import type { DiagnosisFixId } from "@/lib/diagnosis/build-diagnosis";
import type { PdfOcrLanguage } from "@/lib/pdf-ocr/types";

export type PdfCleanupSelection = Record<DiagnosisFixId, boolean>;

export type PdfCleanupProgressPhase =
  | "preparing"
  | "rendering-visual-fixes"
  | "applying-page-fixes"
  | "ocr-loading"
  | "ocr-recognizing"
  | "ocr-overlaying"
  | "saving"
  | "validating";

export interface PdfCleanupProgress {
  phase: PdfCleanupProgressPhase;
  pageNumber?: number;
  pageCount?: number;
  pageProgress?: number;
}

export interface PdfCleanupValidation {
  valid: boolean;
  expectedPageCount: number;
  outputPageCount: number;
  checkedTextPages: number;
  checkedOcrPages: number;
  checkedVisualPages: number;
}

export interface PdfCleanupReport {
  originalPageCount: number;
  outputPageCount: number;
  rotatedPages: number[];
  straightenedPages: number[];
  readabilityEnhancedPages: number[];
  searchableTextPages: number[];
  removedBlankPages: number[];
  normalizedPages: number[];
  skippedVisualPages: number[];
  ocrLanguage: PdfOcrLanguage | null;
  ocrWordCount: number;
  ocrCharacterCount: number;
  ocrDurationMs: number;
  unsupportedSelectedFixes: Array<"compress">;
  warnings: string[];
  durationMs: number;
}

export interface PdfCleanupResult {
  bytes: Uint8Array;
  report: PdfCleanupReport;
  validation: PdfCleanupValidation;
}

export type PdfCleanupErrorCode =
  | "cleanup-cancelled"
  | "no-supported-fixes"
  | "unsafe-blank-removal"
  | "ocr-failed"
  | "output-invalid"
  | "cleanup-failed";

export class PdfCleanupError extends Error {
  readonly code: PdfCleanupErrorCode;

  constructor(code: PdfCleanupErrorCode, message: string) {
    super(message);
    this.name = "PdfCleanupError";
    this.code = code;
  }
}
