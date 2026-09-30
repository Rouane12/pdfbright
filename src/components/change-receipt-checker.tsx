"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { analyzePdfFile } from "@/lib/pdf-analysis/analyze-pdf";
import {
  PdfAnalysisError,
  type PdfAnalysisProgress,
  type PdfAnalysisResult,
} from "@/lib/pdf-analysis/types";
import {
  buildChangeReceipt,
  readChangeReceiptMetadata,
  type ChangeReceiptMetadata,
} from "@/lib/tools/change-receipt";

const TOOL_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

interface SelectedAnalysis {
  file: File;
  analysis: PdfAnalysisResult;
  metadata: ChangeReceiptMetadata;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(
  label: "original" | "modified",
  progress: PdfAnalysisProgress | null,
) {
  const prefix = label === "original" ? "Original" : "Modified";
  if (!progress) return `${prefix}: preparing checks…`;

  switch (progress.phase) {
    case "loading":
      return `${prefix}: opening the PDF locally…`;
    case "parsing":
      return `${prefix}: reading document structure…`;
    case "analyzing-pages":
      return progress.pageNumber && progress.pageCount
        ? `${prefix}: checking page ${progress.pageNumber} of ${progress.pageCount}…`
        : `${prefix}: checking pages…`;
    case "finalizing":
      return `${prefix}: finalizing structural snapshot…`;
  }
}

function FileSlot({
  label,
  file,
  inputRef,
  ariaLabel,
  onChange,
}: {
  label: string;
  file: File | null;
  inputRef: RefObject<HTMLInputElement | null>;
  ariaLabel: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={`change-file-slot${file ? " change-file-slot--selected" : ""}`}>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        aria-label={ariaLabel}
        onChange={onChange}
      />
      <span className="change-file-slot__label">{label}</span>
      {file ? (
        <>
          <strong>{file.name}</strong>
          <p>{formatFileSize(file.size)}</p>
          <button
            className="tool-text-button"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </button>
        </>
      ) : (
        <>
          <div className="readiness-upload-icon" aria-hidden="true">PDF</div>
          <strong>Choose {label.toLowerCase()} PDF</strong>
          <p>The file stays in your browser.</p>
          <button
            className="button button--secondary"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            Choose PDF
          </button>
        </>
      )}
    </div>
  );
}

export function ChangeReceiptChecker() {
  const originalInputRef = useRef<HTMLInputElement>(null);
  const modifiedInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runRef = useRef(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [modifiedFile, setModifiedFile] = useState<File | null>(null);
  const [originalResult, setOriginalResult] = useState<SelectedAnalysis | null>(null);
  const [modifiedResult, setModifiedResult] = useState<SelectedAnalysis | null>(null);
  const [progress, setProgress] = useState("Choose both PDFs to compare them.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const receipt = useMemo(
    () =>
      originalResult && modifiedResult
        ? buildChangeReceipt(
            {
              analysis: originalResult.analysis,
              metadata: originalResult.metadata,
            },
            {
              analysis: modifiedResult.analysis,
              metadata: modifiedResult.metadata,
            },
          )
        : null,
    [originalResult, modifiedResult],
  );

  function validateFile(file: File) {
    const looksLikePdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!looksLikePdf) return "Please choose PDF files.";
    if (file.size === 0) return "One of the selected PDFs appears to be empty.";
    if (file.size > TOOL_MAX_FILE_SIZE_BYTES) {
      return "For browser safety, each PDF must be 50 MB or smaller. This is a local-processing safety limit, not a paid limit.";
    }
    return null;
  }

  async function runComparison(original: File, modified: File) {
    const validationError = validateFile(original) ?? validateFile(modified);
    if (validationError) {
      setError(validationError);
      return;
    }

    const runId = runRef.current + 1;
    runRef.current = runId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setOriginalResult(null);
    setModifiedResult(null);
    setIsAnalyzing(true);

    try {
      setProgress("Original: preparing checks…");
      const [originalAnalysis, originalMetadata] = await Promise.all([
        analyzePdfFile(original, {
          signal: controller.signal,
          onProgress: (nextProgress) => {
            if (runRef.current === runId) {
              setProgress(describeProgress("original", nextProgress));
            }
          },
        }),
        readChangeReceiptMetadata(original),
      ]);

      if (runRef.current !== runId) return;

      setProgress("Modified: preparing checks…");
      const [modifiedAnalysis, modifiedMetadata] = await Promise.all([
        analyzePdfFile(modified, {
          signal: controller.signal,
          onProgress: (nextProgress) => {
            if (runRef.current === runId) {
              setProgress(describeProgress("modified", nextProgress));
            }
          },
        }),
        readChangeReceiptMetadata(modified),
      ]);

      if (runRef.current !== runId) return;

      setOriginalResult({
        file: original,
        analysis: originalAnalysis,
        metadata: originalMetadata,
      });
      setModifiedResult({
        file: modified,
        analysis: modifiedAnalysis,
        metadata: modifiedMetadata,
      });
      setProgress("Comparison complete.");
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
          : "PDFBright could not compare these PDFs safely. Please try another pair.",
      );
    } finally {
      if (runRef.current === runId) {
        setIsAnalyzing(false);
        abortRef.current = null;
      }
    }
  }

