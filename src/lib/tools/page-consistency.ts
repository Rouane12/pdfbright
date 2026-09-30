import type {
  PdfAnalysisResult,
  PdfPageAnalysis,
} from "@/lib/pdf-analysis/types";

export type PageConsistencyStatus = "consistent" | "review" | "mixed";
export type PageConsistencyCellState =
  | "match"
  | "outlier"
  | "warning"
  | "blank"
  | "not-applicable";

export interface PageConsistencySizeGroup {
  signature: string;
  label: string;
  widthPoints: number;
  heightPoints: number;
  count: number;
  pageNumbers: number[];
  dominant: boolean;
}

export interface PageConsistencyPage {
  pageNumber: number;
  sizeLabel: string;
  dimensionsLabel: string;
  orientation: "portrait" | "landscape" | "square";
  contentLabel: string;
  searchable: boolean;
  rotated: boolean;
  blank: boolean;
  sizeState: PageConsistencyCellState;
  orientationState: PageConsistencyCellState;
  contentState: PageConsistencyCellState;
  searchabilityState: PageConsistencyCellState;
  rotationState: PageConsistencyCellState;
  blankState: PageConsistencyCellState;
  issues: string[];
}

export interface PageConsistencyReport {
  status: PageConsistencyStatus;
  headline: string;
  summary: string;
  pageCount: number;
  dominantSizeLabel: string;
  dominantOrientation: "portrait" | "landscape" | "square";
  dominantContentLabel: string;
  sizeGroups: PageConsistencySizeGroup[];
  pages: PageConsistencyPage[];
  pagesToReview: number[];
  sizeOutlierPages: number[];
  orientationOutlierPages: number[];
  contentOutlierPages: number[];
}

const STANDARD_FORMATS = [
  { label: "A3", short: 841.89, long: 1190.55 },
  { label: "A4", short: 595.28, long: 841.89 },
  { label: "A5", short: 419.53, long: 595.28 },
  { label: "US Letter", short: 612, long: 792 },
  { label: "US Legal", short: 612, long: 1008 },
] as const;

function orientationFor(width: number, height: number) {
  if (Math.abs(width - height) <= 1) return "square" as const;
  return width > height ? ("landscape" as const) : ("portrait" as const);
}

function normalizedDimensions(width: number, height: number) {
  return {
    short: Math.min(width, height),
    long: Math.max(width, height),
  };
}

function dimensionSignature(width: number, height: number) {
  const { short, long } = normalizedDimensions(width, height);
  const bucket = (value: number) => Math.round(value / 8) * 8;
  return `${bucket(short)}x${bucket(long)}`;
}

function knownFormat(width: number, height: number) {
  const { short, long } = normalizedDimensions(width, height);
  const tolerance = 0.025;

  return (
    STANDARD_FORMATS.find(
      (format) =>
        Math.abs(short - format.short) <= format.short * tolerance &&
        Math.abs(long - format.long) <= format.long * tolerance,
    )?.label ?? null
  );
}

function dimensionsLabel(width: number, height: number) {
  const widthIn = width / 72;
  const heightIn = height / 72;
  return `${widthIn.toFixed(2)} × ${heightIn.toFixed(2)} in`;
}

function contentFamily(page: PdfPageAnalysis) {
  if (page.blankness.likelyBlank) return "blank";
  if (page.hasExtractableText) return "text-bearing";
  if (page.contentKind === "probable-scan" || page.contentKind === "image-only") {
    return "image-based";
  }
  return "unknown";
}

function contentLabel(family: string) {
  switch (family) {
    case "text-bearing":
      return "Text-bearing";
    case "image-based":
      return "Image-based";
    case "blank":
      return "Likely blank";
    default:
      return "Unknown";
  }
}

function dominantValue<T extends string>(values: T[], fallback: T): T {
  if (values.length === 0) return fallback;

  const counts = new Map<T, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let dominant = fallback;
  let best = -1;
  for (const [value, count] of counts) {
    if (count > best) {
      dominant = value;
      best = count;
    }
  }
  return dominant;
}

function buildSizeGroups(pages: PdfPageAnalysis[]): PageConsistencySizeGroup[] {
  const groups = new Map<
    string,
    {
      widthPoints: number;
      heightPoints: number;
      pageNumbers: number[];
    }
  >();

  for (const page of pages) {
    const signature = dimensionSignature(
      page.displayWidthPoints,
      page.displayHeightPoints,
    );
    const current = groups.get(signature);

    if (current) {
      current.pageNumbers.push(page.pageNumber);
    } else {
      const { short, long } = normalizedDimensions(
        page.displayWidthPoints,
        page.displayHeightPoints,
      );
      groups.set(signature, {
        widthPoints: short,
        heightPoints: long,
        pageNumbers: [page.pageNumber],
      });
    }
  }

  const sorted = Array.from(groups.entries())
    .map(([signature, group]) => ({
      signature,
      label:
        knownFormat(group.widthPoints, group.heightPoints) ??
        dimensionsLabel(group.widthPoints, group.heightPoints),
      widthPoints: group.widthPoints,
      heightPoints: group.heightPoints,
      count: group.pageNumbers.length,
      pageNumbers: group.pageNumbers,
      dominant: false,
    }))
    .sort((a, b) => b.count - a.count || a.pageNumbers[0] - b.pageNumbers[0]);

  if (sorted[0]) sorted[0].dominant = true;
  return sorted;
}

