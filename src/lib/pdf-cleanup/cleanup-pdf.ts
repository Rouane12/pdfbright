import type { PdfAnalysisResult, PdfPageAnalysis } from "@/lib/pdf-analysis/types";
import { recognizePdfPages } from "@/lib/pdf-ocr/recognize-pages";
import type { PdfOcrLanguage, PdfOcrPageResult } from "@/lib/pdf-ocr/types";
import {
  PdfCleanupError,
  type PdfCleanupProgress,
  type PdfCleanupResult,
  type PdfCleanupSelection,
  type PdfCleanupValidation,
} from "./types";

const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";
const VISUAL_RENDER_MAX_DIMENSION = 2200;
const VISUAL_RENDER_MAX_SCALE = 2.25;
const MIN_STRAIGHTEN_CONFIDENCE = 0.4;
const MIN_OCR_CHARACTERS = 3;

type PdfJsLoadingTask = ReturnType<(typeof import("pdfjs-dist"))["getDocument"]>;
type PdfJsDocumentProxy = Awaited<PdfJsLoadingTask["promise"]>;

export interface CleanupPdfOptions {
  signal?: AbortSignal;
  onProgress?: (progress: PdfCleanupProgress) => void;
  ocrLanguage?: PdfOcrLanguage;
}

interface VisualReplacement {
  pageNumber: number;
  jpegBytes: Uint8Array;
  straightened: boolean;
  readabilityEnhanced: boolean;
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new PdfCleanupError("cleanup-cancelled", "PDF cleanup was cancelled.");
  }
}

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function applyConservativeReadability(imageData: ImageData) {
  const data = imageData.data;
  const contrast = 1.04;
  const brightness = 2;

  for (let index = 0; index < data.length; index += 4) {
    data[index] = clampChannel((data[index] - 128) * contrast + 128 + brightness);
    data[index + 1] = clampChannel((data[index + 1] - 128) * contrast + 128 + brightness);
    data[index + 2] = clampChannel((data[index + 2] - 128) * contrast + 128 + brightness);
  }
}

function rotateCanvasPreservingBounds(source: HTMLCanvasElement, degreesToRotate: number) {
  if (Math.abs(degreesToRotate) < 0.05) return source;

  const radians = (degreesToRotate * Math.PI) / 180;
  const sine = Math.abs(Math.sin(radians));
  const cosine = Math.abs(Math.cos(radians));
  const width = Math.max(1, Math.ceil(source.width * cosine + source.height * sine));
  const height = Math.max(1, Math.ceil(source.width * sine + source.height * cosine));
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const context = output.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Canvas context unavailable while straightening a page.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.translate(width / 2, height / 2);
  context.rotate(radians);
  context.drawImage(source, -source.width / 2, -source.height / 2);
  return output;
}

function canvasToJpegBytes(canvas: HTMLCanvasElement) {
  return new Promise<Uint8Array>((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("Browser could not encode the cleaned page image."));
          return;
        }

        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      "image/jpeg",
      0.96,
    );
  });
}

function isVisualCleanupEligible(page: PdfPageAnalysis) {
  return (
    page.rotationDegrees === 0 &&
    !page.blankness.likelyBlank &&
    (page.contentKind === "probable-scan" || page.contentKind === "image-only")
  );
}

function isOcrEligible(page: PdfPageAnalysis) {
  return (
    !page.hasExtractableText &&
    !page.blankness.likelyBlank &&
    (page.contentKind === "probable-scan" || page.contentKind === "image-only")
  );
}

