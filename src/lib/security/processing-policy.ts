export const CURRENT_PROCESSING_CLASS = "local" as const;
export const SERVER_ASSISTED_PROCESSING_ENABLED = false;

// These are current anonymous/V1 safety limits. M9 may layer plan-specific
// allowances on top, but hard safety limits should remain centralized here.
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 25;
export const MAX_PAGE_COUNT = 25;

// 7,200 PDF points is 100 inches at 72 points/inch. This is intentionally far
// above normal document sizes while protecting browser render/memory paths from
// pathological page dimensions.
export const MAX_PAGE_DIMENSION_POINTS = 7_200;

// The PDF specification permits a header offset; scanning the first KiB keeps
// the check tolerant without reading the whole document before validation.
export const PDF_HEADER_SCAN_BYTES = 1_024;
export const PDF_PREFLIGHT_TIMEOUT_MS = 15_000;

export const PROCESSING_POLICY_LAST_UPDATED = "2026-09-13";
