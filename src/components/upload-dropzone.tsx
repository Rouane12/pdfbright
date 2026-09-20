"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { AnalysisDebugPanel } from "@/components/analysis-debug-panel";
import { DiagnosisWorkspace } from "@/components/diagnosis-workspace";
import { captureClientException } from "@/lib/analytics/client";
import { analyzePdfFile } from "@/lib/pdf-analysis/analyze-pdf";
import {
  PdfAnalysisError,
  type PdfAnalysisProgress,
  type PdfAnalysisResult,
} from "@/lib/pdf-analysis/types";
import { PdfPreflightError, preflightPdfFile } from "@/lib/security/pdf-preflight";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function describeProgress(progress: PdfAnalysisProgress | null) {
  if (!progress) return "Validating PDF locally…";

  switch (progress.phase) {
    case "loading":
      return "Loading PDF locally…";
    case "parsing":
      return "Reading document structure…";
    case "analyzing-pages":
      if (progress.pageNumber && progress.pageCount) {
        return `Analyzing page ${progress.pageNumber} of ${progress.pageCount}…`;
      }
      return "Analyzing pages…";
    case "finalizing":
      return "Preparing analysis summary…";
  }
}

function UploadSourceIcon({ kind }: { kind: "device" | "drive" | "dropbox" | "onedrive" }) {
  if (kind === "device") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3.5h7l4 4V20H7V3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 3.8V8h4M12 16V10m0 0-2.4 2.4M12 10l2.4 2.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "drive") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 3 4.8 8.2H8.3L3.6 19 9 3Z" fill="#34A853" />
        <path d="M9 3h6l5.4 9.3h-5.9L9 3Z" fill="#FBBC04" />
        <path d="M8.3 11.2h5.5l3.2 5.5-2.1 3.3H3.6l4.7-8.8Z" fill="#4285F4" />
      </svg>
    );
  }

  if (kind === "dropbox") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6.3 4 5.7 3.6-5.7 3.6L.7 7.6 6.3 4Zm11.4 0 5.6 3.6-5.6 3.6L12 7.6 17.7 4ZM6.3 12.1l5.7 3.6-5.7 3.6-5.6-3.6 5.6-3.6Zm11.4 0 5.6 3.6-5.6 3.6-5.7-3.6 5.7-3.6ZM6.9 20l5.1-3.2 5.1 3.2-5.1 3.2L6.9 20Z" fill="#0061FF" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.2 17.8h10.2a4.1 4.1 0 0 0 .4-8.2 6.2 6.2 0 0 0-11.4-1.8A5.1 5.1 0 0 0 8.2 17.8Z" fill="#1A73E8" />
      <path d="M4.5 17.8h8.7a3.5 3.5 0 0 0 .3-7 5.3 5.3 0 0 0-9.8-1.5 4.3 4.3 0 0 0 .8 8.5Z" fill="#36BFFA" opacity=".92" />
    </svg>
  );
}

