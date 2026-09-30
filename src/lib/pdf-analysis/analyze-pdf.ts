import { PixelAnalysisWorkerClient } from "./pixel-worker-client";
import {
  PdfAnalysisError,
  type PdfAnalysisFinding,
  type PdfAnalysisProgress,
  type PdfAnalysisResult,
  type PdfPageAnalysis,
  type PixelHeuristicResult,
  type PageContentKind,
  type PageOrientation,
} from "./types";

const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";
const MAX_RENDER_DIMENSION = 240;
const DIMENSION_BUCKET_POINTS = 8;

export interface AnalyzePdfOptions {
  signal?: AbortSignal;
  onProgress?: (progress: PdfAnalysisProgress) => void;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function normalizeRotation(rotation: number) {
  return ((Math.round(rotation) % 360) + 360) % 360;
}

function orientationFor(width: number, height: number): PageOrientation {
  const difference = Math.abs(width - height);
  if (difference <= 1) return "square";
  return width > height ? "landscape" : "portrait";
}

function dimensionSignature(width: number, height: number) {
  const bucket = (value: number) =>
    Math.round(value / DIMENSION_BUCKET_POINTS) * DIMENSION_BUCKET_POINTS;
  return `${bucket(width)}x${bucket(height)}`;
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new PdfAnalysisError("analysis-cancelled", "PDF analysis was cancelled.");
  }
}

function classifyContent(
  textCharacters: number,
  imagePaintOperations: number,
  pixels: PixelHeuristicResult | null,
) {
  const hasExtractableText = textCharacters >= 3;
  const blankCandidate = Boolean(pixels?.likelyBlank && textCharacters < 4);

  if (blankCandidate) {
    return { kind: "blank-candidate" as PageContentKind, probableScanConfidence: 0 };
  }

  if (hasExtractableText && imagePaintOperations > 0) {
    return { kind: "mixed" as PageContentKind, probableScanConfidence: 0 };
  }

  if (hasExtractableText) {
    return { kind: "text" as PageContentKind, probableScanConfidence: 0 };
  }

  if (imagePaintOperations > 0) {
    if (!pixels) {
      return {
        kind: "image-only" as PageContentKind,
        probableScanConfidence: 0.45,
      };
    }

    // Scanned documents are often mostly white paper with relatively sparse
    // dark strokes and strong local edges. A photo-only PDF should generally
    // remain `image-only` rather than being promoted to `probable-scan`.
    const whitePageScore = clamp((pixels.nearWhiteRatio - 0.78) / 0.18);
    const edgeScore = clamp(pixels.edgeDensity / 0.02);
    const inkScore = clamp(pixels.darkPixelRatio / 0.01);
    const documentLikeScore =
      whitePageScore * 0.55 + edgeScore * 0.25 + inkScore * 0.2;
    const imageEvidence = Math.min(imagePaintOperations, 2) * 0.05;
    const probableScanConfidence = clamp(
      0.35 + imageEvidence + documentLikeScore * 0.5,
    );

    return {
      kind:
        probableScanConfidence >= 0.68
          ? ("probable-scan" as PageContentKind)
          : ("image-only" as PageContentKind),
      probableScanConfidence,
    };
  }

  return { kind: "unknown" as PageContentKind, probableScanConfidence: 0 };
}

