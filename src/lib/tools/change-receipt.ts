import { PDFDocument } from "pdf-lib";
import type {
  PdfAnalysisResult,
  PdfPageAnalysis,
} from "@/lib/pdf-analysis/types";

export interface ChangeReceiptMetadata {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
}

export interface ChangeReceiptFileSnapshot {
  analysis: PdfAnalysisResult;
  metadata: ChangeReceiptMetadata;
}

export interface ChangeReceiptMetadataChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface ChangeReceiptChange {
  id:
    | "file-size"
    | "page-count"
    | "page-size"
    | "rotation"
    | "searchability"
    | "content-profile"
    | "blankness"
    | "metadata";
  label: string;
  detail: string;
  pageNumbers?: number[];
}

export interface ChangeReceiptPageComparison {
  pageNumber: number;
  existsBefore: boolean;
  existsAfter: boolean;
  changes: string[];
}

export interface ChangeReceiptReport {
  changed: boolean;
  headline: string;
  summary: string;
  changes: ChangeReceiptChange[];
  pageComparisons: ChangeReceiptPageComparison[];
  metadataChanges: ChangeReceiptMetadataChange[];
  original: {
    fileSizeBytes: number;
    pageCount: number;
    searchablePages: number;
  };
  modified: {
    fileSizeBytes: number;
    pageCount: number;
    searchablePages: number;
  };
  addedPages: number[];
  removedPages: number[];
  sizeDeltaBytes: number;
  sizeDeltaPercent: number | null;
}

function dateString(value: Date | undefined) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString()
    : null;
}

