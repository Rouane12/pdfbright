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
  buildSearchabilityReport,
  type SearchabilityPageAssessment,
} from "@/lib/tools/searchability";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(progress: PdfAnalysisProgress | null) {
  if (!progress) return "Preparing text-layer checks…";

  switch (progress.phase) {
    case "loading":
      return "Opening the PDF locally…";
    case "parsing":
      return "Reading document structure…";
    case "analyzing-pages":
      return progress.pageNumber && progress.pageCount
        ? `Checking page ${progress.pageNumber} of ${progress.pageCount}…`
        : "Checking page text layers…";
    case "finalizing":
      return "Building the searchability map…";
  }
}

function pageStatusText(page: SearchabilityPageAssessment) {
  switch (page.status) {
    case "searchable":
      return "Searchable";
    case "needs-ocr":
      return "Needs OCR";
    case "blank":
      return "Blank";
    case "review":
      return "Review";
  }
}

export function SearchabilityChecker() {
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
    () => (analysis ? buildSearchabilityReport(analysis) : null),
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
        "For browser safety, the free searchability test currently accepts PDFs up to 50 MB. This is a local-processing safety limit, not a paid limit.",
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
          : "PDFBright could not test this PDF safely. Please try another file.",
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

  return (
    <div className="searchability-shell">
      <section className="searchability-upload" aria-labelledby="searchability-upload-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Test the text layer</p>
            <h2 id="searchability-upload-heading">Find the exact pages Ctrl+F can&apos;t reliably reach</h2>
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
              aria-label="Choose a PDF for searchability testing"
              onChange={onInputChange}
            />
            <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
            <h3>Drop a PDF to test its searchable text</h3>
            <p>
              PDFBright checks every page for a reliable extractable text layer and separates
              searchable pages, likely OCR candidates, blank pages, and uncertain cases.
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
            <strong>We couldn&apos;t complete the searchability test.</strong>
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

      {report && file ? (
        <>
          <section className="searchability-report" aria-labelledby="searchability-report-heading">
            <div className={`searchability-verdict searchability-verdict--${report.status}`}>
              <div
                className="searchability-coverage"
                aria-label={`Search coverage ${report.coveragePercent} percent`}
              >
                <strong>{report.coveragePercent}%</strong>
                <span>search coverage</span>
              </div>
              <div>
                <p className="tool-kicker">2 · Searchability result</p>
                <h2 id="searchability-report-heading">{report.headline}</h2>
                <p>{report.summary}</p>
              </div>
              <div className="searchability-stats">
                <span><strong>{report.searchablePageCount}</strong> searchable</span>
                <span><strong>{report.needsOcrPages.length}</strong> need OCR</span>
                <span><strong>{report.blankPages.length}</strong> blank</span>
              </div>
            </div>

            <div className="searchability-map-card">
              <div className="quality-map-heading">
                <div>
                  <p className="tool-kicker">Page-by-page map</p>
                  <h3>Exactly where search stops working</h3>
                </div>
                <div className="quality-map-legend" aria-label="Searchability map legend">
                  <span><i className="quality-dot search-dot--searchable" /> Searchable</span>
                  <span><i className="quality-dot search-dot--ocr" /> Needs OCR</span>
                  <span><i className="quality-dot search-dot--review" /> Review</span>
                  <span><i className="quality-dot search-dot--blank" /> Blank</span>
                </div>
              </div>

              <div
                className="searchability-page-map"
                role="region"
                aria-label="Page searchability map"
                tabIndex={0}
              >
                {report.pages.map((page) => (
                  <div
                    className={`searchability-page-cell searchability-page-cell--${page.status}`}
                    key={page.pageNumber}
                    title={`Page ${page.pageNumber}: ${pageStatusText(page)}`}
                    aria-label={`Page ${page.pageNumber}: ${pageStatusText(page)}`}
                  >
                    <strong>{page.pageNumber}</strong>
                    <span>{pageStatusText(page)}</span>
                  </div>
                ))}
              </div>

              <p className="quality-map-note">
                Searchability here means PDFBright can extract a reliable text layer from the page.
                Blank pages are excluded from the coverage percentage.
              </p>
            </div>
          </section>

          <section className="searchability-details" aria-labelledby="searchability-details-heading">
            <div className="quality-review-heading">
              <div>
                <p className="tool-kicker">3 · Page details</p>
                <h2 id="searchability-details-heading">
                  {report.needsOcrPages.length > 0
                    ? `${report.needsOcrPages.length} page${report.needsOcrPages.length === 1 ? "" : "s"} likely need OCR`
                    : report.reviewPages.length > 0
                      ? "A few pages need manual review"
                      : "The text layer looks consistent"}
                </h2>
              </div>
              <span className="quality-review-count">
                {report.searchablePageCount}/{report.contentPageCount}
              </span>
            </div>

            <div className="searchability-detail-grid">
              {report.pages.map((page) => (
                <article
                  className={`searchability-detail searchability-detail--${page.status}`}
                  key={page.pageNumber}
                >
                  <div className="searchability-detail-top">
                    <div>
                      <span>Page {page.pageNumber}</span>
                      <strong>{page.label}</strong>
                    </div>
                    <em>{page.contentLabel}</em>
                  </div>
                  <p>{page.detail}</p>
                </article>
              ))}
            </div>

            <div className="readiness-next-step quality-next-step">
              <div>
                <p className="tool-kicker">Need searchable text added?</p>
                <h3>Send the PDF into PDFBright&apos;s cleanup workflow.</h3>
                <p>
                  Pages identified as likely scans can be routed toward OCR where supported,
                  while pages that already have a text layer can be left alone.
                </p>
              </div>
              <div className="readiness-actions">
                <Link className="button button--primary" href="/#upload">
                  Make it searchable
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
