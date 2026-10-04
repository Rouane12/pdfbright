"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  captureAnalyticsEvent,
  fileSizeBucket,
} from "@/lib/analytics/client";
import {
  analyzePdfFile,
} from "@/lib/pdf-analysis/analyze-pdf";
import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";
import {
  compressionModeLabel,
  FitToSizeError,
  fitPdfToTargetSize,
  type FitToSizeProgress,
  type FitToSizeResult,
} from "@/lib/pdf-optimization/fit-to-size";
import {
  PdfPreflightError,
  preflightPdfFile,
} from "@/lib/security/pdf-preflight";

const TARGET_PRESETS = [
  { label: "500 KB", amount: "500", unit: "KB" as const },
  { label: "1 MB", amount: "1", unit: "MB" as const },
  { label: "2 MB", amount: "2", unit: "MB" as const },
  { label: "5 MB", amount: "5", unit: "MB" as const },
  { label: "10 MB", amount: "10", unit: "MB" as const },
];

type TargetUnit = "KB" | "MB";
type ToolStage = "idle" | "analyzing" | "optimizing" | "done";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes >= 10 ? megabytes.toFixed(1) : megabytes.toFixed(2)} MB`;
}

function targetBucket(bytes: number) {
  const megabytes = bytes / (1024 * 1024);
  if (megabytes <= 0.5) return "0-0.5mb";
  if (megabytes <= 1) return "0.5-1mb";
  if (megabytes <= 2) return "1-2mb";
  if (megabytes <= 5) return "2-5mb";
  if (megabytes <= 10) return "5-10mb";
  return "10mb+";
}

function parseTargetBytes(amount: string, unit: TargetUnit) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  const multiplier = unit === "MB" ? 1024 * 1024 : 1024;
  return Math.round(value * multiplier);
}

function outputName(fileName: string) {
  return `${fileName.replace(/\.pdf$/i, "")}-fit.pdf`;
}

function progressLabel(progress: FitToSizeProgress | null) {
  if (!progress) return "Preparing the first measured output…";
  const profile = compressionModeLabel(progress.mode) ?? "quality";
  const cleanup = progress.cleanupProgress;

  if (!cleanup) {
    return `Testing ${profile} · option ${progress.attempt} of ${progress.totalAttempts}`;
  }

  if (cleanup.phase === "optimizing-file-size" && cleanup.pageCount) {
    return `Testing ${profile} · optimizing page ${cleanup.pageNumber ?? 1} of ${cleanup.pageCount}`;
  }

  if (cleanup.phase === "validating") {
    return `Testing ${profile} · validating the output`;
  }

  if (cleanup.phase === "saving") {
    return `Testing ${profile} · measuring the result`;
  }

  return `Testing ${profile} · option ${progress.attempt} of ${progress.totalAttempts}`;
}

function statusTitle(result: FitToSizeResult) {
  if (result.status === "already-fits") return "Your PDF already fits.";
  if (result.status === "target-reached") return "Target reached.";
  return "Best safe result found.";
}

export function FitPdfSizeTool() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const outputUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetAmount, setTargetAmount] = useState("2");
  const [targetUnit, setTargetUnit] = useState<TargetUnit>("MB");
  const [stage, setStage] = useState<ToolStage>("idle");
  const [progress, setProgress] = useState<FitToSizeProgress | null>(null);
  const [analysis, setAnalysis] = useState<PdfAnalysisResult | null>(null);
  const [result, setResult] = useState<FitToSizeResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetBytes = useMemo(
    () => parseTargetBytes(targetAmount, targetUnit),
    [targetAmount, targetUnit],
  );
  const busy = stage === "analyzing" || stage === "optimizing";

  useEffect(() => {
    captureAnalyticsEvent("fit_to_size_viewed");

    return () => {
      abortRef.current?.abort();
      if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
    };
  }, []);

  function clearOutput() {
    if (outputUrlRef.current) {
      URL.revokeObjectURL(outputUrlRef.current);
      outputUrlRef.current = null;
    }
    setDownloadUrl(null);
    setResult(null);
    setAnalysis(null);
    setProgress(null);
    setStage("idle");
  }

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) return;
    const isPdf =
      nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Choose a PDF file to fit to a size limit.");
      return;
    }

    abortRef.current?.abort();
    clearOutput();
    setError(null);
    setFile(nextFile);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (busy) return;
    chooseFile(event.dataTransfer.files?.[0]);
  }

  function setTarget(amount: string, unit: TargetUnit) {
    abortRef.current?.abort();
    clearOutput();
    setError(null);
    setTargetAmount(amount);
    setTargetUnit(unit);
  }

  async function runFit() {
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }

    if (!targetBytes || targetBytes < 50 * 1024) {
      setError("Choose a target of at least 50 KB.");
      return;
    }

    abortRef.current?.abort();
    clearOutput();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setStage("analyzing");

    captureAnalyticsEvent("fit_to_size_started", {
      file_size_bucket: fileSizeBucket(file.size),
      target_size_bucket: targetBucket(targetBytes),
      local_vs_server: "local",
    });

    try {
      await preflightPdfFile(file, controller.signal);
      const nextAnalysis = await analyzePdfFile(file, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      setAnalysis(nextAnalysis);
      setStage("optimizing");

      const nextResult = await fitPdfToTargetSize(file, nextAnalysis, targetBytes, {
        signal: controller.signal,
        onProgress: setProgress,
      });

      if (controller.signal.aborted) return;

      const blob = nextResult.cleanupResult
        ? new Blob([Uint8Array.from(nextResult.cleanupResult.bytes)], { type: "application/pdf" })
        : file;
      const url = URL.createObjectURL(blob);
      outputUrlRef.current = url;
      setDownloadUrl(url);
      setResult(nextResult);
      setStage("done");

      captureAnalyticsEvent("fit_to_size_completed", {
        outcome: nextResult.status,
        file_size_bucket: fileSizeBucket(file.size),
        output_size_bucket: fileSizeBucket(nextResult.outputBytes),
        target_size_bucket: targetBucket(targetBytes),
        attempts: nextResult.attemptedModes.length,
        selected_mode: nextResult.selectedMode,
        local_vs_server: "local",
      });
    } catch (failure) {
      if (controller.signal.aborted) return;

      const message =
        failure instanceof FitToSizeError || failure instanceof PdfPreflightError
          ? failure.message
          : failure instanceof Error
            ? failure.message
            : "PDFBright could not safely fit this PDF to the requested limit.";
      const code =
        failure instanceof FitToSizeError || failure instanceof PdfPreflightError
          ? failure.code
          : "unexpected";

      setError(message);
      setStage("idle");
      captureAnalyticsEvent("fit_to_size_failed", {
        error_code: code,
        file_size_bucket: fileSizeBucket(file.size),
        target_size_bucket: targetBucket(targetBytes),
        local_vs_server: "local",
      });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  const scanPages = analysis
    ? analysis.pages.filter(
        (page) => page.contentKind === "probable-scan" || page.contentKind === "image-only",
      ).length
    : null;
  const selectedMode = result ? compressionModeLabel(result.selectedMode) : null;
  const targetDisplay = targetBytes ? formatFileSize(targetBytes) : `${targetAmount} ${targetUnit}`;

  return (
    <div className="fit-size-tool">
      <div
        className={`fit-size-dropzone ${file ? "is-selected" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="application/pdf,.pdf"
          onChange={onFileChange}
          disabled={busy}
        />
        <div className="fit-size-dropzone__icon" aria-hidden="true">↘</div>
        <div>
          <strong>{file ? file.name : "Choose the PDF that has to fit"}</strong>
          <p>
            {file
              ? `${formatFileSize(file.size)} · ready to measure against your limit`
              : "Drop a PDF here or select one from your device. Processing stays in this browser."}
          </p>
        </div>
        <button
          type="button"
          className="fit-size-secondary-button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {file ? "Change PDF" : "Choose PDF"}
        </button>
      </div>

      <div className="fit-size-target-card">
        <div className="fit-size-target-heading">
          <div>
            <span className="fit-size-step">Size limit</span>
            <h2>How small does it need to be?</h2>
          </div>
          {file && targetBytes ? (
            <span className={`fit-size-fit-hint ${file.size <= targetBytes ? "is-good" : ""}`}>
              {file.size <= targetBytes ? "Already fits" : `${formatFileSize(file.size)} → ≤ ${targetDisplay}`}
            </span>
          ) : null}
        </div>

        <div className="fit-size-presets" aria-label="Common target sizes">
          {TARGET_PRESETS.map((preset) => {
            const active = preset.amount === targetAmount && preset.unit === targetUnit;
            return (
              <button
                key={preset.label}
                type="button"
                className={active ? "is-active" : ""}
                onClick={() => setTarget(preset.amount, preset.unit)}
                disabled={busy}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="fit-size-custom-row">
          <label htmlFor="fit-target-size">Custom limit</label>
          <div className="fit-size-custom-control">
            <input
              id="fit-target-size"
              type="number"
              min="0.05"
              step="0.05"
              inputMode="decimal"
              value={targetAmount}
              onChange={(event) => setTarget(event.target.value, targetUnit)}
              disabled={busy}
            />
            <select
              aria-label="Target size unit"
              value={targetUnit}
              onChange={(event) => setTarget(targetAmount, event.target.value as TargetUnit)}
              disabled={busy}
            >
              <option value="MB">MB</option>
              <option value="KB">KB</option>
            </select>
          </div>
        </div>

        <div className="fit-size-policy">
          <span aria-hidden="true">✓</span>
          <p>
            PDFBright tests measured outputs from <strong>Best Quality → Balanced → Smaller File</strong>
            and stops at the least aggressive validated profile that actually fits. Native text and vector
            pages are preserved instead of being flattened just to chase a number.
          </p>
        </div>

        <button
          type="button"
          className="fit-size-primary-button"
          onClick={() => void runFit()}
          disabled={busy || !file || !targetBytes}
        >
          {busy ? "Finding the best fit…" : `Fit PDF under ${targetDisplay}`}
        </button>
      </div>

      {busy ? (
        <div className="fit-size-progress" role="status" aria-live="polite">
          <div className="fit-size-progress__spinner" aria-hidden="true" />
          <div>
            <strong>{stage === "analyzing" ? "Understanding the document first" : "Measuring real outputs"}</strong>
            <p>
              {stage === "analyzing"
                ? "Checking page structure and finding scan/image pages that can be recompressed safely…"
                : progressLabel(progress)}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="fit-size-notice fit-size-notice--error" role="alert">
          <strong>PDFBright stopped safely.</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {result ? (
        <section className={`fit-size-result fit-size-result--${result.status}`} aria-labelledby="fit-size-result-heading">
          <div className="fit-size-result__top">
            <div>
              <span className="fit-size-result__eyebrow">
                {result.status === "best-safe-effort" ? "Quality floor reached" : "Fit complete"}
              </span>
              <h2 id="fit-size-result-heading">{statusTitle(result)}</h2>
              <p>
                {result.status === "already-fits"
                  ? "No recompression was necessary, so PDFBright kept the original file unchanged."
                  : result.status === "target-reached"
                    ? "PDFBright used the least aggressive measured profile that landed under your limit, then reopened the output to validate it before download."
                    : "The requested limit is below what PDFBright's current validated profiles can safely reach. This is the smallest measured result we found without pushing beyond those guardrails."}
              </p>
            </div>
            <div className="fit-size-result__badge">
              {result.status === "target-reached"
                ? "Under limit"
                : result.status === "already-fits"
                  ? "No change needed"
                  : "Best safe effort"}
            </div>
          </div>

          <div className="fit-size-metrics">
            <div>
              <span>Original</span>
              <strong>{formatFileSize(result.originalBytes)}</strong>
            </div>
            <div>
              <span>Target</span>
              <strong>≤ {formatFileSize(result.targetBytes)}</strong>
            </div>
            <div>
              <span>{result.status === "best-safe-effort" ? "Smallest safe" : "Result"}</span>
              <strong>{formatFileSize(result.outputBytes)}</strong>
            </div>
            <div>
              <span>Profile</span>
              <strong>{selectedMode ?? "Original"}</strong>
            </div>
          </div>

          {analysis ? (
            <div className="fit-size-proof-row">
              <span>✓ {analysis.pageCount} {analysis.pageCount === 1 ? "page" : "pages"} inspected</span>
              <span>✓ {scanPages ?? 0} scan/image {scanPages === 1 ? "page" : "pages"} eligible</span>
              {result.cleanupResult ? (
                <span>✓ {result.cleanupResult.validation.outputPageCount} pages validated after fitting</span>
              ) : (
                <span>✓ original preserved</span>
              )}
            </div>
          ) : null}

          {downloadUrl ? (
            <div className="fit-size-result__actions">
              <a
                className="fit-size-primary-button fit-size-primary-button--link"
                href={downloadUrl}
                download={outputName(file?.name ?? "document.pdf")}
                onClick={() => {
                  captureAnalyticsEvent("fit_to_size_downloaded", {
                    outcome: result.status,
                    output_size_bucket: fileSizeBucket(result.outputBytes),
                    target_size_bucket: targetBucket(result.targetBytes),
                    local_vs_server: "local",
                  });
                }}
              >
                {result.status === "already-fits" ? "Download original PDF" : "Download fitted PDF"}
              </a>
              <button
                type="button"
                className="fit-size-secondary-button"
                onClick={() => {
                  clearOutput();
                  setFile(null);
                  setError(null);
                }}
              >
                Fit another PDF
              </button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