export function UploadDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceMenuRef = useRef<HTMLDetailsElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const analysisRunRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<PdfAnalysisProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PdfAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const debugMode =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("debug")
      : null;
  const analysisDebugEnabled = debugMode === "analysis";
  const cleanupDebugEnabled = debugMode === "cleanup";

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function openDevicePicker() {
    if (sourceMenuRef.current) {
      sourceMenuRef.current.open = false;
    }
    inputRef.current?.click();
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    const runId = analysisRunRef.current + 1;
    analysisRunRef.current = runId;
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setSelectedFile(file);
    setError(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setAnalysisProgress(null);
    setIsAnalyzing(true);

    try {
      await preflightPdfFile(file, controller.signal);
      if (analysisRunRef.current !== runId) return;

      setAnalysisProgress({ phase: "loading" });
      const result = await analyzePdfFile(file, {
        signal: controller.signal,
        onProgress: (progress) => {
          if (analysisRunRef.current === runId) {
            setAnalysisProgress(progress);
          }
        },
      });

      if (analysisRunRef.current !== runId) return;
      setAnalysisResult(result);
      setAnalysisError(null);
    } catch (analysisFailure) {
      if (analysisRunRef.current !== runId) return;

      if (
        (analysisFailure instanceof PdfPreflightError && analysisFailure.code === "cancelled") ||
        (analysisFailure instanceof PdfAnalysisError && analysisFailure.code === "analysis-cancelled")
      ) {
        return;
      }

      setAnalysisResult(null);

      if (analysisFailure instanceof PdfPreflightError) {
        setSelectedFile(null);
        setError(analysisFailure.message);
        setAnalysisError(null);
      } else {
        const reportableAnalysisFailure =
          !(analysisFailure instanceof PdfAnalysisError) ||
          analysisFailure.code === "browser-memory" ||
          analysisFailure.code === "analysis-failed";

        if (reportableAnalysisFailure) {
          captureClientException(
            "analysis",
            analysisFailure,
            analysisFailure instanceof PdfAnalysisError ? analysisFailure.code : "unexpected",
          );
        }

        setAnalysisError(
          analysisFailure instanceof PdfAnalysisError
            ? analysisFailure.message
            : "PDFBright could not analyze this PDF. Please try another file.",
        );
      }
    } finally {
      if (analysisRunRef.current === runId) {
        setIsAnalyzing(false);
        abortRef.current = null;
      }
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    void handleFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFile(event.dataTransfer.files?.[0]);
  }

  function removeFile() {
    analysisRunRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setSelectedFile(null);
    setError(null);
    setAnalysisResult(null);
    setAnalysisProgress(null);
    setAnalysisError(null);
    setIsAnalyzing(false);
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        tabIndex={-1}
        accept="application/pdf,.pdf"
        onChange={handleInputChange}
        aria-label="Choose a PDF file"
      />

      {selectedFile && analysisResult ? (
        <DiagnosisWorkspace
          key={`${analysisResult.analyzedAt}-${selectedFile.name}`}
          file={selectedFile}
          result={analysisResult}
          onReplace={openDevicePicker}
          onRemove={removeFile}
          debugCleanup={cleanupDebugEnabled}
        />
      ) : (
        <div className="mx-auto max-w-2xl">
          <div
            className={`upload-zone ${selectedFile ? "upload-zone--selected" : ""} ${isDragging ? "upload-zone--active" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="selected-file-shell">
                <div className="document-icon document-icon--ready shrink-0" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
                    <path d="m9.6 14 1.55 1.55 3.45-3.55" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-sm font-semibold text-slate-950">PDF selected</p>
                  <p
                    className="mt-1 max-w-full truncate text-base font-medium text-slate-800"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={openDevicePicker}
                  >
                    Replace PDF
                  </button>
                  <button type="button" className="button button--secondary" onClick={removeFile}>
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="document-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9.6 13.2h5M9.6 16h3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                  Drop your PDF here
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">or choose where your PDF lives</p>

                <div className="upload-source-picker mt-6">
                  <button
                    type="button"
                    className="upload-source-picker__main"
                    onClick={openDevicePicker}
                  >
                    <UploadSourceIcon kind="device" />
                    <span>Choose a PDF</span>
                  </button>

                  <details ref={sourceMenuRef} className="upload-source-picker__menu">
                    <summary aria-label="Choose another PDF source">
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="m6 8 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <div className="upload-source-popover">
                      <button type="button" className="upload-source-option" onClick={openDevicePicker}>
                        <span className="upload-source-option__icon upload-source-option__icon--device"><UploadSourceIcon kind="device" /></span>
                        <span className="upload-source-option__copy">
                          <strong>From device</strong>
                          <small>Choose a PDF already on this device</small>
                        </span>
                      </button>

                      <button type="button" className="upload-source-option" disabled title="Google Drive import is coming soon">
                        <span className="upload-source-option__icon"><UploadSourceIcon kind="drive" /></span>
                        <span className="upload-source-option__copy">
                          <strong>Google Drive</strong>
                          <small>Cloud import</small>
                        </span>
                        <span className="upload-source-option__soon">Soon</span>
                      </button>

                      <button type="button" className="upload-source-option" disabled title="Dropbox import is coming soon">
                        <span className="upload-source-option__icon"><UploadSourceIcon kind="dropbox" /></span>
                        <span className="upload-source-option__copy">
                          <strong>Dropbox</strong>
                          <small>Cloud import</small>
                        </span>
                        <span className="upload-source-option__soon">Soon</span>
                      </button>

                      <button type="button" className="upload-source-option" disabled title="OneDrive import is coming soon">
                        <span className="upload-source-option__icon"><UploadSourceIcon kind="onedrive" /></span>
                        <span className="upload-source-option__copy">
                          <strong>OneDrive</strong>
                          <small>Cloud import</small>
                        </span>
                        <span className="upload-source-option__soon">Soon</span>
                      </button>

                      <p className="upload-source-popover__note">✦ Device upload stays the fastest, most private path.</p>
                    </div>
                  </details>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  PDF only · Free Early Access: up to 10 MB / 10 pages
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 min-h-6 text-center" aria-live="polite" aria-atomic="true">
            {error ? (
              <p className="text-sm font-medium text-rose-700">{error}</p>
            ) : selectedFile && analysisError ? (
              <p className="text-sm font-medium text-rose-700">{analysisError}</p>
            ) : selectedFile && isAnalyzing ? (
              <p className="text-sm font-medium text-slate-700">
                {analysisProgress ? describeProgress(analysisProgress) : "Validating PDF locally…"}
              </p>
            ) : selectedFile ? (
              <p className="sr-only">PDF selected successfully. Your original file has not been changed.</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {selectedFile && analysisResult
          ? `Analysis complete. ${analysisResult.pageCount} ${analysisResult.pageCount === 1 ? "page" : "pages"}. Diagnosis ready. Original file unchanged.`
          : null}
      </div>

      <p className="mt-4 text-center text-[0.8rem] leading-5 text-slate-600 sm:text-sm">
        Current processing runs locally in your browser · No signup required ·{" "}
        <a className="brand-link font-semibold" href="/privacy">
          Privacy details
        </a>
      </p>

      {analysisDebugEnabled && analysisResult ? <AnalysisDebugPanel result={analysisResult} /> : null}
    </div>
  );
}