function buildFindings(
  pages: PdfPageAnalysis[],
  hasInconsistentPageSizes: boolean,
  hasMixedPageOrientations: boolean,
  likelyCompressionOpportunity: boolean,
): PdfAnalysisFinding[] {
  const findings: PdfAnalysisFinding[] = [];

  const rotated = pages.filter((page) => page.rotationDegrees !== 0).map((page) => page.pageNumber);
  if (rotated.length > 0) {
    findings.push({
      id: "rotation-metadata",
      evidence: "fact",
      pageNumbers: rotated,
      count: rotated.length,
      confidence: 1,
    });
  }

  const textless = pages
    .filter((page) => !page.hasExtractableText)
    .map((page) => page.pageNumber);
  if (textless.length > 0) {
    findings.push({
      id: "textless-pages",
      evidence: "fact",
      pageNumbers: textless,
      count: textless.length,
      confidence: 1,
    });
  }

  const probableScans = pages
    .filter((page) => page.contentKind === "probable-scan")
    .map((page) => page.pageNumber);
  if (probableScans.length > 0) {
    const confidence =
      pages
        .filter((page) => page.contentKind === "probable-scan")
        .reduce((sum, page) => sum + page.probableScanConfidence, 0) /
      probableScans.length;
    findings.push({
      id: "probable-scans",
      evidence: "heuristic",
      pageNumbers: probableScans,
      count: probableScans.length,
      confidence,
    });
  }

  const blankCandidates = pages
    .filter((page) => page.blankness.likelyBlank)
    .map((page) => page.pageNumber);
  if (blankCandidates.length > 0) {
    const confidence =
      pages
        .filter((page) => page.blankness.likelyBlank)
        .reduce((sum, page) => sum + (page.blankness.score ?? 0), 0) /
      blankCandidates.length;
    findings.push({
      id: "blank-candidates",
      evidence: "heuristic",
      pageNumbers: blankCandidates,
      count: blankCandidates.length,
      confidence,
    });
  }

  if (hasInconsistentPageSizes) {
    findings.push({
      id: "inconsistent-page-sizes",
      evidence: "fact",
      pageNumbers: pages.map((page) => page.pageNumber),
      count: pages.length,
      confidence: 1,
    });
  }

  if (hasMixedPageOrientations) {
    findings.push({
      id: "inconsistent-orientation",
      evidence: "fact",
      pageNumbers: pages.map((page) => page.pageNumber),
      count: pages.length,
      confidence: 1,
    });
  }

  const skewed = pages.filter((page) => page.skew.likelySkewed).map((page) => page.pageNumber);
  if (skewed.length > 0) {
    const confidence =
      pages
        .filter((page) => page.skew.likelySkewed)
        .reduce((sum, page) => sum + page.skew.confidence, 0) / skewed.length;
    findings.push({
      id: "likely-skew",
      evidence: "heuristic",
      pageNumbers: skewed,
      count: skewed.length,
      confidence,
    });
  }

  if (likelyCompressionOpportunity) {
    findings.push({
      id: "compression-opportunity",
      evidence: "heuristic",
      pageNumbers: probableScans,
      count: probableScans.length,
      confidence: 0.65,
    });
  }

  return findings;
}

function mapAnalysisError(error: unknown): PdfAnalysisError {
  if (error instanceof PdfAnalysisError) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return new PdfAnalysisError("analysis-cancelled", "PDF analysis was cancelled.");
  }

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (name === "PasswordException") {
    return new PdfAnalysisError(
      "password-protected",
      "Password-protected PDFs cannot currently be analyzed.",
    );
  }

  if (name === "InvalidPDFException") {
    return new PdfAnalysisError("damaged-pdf", "This PDF appears to be damaged or invalid.");
  }

  if (name === "MissingPDFException" || name === "UnexpectedResponseException") {
    return new PdfAnalysisError("unsupported-pdf", "This PDF could not be read in this browser.");
  }

  if (message.includes("out of memory") || message.includes("array buffer allocation")) {
    return new PdfAnalysisError(
      "browser-memory",
      "Your browser does not have enough memory to analyze this PDF.",
    );
  }

  return new PdfAnalysisError(
    "analysis-failed",
    "PDFBright could not analyze this PDF. Please try another file.",
  );
}