export function buildPageConsistencyReport(
  analysis: PdfAnalysisResult,
): PageConsistencyReport {
  const sizeGroups = buildSizeGroups(analysis.pages);
  const dominantSize = sizeGroups[0];
  const sizeGroupByPage = new Map<number, string>();

  for (const group of sizeGroups) {
    for (const pageNumber of group.pageNumbers) {
      sizeGroupByPage.set(pageNumber, group.signature);
    }
  }

  const orientations = analysis.pages.map((page) =>
    orientationFor(page.displayWidthPoints, page.displayHeightPoints),
  );
  const dominantOrientation = dominantValue(
    orientations,
    "portrait" as const,
  );

  const nonBlankFamilies = analysis.pages
    .map(contentFamily)
    .filter((family) => family !== "blank");
  const dominantContentFamily = dominantValue(
    nonBlankFamilies,
    "unknown",
  );

  const pages = analysis.pages.map((page): PageConsistencyPage => {
    const orientation = orientationFor(
      page.displayWidthPoints,
      page.displayHeightPoints,
    );
    const family = contentFamily(page);
    const sizeOutlier =
      Boolean(dominantSize) &&
      sizeGroupByPage.get(page.pageNumber) !== dominantSize.signature;
    const orientationOutlier = orientation !== dominantOrientation;
    const contentOutlier =
      family !== "blank" &&
      dominantContentFamily !== "unknown" &&
      family !== dominantContentFamily;
    const rotated = page.rotationDegrees !== 0;
    const blank = page.blankness.likelyBlank;
    const issues: string[] = [];

    if (sizeOutlier) issues.push("Page size differs from the dominant document size");
    if (orientationOutlier) issues.push("Orientation differs from the dominant orientation");
    if (contentOutlier) issues.push("Content type differs from the dominant document pattern");
    if (!page.hasExtractableText && !blank) issues.push("No reliable searchable text layer");
    if (rotated) issues.push(`Rotation metadata: ${page.rotationDegrees}°`);
    if (blank) issues.push("Likely blank page");

    return {
      pageNumber: page.pageNumber,
      sizeLabel:
        knownFormat(page.displayWidthPoints, page.displayHeightPoints) ??
        dimensionsLabel(page.displayWidthPoints, page.displayHeightPoints),
      dimensionsLabel: dimensionsLabel(
        page.displayWidthPoints,
        page.displayHeightPoints,
      ),
      orientation,
      contentLabel: contentLabel(family),
      searchable: page.hasExtractableText,
      rotated,
      blank,
      sizeState: sizeOutlier ? "outlier" : "match",
      orientationState: orientationOutlier ? "outlier" : "match",
      contentState: blank
        ? "blank"
        : contentOutlier
          ? "outlier"
          : family === "unknown"
            ? "warning"
            : "match",
      searchabilityState: blank
        ? "not-applicable"
        : page.hasExtractableText
          ? "match"
          : "warning",
      rotationState: rotated ? "warning" : "match",
      blankState: blank ? "blank" : "match",
      issues,
    };
  });

  const sizeOutlierPages = pages
    .filter((page) => page.sizeState === "outlier")
    .map((page) => page.pageNumber);
  const orientationOutlierPages = pages
    .filter((page) => page.orientationState === "outlier")
    .map((page) => page.pageNumber);
  const contentOutlierPages = pages
    .filter((page) => page.contentState === "outlier")
    .map((page) => page.pageNumber);
  const pagesToReview = pages
    .filter((page) => page.issues.length > 0)
    .map((page) => page.pageNumber);

  const dominantShare =
    dominantSize && analysis.pageCount > 0
      ? dominantSize.count / analysis.pageCount
      : 1;

  let status: PageConsistencyStatus;
  if (pagesToReview.length === 0) {
    status = "consistent";
  } else if (sizeGroups.length > 2 || dominantShare < 0.65) {
    status = "mixed";
  } else {
    status = "review";
  }

  const headline =
    status === "consistent"
      ? "This document follows one consistent page pattern"
      : status === "mixed"
        ? "This PDF mixes several page patterns"
        : "A few pages break the document pattern";

  const summary =
    status === "consistent"
      ? "Page size, orientation, content type, rotation, blankness, and text-layer checks are consistent across the document."
      : `${pagesToReview.length} page${pagesToReview.length === 1 ? "" : "s"} differ from the dominant pattern in at least one way.`;

  return {
    status,
    headline,
    summary,
    pageCount: analysis.pageCount,
    dominantSizeLabel: dominantSize?.label ?? "Unknown",
    dominantOrientation,
    dominantContentLabel: contentLabel(dominantContentFamily),
    sizeGroups,
    pages,
    pagesToReview,
    sizeOutlierPages,
    orientationOutlierPages,
    contentOutlierPages,
  };
}
