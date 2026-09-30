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
  buildScanQualityReport,
  type ScanQualityGrade,
  type ScanQualityPageAssessment,
  type ScanQualitySignal,
} from "@/lib/tools/scan-quality";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(progress: PdfAnalysisProgress | null) {
  if (!progress) return "Preparing visual checks…";

  switch (progress.phase) {
    case "loading":
      return "Opening the PDF locally…";
    case "parsing":
      return "Reading document structure…";
    case "analyzing-pages":
      return progress.pageNumber && progress.pageCount
        ? `Inspecting page ${progress.pageNumber} of ${progress.pageCount}…`
        : "Inspecting pages…";
    case "finalizing":
      return "Building the quality map…";
  }
}

function gradeDescription(grade: ScanQualityGrade) {
  switch (grade) {
    case "excellent":
      return "No obvious quality problems detected";
    case "good":
      return "Mostly clean, with minor signals to review";
    case "review":
      return "Several pages may benefit from cleanup";
    case "poor":
      return "Multiple issues are likely affecting usability";
  }
}

function signalLabel(signal: ScanQualitySignal) {
  if (signal === "good") return "Clear";
  if (signal === "review") return "Review";
  if (signal === "poor") return "Poor";
  return "N/A";
}

function MapCell({
  page,
  kind,
}: {
  page: ScanQualityPageAssessment;
  kind: "overall" | "searchability" | "alignment" | "contrast" | "sharpness";
}) {
  let className = "";
  let label = "";

  if (kind === "overall") {
    className = `quality-cell--${page.grade}`;
    label = `${page.label}, score ${page.score} out of 100`;
  } else if (kind === "searchability") {
    className = page.searchable ? "quality-cell--good" : "quality-cell--poor";
    label = page.searchable ? "Searchable" : "Not searchable";
  } else {
    const signal = page[kind];
    className =
      signal === "not-applicable"
        ? "quality-cell--na"
        : signal === "good"
          ? "quality-cell--good"
          : signal === "poor"
            ? "quality-cell--poor"
            : "quality-cell--review";
    label = signalLabel(signal);
  }

  return (
    <span
      className={`quality-cell ${className}`}
      title={`Page ${page.pageNumber}: ${label}`}
      aria-label={`Page ${page.pageNumber}: ${label}`}
    >
      {page.pageNumber}
    </span>
  );
}

function QualityMapRow({
  label,
  pages,
  kind,
}: {
  label: string;
  pages: ScanQualityPageAssessment[];
  kind: "overall" | "searchability" | "alignment" | "contrast" | "sharpness";
}) {
  return (
    <div className="quality-map-row">
      <span className="quality-map-label">{label}</span>
      <div className="quality-map-cells">
        {pages.map((page) => (
          <MapCell key={page.pageNumber} page={page} kind={kind} />
        ))}
      </div>
    </div>
  );
}

