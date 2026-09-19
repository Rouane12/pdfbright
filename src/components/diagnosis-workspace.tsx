"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProcessingExperience } from "@/components/processing-experience";
import { ResultExperience } from "@/components/result-experience";
import { captureClientException } from "@/lib/analytics/client";
import {
  ADVANCED_FIX_OPTIONS,
  buildDiagnosisPlan,
  type DiagnosisFixId,
  type DiagnosisRecommendation,
} from "@/lib/diagnosis/build-diagnosis";
import { cleanupPdfFile } from "@/lib/pdf-cleanup/cleanup-pdf";
import {
  PdfCleanupError,
  type PdfCleanupProgress,
  type PdfCleanupResult,
  type PdfCleanupSelection,
} from "@/lib/pdf-cleanup/types";
import { OCR_LANGUAGE_OPTIONS, type PdfOcrLanguage } from "@/lib/pdf-ocr/types";
import {
  PDF_COMPRESSION_OPTIONS,
  type PdfCompressionMode,
} from "@/lib/pdf-optimization/profiles";
import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";

interface DiagnosisWorkspaceProps {
  file: File;
  result: PdfAnalysisResult;
  onReplace: () => void;
  onRemove: () => void;
  debugCleanup?: boolean;
}

const M7_SUPPORTED_FIXES = new Set<DiagnosisFixId>([
  "straighten",
  "rotate",
  "searchable-text",
  "remove-blank-pages",
  "improve-readability",
  "normalize-pages",
  "compress",
]);

