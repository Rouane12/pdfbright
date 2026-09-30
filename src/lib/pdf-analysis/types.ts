export type AnalysisEvidence = "fact" | "heuristic" | "unsupported";

export type PageOrientation = "portrait" | "landscape" | "square";

export type PageContentKind =
  | "text"
  | "mixed"
  | "probable-scan"
  | "image-only"
  | "blank-candidate"
  | "unknown";

export type PdfAnalysisErrorCode =
  | "password-protected"
  | "damaged-pdf"
  | "unsupported-pdf"
  | "browser-memory"
  | "analysis-cancelled"
  | "analysis-failed";

export interface PixelHeuristicResult {
  nearWhiteRatio: number;
  darkPixelRatio: number;
  edgeDensity: number;
  meanLuminance: number;
  contrastScore: number;
  sharpnessScore: number;
  blankScore: number;
  likelyBlank: boolean;
  estimatedSkewDegrees: number | null;
  skewConfidence: number;
}

export interface PdfPageAnalysis {
  pageNumber: number;
  widthPoints: number;
  heightPoints: number;
  displayWidthPoints: number;
  displayHeightPoints: number;
  rotationDegrees: number;
  orientation: PageOrientation;
  extractableTextCharacters: number;
  extractableTextItems: number;
  hasExtractableText: boolean;
  imagePaintOperations: number;
  contentKind: PageContentKind;
  probableScanConfidence: number;
  blankness: {
    evidence: "heuristic";
    score: number | null;
    likelyBlank: boolean;
  };
  skew: {
    evidence: "heuristic";
    estimatedDegrees: number | null;
    confidence: number;
    likelySkewed: boolean;
  };
  visualQuality: {
    evidence: "heuristic";
    meanLuminance: number | null;
    contrastScore: number | null;
    sharpnessScore: number | null;
    lowContrast: boolean;
    lowSharpness: boolean;
    unusuallyDark: boolean;
  };
  lowResolutionRender: {
    attempted: boolean;
    widthPixels: number | null;
    heightPixels: number | null;
  };
  warnings: string[];
}

export interface PdfAnalysisFinding {
  id:
    | "rotation-metadata"
    | "textless-pages"
    | "probable-scans"
    | "blank-candidates"
    | "inconsistent-page-sizes"
    | "inconsistent-orientation"
    | "likely-skew"
    | "compression-opportunity";
  evidence: AnalysisEvidence;
  pageNumbers: number[];
  count: number;
  confidence: number | null;
}

export interface PdfAnalysisSummary {
  pagesWithExtractableText: number;
  pagesWithoutExtractableText: number;
  probableScanPages: number[];
  blankPageCandidates: number[];
  pagesWithRotationMetadata: number[];
  likelySkewedPages: number[];
  hasInconsistentPageSizes: boolean;
  hasMixedPageOrientations: boolean;
  likelyCompressionOpportunity: boolean;
}

export interface PdfAnalysisResult {
  schemaVersion: 1;
  analyzedAt: string;
  fileSizeBytes: number;
  pageCount: number;
  durationMs: number;
  pages: PdfPageAnalysis[];
  summary: PdfAnalysisSummary;
  findings: PdfAnalysisFinding[];
  warnings: string[];
}

export type PdfAnalysisProgressPhase =
  | "loading"
  | "parsing"
  | "analyzing-pages"
  | "finalizing";

export interface PdfAnalysisProgress {
  phase: PdfAnalysisProgressPhase;
  pageNumber?: number;
  pageCount?: number;
}

export class PdfAnalysisError extends Error {
  readonly code: PdfAnalysisErrorCode;

  constructor(code: PdfAnalysisErrorCode, message: string) {
    super(message);
    this.name = "PdfAnalysisError";
    this.code = code;
  }
}
