"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BeforeSendInspectionError,
  inspectPdfBeforeSend,
  type BeforeSendReport,
} from "@/lib/tools/before-send";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(status: BeforeSendReport["status"]) {
  if (status === "clear") return "Looks clear";
  if (status === "review") return "Review";
  return "Attention";
}

export function BeforeSendChecker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<BeforeSendReport | null>(null);
  const [progress, setProgress] = useState("Preparing the inspection…");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

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
        "For browser safety, the free send checker currently accepts PDFs up to 50 MB. This is a local-processing safety limit, not a paid limit.",
      );
      return;
    }

    const runId = runRef.current + 1;
    runRef.current = runId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setFile(selected);
    setReport(null);
    setError(null);
    setProgress("Preparing the inspection…");
    setIsInspecting(true);

    try {
      const result = await inspectPdfBeforeSend(selected, {
        signal: controller.signal,
        onProgress: (message) => {
          if (runRef.current === runId) setProgress(message);
        },
      });

      if (runRef.current !== runId) return;
      setReport(result);
    } catch (failure) {
      if (runRef.current !== runId) return;
      if (failure instanceof DOMException && failure.name === "AbortError") return;

      setError(
        failure instanceof BeforeSendInspectionError
          ? failure.message
          : "PDFBright could not inspect this PDF safely. Please try another file.",
      );
    } finally {
      if (runRef.current === runId) {
        setIsInspecting(false);
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
    setReport(null);
    setError(null);
    setIsInspecting(false);
    setProgress("Preparing the inspection…");
  }

  return (
    <div className="before-send-shell">
      <section className="before-send-upload" aria-labelledby="before-send-upload-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Inspect the document</p>
            <h2 id="before-send-upload-heading">Check what travels with your PDF</h2>
          </div>
          {file ? (
            <button className="tool-text-button" type="button" onClick={reset}>
              Check another
            </button>
          ) : (
            <span className="local-pill">Runs locally</span>
          )}
        </div>

        {!file || (!report && !isInspecting) ? (
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
              aria-label="Choose a PDF for before-send inspection"
              onChange={onInputChange}
            />
            <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
            <h3>Drop the PDF you&apos;re about to share</h3>
            <p>
              We&apos;ll check for metadata, comments, forms, links, attachments,
              scripts/actions, signatures, and security signals without uploading the file.
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

        {isInspecting ? (
          <div className="readiness-progress" role="status" aria-live="polite">
            <div className="readiness-spinner" aria-hidden="true" />
            <div>
              <strong>{progress}</strong>
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
            <strong>We couldn&apos;t complete the send check.</strong>
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
          <section className="before-send-report" aria-labelledby="before-send-report-heading">
            <div className={`send-verdict send-verdict--${report.status}`}>
              <div className="send-verdict-icon" aria-hidden="true">
                {report.status === "clear" ? "✓" : report.status === "review" ? "!" : "×"}
              </div>
              <div>
                <p className="tool-kicker">2 · Before-you-send result</p>
                <h2 id="before-send-report-heading">{report.headline}</h2>
                <p>{report.summary}</p>
              </div>
              <span className="send-status-pill">{statusLabel(report.status)}</span>
            </div>

            <div className="send-summary-grid">
              <article>
                <strong>{report.counts.comments}</strong>
                <span>comments / markups</span>
              </article>
              <article>
                <strong>{report.counts.forms}</strong>
                <span>form fields</span>
              </article>
              <article>
                <strong>{report.counts.externalLinks}</strong>
                <span>external links</span>
              </article>
              <article>
                <strong>{report.counts.attachments}</strong>
                <span>attachments</span>
              </article>
              <article>
                <strong>{report.counts.scriptsAndActions}</strong>
                <span>scripts / actions</span>
              </article>
              <article>
                <strong>{report.counts.signatures}</strong>
                <span>signatures</span>
              </article>
            </div>

            <div className="send-findings-heading">
              <div>
                <p className="tool-kicker">What to review</p>
                <h3>
                  {report.findings.length === 0
                    ? "No obvious hidden baggage"
                    : `${report.findings.length} categor${report.findings.length === 1 ? "y" : "ies"} found`}
                </h3>
              </div>
            </div>

            {report.findings.length === 0 ? (
              <div className="quality-empty-state">
                <strong>No obvious send-risk signals detected.</strong>
                <p>
                  This is a structural/privacy check, not a guarantee that the visible page content
                  itself is appropriate to share.
                </p>
              </div>
            ) : (
              <div className="send-findings-list">
                {report.findings.map((finding) => (
                  <article
                    className={`send-finding send-finding--${finding.status}`}
                    key={finding.id}
                  >
                    <div className="send-finding-icon" aria-hidden="true">
                      {finding.status === "attention" ? "×" : "!"}
                    </div>
                    <div>
                      <div className="send-finding-title">
                        <h4>{finding.label}</h4>
                        {typeof finding.count === "number" ? <span>{finding.count}</span> : null}
                      </div>
                      <p>{finding.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="before-send-details" aria-labelledby="before-send-details-heading">
            <div className="send-findings-heading">
              <div>
                <p className="tool-kicker">3 · Document details</p>
                <h2 id="before-send-details-heading">Metadata that will travel with the file</h2>
              </div>
              <span className="quality-review-count">{report.metadata.length}</span>
            </div>

            {report.metadata.length > 0 ? (
              <div className="send-metadata-grid">
                {report.metadata.map((field) => (
                  <div
                    className={`send-metadata-field${field.privacyRelevant ? " send-metadata-field--review" : ""}`}
                    key={field.label}
                  >
                    <span>{field.label}</span>
                    <strong>{field.value}</strong>
                    {field.privacyRelevant ? <small>Review before sharing</small> : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="quality-empty-state">
                <strong>No common document metadata fields were populated.</strong>
              </div>
            )}

            <div className="send-document-facts">
              <span>{report.pageCount} pages</span>
              <span>{formatFileSize(report.fileSizeBytes)}</span>
              {report.documentInfo.pdfVersion ? <span>PDF {report.documentInfo.pdfVersion}</span> : null}
              <span>
                {report.documentInfo.encryptedOrRestricted
                  ? "Restrictions detected"
                  : "No permission restrictions reported"}
              </span>
            </div>

            <div className="readiness-next-step quality-next-step">
              <div>
                <p className="tool-kicker">Need to clean something up?</p>
                <h3>Use PDFBright before you send the final file.</h3>
                <p>
                  This checker only reports what it can detect. The main cleanup workflow can handle
                  supported page-quality and document-cleanup problems without changing the tool&apos;s diagnosis-first approach.
                </p>
              </div>
              <div className="readiness-actions">
                <Link className="button button--primary" href="/#upload">
                  Clean this PDF
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
