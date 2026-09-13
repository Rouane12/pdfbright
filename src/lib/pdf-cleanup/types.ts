import type { DiagnosisFixId } from "@/lib/diagnosis/build-diagnosis";

export type PdfCleanupSelection = Record<DiagnosisFixId, boolean>;

export type PdfCleanupProgressPhase =
  | "preparing"
  | "rendering-visual-fixes"
  | "applying-page-fixes"
  | "saving"
  | "validating";

export interface PdfCleanupProgress {
  phase: PdfCleanupProgressPhase;
  pageNumber?: number;
  pageCount?: number;
}

export interface PdfCleanupValidation {
  valid: boolean;
  expectedPageCount: number;
  outputPageCount: number;
  checkedTextPages: number;
  checkedVisualPages: number;
}

export interface PdfCleanupReport {
  originalPageCount: number;
  outputPageCount: number;
  rotatedPages: number[];
  straightenedPages: number[];
  readabilityEnhancedPages: number[];
  removedBlankPages: number[];
  normalizedPages: number[];
  skippedVisualPages: number[];
  unsupportedSelectedFixes: Array<"searchable-text" | "compress">;
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