export function ScanQualityMap() {
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
    () => (analysis ? buildScanQualityReport(analysis) : null),
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
        "For browser safety, the free scan-quality tool currently accepts PDFs up to 50 MB. This is a local-processing safety limit, not a paid limit.",
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
          : "PDFBright could not inspect this PDF safely. Please try another file.",
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
    <div className="scan-quality-shell">
      <section className="scan-quality-upload" aria-labelledby="scan-quality-upload-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Analyze the scan</p>
            <h2 id="scan-quality-upload-heading">Drop in a PDF to map its weak pages</h2>
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
              aria-label="Choose a PDF for scan quality analysis"
              onChange={onInputChange}
            />
            <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
            <h3>Drop your scanned PDF here</h3>
            <p>
              PDFBright inspects low-resolution page renders for alignment, blankness,
              searchability, contrast, sharpness, and other scan-quality signals.
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
            <strong>We couldn&apos;t complete the scan-quality check.</strong>
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
          <section className="scan-quality-report" aria-labelledby="scan-quality-report-heading">
            <div className={`quality-score-card quality-score-card--${report.grade}`}>
              <div className="quality-score-ring" aria-label={`Quality score ${report.score} out of 100`}>
                <strong>{report.score}</strong>
                <span>/100</span>
              </div>
              <div className="quality-score-copy">
                <p className="tool-kicker">2 · Document quality</p>
                <h2 id="scan-quality-report-heading">{report.label}</h2>
                <p>{gradeDescription(report.grade)}. {report.summary}</p>
              </div>
              <div className="quality-score-meta">
                <span><strong>{analysis.pageCount}</strong> pages</span>
                <span><strong>{report.searchablePages}</strong> searchable</span>
                <span><strong>{report.excellentPages}</strong> excellent</span>
              </div>
            </div>

            <div className="quality-map-card">
              <div className="quality-map-heading">
                <div>
                  <p className="tool-kicker">Page-by-page map</p>
                  <h3>Where the document gets weaker</h3>
                </div>
                <div className="quality-map-legend" aria-label="Quality map legend">
                  <span><i className="quality-dot quality-dot--good" /> Clear</span>
                  <span><i className="quality-dot quality-dot--review" /> Review</span>
                  <span><i className="quality-dot quality-dot--poor" /> Problem</span>
                  <span><i className="quality-dot quality-dot--na" /> Not applicable</span>
                </div>
              </div>

              <div className="quality-map-scroll" role="region" aria-label="Page quality heatmap" tabIndex={0}>
                <QualityMapRow label="Overall" pages={report.pages} kind="overall" />
                <QualityMapRow label="Searchable" pages={report.pages} kind="searchability" />
                <QualityMapRow label="Alignment" pages={report.pages} kind="alignment" />
                <QualityMapRow label="Contrast" pages={report.pages} kind="contrast" />
                <QualityMapRow label="Sharpness" pages={report.pages} kind="sharpness" />
              </div>

              <p className="quality-map-note">
                Contrast and sharpness are conservative visual heuristics from a low-resolution
                analysis render. They are useful warning signals, not a print-quality certification.
              </p>
            </div>
          </section>

          <section className="quality-review-section" aria-labelledby="quality-review-heading">
            <div className="quality-review-heading">
              <div>
                <p className="tool-kicker">3 · Pages to review</p>
                <h2 id="quality-review-heading">
                  {reviewPages.length === 0
                    ? "Nothing obvious needs attention"
                    : `${reviewPages.length} page${reviewPages.length === 1 ? "" : "s"} deserve a closer look`}
                </h2>
              </div>
              <span className="quality-review-count">
                {reviewPages.length}/{analysis.pageCount}
              </span>
            </div>

            {reviewPages.length === 0 ? (
              <div className="quality-empty-state">
                <strong>Clean signal across the document.</strong>
                <p>
                  PDFBright did not detect obvious scan-quality issues in the current analysis.
                </p>
              </div>
            ) : (
              <div className="quality-page-grid">
                {reviewPages.map((page) => (
                  <article className={`quality-page-card quality-page-card--${page.grade}`} key={page.pageNumber}>
                    <div className="quality-page-card__top">
                      <div>
                        <span>Page {page.pageNumber}</span>
                        <strong>{page.contentLabel}</strong>
                      </div>
                      <div className="quality-page-score">
                        <strong>{page.score}</strong>
                        <small>{page.label}</small>
                      </div>
                    </div>

                    <div className="quality-issue-list">
                      {page.issues.map((issue) => (
                        <div className={`quality-issue quality-issue--${issue.severity}`} key={issue.id}>
                          <span aria-hidden="true">{issue.severity === "problem" ? "×" : "!"}</span>
                          <div>
                            <strong>{issue.label}</strong>
                            <p>{issue.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="readiness-next-step quality-next-step">
              <div>
                <p className="tool-kicker">Want the weak pages fixed?</p>
                <h3>Send the PDF into PDFBright&apos;s cleanup workflow.</h3>
                <p>
                  The quality map only diagnoses the file. The cleanup flow can address rotation,
                  skew, searchability, blank pages, normalization, and readability issues where supported.
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