export async function analyzePdfFile(
  file: File,
  options: AnalyzePdfOptions = {},
): Promise<PdfAnalysisResult> {
  const startedAt = performance.now();
  const { signal, onProgress } = options;
  let loadingTask: { destroy: () => Promise<void> } | null = null;
  let pixelWorker: PixelAnalysisWorkerClient | null = null;

  try {
    abortIfNeeded(signal);
    onProgress?.({ phase: "loading" });

    const bytes = new Uint8Array(await file.arrayBuffer());
    abortIfNeeded(signal);

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

    onProgress?.({ phase: "parsing" });
    const task = pdfjs.getDocument({ data: bytes });
    loadingTask = task;
    const documentProxy = await task.promise;

    const pageCount = documentProxy.numPages;
    const pages: PdfPageAnalysis[] = [];
    const warnings: string[] = [];
    pixelWorker = new PixelAnalysisWorkerClient();

    const ops = pdfjs.OPS as unknown as Record<string, number>;
    const imageOperationCodes = new Set(
      [
        ops.paintImageXObject,
        ops.paintInlineImageXObject,
        ops.paintImageMaskXObject,
        ops.paintSolidColorImageMask,
      ].filter((value): value is number => typeof value === "number"),
    );

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      abortIfNeeded(signal);
      onProgress?.({ phase: "analyzing-pages", pageNumber, pageCount });

      const page = await documentProxy.getPage(pageNumber);
      const rawView = page.view;
      const widthPoints = Math.abs(rawView[2] - rawView[0]);
      const heightPoints = Math.abs(rawView[3] - rawView[1]);
      const baseViewport = page.getViewport({ scale: 1 });
      const rotationDegrees = normalizeRotation(page.rotate ?? 0);
      const orientation = orientationFor(baseViewport.width, baseViewport.height);

      const textContent = await page.getTextContent();
      let extractableTextCharacters = 0;
      let extractableTextItems = 0;

      for (const item of textContent.items) {
        if ("str" in item && typeof item.str === "string") {
          const normalized = item.str.replace(/\s+/g, " ").trim();
          if (normalized.length > 0) {
            extractableTextItems += 1;
            extractableTextCharacters += normalized.length;
          }
        }
      }

      const hasExtractableText = extractableTextCharacters >= 3;
      const operatorList = await page.getOperatorList();
      const imagePaintOperations = operatorList.fnArray.reduce(
        (count, operation) => count + (imageOperationCodes.has(operation) ? 1 : 0),
        0,
      );

      const pageWarnings: string[] = [];
      let pixelResult: PixelHeuristicResult | null = null;
      let renderWidth: number | null = null;
      let renderHeight: number | null = null;

      try {
        const scale = Math.min(
          1,
          MAX_RENDER_DIMENSION / Math.max(baseViewport.width, baseViewport.height),
        );
        const renderViewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        renderWidth = Math.max(1, Math.round(renderViewport.width));
        renderHeight = Math.max(1, Math.round(renderViewport.height));
        canvas.width = renderWidth;
        canvas.height = renderHeight;

        const context = canvas.getContext("2d", {
          alpha: false,
          willReadFrequently: true,
        });

        if (!context) {
          throw new Error("Canvas context unavailable.");
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport: renderViewport,
          background: "#ffffff",
        }).promise;

        abortIfNeeded(signal);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        pixelResult = await pixelWorker.analyze(imageData, signal);
        canvas.width = 1;
        canvas.height = 1;
      } catch (renderError) {
        if (renderError instanceof PdfAnalysisError) throw renderError;
        if (renderError instanceof DOMException && renderError.name === "AbortError") {
          throw renderError;
        }
        pageWarnings.push("Low-resolution image heuristics were unavailable for this page.");
      }

      const classification = classifyContent(
        extractableTextCharacters,
        imagePaintOperations,
        pixelResult,
      );
      const blankLikely = Boolean(pixelResult?.likelyBlank && extractableTextCharacters < 4);
      const skewEligible =
        classification.kind === "probable-scan" || classification.kind === "image-only";
      const skewConfidence = skewEligible ? (pixelResult?.skewConfidence ?? 0) : 0;
      const estimatedSkewDegrees = skewEligible
        ? (pixelResult?.estimatedSkewDegrees ?? null)
        : null;
      const likelySkewed =
        estimatedSkewDegrees !== null &&
        Math.abs(estimatedSkewDegrees) >= 0.75 &&
        skewConfidence >= 0.35;
      const visualQualityEligible =
        classification.kind === "probable-scan" || classification.kind === "image-only";
      const meanLuminance = visualQualityEligible
        ? (pixelResult?.meanLuminance ?? null)
        : null;
      const contrastScore = visualQualityEligible
        ? (pixelResult?.contrastScore ?? null)
        : null;
      const sharpnessScore = visualQualityEligible
        ? (pixelResult?.sharpnessScore ?? null)
        : null;
      const lowContrast =
        !blankLikely &&
        contrastScore !== null &&
        contrastScore < 0.18;
      const lowSharpness =
        !blankLikely &&
        sharpnessScore !== null &&
        sharpnessScore < 0.22;
      const unusuallyDark =
        !blankLikely &&
        meanLuminance !== null &&
        meanLuminance < 155;

      pages.push({
        pageNumber,
        widthPoints,
        heightPoints,
        displayWidthPoints: baseViewport.width,
        displayHeightPoints: baseViewport.height,
        rotationDegrees,
        orientation,
        extractableTextCharacters,
        extractableTextItems,
        hasExtractableText,
        imagePaintOperations,
        contentKind: classification.kind,
        probableScanConfidence: classification.probableScanConfidence,
        blankness: {
          evidence: "heuristic",
          score: pixelResult?.blankScore ?? null,
          likelyBlank: blankLikely,
        },
        skew: {
          evidence: "heuristic",
          estimatedDegrees: estimatedSkewDegrees,
          confidence: skewConfidence,
          likelySkewed,
        },
        visualQuality: {
          evidence: "heuristic",
          meanLuminance,
          contrastScore,
          sharpnessScore,
          lowContrast,
          lowSharpness,
          unusuallyDark,
        },
        lowResolutionRender: {
          attempted: true,
          widthPixels: renderWidth,
          heightPixels: renderHeight,
        },
        warnings: pageWarnings,
      });

      if (pageWarnings.length > 0) {
        warnings.push(`Page ${pageNumber}: low-resolution heuristics unavailable.`);
      }

      page.cleanup();
    }

    onProgress?.({ phase: "finalizing", pageCount });

    const dimensionSignatures = new Set(
      pages.map((page) =>
        dimensionSignature(page.displayWidthPoints, page.displayHeightPoints),
      ),
    );
    const hasInconsistentPageSizes = dimensionSignatures.size > 1;
    const orientations = new Set(
      pages
        .map((page) => page.orientation)
        .filter((orientation) => orientation !== "square"),
    );
    const hasMixedPageOrientations = orientations.size > 1;
    const probableScanPages = pages
      .filter((page) => page.contentKind === "probable-scan")
      .map((page) => page.pageNumber);
    const blankPageCandidates = pages
      .filter((page) => page.blankness.likelyBlank)
      .map((page) => page.pageNumber);
    const pagesWithRotationMetadata = pages
      .filter((page) => page.rotationDegrees !== 0)
      .map((page) => page.pageNumber);
    const likelySkewedPages = pages
      .filter((page) => page.skew.likelySkewed)
      .map((page) => page.pageNumber);
    const pagesWithExtractableText = pages.filter(
      (page) => page.hasExtractableText,
    ).length;
    const bytesPerPage = file.size / Math.max(pageCount, 1);
    const likelyCompressionOpportunity =
      probableScanPages.length >= Math.max(1, Math.ceil(pageCount * 0.35)) &&
      bytesPerPage >= 250_000;

    const findings = buildFindings(
      pages,
      hasInconsistentPageSizes,
      hasMixedPageOrientations,
      likelyCompressionOpportunity,
    );

    return {
      schemaVersion: 1,
      analyzedAt: new Date().toISOString(),
      fileSizeBytes: file.size,
      pageCount,
      durationMs: Math.round(performance.now() - startedAt),
      pages,
      summary: {
        pagesWithExtractableText,
        pagesWithoutExtractableText: pageCount - pagesWithExtractableText,
        probableScanPages,
        blankPageCandidates,
        pagesWithRotationMetadata,
        likelySkewedPages,
        hasInconsistentPageSizes,
        hasMixedPageOrientations,
        likelyCompressionOpportunity,
      },
      findings,
      warnings,
    };
  } catch (error) {
    throw mapAnalysisError(error);
  } finally {
    pixelWorker?.destroy();

    try {
      await loadingTask?.destroy();
    } catch {
      // Cleanup failures must not replace the actual analysis result/error.
    }
  }
}
