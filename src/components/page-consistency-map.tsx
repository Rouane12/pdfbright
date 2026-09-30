"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { analyzePdfFile } from "@/lib/pdf-analysis/analyze-pdf";
import {
  PdfAnalysisError,
  type PdfAnalysisProgress,
  type PdfAnalysisResult,
} from "@/lib/pdf-analysis/types";
import {
  buildPageConsistencyReport,
  type PageConsistencyCellState,
  type PageConsistencyPage,
} from "@/lib/tools/page-consistency";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(progress: PdfAnalysisProgress | null) {
  if (!progress) return "Preparing consistency checks…";

  switch (progress.phase) {
    case "loading":
      return "Opening the PDF locally…";
    case "parsing":
      return "Reading document structure…";
    case "analyzing-pages":
      return progress.pageNumber && progress.pageCount
        ? `Mapping page ${progress.pageNumber} of ${progress.pageCount}…`
        : "Mapping page structure…";
    case "finalizing":
      return "Building the consistency map…";
  }
}

function stateLabel(state: PageConsistencyCellState) {
  switch (state) {
    case "match":
      return "Matches";
    case "outlier":
      return "Outlier";
    case "warning":
      return "Review";
    case "blank":
      return "Blank";
    case "not-applicable":
      return "N/A";
  }
}

function ConsistencyCell({
  page,
  kind,
}: {
  page: PageConsistencyPage;
  kind:
    | "sizeState"
    | "orientationState"
    | "contentState"
    | "searchabilityState"
    | "rotationState"
    | "blankState";
}) {
  const state = page[kind];

  return (
    <span
      className={`consistency-cell consistency-cell--${state}`}
      title={`Page ${page.pageNumber}: ${stateLabel(state)}`}
      aria-label={`Page ${page.pageNumber}: ${stateLabel(state)}`}
    >
      {page.pageNumber}
    </span>
  );
}

