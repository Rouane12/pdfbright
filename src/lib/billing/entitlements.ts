import {
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
} from "@/lib/security/processing-policy";

export type PdfBrightPlan = "free" | "pro";

export type ProcessingAllowance = {
  maxFileSizeBytes: number;
  maxFileSizeMB: number;
  maxPageCount: number;
  maxOcrPages: number;
};

// M9 launch allowances intentionally stay inside the browser-safety ceilings
// already validated in M5-M8. Pro gets the full tested local envelope; Free
// stays generous enough for normal one-off cleanup while preserving a clear
// reason to upgrade for larger/heavier documents.
export const FREE_PROCESSING_ALLOWANCE: ProcessingAllowance = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFileSizeMB: 10,
  maxPageCount: 10,
  maxOcrPages: 3,
};

export const PRO_PROCESSING_ALLOWANCE: ProcessingAllowance = {
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  maxFileSizeMB: MAX_FILE_SIZE_MB,
  maxPageCount: MAX_PAGE_COUNT,
  maxOcrPages: 10,
};

export function getProcessingAllowance(plan: PdfBrightPlan): ProcessingAllowance {
  return plan === "pro" ? PRO_PROCESSING_ALLOWANCE : FREE_PROCESSING_ALLOWANCE;
}
