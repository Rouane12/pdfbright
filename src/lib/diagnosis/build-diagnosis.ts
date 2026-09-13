import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";

export type DiagnosisFixId =
  | "straighten"
  | "rotate"
  | "searchable-text"
  | "remove-blank-pages"
  | "normalize-pages"
  | "compress";

export type DiagnosisEvidence = "fact" | "heuristic";

export interface DiagnosisRecommendation {
  id: DiagnosisFixId;
  title: string;
  description: string;
  pageNumbers: number[];
  count: number;
  evidence: DiagnosisEvidence;
  confidence: number | null;
  defaultSelected: boolean;
  destructive: boolean;
  reviewRequired: boolean;
}

export interface DiagnosisPlan {
  recommendations: DiagnosisRecommendation[];
  pageCount: number;
  findingCount: number;
  isClean: boolean;
}

function withoutBlankCandidates(result: PdfAnalysisResult) {
  const blankPages = new Set(result.summary.blankPageCandidates);
  return result.pages
    .filter((page) => !page.hasExtractableText && !blankPages.has(page.pageNumber))
    .map((page) => page.pageNumber);
}

function averageSkewConfidence(result: PdfAnalysisResult) {
  const skewedPages = result.pages.filter((page) => page.skew.likelySkewed);
  if (skewedPages.length === 0) return null;

  return (
    skewedPages.reduce((sum, page) => sum + page.skew.confidence, 0) /
    skewedPages.length
  );
}

export function buildDiagnosisPlan(result: PdfAnalysisResult): DiagnosisPlan {
  const recommendations: DiagnosisRecommendation[] = [];
  const rotatedPages = result.summary.pagesWithRotationMetadata;
  const skewedPages = result.summary.likelySkewedPages;
  const textlessNonblankPages = withoutBlankCandidates(result);
  const blankPages = result.summary.blankPageCandidates;
  const skewConfidence = averageSkewConfidence(result);

  if (skewedPages.length > 0) {
    const confidence = skewConfidence ?? 0;
    recommendations.push({
      id: "straighten",
      title:
        skewedPages.length === 1
          ? "1 page looks slightly crooked"
          : `${skewedPages.length} pages look slightly crooked`,
      description:
        "PDFBright can straighten likely scanned pages while leaving uncertain pages alone.",
      pageNumbers: skewedPages,
      count: skewedPages.length,
      evidence: "heuristic",
      confidence,
      defaultSelected: confidence >= 0.45,
      destructive: false,
      reviewRequired: confidence < 0.55,
    });
  }

  if (rotatedPages.length > 0) {
    recommendations.push({
      id: "rotate",
      title:
        rotatedPages.length === 1
          ? "1 page is sideways"
          : `${rotatedPages.length} pages are sideways`,
      description: "Rotate pages with clear orientation metadata so they read normally.",
      pageNumbers: rotatedPages,
      count: rotatedPages.length,
      evidence: "fact",
      confidence: 1,
      defaultSelected: true,
      destructive: false,
      reviewRequired: false,
    });
  }

  if (textlessNonblankPages.length > 0) {
    recommendations.push({
      id: "searchable-text",
      title:
        textlessNonblankPages.length === 1
          ? "Text isn't searchable on 1 page"
          : `Text isn't searchable on ${textlessNonblankPages.length} pages`,
      description:
        "These pages do not contain extractable text. Searchable text can be added with OCR when that cleanup step is available.",
      pageNumbers: textlessNonblankPages,
      count: textlessNonblankPages.length,
      evidence: "fact",
      confidence: 1,
      defaultSelected: true,
      destructive: false,
      reviewRequired: false,
    });
  }

  if (blankPages.length > 0) {
    recommendations.push({
      id: "remove-blank-pages",
      title:
        blankPages.length === 1
          ? "1 page appears blank"
          : `${blankPages.length} pages appear blank`,
      description:
        "Blank-page detection is an estimate. Review these pages before anything is removed.",
      pageNumbers: blankPages,
      count: blankPages.length,
      evidence: "heuristic",
      confidence: null,
      defaultSelected: false,
      destructive: true,
      reviewRequired: true,
    });
  }

  if (result.summary.hasInconsistentPageSizes) {
    recommendations.push({
      id: "normalize-pages",
      title: "Page sizes are inconsistent",
      description:
        "Some pages use noticeably different dimensions. PDFBright can normalize them without intentionally cropping meaningful content.",
      pageNumbers: result.pages.map((page) => page.pageNumber),
      count: result.pageCount,
      evidence: "fact",
      confidence: 1,
      defaultSelected: true,
      destructive: false,
      reviewRequired: false,
    });
  }

  if (result.summary.likelyCompressionOpportunity) {
    recommendations.push({
      id: "compress",
      title: "This PDF can likely be made smaller",
      description:
        "The document appears to contain image-heavy pages that may compress well without hurting normal readability.",
      pageNumbers: result.summary.probableScanPages,
      count: result.summary.probableScanPages.length,
      evidence: "heuristic",
      confidence: 0.65,
      defaultSelected: true,
      destructive: false,
      reviewRequired: false,
    });
  }

  return {
    recommendations,
    pageCount: result.pageCount,
    findingCount: recommendations.length,
    isClean: recommendations.length === 0,
  };
}

export const ADVANCED_FIX_OPTIONS: Array<{
  id: DiagnosisFixId;
  label: string;
  description: string;
}> = [
  {
    id: "straighten",
    label: "Straighten pages",
    description: "Correct likely crooked scanned pages conservatively.",
  },
  {
    id: "rotate",
    label: "Rotate sideways pages",
    description: "Orient pages that are clearly rotated.",
  },
  {
    id: "searchable-text",
    label: "Make scans searchable",
    description: "Add searchable text to image-only pages with OCR.",
  },
  {
    id: "remove-blank-pages",
    label: "Remove blank pages",
    description: "Only after reviewing pages that merely appear blank.",
  },
  {
    id: "normalize-pages",
    label: "Make page sizes consistent",
    description: "Normalize awkward page dimensions where appropriate.",
  },
  {
    id: "compress",
    label: "Make file smaller",
    description: "Optimize image-heavy PDFs while protecting readability.",
  },
];