function isCleanupAvailable(id: DiagnosisFixId) {
  return M7_SUPPORTED_FIXES.has(id);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initialSelection(plan: ReturnType<typeof buildDiagnosisPlan>): PdfCleanupSelection {
  const selected: PdfCleanupSelection = {
    straighten: false,
    rotate: false,
    "searchable-text": false,
    "remove-blank-pages": false,
    "improve-readability": false,
    "normalize-pages": false,
    compress: false,
  };

  for (const recommendation of plan.recommendations) {
    if (isCleanupAvailable(recommendation.id)) {
      selected[recommendation.id] = recommendation.defaultSelected;
    }
  }

  return selected;
}

function evidenceLabel(item: DiagnosisRecommendation) {
  if (!isCleanupAvailable(item.id)) return "Coming later";
  if (item.destructive) return "Review first";
  if (item.evidence === "fact") return "Detected";
  if ((item.confidence ?? 0) >= 0.55) return "Likely";
  return "Review";
}

function pageListLabel(pageNumbers: number[]) {
  if (pageNumbers.length === 0) return "No specific pages";
  if (pageNumbers.length <= 8) return `Pages ${pageNumbers.join(", ")}`;
  return `Pages ${pageNumbers.slice(0, 8).join(", ")} + ${pageNumbers.length - 8} more`;
}

function FindingIcon({ id }: { id: DiagnosisFixId }) {
  if (id === "rotate") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.8 7.5A7 7 0 1 1 5 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4.5 5.8 7 7.6 5.2 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === "searchable-text") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5.5 4.5h9l4 4v11h-13v-15Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M14.5 4.8v4h3.8M8.5 13h7M8.5 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "remove-blank-pages") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M7 4h10v16H7V4Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9.5 12h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "normalize-pages") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="6" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 4h9v12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === "compress") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M8 4v5H3M16 20v-5h5M4 8l5-5M20 16l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 15.5c3-5 5-2 7-7s4-2 7-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function DiagnosisWorkspace({
  file,
  result,
  onReplace,
  onRemove,
  debugCleanup = false,
}: DiagnosisWorkspaceProps) {
  const plan = useMemo(() => buildDiagnosisPlan(result), [result]);
  const cleanupAbortRef = useRef<AbortController | null>(null);
  const downloadUrlRef = useRef<string | null>(null);
  const [selected, setSelected] = useState<PdfCleanupSelection>(() => initialSelection(plan));
  const [ocrLanguage, setOcrLanguage] = useState<PdfOcrLanguage>("eng");
  const [compressionMode, setCompressionMode] = useState<PdfCompressionMode>("balanced");
  const [reviewing, setReviewing] = useState<DiagnosisFixId | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState<PdfCleanupProgress | null>(null);
  const [cleanupResult, setCleanupResult] = useState<PdfCleanupResult | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const selectedCount = Object.entries(selected).filter(
    ([id, enabled]) => enabled && isCleanupAvailable(id as DiagnosisFixId),
  ).length;

  useEffect(() => {
    return () => {
      cleanupAbortRef.current?.abort();
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  function clearCleanupOutput() {
    cleanupAbortRef.current?.abort();
    cleanupAbortRef.current = null;
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = null;
    }
    setDownloadUrl(null);
    setCleanupResult(null);
    setCleanupError(null);
    setCleanupProgress(null);
    setIsCleaning(false);
  }

  function setFix(id: DiagnosisFixId, value: boolean) {
    if (!isCleanupAvailable(id)) return;
    clearCleanupOutput();
    setSelected((current) => ({ ...current, [id]: value }));
  }

  function changeOcrLanguage(value: PdfOcrLanguage) {
    clearCleanupOutput();
    setOcrLanguage(value);
  }

  function changeCompressionMode(value: PdfCompressionMode) {
    clearCleanupOutput();
    setCompressionMode(value);
  }

  function cancelCleanup() {
    cleanupAbortRef.current?.abort();
  }

  async function runCleanup() {
    if (selectedCount === 0 || isCleaning) return;

    clearCleanupOutput();
    const controller = new AbortController();
    cleanupAbortRef.current = controller;
    setIsCleaning(true);
    setCleanupProgress({ phase: "preparing" });

    try {
      const output = await cleanupPdfFile(file, result, selected, {
        signal: controller.signal,
        onProgress: setCleanupProgress,
        ocrLanguage,
        compressionMode,
      });

      const blobBytes = Uint8Array.from(output.bytes);
      const url = URL.createObjectURL(new Blob([blobBytes.buffer], { type: "application/pdf" }));
      downloadUrlRef.current = url;
      setDownloadUrl(url);
      setCleanupResult(output);
      setCleanupError(null);
    } catch (error) {
      if (error instanceof PdfCleanupError && error.code === "cleanup-cancelled") {
        setCleanupProgress(null);
        return;
      }

      const reportableCleanupFailure =
        !(error instanceof PdfCleanupError) ||
        error.code === "ocr-failed" ||
        error.code === "output-invalid" ||
        error.code === "cleanup-failed";

      if (reportableCleanupFailure) {
        captureClientException(
          "cleanup",
          error,
          error instanceof PdfCleanupError ? error.code : "unexpected",
        );
      }

      setCleanupResult(null);
      setCleanupError(
        error instanceof PdfCleanupError
          ? error.message
          : "PDFBright could not safely finish this cleanup.",
      );
    } finally {
      if (cleanupAbortRef.current === controller) {
        cleanupAbortRef.current = null;
        setIsCleaning(false);
      }
    }
  }

  return (
    <section className="diagnosis-workspace">
      <div className="diagnosis-file-summary">
        <div className="document-icon document-icon--ready shrink-0" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="m9.6 14 1.55 1.55 3.45-3.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-950" title={file.name}>{file.name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {formatFileSize(file.size)} · {result.pageCount} {result.pageCount === 1 ? "page" : "pages"}
          </p>
        </div>

        {cleanupResult ? (
          <span className="result-file-ready">Ready</span>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button type="button" className="workspace-link" onClick={onReplace} disabled={isCleaning}>Replace</button>
            <button type="button" className="workspace-link workspace-link--danger" onClick={onRemove} disabled={isCleaning}>Remove</button>
          </div>
        )}
      </div>

      {isCleaning ? (
        <ProcessingExperience fileName={file.name} progress={cleanupProgress} onCancel={cancelCleanup} />
      ) : cleanupResult && downloadUrl ? (
        <ResultExperience
          file={file}
          result={cleanupResult}
          downloadUrl={downloadUrl}
          onCleanAnother={onRemove}
          debugCleanup={debugCleanup}
        />
      ) : (
        <div className="diagnosis-main-card">
          <div className="max-w-2xl">
            <p className="section-kicker">Your diagnosis</p>
            <h2 id="diagnosis-heading" className="diagnosis-title">
              {plan.isClean ? "This PDF already looks tidy" : "We found a few things we can improve"}
            </h2>
            <p className="diagnosis-intro">
              {plan.isClean
                ? "We did not find any obvious cleanup problems in the checks PDFBright can run today. You can still customize a cleanup plan below."
                : `${plan.findingCount} ${plan.findingCount === 1 ? "recommendation is" : "recommendations are"} ready. Safe fixes that PDFBright can perform now are selected for you; uncertain or destructive changes stay off until you review them.`}
            </p>
          </div>

          {plan.recommendations.length > 0 ? (
            <div className="mt-7 space-y-3" role="list" aria-label="Recommended PDF fixes">
              {plan.recommendations.map((item) => {
                const available = isCleanupAvailable(item.id);
                const isReviewing = reviewing === item.id;
                const controlId = `diagnosis-${item.id}`;

                return (
                  <article
                    key={item.id}
                    className={`diagnosis-finding ${selected[item.id] ? "diagnosis-finding--selected" : ""} ${!available ? "diagnosis-finding--future" : ""}`}
                    role="listitem"
                  >
                    <div className="finding-icon" aria-hidden="true"><FindingIcon id={item.id} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold tracking-tight text-slate-950">{item.title}</h3>
                        <span className={`finding-badge ${item.destructive ? "finding-badge--review" : ""} ${!available ? "finding-badge--future" : ""}`}>
                          {evidenceLabel(item)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.description}</p>

                      {item.reviewRequired && available ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            className="review-button"
                            aria-expanded={isReviewing}
                            aria-controls={`${controlId}-review`}
                            onClick={() => setReviewing(isReviewing ? null : item.id)}
                          >
                            {isReviewing ? "Hide review" : "Review pages"}
                          </button>
                          {isReviewing ? (
                            <div id={`${controlId}-review`} className="review-panel">
                              <p className="font-semibold text-slate-800">{pageListLabel(item.pageNumbers)}</p>
                              <p className="mt-1 text-slate-600">This is a heuristic finding. Keep removal disabled unless these pages are safe to delete.</p>
                            </div>
                          ) : null}
                        </div>
                      ) : item.pageNumbers.length > 0 && item.pageNumbers.length <= 5 ? (
                        <p className="mt-2 text-xs font-medium text-slate-500">{pageListLabel(item.pageNumbers)}</p>
                      ) : null}
                    </div>

                    <label className={`finding-toggle ${!available ? "finding-toggle--disabled" : ""}`} htmlFor={controlId}>
                      <span className="sr-only">
                        {available ? `${selected[item.id] ? "Disable" : "Enable"} ${item.title}` : `${item.title} is not available yet`}
                      </span>
                      <input
                        id={controlId}
                        type="checkbox"
                        checked={selected[item.id]}
                        disabled={!available || isCleaning}
                        onChange={(event) => setFix(item.id, event.target.checked)}
                      />
                      <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
                    </label>
                  </article>
                );
              })}
            </div>
          ) : null}

          <details className="diagnosis-customize mt-6">
            <summary>Customize fixes</summary>
            <div className="advanced-fix-grid">
              {ADVANCED_FIX_OPTIONS.map((option) => {
                const available = isCleanupAvailable(option.id);
                return (
                  <label key={option.id} className={`advanced-fix-option ${!available ? "advanced-fix-option--disabled" : ""}`}>
                    <input
                      type="checkbox"
                      checked={selected[option.id]}
                      disabled={!available || isCleaning}
                      onChange={(event) => setFix(option.id, event.target.checked)}
                    />
                    <span>
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                        {option.label}
                        {!available ? <span className="advanced-fix-future">Coming later</span> : null}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {selected["searchable-text"] ? (
              <div className="border-t border-slate-200 px-4 py-4">
                <label className="block max-w-sm" htmlFor="ocr-language">
                  <span className="block text-sm font-semibold text-slate-900">OCR language</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Choose the main language printed on the scanned pages. Recognition runs locally in your browser; the language model may be downloaded and cached.
                  </span>
                  <select
                    id="ocr-language"
                    value={ocrLanguage}
                    disabled={isCleaning}
                    onChange={(event) => changeOcrLanguage(event.target.value as PdfOcrLanguage)}
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    {OCR_LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.code} value={language.code}>{language.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {selected.compress ? (
              <div className="border-t border-slate-200 px-4 py-4">
                <label className="block max-w-sm" htmlFor="compression-mode">
                  <span className="block text-sm font-semibold text-slate-900">File optimization</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    PDFBright only recompresses safe image-heavy scan pages. Native text and vector pages stay native.
                  </span>
                  <select
                    id="compression-mode"
                    value={compressionMode}
                    disabled={isCleaning}
                    onChange={(event) => changeCompressionMode(event.target.value as PdfCompressionMode)}
                    className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    {PDF_COMPRESSION_OPTIONS.map((mode) => (
                      <option key={mode.id} value={mode.id}>{mode.label}</option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    {PDF_COMPRESSION_OPTIONS.find((mode) => mode.id === compressionMode)?.description}
                  </span>
                </label>
              </div>
            ) : null}
          </details>

          <div className="diagnosis-actions">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedCount === 0 ? "No available fixes selected" : `${selectedCount} ${selectedCount === 1 ? "fix" : "fixes"} selected`}
              </p>
              <p id="cleanup-status-note" className="mt-1 text-xs leading-5 text-slate-500">
                {selectedCount === 0
                  ? "Choose an available cleanup option if you want to make changes."
                  : "Review your selected fixes before continuing."}
              </p>
            </div>

            <button
              type="button"
              className="button button--primary diagnosis-primary-action"
              disabled={selectedCount === 0}
              aria-describedby="cleanup-status-note"
              onClick={() => void runCleanup()}
            >
              Fix My PDF
            </button>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {cleanupError ? (
              <p className="diagnosis-cleanup-error" role="alert">{cleanupError} Your original file is unchanged.</p>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}