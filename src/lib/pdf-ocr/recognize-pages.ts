import { resolveProcessingEntitlement } from "@/lib/billing/processing-entitlement-client";
import type {
  PdfOcrLanguage,
  PdfOcrLine,
  PdfOcrPageResult,
  PdfOcrProgress,
  PdfOcrRunResult,
  PdfOcrTarget,
  PdfOcrWord,
} from "./types";

const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";
const OCR_RENDER_MAX_DIMENSION = 2400;
const OCR_RENDER_MAX_SCALE = 3;
const MIN_WORD_CONFIDENCE = 25;
export const LOCAL_OCR_PAGE_LIMIT = 10;

type OcrWordLike = {
  text?: string;
  confidence?: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
};

type OcrBlockLike = {
  paragraphs?: Array<{
    lines?: Array<{
      words?: OcrWordLike[];
    }>;
  }>;
};

export interface RecognizePdfPagesOptions {
  signal?: AbortSignal;
  onProgress?: (progress: PdfOcrProgress) => void;
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("OCR cancelled", "AbortError");
  }
}

function normalizeWord(word: OcrWordLike): PdfOcrWord | null {
  const text = word.text?.trim() ?? "";
  const confidence = Number.isFinite(word.confidence) ? Number(word.confidence) : 0;
  const bbox = word.bbox;
  if (!text || confidence < MIN_WORD_CONFIDENCE || !bbox) return null;
  if (
    !Number.isFinite(bbox.x0) ||
    !Number.isFinite(bbox.y0) ||
    !Number.isFinite(bbox.x1) ||
    !Number.isFinite(bbox.y1) ||
    bbox.x1 <= bbox.x0 ||
    bbox.y1 <= bbox.y0
  ) {
    return null;
  }

  return {
    text,
    confidence,
    bbox: {
      x0: bbox.x0,
      y0: bbox.y0,
      x1: bbox.x1,
      y1: bbox.y1,
    },
  };
}

function collectLayout(blocks: OcrBlockLike[] | null | undefined): {
  words: PdfOcrWord[];
  lines: PdfOcrLine[];
} {
  if (!blocks) return { words: [], lines: [] };

  const entries: Array<{
    line: PdfOcrLine;
    overlay: PdfOcrWord;
  }> = [];

  for (const block of blocks) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const sourceLine of paragraph.lines ?? []) {
        const rawWords = (sourceLine.words ?? [])
          .map(normalizeWord)
          .filter((word): word is PdfOcrWord => word !== null)
          .sort((a, b) => a.bbox.x0 - b.bbox.x0);

        if (rawWords.length === 0) continue;

        const lineBox = {
          x0: Math.min(...rawWords.map((word) => word.bbox.x0)),
          y0: Math.min(...rawWords.map((word) => word.bbox.y0)),
          x1: Math.max(...rawWords.map((word) => word.bbox.x1)),
          y1: Math.max(...rawWords.map((word) => word.bbox.y1)),
        };
        const lineText = rawWords.map((word) => word.text).join(" ");
        const lineConfidence =
          rawWords.reduce((total, word) => total + word.confidence, 0) / rawWords.length;

        entries.push({
          line: {
            text: lineText,
            bbox: lineBox,
            wordCount: rawWords.length,
          },
          // The searchable PDF layer intentionally gets one text object per
          // OCR line. Emitting every word separately makes PDF viewers infer
          // reading order from tiny positional differences, which can scramble
          // copied text even when the words are visually aligned. A single
          // line run preserves deterministic top-to-bottom, left-to-right order.
          overlay: {
            text: lineText,
            confidence: lineConfidence,
            bbox: lineBox,
          },
        });
      }
    }
  }

  entries.sort((a, b) => {
    const verticalDelta = a.line.bbox.y0 - b.line.bbox.y0;
    if (Math.abs(verticalDelta) > 4) return verticalDelta;
    return a.line.bbox.x0 - b.line.bbox.x0;
  });

  return {
    lines: entries.map((entry) => entry.line),
    words: entries.map((entry) => entry.overlay),
  };
}

