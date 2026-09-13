import type { DiagnosisFixId } from "@/lib/diagnosis/build-diagnosis";
import type { PdfOcrLanguage } from "@/lib/pdf-ocr/types";
import type { PdfCompressionMode } from "@/lib/pdf-optimization/profiles";

export type PdfCleanupSelection = Record<DiagnosisFixId, boolean>;

export type PdfCleanupProgressPhase =
  | "preparing"
  | "rendering-visual-fixes"
  | "optimizing-file-size"
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
  originalFileSizeBytes: number;
  outputFileSizeBytes: number;
  bytesSaved: number;
  sizeReductionPercent: number;
  compressionMode: PdfCompressionMode | null;
  optimizedPages: number[];
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
  | "compression-not-applicable"
  | "compression-not-effective"
  | "output-invalid"
  | "cleanup-failed";

function stripOriginalFileStatus(message: string) {
  const cleaned = message
    .replace(/\s+(?:Your|The) original file (?:is unchanged|was not changed)\.?$/i, "")
    .trim();
  return cleaned || message;
}

export class PdfCleanupError extends Error {
  readonly code: PdfCleanupErrorCode;

  constructor(code: PdfCleanupErrorCode, message: string) {
    super(stripOriginalFileStatus(message));
    this.name = "PdfCleanupError";
    this.code = code;
  }
}