async function buildVisualReplacement(
  documentProxy: PdfJsDocumentProxy,
  page: PdfPageAnalysis,
  selection: PdfCleanupSelection,
  signal?: AbortSignal,
): Promise<VisualReplacement | null> {
  const wantsStraightening =
    selection.straighten &&
    page.skew.likelySkewed &&
    page.skew.estimatedDegrees !== null &&
    page.skew.confidence >= MIN_STRAIGHTEN_CONFIDENCE;
  const wantsReadability = selection["improve-readability"];

  if ((!wantsStraightening && !wantsReadability) || !isVisualCleanupEligible(page)) {
    return null;
  }

  abortIfNeeded(signal);
  const pdfPage = await documentProxy.getPage(page.pageNumber);
  let canvas: HTMLCanvasElement | null = null;
  let outputCanvas: HTMLCanvasElement | null = null;

  try {
    const annotations = await pdfPage.getAnnotations({ intent: "display" });
    if (annotations.length > 0) return null;

    const baseViewport = pdfPage.getViewport({ scale: 1, rotation: 0 });
    const maxDimension = Math.max(baseViewport.width, baseViewport.height);
    const scale = Math.max(
      1,
      Math.min(VISUAL_RENDER_MAX_SCALE, VISUAL_RENDER_MAX_DIMENSION / maxDimension),
    );
    const viewport = pdfPage.getViewport({ scale, rotation: 0 });
    canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));

    const context = canvas.getContext("2d", {
      alpha: false,
      willReadFrequently: wantsReadability,
    });

    if (!context) {
      throw new Error("Canvas context unavailable while preparing visual cleanup.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await pdfPage.render({
      canvas,
      canvasContext: context,
      viewport,
      background: "#ffffff",
    }).promise;
    abortIfNeeded(signal);

    if (wantsReadability) {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      applyConservativeReadability(imageData);
      context.putImageData(imageData, 0, 0);
    }

    const correction = wantsStraightening ? -(page.skew.estimatedDegrees ?? 0) : 0;
    outputCanvas = rotateCanvasPreservingBounds(canvas, correction);
    const jpegBytes = await canvasToJpegBytes(outputCanvas);

    return {
      pageNumber: page.pageNumber,
      jpegBytes,
      straightened: wantsStraightening,
      readabilityEnhanced: wantsReadability,
    };
  } finally {
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
    }
    if (outputCanvas && outputCanvas !== canvas) {
      outputCanvas.width = 1;
      outputCanvas.height = 1;
    }
    pdfPage.cleanup();
  }
}

function sanitizeOcrText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "")
    .trim();
}

async function applySearchableTextLayer(
  pdfDocument: import("pdf-lib").PDFDocument,
  ocrPages: PdfOcrPageResult[],
) {
  const { StandardFonts } = await import("pdf-lib");
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);

  for (const result of ocrPages) {
    const page = pdfDocument.getPage(result.outputPageNumber - 1);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const scaleX = pageWidth / result.renderWidthPixels;
    const scaleY = pageHeight / result.renderHeightPixels;

    for (const word of result.words) {
      let text = sanitizeOcrText(word.text);
      if (!text) continue;

      const boxWidth = Math.max(1, (word.bbox.x1 - word.bbox.x0) * scaleX);
      const boxHeight = Math.max(1, (word.bbox.y1 - word.bbox.y0) * scaleY);
      let fontSize = Math.max(2.5, boxHeight * 0.84);

      try {
        const measuredWidth = font.widthOfTextAtSize(text, fontSize);
        if (measuredWidth > boxWidth * 1.15 && measuredWidth > 0) {
          fontSize = Math.max(2.5, fontSize * ((boxWidth * 1.08) / measuredWidth));
        }
      } catch {
        text = text.replace(/[^\u0020-\u007E]/g, "").trim();
        if (!text) continue;
        const measuredWidth = font.widthOfTextAtSize(text, fontSize);
        if (measuredWidth > boxWidth * 1.15 && measuredWidth > 0) {
          fontSize = Math.max(2.5, fontSize * ((boxWidth * 1.08) / measuredWidth));
        }
      }

      const x = Math.max(0, word.bbox.x0 * scaleX);
      const y = Math.max(
        0,
        pageHeight - word.bbox.y1 * scaleY + Math.max(0, (boxHeight - fontSize) * 0.2),
      );

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        opacity: 0,
      });
    }
  }
}