export async function recognizePdfPages(
  pdfBytes: Uint8Array,
  targets: PdfOcrTarget[],
  language: PdfOcrLanguage,
  options: RecognizePdfPagesOptions = {},
): Promise<PdfOcrRunResult> {
  const startedAt = performance.now();
  const { signal, onProgress } = options;

  if (targets.length === 0) {
    return { pages: [], durationMs: 0 };
  }

  const entitlement = await resolveProcessingEntitlement();
  const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";
  abortIfNeeded(signal);
  const maxOcrPages = Math.min(LOCAL_OCR_PAGE_LIMIT, entitlement.limits.maxOcrPages);

  if (targets.length > maxOcrPages) {
    throw new Error(
      entitlement.plan === "pro"
        ? `This PDF has ${targets.length} scanned pages that need OCR. Local OCR is currently limited to ${maxOcrPages} pages because larger jobs can take several minutes in the browser. Heavy OCR will use server-assisted processing in a future update.`
        : billingEnabled
          ? `This PDF has ${targets.length} scanned pages that need OCR. The Free plan supports up to ${maxOcrPages} OCR pages per document; PDFBright Pro supports up to ${LOCAL_OCR_PAGE_LIMIT} local OCR pages.`
          : `This PDF has ${targets.length} scanned pages that need OCR. Free Early Access currently supports up to ${maxOcrPages} OCR pages per document.`,
    );
  }

  abortIfNeeded(signal);
  onProgress?.({ phase: "loading", pageCount: targets.length });

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const loadingTask = pdfjs.getDocument({ data: pdfBytes.slice() });
  const tesseract = await import("tesseract.js");

  let currentPageIndex = 0;
  let workerTerminated = false;
  const worker = await tesseract.createWorker(language, tesseract.OEM.LSTM_ONLY, {
    logger: (message: { status?: string; progress?: number }) => {
      if (message.status !== "recognizing text") return;
      onProgress?.({
        phase: "recognizing",
        pageNumber: currentPageIndex + 1,
        pageCount: targets.length,
        pageProgress: Number.isFinite(message.progress) ? message.progress : undefined,
      });
    },
  });

  const terminateWorker = async () => {
    if (workerTerminated) return;
    workerTerminated = true;
    await worker.terminate();
  };

  const abortHandler = () => {
    void terminateWorker();
  };
  signal?.addEventListener("abort", abortHandler, { once: true });

  try {
    const documentProxy = await loadingTask.promise;
    const pages: PdfOcrPageResult[] = [];

    for (let index = 0; index < targets.length; index += 1) {
      currentPageIndex = index;
      abortIfNeeded(signal);
      const pageStartedAt = performance.now();
      const target = targets[index];
      const pdfPage = await documentProxy.getPage(target.outputPageNumber);
      let canvas: HTMLCanvasElement | null = null;

      try {
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const maxDimension = Math.max(baseViewport.width, baseViewport.height);
        const scale = Math.max(
          1,
          Math.min(OCR_RENDER_MAX_SCALE, OCR_RENDER_MAX_DIMENSION / maxDimension),
        );
        const viewport = pdfPage.getViewport({ scale });

        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewport.width));
        canvas.height = Math.max(1, Math.round(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          throw new Error("Canvas context unavailable while preparing OCR.");
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
        onProgress?.({
          phase: "recognizing",
          pageNumber: index + 1,
          pageCount: targets.length,
          pageProgress: 0,
        });

        const recognition = await worker.recognize(canvas, {}, { text: true, blocks: true });
        abortIfNeeded(signal);

        const { words, lines } = collectLayout(
          recognition.data.blocks as OcrBlockLike[] | null | undefined,
        );
        const recognizedCharacters = words.reduce(
          (total, word) => total + word.text.replace(/\s+/g, "").length,
          0,
        );
        const meanConfidence =
          words.length > 0
            ? words.reduce((total, word) => total + word.confidence, 0) / words.length
            : 0;

        pages.push({
          originalPageNumber: target.originalPageNumber,
          outputPageNumber: target.outputPageNumber,
          language,
          words,
          lines,
          recognizedCharacters,
          meanConfidence,
          renderWidthPixels: canvas.width,
          renderHeightPixels: canvas.height,
          durationMs: Math.round(performance.now() - pageStartedAt),
        });
      } finally {
        if (canvas) {
          canvas.width = 1;
          canvas.height = 1;
        }
        pdfPage.cleanup();
      }
    }

    return {
      pages,
      durationMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    signal?.removeEventListener("abort", abortHandler);
    await Promise.allSettled([terminateWorker(), loadingTask.destroy()]);
  }
}
