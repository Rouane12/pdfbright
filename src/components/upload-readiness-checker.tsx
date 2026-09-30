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
  evaluateUploadReadiness,
  type UploadReadinessPageFormat,
  type UploadReadinessRequirements,
  type UploadReadinessStatus,
} from "@/lib/tools/upload-readiness";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(progress: PdfAnalysisProgress | null) {
  if (!progress) return "Preparing local checks…";

  switch (progress.phase) {
    case "loading":
      return "Opening the PDF locally…";
    case "parsing":
      return "Reading document structure…";
    case "analyzing-pages":
      return progress.pageNumber && progress.pageCount
        ? `Checking page ${progress.pageNumber} of ${progress.pageCount}…`
        : "Checking pages…";
    case "finalizing":
      return "Building your readiness report…";
  }
}

function StatusIcon({ status }: { status: UploadReadinessStatus }) {
  if (status === "pass") return <span aria-hidden="true">✓</span>;
  if (status === "warning") return <span aria-hidden="true">!</span>;
  return <span aria-hidden="true">×</span>;
}

export function UploadReadinessChecker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<PdfAnalysisResult | null>(null);
  const [progress, setProgress] = useState<PdfAnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<UploadReadinessRequirements>({
    maxFileSizeMb: 5,
    maxPages: 25,
    pageFormat: "any",
    requireSearchableText: true,
    requireConsistentPageSize: false,
  });

  useEffect(() => () => abortRef.current?.abort(), []);

  const report = useMemo(
    () => (analysis ? evaluateUploadReadiness(analysis, requirements) : null),
    [analysis, requirements],
  );

  function updateRequirement<K extends keyof UploadReadinessRequirements>(
    key: K,
    value: UploadReadinessRequirements[K],
  ) {
    setRequirements((current) => ({ ...current, [key]: value }));
  }

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
        "For browser safety, the free readiness checker currently accepts PDFs up to 50 MB. This is a local-processing safety limit, not a paid limit.",
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

  return (
    <div className="readiness-shell">
      <section className="readiness-settings" aria-labelledby="requirements-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Set the rules</p>
            <h2 id="requirements-heading">What does the destination require?</h2>
          </div>
          <span className="local-pill">Runs locally</span>
        </div>

        <div className="requirement-grid">
          <label className="requirement-field">
            <span>Maximum file size</span>
            <span className="requirement-input-row">
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={requirements.maxFileSizeMb}
                onChange={(event) =>
                  updateRequirement("maxFileSizeMb", Math.max(0.1, Number(event.target.value) || 0.1))
                }
              />
              <span>MB</span>
            </span>
          </label>

          <label className="requirement-field">
            <span>Maximum pages</span>
            <span className="requirement-input-row">
              <input
                type="number"
                min="1"
                max="500"
                step="1"
                value={requirements.maxPages}
                onChange={(event) =>
                  updateRequirement("maxPages", Math.max(1, Number(event.target.value) || 1))
                }
              />
              <span>pages</span>
            </span>
          </label>

          <label className="requirement-field">
            <span>Required page format</span>
            <select
              value={requirements.pageFormat}
              onChange={(event) =>
                updateRequirement("pageFormat", event.target.value as UploadReadinessPageFormat)
              }
            >
              <option value="any">Any format</option>
              <option value="a4">A4</option>
              <option value="letter">US Letter</option>
            </select>
          </label>

          <div className="requirement-toggle-group">
            <label className="requirement-toggle">
              <input
                type="checkbox"
                checked={requirements.requireSearchableText}
                onChange={(event) =>
                  updateRequirement("requireSearchableText", event.target.checked)
                }
              />
              <span>
                <strong>Searchable text required</strong>
                <small>Flag pages where Ctrl+F is unlikely to work.</small>
              </span>
            </label>

            <label className="requirement-toggle">
              <input
                type="checkbox"
                checked={requirements.requireConsistentPageSize}
                onChange={(event) =>
                  updateRequirement("requireConsistentPageSize", event.target.checked)
                }
              />
              <span>
                <strong>Consistent page sizes required</strong>
                <small>Useful for strict portals, printing, and archival submissions.</small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="readiness-upload" aria-labelledby="upload-check-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">2 · Check the file</p>
            <h2 id="upload-check-heading">Drop in the PDF you plan to submit</h2>
          </div>
          {file ? (
            <button className="tool-text-button" type="button" onClick={reset}>
              Check another
            </button>
          ) : null}
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
              onChange={onInputChange}
            />
            <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
            <h3>Drop your PDF here</h3>
            <p>Nothing is uploaded to a PDFBright document server for this check.</p>
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
            <strong>We couldn&apos;t complete the check.</strong>
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
        <section className="readiness-report" aria-labelledby="readiness-report-heading">
          <div className={`readiness-verdict readiness-verdict--${report.overall}`}>
            <div className="readiness-verdict-icon">
              <StatusIcon status={report.overall} />
            </div>
            <div>
              <p className="tool-kicker">3 · Readiness result</p>
              <h2 id="readiness-report-heading">{report.headline}</h2>
              <p>{report.summary}</p>
            </div>
            <div className="readiness-file-meta">
              <strong>{file.name}</strong>
              <span>{formatFileSize(file.size)} · {analysis.pageCount} pages</span>
            </div>
          </div>

          <div className="readiness-check-list">
            {report.checks.map((check) => (
              <article
                className={`readiness-check readiness-check--${check.status}`}
                key={check.id}
              >
                <div className="readiness-check-icon">
                  <StatusIcon status={check.status} />
                </div>
                <div>
                  <h3>{check.label}</h3>
                  <p>{check.detail}</p>
                </div>
                <span className="readiness-check-status">
                  {check.status === "pass"
                    ? "Pass"
                    : check.status === "warning"
                      ? "Review"
                      : "Fail"}
                </span>
              </article>
            ))}
          </div>

          <div className="readiness-next-step">
            <div>
              <p className="tool-kicker">Need to fix something?</p>
              <h3>Use PDFBright&apos;s cleanup workflow on the document.</h3>
              <p>
                The checker never changes your file. The main cleanup flow can address searchability,
                rotation, page consistency, scan quality, and file-size issues.
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
      ) : null}
    </div>
  );
}
