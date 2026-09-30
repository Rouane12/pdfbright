import type {
  PdfAnalysisResult,
  PdfPageAnalysis,
} from "@/lib/pdf-analysis/types";

export type SearchabilityStatus =
  | "fully-searchable"
  | "partially-searchable"
  | "not-searchable"
  | "no-content";

export type SearchabilityPageStatus =
  | "searchable"
  | "needs-ocr"
  | "blank"
  | "review";

export interface SearchabilityPageAssessment {
  pageNumber: number;
  status: SearchabilityPageStatus;
  label: string;
  detail: string;
  extractableTextCharacters: number;
  contentLabel: string;
}

export interface SearchabilityReport {
  status: SearchabilityStatus;
  headline: string;
  summary: string;
  coveragePercent: number;
  pageCount: number;
  contentPageCount: number;
  searchablePageCount: number;
  needsOcrPages: number[];
  reviewPages: number[];
  blankPages: number[];
  pages: SearchabilityPageAssessment[];
}

function contentLabel(page: PdfPageAnalysis) {
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

function assessPage(page: PdfPageAnalysis): SearchabilityPageAssessment {
  if (page.blankness.likelyBlank) {
    return {
      pageNumber: page.pageNumber,
      status: "blank",
      label: "Likely blank",
      detail: "No meaningful visible content was detected, so this page is excluded from search coverage.",
      extractableTextCharacters: page.extractableTextCharacters,
      contentLabel: contentLabel(page),
    };
  }

  if (page.hasExtractableText) {
    return {
      pageNumber: page.pageNumber,
      status: "searchable",
      label: "Searchable",
      detail: `${page.extractableTextCharacters.toLocaleString()} extractable text character${page.extractableTextCharacters === 1 ? "" : "s"} detected.`,
      extractableTextCharacters: page.extractableTextCharacters,
      contentLabel: contentLabel(page),
    };
  }

  if (page.contentKind === "probable-scan" || page.contentKind === "image-only") {
    return {
      pageNumber: page.pageNumber,
      status: "needs-ocr",
      label: "Needs OCR",
      detail:
        "This page appears image-based and has no reliable extractable text layer.",
      extractableTextCharacters: page.extractableTextCharacters,
      contentLabel: contentLabel(page),
    };
  }

  return {
    pageNumber: page.pageNumber,
    status: "review",
    label: "No reliable text layer",
    detail:
      "No reliable extractable text was detected, but the page does not look clearly scan-based.",
    extractableTextCharacters: page.extractableTextCharacters,
    contentLabel: contentLabel(page),
  };
}

export function buildSearchabilityReport(
  analysis: PdfAnalysisResult,
): SearchabilityReport {
  const pages = analysis.pages.map(assessPage);
  const blankPages = pages
    .filter((page) => page.status === "blank")
    .map((page) => page.pageNumber);
  const contentPages = pages.filter((page) => page.status !== "blank");
  const searchablePageCount = contentPages.filter(
    (page) => page.status === "searchable",
  ).length;
  const contentPageCount = contentPages.length;
  const coveragePercent =
    contentPageCount > 0
      ? Math.round((searchablePageCount / contentPageCount) * 100)
      : 0;
  const needsOcrPages = pages
    .filter((page) => page.status === "needs-ocr")
    .map((page) => page.pageNumber);
  const reviewPages = pages
    .filter((page) => page.status === "review")
    .map((page) => page.pageNumber);

  let status: SearchabilityStatus;
  if (contentPageCount === 0) {
    status = "no-content";
  } else if (searchablePageCount === contentPageCount) {
    status = "fully-searchable";
  } else if (searchablePageCount === 0) {
    status = "not-searchable";
  } else {
    status = "partially-searchable";
  }

  let headline: string;
  let summary: string;

  switch (status) {
    case "fully-searchable":
      headline = "Every content page is searchable";
      summary =
        "Reliable extractable text was detected across all non-blank pages in this PDF.";
      break;
    case "partially-searchable":
      headline = "Only part of this PDF is searchable";
      summary = `${searchablePageCount} of ${contentPageCount} content pages have reliable extractable text.`;
      break;
    case "not-searchable":
      headline = "This PDF is not reliably searchable";
      summary =
        "No content page has a reliable extractable text layer. Image-based pages will generally need OCR.";
      break;
    case "no-content":
      headline = "No searchable content pages were detected";
      summary =
        "The analyzed pages appear blank or contain too little meaningful content for a searchability result.";
      break;
  }

  return {
    status,
    headline,
    summary,
    coveragePercent,
    pageCount: analysis.pageCount,
    contentPageCount,
    searchablePageCount,
    needsOcrPages,
    reviewPages,
    blankPages,
    pages,
  };
}
