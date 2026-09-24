import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";

export type UploadReadinessStatus = "pass" | "warning" | "fail";
export type UploadReadinessPageFormat = "any" | "a4" | "letter";

export interface UploadReadinessRequirements {
  maxFileSizeMb: number;
  maxPages: number;
  pageFormat: UploadReadinessPageFormat;
  requireSearchableText: boolean;
  requireConsistentPageSize: boolean;
}

export interface UploadReadinessCheck {
  id:
    | "structure"
    | "file-size"
    | "page-count"
    | "searchability"
    | "page-format"
    | "page-consistency"
    | "presentation";
  label: string;
  status: UploadReadinessStatus;
  detail: string;
  pageNumbers?: number[];
}

export interface UploadReadinessReport {
  overall: UploadReadinessStatus;
  headline: string;
  summary: string;
  checks: UploadReadinessCheck[];
}

const PAGE_FORMATS = {
  a4: { label: "A4", short: 595.28, long: 841.89 },
  letter: { label: "US Letter", short: 612, long: 792 },
} as const;

function clampPositive(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formatMb(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${mb.toFixed(mb >= 10 ? 1 : 2)} MB`;
}

function pageList(pageNumbers: number[]) {
  const visible = pageNumbers.slice(0, 6).join(", ");
  if (pageNumbers.length <= 6) return visible;
  return `${visible} +${pageNumbers.length - 6} more`;
}

function pageMatchesFormat(
  widthPoints: number,
  heightPoints: number,
  format: Exclude<UploadReadinessPageFormat, "any">,
) {
  const target = PAGE_FORMATS[format];
  const short = Math.min(widthPoints, heightPoints);
  const long = Math.max(widthPoints, heightPoints);
  const tolerance = 0.025;

  return (
    Math.abs(short - target.short) <= target.short * tolerance &&
    Math.abs(long - target.long) <= target.long * tolerance
  );
}

function overallStatus(checks: UploadReadinessCheck[]): UploadReadinessStatus {
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warning")) return "warning";
  return "pass";
}

export function evaluateUploadReadiness(
  analysis: PdfAnalysisResult,
  requirements: UploadReadinessRequirements,
): UploadReadinessReport {
  const maxFileSizeMb = clampPositive(requirements.maxFileSizeMb, 5);
  const maxPages = Math.max(1, Math.round(clampPositive(requirements.maxPages, 25)));
  const checks: UploadReadinessCheck[] = [
    {
      id: "structure",
      label: "Readable PDF structure",
      status: "pass",
      detail: `PDFBright successfully parsed all ${analysis.pageCount} pages.`,
    },
  ];

  const fileSizeLimitBytes = maxFileSizeMb * 1024 * 1024;
  const fileSizeRatio = analysis.fileSizeBytes / fileSizeLimitBytes;

  checks.push({
    id: "file-size",
    label: `File size ≤ ${maxFileSizeMb} MB`,
    status:
      analysis.fileSizeBytes > fileSizeLimitBytes
        ? "fail"
        : fileSizeRatio >= 0.9
          ? "warning"
          : "pass",
    detail:
      analysis.fileSizeBytes > fileSizeLimitBytes
        ? `This PDF is ${formatMb(analysis.fileSizeBytes)}, which exceeds the ${maxFileSizeMb} MB requirement.`
        : fileSizeRatio >= 0.9
          ? `This PDF is ${formatMb(analysis.fileSizeBytes)} and is close to the ${maxFileSizeMb} MB limit.`
          : `This PDF is ${formatMb(analysis.fileSizeBytes)}.`,
  });

  const pageDistance = maxPages - analysis.pageCount;
  checks.push({
    id: "page-count",
    label: `Page count ≤ ${maxPages}`,
    status:
      analysis.pageCount > maxPages
        ? "fail"
        : pageDistance <= 2
          ? "warning"
          : "pass",
    detail:
      analysis.pageCount > maxPages
        ? `This PDF has ${analysis.pageCount} pages, which exceeds the ${maxPages}-page requirement.`
        : pageDistance <= 2
          ? `This PDF has ${analysis.pageCount} pages and is close to the ${maxPages}-page limit.`
          : `This PDF has ${analysis.pageCount} pages.`,
  });

  if (requirements.requireSearchableText) {
    const textless = analysis.pages
      .filter((page) => !page.hasExtractableText)
      .map((page) => page.pageNumber);

    checks.push({
      id: "searchability",
      label: "Searchable text on every page",
      status: textless.length === 0 ? "pass" : "fail",
      detail:
        textless.length === 0
          ? "Every page contains extractable text."
          : `${textless.length} page${textless.length === 1 ? " is" : "s are"} not reliably searchable: ${pageList(textless)}.`,
      pageNumbers: textless.length > 0 ? textless : undefined,
    });
  } else {
    checks.push({
      id: "searchability",
      label: "Searchable text",
      status: analysis.summary.pagesWithoutExtractableText > 0 ? "warning" : "pass",
      detail:
        analysis.summary.pagesWithoutExtractableText > 0
          ? `${analysis.summary.pagesWithoutExtractableText} page${analysis.summary.pagesWithoutExtractableText === 1 ? " has" : "s have"} no extractable text, but searchability is not required by your settings.`
          : "Every page contains extractable text.",
    });
  }

  if (requirements.pageFormat !== "any") {
    const mismatchedPages = analysis.pages
      .filter(
        (page) =>
          !pageMatchesFormat(
            page.displayWidthPoints,
            page.displayHeightPoints,
            requirements.pageFormat as Exclude<UploadReadinessPageFormat, "any">,
          ),
      )
      .map((page) => page.pageNumber);
    const target = PAGE_FORMATS[requirements.pageFormat];

    checks.push({
      id: "page-format",
      label: `${target.label} page format`,
      status: mismatchedPages.length === 0 ? "pass" : "fail",
      detail:
        mismatchedPages.length === 0
          ? `All pages are within PDFBright's tolerance for ${target.label}.`
          : `${mismatchedPages.length} page${mismatchedPages.length === 1 ? " does" : "s do"} not match ${target.label}: ${pageList(mismatchedPages)}.`,
      pageNumbers: mismatchedPages.length > 0 ? mismatchedPages : undefined,
    });
  } else {
    checks.push({
      id: "page-format",
      label: "Page format",
      status: "pass",
      detail: "Any page format is allowed by your settings.",
    });
  }

  checks.push({
    id: "page-consistency",
    label: "Consistent page sizes",
    status: requirements.requireConsistentPageSize
      ? analysis.summary.hasInconsistentPageSizes
        ? "fail"
        : "pass"
      : analysis.summary.hasInconsistentPageSizes
        ? "warning"
        : "pass",
    detail: analysis.summary.hasInconsistentPageSizes
      ? requirements.requireConsistentPageSize
        ? "The PDF contains noticeably different page sizes."
        : "The PDF contains different page sizes. Your settings allow this, but some portals may not."
      : "Page dimensions are consistent.",
  });

  const presentationIssues: string[] = [];
  if (analysis.summary.pagesWithRotationMetadata.length > 0) {
    presentationIssues.push(
      `${analysis.summary.pagesWithRotationMetadata.length} rotated page${analysis.summary.pagesWithRotationMetadata.length === 1 ? "" : "s"}`,
    );
  }
  if (analysis.summary.blankPageCandidates.length > 0) {
    presentationIssues.push(
      `${analysis.summary.blankPageCandidates.length} likely blank page${analysis.summary.blankPageCandidates.length === 1 ? "" : "s"}`,
    );
  }
  if (analysis.summary.likelySkewedPages.length > 0) {
    presentationIssues.push(
      `${analysis.summary.likelySkewedPages.length} likely crooked page${analysis.summary.likelySkewedPages.length === 1 ? "" : "s"}`,
    );
  }

  checks.push({
    id: "presentation",
    label: "Presentation check",
    status: presentationIssues.length > 0 ? "warning" : "pass",
    detail:
      presentationIssues.length > 0
        ? `PDFBright also noticed ${presentationIssues.join(", ")}. These may not block an upload, but they are worth reviewing.`
        : "No obvious rotation, blank-page, or skew warnings were detected.",
  });

  const overall = overallStatus(checks);
  const failed = checks.filter((check) => check.status === "fail").length;
  const warnings = checks.filter((check) => check.status === "warning").length;

  if (overall === "fail") {
    return {
      overall,
      headline: "This PDF may be rejected",
      summary: `${failed} requirement${failed === 1 ? "" : "s"} failed${warnings ? ` and ${warnings} warning${warnings === 1 ? "" : "s"} need review` : ""}.`,
      checks,
    };
  }

  if (overall === "warning") {
    return {
      overall,
      headline: "Likely upload-ready, with a few warnings",
      summary: `${warnings} warning${warnings === 1 ? "" : "s"} may be worth checking before you submit the file.`,
      checks,
    };
  }

  return {
    overall,
    headline: "This PDF matches your requirements",
    summary: "Every selected readiness check passed.",
    checks,
  };
}