function ConsistencyRow({
  label,
  pages,
  kind,
}: {
  label: string;
  pages: PageConsistencyPage[];
  kind:
    | "sizeState"
    | "orientationState"
    | "contentState"
    | "searchabilityState"
    | "rotationState"
    | "blankState";
}) {
  return (
    <div className="quality-map-row">
      <span className="quality-map-label">{label}</span>
      <div className="quality-map-cells">
        {pages.map((page) => (
          <ConsistencyCell key={page.pageNumber} page={page} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export function PageConsistencyMap() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PdfAnalysisResult | null>(null);
  const [progress, setProgress] = useState<PdfAnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const report = useMemo(
    () => (analysis ? buildPageConsistencyReport(analysis) : null),
    [analysis],
  );

  async function inspectFile(selected: File | undefined) {
    if (!selected) return;

    const looksLikePdf =
      selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) {
      setError("Please choose a PDF file.");
      return;
    }

    if (selected.size === 0) {
      setError("This PDF appears to be empty.");
      return;
    }

    if (selected.size > TOOL_MAX_FILE_SIZE_BYTES) {
      setError(
        "For browser safety, the free page-consistency tool currently accepts PDFs up to 50 MB. This is a local-processing safety limit, not a paid limit.",
      );
      return;
    }

    const runId = runRef.current + 1;
    runRef.current = runId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFile(selected);
    setAnalysis(null);
    setError(null);
    setProgress(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzePdfFile(selected, {
        signal: controller.signal,
        onProgress: (nextProgress) => {
          if (runRef.current === runId) setProgress(nextProgress);
        },
      });

      if (runRef.current !== runId) return;
      setAnalysis(result);
    } catch (failure) {
      if (runRef.current !== runId) return;

      if (
        failure instanceof PdfAnalysisError &&
        failure.code === "analysis-cancelled"
      ) {
        return;
      }

      setError(
        failure instanceof PdfAnalysisError
          ? failure.message
          : "PDFBright could not map this PDF safely. Please try another file.",
      );
      setAnalysis(null);
    } finally {
      if (runRef.current === runId) {
        setIsAnalyzing(false);
        abortRef.current = null;
      }
    }
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    void inspectFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void inspectFile(event.dataTransfer.files?.[0]);
  }

  function reset() {
    abortRef.current?.abort();
    runRef.current += 1;
    setFile(null);
    setAnalysis(null);
    setProgress(null);
    setIsAnalyzing(false);
    setError(null);
  }

  const reviewPages = report?.pages.filter((page) => page.issues.length > 0) ?? [];

  return (
    <div className="consistency-shell">
      <section className="consistency-upload" aria-labelledby="consistency-upload-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Map the document pattern</p>
            <h2 id="consistency-upload-heading">Find the pages that don&apos;t match the rest</h2>
          </div>
          {file ? (
            <button className="tool-text-button" type="button" onClick={reset}>
              Check another
            </button>
          ) : (
            <span className="local-pill">Runs locally</span>
          )}
        </div>

        {!file || (!analysis && !isAnalyzing) ? (
          <div
            className={`readiness-dropzone${isDragging ? " readiness-dropzone--dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
          >
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="application/pdf,.pdf"
              aria-label="Choose a PDF for page consistency mapping"
              onChange={onInputChange}
            />
            <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
            <h3>Drop a PDF to compare every page</h3>
            <p>
              PDFBright maps page size, orientation, content pattern, searchability,
              rotation, and blankness so structural outliers stand out immediately.
            </p>
            <button
              className="button button--primary"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Choose PDF
            </button>
            <small>Free · no signup · up to 50 MB for browser safety</small>
          </div>
        ) : null}

        {isAnalyzing ? (
          <div className="readiness-progress" role="status" aria-live="polite">
            <div className="readiness-spinner" aria-hidden="true" />
            <div>
              <strong>{describeProgress(progress)}</strong>
              <p>{file ? `${file.name} · ${formatFileSize(file.size)}` : null}</p>
            </div>
            <button
              className="tool-text-button"
              type="button"
              onClick={() => abortRef.current?.abort()}
            >
              Cancel
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="readiness-error" role="alert">
            <strong>We couldn&apos;t complete the consistency map.</strong>
            <p>{error}</p>
            <button
              className="tool-text-button"
              type="button"
              onClick={() => inputRef.current?.click()}
            >
              Choose another PDF
            </button>
          </div>
        ) : null}
      </section>

      {report && analysis && file ? (
        <>
          <section className="consistency-report" aria-labelledby="consistency-report-heading">
            <div className={`consistency-verdict consistency-verdict--${report.status}`}>
              <div>
                <p className="tool-kicker">2 · Consistency result</p>
                <h2 id="consistency-report-heading">{report.headline}</h2>
                <p>{report.summary}</p>
              </div>
              <div className="consistency-pattern">
                <span><strong>{report.dominantSizeLabel}</strong> dominant size</span>
                <span><strong>{report.dominantOrientation}</strong> orientation</span>
                <span><strong>{report.dominantContentLabel}</strong> content</span>
              </div>
            </div>

            <div className="quality-map-card">
              <div className="quality-map-heading">
                <div>
                  <p className="tool-kicker">Page-by-page matrix</p>
                  <h3>Where each page breaks the dominant pattern</h3>
                </div>
                <div className="quality-map-legend" aria-label="Consistency map legend">
                  <span><i className="quality-dot consistency-dot--match" /> Matches</span>
                  <span><i className="quality-dot consistency-dot--outlier" /> Outlier</span>
                  <span><i className="quality-dot consistency-dot--warning" /> Review</span>
                  <span><i className="quality-dot consistency-dot--blank" /> Blank</span>
                </div>
              </div>

              <div
                className="quality-map-scroll"
                role="region"
                aria-label="Page consistency matrix"
                tabIndex={0}
              >
                <ConsistencyRow label="Page size" pages={report.pages} kind="sizeState" />
                <ConsistencyRow label="Orientation" pages={report.pages} kind="orientationState" />
                <ConsistencyRow label="Content" pages={report.pages} kind="contentState" />
                <ConsistencyRow label="Searchable" pages={report.pages} kind="searchabilityState" />
                <ConsistencyRow label="Rotation" pages={report.pages} kind="rotationState" />
                <ConsistencyRow label="Blankness" pages={report.pages} kind="blankState" />
              </div>
            </div>

            <div className="consistency-size-groups">
              <div className="send-findings-heading">
                <div>
                  <p className="tool-kicker">Detected page sizes</p>
                  <h3>{report.sizeGroups.length} size group{report.sizeGroups.length === 1 ? "" : "s"}</h3>
                </div>
              </div>
              <div className="consistency-size-grid">
                {report.sizeGroups.map((group) => (
                  <article
                    className={`consistency-size-card${group.dominant ? " consistency-size-card--dominant" : ""}`}
                    key={group.signature}
                  >
                    <span>{group.dominant ? "Dominant" : "Outlier group"}</span>
                    <strong>{group.label}</strong>
                    <p>{group.count} page{group.count === 1 ? "" : "s"} · pages {group.pageNumbers.join(", ")}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="consistency-details" aria-labelledby="consistency-details-heading">
            <div className="quality-review-heading">
              <div>
                <p className="tool-kicker">3 · Pages to review</p>
                <h2 id="consistency-details-heading">
                  {reviewPages.length === 0
                    ? "Every page matches the document pattern"
                    : `${reviewPages.length} page${reviewPages.length === 1 ? "" : "s"} stand out`}
                </h2>
              </div>
              <span className="quality-review-count">
                {reviewPages.length}/{analysis.pageCount}
              </span>
            </div>

            {reviewPages.length === 0 ? (
              <div className="quality-empty-state">
                <strong>No structural outliers detected.</strong>
                <p>
                  PDFBright found one consistent pattern for page size, orientation,
                  content type, text layer, rotation, and blankness.
                </p>
              </div>
            ) : (
              <div className="consistency-review-grid">
                {reviewPages.map((page) => (
                  <article className="consistency-review-card" key={page.pageNumber}>
                    <div className="consistency-review-top">
                      <div>
                        <span>Page {page.pageNumber}</span>
                        <strong>{page.sizeLabel} · {page.orientation}</strong>
                      </div>
                      <em>{page.contentLabel}</em>
                    </div>
                    <ul>
                      {page.issues.map((issue) => (
                        <li key={issue}>{issue}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}

            <div className="readiness-next-step quality-next-step">
              <div>
                <p className="tool-kicker">Want a cleaner final document?</p>
                <h3>Send the outliers into PDFBright&apos;s cleanup workflow.</h3>
                <p>
                  The map diagnoses the structure. PDFBright can then apply supported
                  normalization, rotation, blank-page, OCR, and page-quality fixes.
                </p>
              </div>
              <div className="readiness-actions">
                <Link className="button button--primary" href="/#upload">
                  Fix this PDF
                </Link>
                <button className="button button--secondary" type="button" onClick={reset}>
                  Check another
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