function stringValue(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function readChangeReceiptMetadata(
  file: File,
): Promise<ChangeReceiptMetadata> {
  try {
    const bytes = await file.arrayBuffer();
    const document = await PDFDocument.load(bytes);

    return {
      title: stringValue(document.getTitle()),
      author: stringValue(document.getAuthor()),
      subject: stringValue(document.getSubject()),
      keywords: stringValue(document.getKeywords()),
      creator: stringValue(document.getCreator()),
      producer: stringValue(document.getProducer()),
      creationDate: dateString(document.getCreationDate()),
      modificationDate: dateString(document.getModificationDate()),
    };
  } catch {
    return {
      title: null,
      author: null,
      subject: null,
      keywords: null,
      creator: null,
      producer: null,
      creationDate: null,
      modificationDate: null,
    };
  }
}

function sameNumber(a: number, b: number, tolerance = 0.75) {
  return Math.abs(a - b) <= tolerance;
}

function pageContentProfile(page: PdfPageAnalysis) {
  if (page.blankness.likelyBlank) return "likely blank";
  if (page.hasExtractableText) return "text-bearing";
  if (page.contentKind === "probable-scan" || page.contentKind === "image-only") {
    return "image-based";
  }
  return "unknown";
}

function formatPageList(pageNumbers: number[]) {
  const visible = pageNumbers.slice(0, 8).join(", ");
  return pageNumbers.length <= 8
    ? visible
    : `${visible} +${pageNumbers.length - 8} more`;
}

function metadataEntries(metadata: ChangeReceiptMetadata) {
  return [
    ["Title", metadata.title],
    ["Author", metadata.author],
    ["Subject", metadata.subject],
    ["Keywords", metadata.keywords],
    ["Creator", metadata.creator],
    ["Producer", metadata.producer],
    ["Created", metadata.creationDate],
    ["Modified", metadata.modificationDate],
  ] as const;
}

export function buildChangeReceipt(
  original: ChangeReceiptFileSnapshot,
  modified: ChangeReceiptFileSnapshot,
): ChangeReceiptReport {
  const changes: ChangeReceiptChange[] = [];
  const originalAnalysis = original.analysis;
  const modifiedAnalysis = modified.analysis;
  const sizeDeltaBytes =
    modifiedAnalysis.fileSizeBytes - originalAnalysis.fileSizeBytes;
  const sizeDeltaPercent =
    originalAnalysis.fileSizeBytes > 0
      ? (sizeDeltaBytes / originalAnalysis.fileSizeBytes) * 100
      : null;

  if (sizeDeltaBytes !== 0) {
    const direction = sizeDeltaBytes > 0 ? "larger" : "smaller";
    const percentage =
      sizeDeltaPercent === null
        ? ""
        : ` (${Math.abs(sizeDeltaPercent).toFixed(1)}% ${direction})`;

    changes.push({
      id: "file-size",
      label: "File size changed",
      detail: `The modified PDF is ${Math.abs(sizeDeltaBytes).toLocaleString()} bytes ${direction}${percentage}.`,
    });
  }

  const addedPages: number[] = [];
  const removedPages: number[] = [];

  if (modifiedAnalysis.pageCount > originalAnalysis.pageCount) {
    for (
      let pageNumber = originalAnalysis.pageCount + 1;
      pageNumber <= modifiedAnalysis.pageCount;
      pageNumber += 1
    ) {
      addedPages.push(pageNumber);
    }
  } else if (originalAnalysis.pageCount > modifiedAnalysis.pageCount) {
    for (
      let pageNumber = modifiedAnalysis.pageCount + 1;
      pageNumber <= originalAnalysis.pageCount;
      pageNumber += 1
    ) {
      removedPages.push(pageNumber);
    }
  }

  if (originalAnalysis.pageCount !== modifiedAnalysis.pageCount) {
    changes.push({
      id: "page-count",
      label: "Page count changed",
      detail:
        modifiedAnalysis.pageCount > originalAnalysis.pageCount
          ? `${addedPages.length} page${addedPages.length === 1 ? "" : "s"} added at the end of the compared page sequence.`
          : `${removedPages.length} page${removedPages.length === 1 ? "" : "s"} removed from the end of the compared page sequence.`,
      pageNumbers: modifiedAnalysis.pageCount > originalAnalysis.pageCount
        ? addedPages
        : removedPages,
    });
  }

  const pairedPageCount = Math.min(
    originalAnalysis.pageCount,
    modifiedAnalysis.pageCount,
  );
  const sizeChangedPages: number[] = [];
  const rotationChangedPages: number[] = [];
  const searchabilityChangedPages: number[] = [];
  const contentChangedPages: number[] = [];
  const blanknessChangedPages: number[] = [];
  const pageComparisons: ChangeReceiptPageComparison[] = [];

  for (let index = 0; index < pairedPageCount; index += 1) {
    const before = originalAnalysis.pages[index];
    const after = modifiedAnalysis.pages[index];
    const pageChanges: string[] = [];

    if (
      !sameNumber(before.widthPoints, after.widthPoints) ||
      !sameNumber(before.heightPoints, after.heightPoints)
    ) {
      sizeChangedPages.push(index + 1);
      pageChanges.push(
        `Page size changed from ${(before.widthPoints / 72).toFixed(2)} × ${(before.heightPoints / 72).toFixed(2)} in to ${(after.widthPoints / 72).toFixed(2)} × ${(after.heightPoints / 72).toFixed(2)} in`,
      );
    }

    if (before.rotationDegrees !== after.rotationDegrees) {
      rotationChangedPages.push(index + 1);
      pageChanges.push(
        `Rotation changed from ${before.rotationDegrees}° to ${after.rotationDegrees}°`,
      );
    }

    if (before.hasExtractableText !== after.hasExtractableText) {
      searchabilityChangedPages.push(index + 1);
      pageChanges.push(
        after.hasExtractableText
          ? "A reliable searchable text layer was added"
          : "The reliable searchable text layer is no longer detected",
      );
    }

    const beforeProfile = pageContentProfile(before);
    const afterProfile = pageContentProfile(after);
    if (beforeProfile !== afterProfile) {
      contentChangedPages.push(index + 1);
      pageChanges.push(
        `Content profile changed from ${beforeProfile} to ${afterProfile}`,
      );
    }

    if (before.blankness.likelyBlank !== after.blankness.likelyBlank) {
      blanknessChangedPages.push(index + 1);
      pageChanges.push(
        after.blankness.likelyBlank
          ? "The page is now classified as likely blank"
          : "The page is no longer classified as likely blank",
      );
    }

    pageComparisons.push({
      pageNumber: index + 1,
      existsBefore: true,
      existsAfter: true,
      changes: pageChanges,
    });
  }

  for (const pageNumber of addedPages) {
    pageComparisons.push({
      pageNumber,
      existsBefore: false,
      existsAfter: true,
      changes: ["Page exists only in the modified PDF"],
    });
  }

  for (const pageNumber of removedPages) {
    pageComparisons.push({
      pageNumber,
      existsBefore: true,
      existsAfter: false,
      changes: ["Page exists only in the original PDF"],
    });
  }

  if (sizeChangedPages.length > 0) {
    changes.push({
      id: "page-size",
      label: "Page dimensions changed",
      detail: `${sizeChangedPages.length} aligned page${sizeChangedPages.length === 1 ? "" : "s"} changed physical dimensions: ${formatPageList(sizeChangedPages)}.`,
      pageNumbers: sizeChangedPages,
    });
  }

  if (rotationChangedPages.length > 0) {
    changes.push({
      id: "rotation",
      label: "Page rotation changed",
      detail: `${rotationChangedPages.length} aligned page${rotationChangedPages.length === 1 ? "" : "s"} changed rotation metadata: ${formatPageList(rotationChangedPages)}.`,
      pageNumbers: rotationChangedPages,
    });
  }

  if (searchabilityChangedPages.length > 0) {
    changes.push({
      id: "searchability",
      label: "Searchability changed",
      detail: `${searchabilityChangedPages.length} aligned page${searchabilityChangedPages.length === 1 ? "" : "s"} changed text-layer status: ${formatPageList(searchabilityChangedPages)}.`,
      pageNumbers: searchabilityChangedPages,
    });
  }

  if (contentChangedPages.length > 0) {
    changes.push({
      id: "content-profile",
      label: "Page content profile changed",
      detail: `${contentChangedPages.length} aligned page${contentChangedPages.length === 1 ? "" : "s"} changed between text-bearing, image-based, blank, or unknown structure: ${formatPageList(contentChangedPages)}.`,
      pageNumbers: contentChangedPages,
    });
  }

  if (blanknessChangedPages.length > 0) {
    changes.push({
      id: "blankness",
      label: "Blank-page status changed",
      detail: `${blanknessChangedPages.length} aligned page${blanknessChangedPages.length === 1 ? "" : "s"} changed blankness classification: ${formatPageList(blanknessChangedPages)}.`,
      pageNumbers: blanknessChangedPages,
    });
  }

  const beforeMetadata = new Map(metadataEntries(original.metadata));
  const metadataChanges: ChangeReceiptMetadataChange[] = [];

  for (const [field, after] of metadataEntries(modified.metadata)) {
    const before = beforeMetadata.get(field) ?? null;
    if (before !== after) {
      metadataChanges.push({ field, before, after });
    }
  }

  if (metadataChanges.length > 0) {
    changes.push({
      id: "metadata",
      label: "Document metadata changed",
      detail: `${metadataChanges.length} common metadata field${metadataChanges.length === 1 ? "" : "s"} changed.`,
    });
  }

  const changed = changes.length > 0;

  return {
    changed,
    headline: changed
      ? "Structural changes detected"
      : "No structural changes detected by these checks",
    summary: changed
      ? `PDFBright found ${changes.length} change categor${changes.length === 1 ? "y" : "ies"} between the two PDFs.`
      : "File size, page count, aligned page structure, text-layer status, and common metadata match under this comparison.",
    changes,
    pageComparisons,
    metadataChanges,
    original: {
      fileSizeBytes: originalAnalysis.fileSizeBytes,
      pageCount: originalAnalysis.pageCount,
      searchablePages: originalAnalysis.summary.pagesWithExtractableText,
    },
    modified: {
      fileSizeBytes: modifiedAnalysis.fileSizeBytes,
      pageCount: modifiedAnalysis.pageCount,
      searchablePages: modifiedAnalysis.summary.pagesWithExtractableText,
    },
    addedPages,
    removedPages,
    sizeDeltaBytes,
    sizeDeltaPercent,
  };
}
