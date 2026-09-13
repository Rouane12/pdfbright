import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
  MAX_PAGE_DIMENSION_POINTS,
  PDF_HEADER_SCAN_BYTES,
  PDF_PREFLIGHT_TIMEOUT_MS,
} from "./processing-policy";

const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";

export type PdfPreflightErrorCode =
  | "cancelled"
  | "not-pdf"
  | "empty-file"
  | "file-too-large"
  | "invalid-header"
  | "password-protected"
  | "damaged-pdf"
  | "unsupported-pdf"
  | "page-limit"
  | "unsafe-page-dimensions"
  | "validation-timeout"
  | "browser-memory"
  | "validation-failed";

export class PdfPreflightError extends Error {
  readonly code: PdfPreflightErrorCode;

  constructor(code: PdfPreflightErrorCode, message: string) {
    super(message);
    this.name = "PdfPreflightError";
    this.code = code;
  }
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new PdfPreflightError("cancelled", "PDF validation was cancelled.");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new PdfPreflightError(
          "validation-timeout",
          "This PDF took too long to validate safely. Try a smaller or simpler file.",
        ),
      );
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function mapPreflightError(error: unknown): PdfPreflightError {
  if (error instanceof PdfPreflightError) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return new PdfPreflightError("cancelled", "PDF validation was cancelled.");
  }

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (name === "PasswordException") {
    return new PdfPreflightError(
      "password-protected",
      "Password-protected PDFs cannot currently be processed.",
    );
  }

  if (name === "InvalidPDFException") {
    return new PdfPreflightError("damaged-pdf", "This PDF appears to be damaged or invalid.");
  }

  if (name === "MissingPDFException" || name === "UnexpectedResponseException") {
    return new PdfPreflightError("unsupported-pdf", "This PDF could not be read safely in this browser.");
  }

  if (message.includes("out of memory") || message.includes("array buffer allocation")) {
    return new PdfPreflightError(
      "browser-memory",
      "Your browser does not have enough memory to validate this PDF safely.",
    );
  }

  return new PdfPreflightError(
    "validation-failed",
    "PDFBright could not safely validate this PDF. Please try another file.",
  );
}

async function validatePdfHeader(file: File) {
  const prefix = new Uint8Array(
    await file.slice(0, Math.min(file.size, PDF_HEADER_SCAN_BYTES)).arrayBuffer(),
  );
  const text = new TextDecoder("latin1").decode(prefix);

  if (!text.includes("%PDF-")) {
    throw new PdfPreflightError(
      "invalid-header",
      "This file does not appear to contain a valid PDF header.",
    );
  }
}

export async function preflightPdfFile(file: File, signal?: AbortSignal): Promise<void> {
  abortIfNeeded(signal);

  const looksLikePdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!looksLikePdf) {
    throw new PdfPreflightError("not-pdf", "Please choose a PDF file.");
  }

  if (file.size === 0) {
    throw new PdfPreflightError(
      "empty-file",
      "This PDF appears to be empty. Please choose another file.",
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new PdfPreflightError(
      "file-too-large",
      `This PDF is larger than the current ${MAX_FILE_SIZE_MB} MB limit.`,
    );
  }

  try {
    await validatePdfHeader(file);
    abortIfNeeded(signal);

    const bytes = new Uint8Array(await file.arrayBuffer());
    abortIfNeeded(signal);

    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
    const loadingTask = pdfjs.getDocument({ data: bytes });

    try {
      const documentProxy = await withTimeout(loadingTask.promise, PDF_PREFLIGHT_TIMEOUT_MS);
      abortIfNeeded(signal);

      if (documentProxy.numPages <= 0) {
        throw new PdfPreflightError("damaged-pdf", "This PDF does not contain any readable pages.");
      }

      if (documentProxy.numPages > MAX_PAGE_COUNT) {
        throw new PdfPreflightError(
          "page-limit",
          `This PDF has ${documentProxy.numPages} pages. The current limit is ${MAX_PAGE_COUNT} pages.`,
        );
      }

      for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
        abortIfNeeded(signal);
        const page = await withTimeout(documentProxy.getPage(pageNumber), PDF_PREFLIGHT_TIMEOUT_MS);

        try {
          const view = page.view;
          const width = Math.abs(view[2] - view[0]);
          const height = Math.abs(view[3] - view[1]);

          if (
            !Number.isFinite(width) ||
            !Number.isFinite(height) ||
            width <= 0 ||
            height <= 0
          ) {
            throw new PdfPreflightError(
              "unsafe-page-dimensions",
              `Page ${pageNumber} has invalid dimensions and cannot be processed safely.`,
            );
          }

          if (width > MAX_PAGE_DIMENSION_POINTS || height > MAX_PAGE_DIMENSION_POINTS) {
            throw new PdfPreflightError(
              "unsafe-page-dimensions",
              `Page ${pageNumber} is unusually large and cannot be processed safely in the browser.`,
            );
          }
        } finally {
          page.cleanup();
        }
      }
    } finally {
      await loadingTask.destroy();
    }
  } catch (error) {
    throw mapPreflightError(error);
  }
}
