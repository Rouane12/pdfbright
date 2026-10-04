import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";
import { cleanupPdfFile } from "@/lib/pdf-cleanup/cleanup-pdf";
import {
  PdfCleanupError,
  type PdfCleanupProgress,
  type PdfCleanupResult,
  type PdfCleanupSelection,
} from "@/lib/pdf-cleanup/types";
import {
  PDF_COMPRESSION_PROFILES,
  type PdfCompressionMode,
} from "./profiles";

export type FitToSizeStatus =
  | "already-fits"
  | "target-reached"
  | "best-safe-effort";

export type FitToSizeErrorCode =
  | "invalid-target"
  | "not-compressible"
  | "optimization-failed";

export interface FitToSizeProgress {
  phase: "testing-profile";
  attempt: number;
  totalAttempts: number;
  mode: PdfCompressionMode;
  cleanupProgress?: PdfCleanupProgress;
}

export interface FitToSizeResult {
  status: FitToSizeStatus;
  targetBytes: number;
  originalBytes: number;
  outputBytes: number;
  selectedMode: PdfCompressionMode | null;
  attemptedModes: PdfCompressionMode[];
  cleanupResult: PdfCleanupResult | null;
}

export class FitToSizeError extends Error {
  readonly code: FitToSizeErrorCode;

  constructor(code: FitToSizeErrorCode, message: string) {
    super(message);
    this.name = "FitToSizeError";
    this.code = code;
  }
}

const QUALITY_ORDER: PdfCompressionMode[] = [
  "best-quality",
  "balanced",
  "smaller-file",
];

const COMPRESSION_ONLY_SELECTION: PdfCleanupSelection = {
  straighten: false,
  rotate: false,
  "searchable-text": false,
  "remove-blank-pages": false,
  "improve-readability": false,
  "normalize-pages": false,
  compress: true,
};

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Target-size optimization was cancelled.", "AbortError");
  }
}

/**
 * Fit a PDF under a requested byte limit using PDFBright's validated scan
 * compression profiles. The engine deliberately prefers the least aggressive
 * profile that actually satisfies the target instead of guessing from a single
 * quality slider.
 *
 * Native text/vector pages are never flattened just to chase a smaller number.
 * If the smallest validated profile cannot reach the requested target, the
 * caller receives the smallest safe measured result as `best-safe-effort`.
 */
export async function fitPdfToTargetSize(
  file: File,
  analysis: PdfAnalysisResult,
  targetBytes: number,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: FitToSizeProgress) => void;
  } = {},
): Promise<FitToSizeResult> {
  if (!Number.isFinite(targetBytes) || targetBytes <= 0) {
    throw new FitToSizeError(
      "invalid-target",
      "Choose a valid file-size limit greater than zero.",
    );
  }

  if (file.size <= targetBytes) {
    return {
      status: "already-fits",
      targetBytes,
      originalBytes: file.size,
      outputBytes: file.size,
      selectedMode: null,
      attemptedModes: [],
      cleanupResult: null,
    };
  }

  const attemptedModes: PdfCompressionMode[] = [];
  let smallest: { mode: PdfCompressionMode; result: PdfCleanupResult } | null = null;
  let sawCompressibleCandidate = false;

  for (let index = 0; index < QUALITY_ORDER.length; index += 1) {
    abortIfNeeded(options.signal);
    const mode = QUALITY_ORDER[index];
    attemptedModes.push(mode);

    options.onProgress?.({
      phase: "testing-profile",
      attempt: index + 1,
      totalAttempts: QUALITY_ORDER.length,
      mode,
    });

    try {
      const result = await cleanupPdfFile(
        file,
        analysis,
        COMPRESSION_ONLY_SELECTION,
        {
          signal: options.signal,
          compressionMode: mode,
          onProgress: (cleanupProgress) => {
            options.onProgress?.({
              phase: "testing-profile",
              attempt: index + 1,
              totalAttempts: QUALITY_ORDER.length,
              mode,
              cleanupProgress,
            });
          },
        },
      );

      sawCompressibleCandidate = true;

      if (!smallest || result.report.outputFileSizeBytes < smallest.result.report.outputFileSizeBytes) {
        smallest = { mode, result };
      }

      if (result.report.outputFileSizeBytes <= targetBytes) {
        return {
          status: "target-reached",
          targetBytes,
          originalBytes: file.size,
          outputBytes: result.report.outputFileSizeBytes,
          selectedMode: mode,
          attemptedModes,
          cleanupResult: result,
        };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      if (error instanceof PdfCleanupError) {
        if (error.code === "compression-not-effective") {
          continue;
        }

        if (error.code === "compression-not-applicable") {
          if (!sawCompressibleCandidate) {
            throw new FitToSizeError(
              "not-compressible",
              "PDFBright did not find scan/image pages it can safely recompress. Native text and vector pages are preserved instead of flattened just to hit a size limit.",
            );
          }
          continue;
        }
      }

      throw error;
    }
  }

  if (smallest) {
    return {
      status: "best-safe-effort",
      targetBytes,
      originalBytes: file.size,
      outputBytes: smallest.result.report.outputFileSizeBytes,
      selectedMode: smallest.mode,
      attemptedModes,
      cleanupResult: smallest.result,
    };
  }

  throw new FitToSizeError(
    sawCompressibleCandidate ? "optimization-failed" : "not-compressible",
    sawCompressibleCandidate
      ? "PDFBright could not produce a validated smaller result for this document."
      : "PDFBright could not safely recompress this document without flattening content it should preserve.",
  );
}

export function compressionModeLabel(mode: PdfCompressionMode | null) {
  return mode ? PDF_COMPRESSION_PROFILES[mode].label : null;
}