async function validateOutput(
  outputBytes: Uint8Array,
  analysis: PdfAnalysisResult,
  removedPages: Set<number>,
  visuallyReplacedPages: Set<number>,
  ocrPages: Map<number, PdfOcrPageResult>,
  signal?: AbortSignal,
): Promise<PdfCleanupValidation> {
  abortIfNeeded(signal);

  if (outputBytes.length < 100) {
    throw new PdfCleanupError("output-invalid", "The cleaned PDF output was unexpectedly empty.");
  }

  const header = new TextDecoder("ascii").decode(outputBytes.slice(0, 5));
  if (header !== "%PDF-") {
    throw new PdfCleanupError("output-invalid", "The cleaned output is not a valid PDF file.");
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const loadingTask = pdfjs.getDocument({ data: outputBytes.slice() });

  try {
    const documentProxy = await loadingTask.promise;
    const retainedPages = analysis.pages.filter((page) => !removedPages.has(page.pageNumber));
    const expectedPageCount = retainedPages.length;

    if (documentProxy.numPages !== expectedPageCount) {
      throw new PdfCleanupError(
        "output-invalid",
        `Output validation expected ${expectedPageCount} pages but found ${documentProxy.numPages}.`,
      );
    }

    let checkedTextPages = 0;
    let checkedOcrPages = 0;
    let checkedVisualPages = 0;

    for (let outputIndex = 0; outputIndex < retainedPages.length; outputIndex += 1) {
      abortIfNeeded(signal);
      const original = retainedPages[outputIndex];
      const outputPage = await documentProxy.getPage(outputIndex + 1);

      try {
        const viewport = outputPage.getViewport({ scale: 1 });
        if (
          !Number.isFinite(viewport.width) ||
          !Number.isFinite(viewport.height) ||
          viewport.width <= 0 ||
          viewport.height <= 0
        ) {
          throw new PdfCleanupError(
            "output-invalid",
            `Output page ${outputIndex + 1} has invalid dimensions.`,
          );
        }

        const ocr = ocrPages.get(original.pageNumber);
        if (ocr) {
          const textContent = await outputPage.getTextContent();
          let characters = 0;
          for (const item of textContent.items) {
            if ("str" in item && typeof item.str === "string") {
              characters += item.str.replace(/\s+/g, "").length;
            }
          }

          const minimumExpected = Math.max(
            MIN_OCR_CHARACTERS,
            Math.floor(ocr.recognizedCharacters * 0.45),
          );
          if (characters < minimumExpected) {
            throw new PdfCleanupError(
              "output-invalid",
              `Output page ${outputIndex + 1} did not retain enough searchable OCR text.`,
            );
          }
          checkedOcrPages += 1;
        } else if (original.hasExtractableText && !visuallyReplacedPages.has(original.pageNumber)) {
          const textContent = await outputPage.getTextContent();
          let characters = 0;
          for (const item of textContent.items) {
            if ("str" in item && typeof item.str === "string") {
              characters += item.str.replace(/\s+/g, " ").trim().length;
            }
          }

          const minimumExpected = Math.max(
            3,
            Math.floor(original.extractableTextCharacters * 0.8),
          );
          if (characters < minimumExpected) {
            throw new PdfCleanupError(
              "output-invalid",
              `Output page ${outputIndex + 1} lost too much extractable text during cleanup.`,
            );
          }
          checkedTextPages += 1;
        } else if (!original.blankness.likelyBlank) {
          const operators = await outputPage.getOperatorList();
          if (operators.fnArray.length === 0) {
            throw new PdfCleanupError(
              "output-invalid",
              `Output page ${outputIndex + 1} unexpectedly contains no visible drawing operations.`,
            );
          }
          checkedVisualPages += 1;
        }
      } finally {
        outputPage.cleanup();
      }
    }

    return {
      valid: true,
      expectedPageCount,
      outputPageCount: documentProxy.numPages,
      checkedTextPages,
      checkedOcrPages,
      checkedVisualPages,
    };
  } finally {
    await loadingTask.destroy();
  }
}

function mapCleanupError(error: unknown) {
  if (error instanceof PdfCleanupError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new PdfCleanupError("cleanup-cancelled", "PDF cleanup was cancelled.");
  }

  return new PdfCleanupError(
    "cleanup-failed",
    error instanceof Error
      ? `PDFBright could not safely finish this cleanup: ${error.message}`
      : "PDFBright could not safely finish this cleanup.",
  );
}

export async function cleanupPdfFile(
  file: File,
  analysis: PdfAnalysisResult,
  selection: PdfCleanupSelection,
  options: CleanupPdfOptions = {},
): Promise<PdfCleanupResult> {
  const startedAt = performance.now();
  const { signal, onProgress, ocrLanguage = "eng" } = options;
  let analysisLoadingTask: { destroy: () => Promise<void> } | null = null;

  try {
    abortIfNeeded(signal);
    onProgress?.({ phase: "preparing" });

    const unsupportedSelectedFixes: Array<"compress"> = [];
    if (selection.compress) unsupportedSelectedFixes.push("compress");

    const supportsAnySelectedFix =
      selection.rotate ||
      selection.straighten ||
      selection["searchable-text"] ||
      selection["remove-blank-pages"] ||
      selection["improve-readability"] ||
      selection["normalize-pages"];

    if (!supportsAnySelectedFix) {
      throw new PdfCleanupError(
        "no-supported-fixes",
        "None of the selected fixes are available in the current cleanup core yet.",
      );
    }

    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const removedPages = new Set<number>(
      selection["remove-blank-pages"] ? analysis.summary.blankPageCandidates : [],
    );

    if (removedPages.size >= analysis.pageCount) {
      throw new PdfCleanupError(
        "unsafe-blank-removal",
        "PDFBright will not remove every page from a document.",
      );
    }

    const warnings: string[] = [];
    const visualReplacements = new Map<number, VisualReplacement>();
    const skippedVisualPages: number[] = [];
    const visualCandidates = analysis.pages.filter((page) => {
      const straighteningCandidate =
        selection.straighten &&
        page.skew.likelySkewed &&
        page.skew.estimatedDegrees !== null;
      const readabilityCandidate =
        selection["improve-readability"] &&
        (page.contentKind === "probable-scan" || page.contentKind === "image-only");
      return straighteningCandidate || readabilityCandidate;
    });

    if (visualCandidates.length > 0) {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      const task = pdfjs.getDocument({ data: sourceBytes.slice() });
      analysisLoadingTask = task;
      const documentProxy = await task.promise;

      for (let index = 0; index < visualCandidates.length; index += 1) {
        abortIfNeeded(signal);
        const page = visualCandidates[index];
        onProgress?.({
          phase: "rendering-visual-fixes",
          pageNumber: index + 1,
          pageCount: visualCandidates.length,
        });

        const replacement = await buildVisualReplacement(
          documentProxy,
          page,
          selection,
          signal,
        );

        if (replacement) {
          visualReplacements.set(page.pageNumber, replacement);
        } else {
          skippedVisualPages.push(page.pageNumber);
          warnings.push(
            `Page ${page.pageNumber}: visual cleanup was skipped to preserve content or annotations safely.`,
          );
        }
      }

      await task.destroy();
      analysisLoadingTask = null;
    }

    abortIfNeeded(signal);
    onProgress?.({ phase: "applying-page-fixes" });
    const { PDFDocument, degrees } = await import("pdf-lib");
    let pdfDocument = await PDFDocument.load(sourceBytes, { updateMetadata: false });

    for (const replacement of visualReplacements.values()) {
      const pageIndex = replacement.pageNumber - 1;
      const originalPage = pdfDocument.getPage(pageIndex);
      const width = originalPage.getWidth();
      const height = originalPage.getHeight();
      const image = await pdfDocument.embedJpg(replacement.jpegBytes);
      const fitted = image.scaleToFit(width, height);

      pdfDocument.removePage(pageIndex);
      const newPage = pdfDocument.insertPage(pageIndex, [width, height]);
      newPage.drawImage(image, {
        x: (width - fitted.width) / 2,
        y: (height - fitted.height) / 2,
        width: fitted.width,
        height: fitted.height,
      });
    }

    const rotatedPages: number[] = [];
    if (selection.rotate) {
      for (const pageNumber of analysis.summary.pagesWithRotationMetadata) {
        if (removedPages.has(pageNumber)) continue;
        const page = pdfDocument.getPage(pageNumber - 1);
        page.setRotation(degrees(0));
        rotatedPages.push(pageNumber);
      }
    }

    const removedBlankPages = [...removedPages].sort((a, b) => a - b);
    for (const pageNumber of [...removedBlankPages].sort((a, b) => b - a)) {
      pdfDocument.removePage(pageNumber - 1);
    }

    const retainedOriginalPageNumbers = analysis.pages
      .filter((page) => !removedPages.has(page.pageNumber))
      .map((page) => page.pageNumber);
    const normalizedPages: number[] = [];

    if (selection["normalize-pages"] && pdfDocument.getPageCount() > 0) {
      const pages = pdfDocument.getPages();
      const targetWidth = Math.max(...pages.map((page) => page.getWidth()));
      const targetHeight = Math.max(...pages.map((page) => page.getHeight()));

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];
        const width = page.getWidth();
        const height = page.getHeight();

        if (Math.abs(width - targetWidth) > 0.5 || Math.abs(height - targetHeight) > 0.5) {
          page.setSize(targetWidth, targetHeight);
          normalizedPages.push(retainedOriginalPageNumbers[index]);
        }
      }
    }

    let ocrPages: PdfOcrPageResult[] = [];
    let ocrDurationMs = 0;
    if (selection["searchable-text"]) {
      const targets = analysis.pages
        .filter((page) => !removedPages.has(page.pageNumber) && isOcrEligible(page))
        .map((page) => ({
          originalPageNumber: page.pageNumber,
          outputPageNumber: retainedOriginalPageNumbers.indexOf(page.pageNumber) + 1,
        }))
        .filter((target) => target.outputPageNumber > 0);

      if (targets.length > 0) {
        abortIfNeeded(signal);
        onProgress?.({ phase: "ocr-loading", pageCount: targets.length });
        const intermediateBytes = await pdfDocument.save();
        const ocr = await recognizePdfPages(
          intermediateBytes,
          targets,
          ocrLanguage,
          {
            signal,
            onProgress: (progress) => {
              if (progress.phase === "loading") {
                onProgress?.({ phase: "ocr-loading", pageCount: progress.pageCount });
              } else {
                onProgress?.({
                  phase: "ocr-recognizing",
                  pageNumber: progress.pageNumber,
                  pageCount: progress.pageCount,
                  pageProgress: progress.pageProgress,
                });
              }
            },
          },
        );

        for (const page of ocr.pages) {
          if (page.words.length === 0 || page.recognizedCharacters < MIN_OCR_CHARACTERS) {
            throw new PdfCleanupError(
              "ocr-failed",
              `PDFBright could not recognize enough text on page ${page.originalPageNumber} to add a reliable searchable layer.`,
            );
          }
        }

        ocrPages = ocr.pages;
        ocrDurationMs = ocr.durationMs;
        abortIfNeeded(signal);
        onProgress?.({ phase: "ocr-overlaying", pageCount: ocrPages.length });
        pdfDocument = await PDFDocument.load(intermediateBytes, { updateMetadata: false });
        await applySearchableTextLayer(pdfDocument, ocrPages);
      }
    }

    abortIfNeeded(signal);
    onProgress?.({ phase: "saving" });
    const outputBytes = await pdfDocument.save();

    abortIfNeeded(signal);
    onProgress?.({ phase: "validating" });
    const ocrPageMap = new Map(ocrPages.map((page) => [page.originalPageNumber, page]));
    const validation = await validateOutput(
      outputBytes,
      analysis,
      removedPages,
      new Set(visualReplacements.keys()),
      ocrPageMap,
      signal,
    );

    const straightenedPages = [...visualReplacements.values()]
      .filter((replacement) => replacement.straightened)
      .map((replacement) => replacement.pageNumber)
      .sort((a, b) => a - b);
    const readabilityEnhancedPages = [...visualReplacements.values()]
      .filter((replacement) => replacement.readabilityEnhanced)
      .map((replacement) => replacement.pageNumber)
      .sort((a, b) => a - b);
    const searchableTextPages = ocrPages
      .map((page) => page.originalPageNumber)
      .sort((a, b) => a - b);
    const ocrWordCount = ocrPages.reduce((total, page) => total + page.words.length, 0);
    const ocrCharacterCount = ocrPages.reduce(
      (total, page) => total + page.recognizedCharacters,
      0,
    );

    return {
      bytes: outputBytes,
      validation,
      report: {
        originalPageCount: analysis.pageCount,
        outputPageCount: validation.outputPageCount,
        rotatedPages,
        straightenedPages,
        readabilityEnhancedPages,
        searchableTextPages,
        removedBlankPages,
        normalizedPages,
        skippedVisualPages,
        ocrLanguage: ocrPages.length > 0 ? ocrLanguage : null,
        ocrWordCount,
        ocrCharacterCount,
        ocrDurationMs,
        unsupportedSelectedFixes,
        warnings,
        durationMs: Math.round(performance.now() - startedAt),
      },
    };
  } catch (error) {
    if (signal?.aborted) {
      throw new PdfCleanupError("cleanup-cancelled", "PDF cleanup was cancelled.");
    }
    throw mapCleanupError(error);
  } finally {
    if (analysisLoadingTask) {
      try {
        await analysisLoadingTask.destroy();
      } catch {
        // Best-effort cleanup only.
      }
    }
  }
}