  function updateFile(kind: "original" | "modified", file: File | undefined) {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const nextOriginal = kind === "original" ? file : originalFile;
    const nextModified = kind === "modified" ? file : modifiedFile;

    if (kind === "original") setOriginalFile(file);
    else setModifiedFile(file);

    setOriginalResult(null);
    setModifiedResult(null);
    setError(null);

    if (nextOriginal && nextModified) {
      void runComparison(nextOriginal, nextModified);
    } else {
      setProgress("Choose both PDFs to compare them.");
    }
  }

  function reset() {
    abortRef.current?.abort();
    runRef.current += 1;
    setOriginalFile(null);
    setModifiedFile(null);
    setOriginalResult(null);
    setModifiedResult(null);
    setProgress("Choose both PDFs to compare them.");
    setIsAnalyzing(false);
    setError(null);
  }

  const changedPages = receipt?.pageComparisons.filter(
    (page) => page.changes.length > 0,
  ) ?? [];

  return (
    <div className="change-receipt-shell">
      <section className="change-receipt-upload" aria-labelledby="change-receipt-upload-heading">
        <div className="readiness-section-heading">
          <div>
            <p className="tool-kicker">1 · Choose the two versions</p>
            <h2 id="change-receipt-upload-heading">Compare the original against the modified PDF</h2>
          </div>
          {originalFile || modifiedFile ? (
            <button className="tool-text-button" type="button" onClick={reset}>
              Start over
            </button>
          ) : (
            <span className="local-pill">Runs locally</span>
          )}
        </div>

        <div className="change-file-grid">
          <FileSlot
            label="Original"
            file={originalFile}
            inputRef={originalInputRef}
            ariaLabel="Choose original PDF for change receipt"
            onChange={(event) => {
              updateFile("original", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <div className="change-file-arrow" aria-hidden="true">→</div>
          <FileSlot
            label="Modified"
            file={modifiedFile}
            inputRef={modifiedInputRef}
            ariaLabel="Choose modified PDF for change receipt"
            onChange={(event) => {
              updateFile("modified", event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>

        {isAnalyzing ? (
          <div className="readiness-progress" role="status" aria-live="polite">
            <div className="readiness-spinner" aria-hidden="true" />
            <div>
              <strong>{progress}</strong>
              <p>Both PDFs remain in this browser session.</p>
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
            <strong>We couldn&apos;t complete the change receipt.</strong>
            <p>{error}</p>
          </div>
        ) : null}
      </section>

      {receipt && originalResult && modifiedResult ? (
        <>
          <section className="change-receipt-report" aria-labelledby="change-receipt-report-heading">
            <div className={`change-verdict${receipt.changed ? " change-verdict--changed" : " change-verdict--same"}`}>
              <div>
                <p className="tool-kicker">2 · Change receipt</p>
                <h2 id="change-receipt-report-heading">{receipt.headline}</h2>
                <p>{receipt.summary}</p>
              </div>
              <span className="send-status-pill">
                {receipt.changed ? `${receipt.changes.length} categories` : "No changes"}
              </span>
            </div>

            <div className="change-snapshot-grid">
              <article>
                <span>Original</span>
                <strong>{receipt.original.pageCount} pages</strong>
                <p>{formatFileSize(receipt.original.fileSizeBytes)} · {receipt.original.searchablePages} searchable</p>
              </article>
              <article>
                <span>Modified</span>
                <strong>{receipt.modified.pageCount} pages</strong>
                <p>{formatFileSize(receipt.modified.fileSizeBytes)} · {receipt.modified.searchablePages} searchable</p>
              </article>
              <article>
                <span>Size delta</span>
                <strong>
                  {receipt.sizeDeltaBytes === 0
                    ? "No change"
                    : `${receipt.sizeDeltaBytes > 0 ? "+" : "−"}${formatFileSize(Math.abs(receipt.sizeDeltaBytes))}`}
                </strong>
                <p>
                  {receipt.sizeDeltaPercent === null
                    ? "Percentage unavailable"
                    : `${Math.abs(receipt.sizeDeltaPercent).toFixed(1)}% ${receipt.sizeDeltaBytes >= 0 ? "larger" : "smaller"}`}
                </p>
              </article>
            </div>

            <div className="send-findings-heading">
              <div>
                <p className="tool-kicker">What changed</p>
                <h3>{receipt.changed ? "Structural receipt" : "No detected structural differences"}</h3>
              </div>
            </div>

            {receipt.changes.length > 0 ? (
              <div className="change-list">
                {receipt.changes.map((change) => (
                  <article className="change-item" key={change.id}>
                    <div className="change-item-icon" aria-hidden="true">Δ</div>
                    <div>
                      <h4>{change.label}</h4>
                      <p>{change.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="quality-empty-state">
                <strong>No structural changes were detected by the checks in this receipt.</strong>
                <p>
                  This does not prove the visible wording, graphics, or semantic content are identical.
                </p>
              </div>
            )}

            <p className="change-scope-note">
              Pages are compared by position. This receipt does not infer semantic equivalence,
              detect textual wording edits, or prove that page content is visually identical.
            </p>
          </section>

          <section className="change-receipt-details" aria-labelledby="change-pages-heading">
            <div className="quality-review-heading">
              <div>
                <p className="tool-kicker">3 · Page-level changes</p>
                <h2 id="change-pages-heading">
                  {changedPages.length === 0
                    ? "Aligned page structure matches"
                    : `${changedPages.length} page position${changedPages.length === 1 ? "" : "s"} changed`}
                </h2>
              </div>
              <span className="quality-review-count">{changedPages.length}</span>
            </div>

            {changedPages.length > 0 ? (
              <div className="change-page-grid">
                {changedPages.map((page) => (
                  <article className="change-page-card" key={page.pageNumber}>
                    <div className="change-page-top">
                      <strong>Page {page.pageNumber}</strong>
                      <span>
                        {!page.existsBefore
                          ? "Added"
                          : !page.existsAfter
                            ? "Removed"
                            : `${page.changes.length} change${page.changes.length === 1 ? "" : "s"}`}
                      </span>
                    </div>
                    <ul>
                      {page.changes.map((change) => (
                        <li key={change}>{change}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            ) : (
              <div className="quality-empty-state">
                <strong>No aligned page-structure changes detected.</strong>
              </div>
            )}

            <div className="send-findings-heading change-metadata-heading">
              <div>
                <p className="tool-kicker">Common metadata</p>
                <h3>
                  {receipt.metadataChanges.length === 0
                    ? "Metadata matches"
                    : `${receipt.metadataChanges.length} metadata field${receipt.metadataChanges.length === 1 ? "" : "s"} changed`}
                </h3>
              </div>
            </div>

            {receipt.metadataChanges.length > 0 ? (
              <div className="change-metadata-grid">
                {receipt.metadataChanges.map((change) => (
                  <article className="change-metadata-card" key={change.field}>
                    <strong>{change.field}</strong>
                    <div>
                      <span>Before</span>
                      <p>{change.before ?? "Not set"}</p>
                    </div>
                    <div>
                      <span>After</span>
                      <p>{change.after ?? "Not set"}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="readiness-next-step quality-next-step">
              <div>
                <p className="tool-kicker">Need to inspect or clean the modified PDF?</p>
                <h3>Continue with PDFBright&apos;s main cleanup workflow.</h3>
                <p>
                  The receipt verifies structural changes. The main workflow can diagnose and fix
                  supported quality, rotation, OCR, blank-page, and normalization issues.
                </p>
              </div>
              <div className="readiness-actions">
                <Link className="button button--primary" href="/#upload">
                  Inspect modified PDF
                </Link>
                <button className="button button--secondary" type="button" onClick={reset}>
                  Compare another pair
                </button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
