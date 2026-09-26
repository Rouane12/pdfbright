import type {
  PdfAnalysisResult,
  PdfPageAnalysis,
} from "@/lib/pdf-analysis/types";

export type ScanQualityGrade = "excellent" | "good" | "review" | "poor";
export type ScanQualitySignal = "good" | "review" | "poor" | "not-applicable";

export interface ScanQualityIssue {
  id:
    | "blank"
    | "rotation"
    | "skew"
    | "searchability"
    | "contrast"
    | "sharpness"
    | "darkness"
    | "analysis-warning";
  label: string;
  detail: string;
  severity: "warning" | "problem";
}

export interface ScanQualityPageAssessment {
  pageNumber: number;
  score: number;
  grade: ScanQualityGrade;
  label: string;
  contentLabel: string;
  issues: ScanQualityIssue[];
  searchable: boolean;
  alignment: ScanQualitySignal;
  contrast: ScanQualitySignal;
  sharpness: ScanQualitySignal;
}

export interface ScanQualityReport {
  score: number;
  grade: ScanQualityGrade;
  label: string;
  summary: string;
  pages: ScanQualityPageAssessment[];
  pagesToReview: number[];
  searchablePages: number;
  excellentPages: number;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function gradeFor(score: number): ScanQualityGrade {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 55) return "review";
  return "poor";
}

function labelFor(grade: ScanQualityGrade) {
  switch (grade) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "review":
      return "Needs review";
    case "poor":
      return "Poor";
  }
}

function contentLabelFor(page: PdfPageAnalysis) {
  switch (page.contentKind) {
    case "text":
      return "Native text";
    case "mixed":
      return "Text + images";
    case "probable-scan":
      return "Likely scan";
    case "image-only":
      return "Image-only";
    case "blank-candidate":
      return "Likely blank";
    default:
      return "Unknown";
  }
}

function assessPage(page: PdfPageAnalysis): ScanQualityPageAssessment {
  let score = 100;
  const issues: ScanQualityIssue[] = [];

  if (page.blankness.likelyBlank) {
    score -= 48;
    issues.push({
      id: "blank",
      label: "Likely blank",
      detail: "Very little visible content was detected on this page.",
      severity: "problem",
    });
  }

  if (page.rotationDegrees !== 0) {
    score -= 14;
    issues.push({
      id: "rotation",
      label: `Rotated ${page.rotationDegrees}°`,
      detail: "The page carries rotation metadata that may display unexpectedly in some workflows.",
      severity: "warning",
    });
  }

  if (page.skew.likelySkewed) {
    score -= Math.round(10 + page.skew.confidence * 10);
    issues.push({
      id: "skew",
      label: "Likely crooked",
      detail:
        page.skew.estimatedDegrees === null
          ? "The scan appears slightly misaligned."
          : `Estimated skew is ${Math.abs(page.skew.estimatedDegrees).toFixed(1)}°.`,
      severity: "warning",
    });
  }

  if (!page.hasExtractableText && !page.blankness.likelyBlank) {
    score -= 14;
    issues.push({
      id: "searchability",
      label: "Not searchable",
      detail: "No reliable extractable text was found on this page.",
      severity: "problem",
    });
  }

  if (page.visualQuality.lowContrast) {
    score -= 12;
    issues.push({
      id: "contrast",
      label: "Low contrast signal",
      detail: "The low-resolution scan signal suggests faint or flat tonal separation.",
      severity: "warning",
    });
  }

  if (page.visualQuality.lowSharpness) {
    score -= 16;
    issues.push({
      id: "sharpness",
      label: "Low sharpness signal",
      detail: "Fine edges look soft in the analysis render, which can make scan text harder to read or OCR.",
      severity: "warning",
    });
  }

  if (page.visualQuality.unusuallyDark) {
    score -= 8;
    issues.push({
      id: "darkness",
      label: "Dark scan signal",
      detail: "The page is unusually dark overall and may benefit from readability cleanup.",
      severity: "warning",
    });
  }

  if (page.warnings.length > 0) {
    score -= 8;
    issues.push({
      id: "analysis-warning",
      label: "Limited visual analysis",
      detail: "Some low-resolution visual checks were unavailable for this page.",
      severity: "warning",
    });
  }

  const finalScore = clampScore(score);
  const grade = gradeFor(finalScore);
  const scanLike =
    page.contentKind === "probable-scan" || page.contentKind === "image-only";

  return {
    pageNumber: page.pageNumber,
    score: finalScore,
    grade,
    label: labelFor(grade),
    contentLabel: contentLabelFor(page),
    issues,
    searchable: page.hasExtractableText,
    alignment:
      page.rotationDegrees !== 0 || page.skew.likelySkewed ? "review" : "good",
    contrast: scanLike
      ? page.visualQuality.lowContrast
        ? "review"
        : page.visualQuality.contrastScore === null
          ? "not-applicable"
          : "good"
      : "not-applicable",
    sharpness: scanLike
      ? page.visualQuality.lowSharpness
        ? "review"
        : page.visualQuality.sharpnessScore === null
          ? "not-applicable"
          : "good"
      : "not-applicable",
  };
}

export function buildScanQualityReport(
  analysis: PdfAnalysisResult,
): ScanQualityReport {
  const pages = analysis.pages.map(assessPage);
  const score =
    pages.length > 0
      ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length)
      : 0;
  const grade = gradeFor(score);
  const pagesToReview = pages
    .filter((page) => page.issues.length > 0)
    .map((page) => page.pageNumber);
  const searchablePages = pages.filter((page) => page.searchable).length;
  const excellentPages = pages.filter((page) => page.grade === "excellent").length;

  return {
    score,
    grade,
    label: labelFor(grade),
    summary:
      pagesToReview.length === 0
        ? "No obvious scan-quality problems were detected."
        : `${pagesToReview.length} page${pagesToReview.length === 1 ? "" : "s"} could use review before you send, archive, or OCR this PDF.`,
    pages,
    pagesToReview,
    searchablePages,
    excellentPages,
  };
}
