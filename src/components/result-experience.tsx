"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { captureAnalyticsEvent } from "@/lib/analytics/client";
import { CleanupDebugPanel } from "@/components/cleanup-debug-panel";
import type { PdfCleanupReport, PdfCleanupResult } from "@/lib/pdf-cleanup/types";

const PDF_WORKER_URL = "/vendor/pdf.worker.min.mjs";

type FeedbackChoice = "yes" | "mostly" | "no";

interface ResultExperienceProps {
  file: File;
  result: PdfCleanupResult;
  downloadUrl: string;
  onCleanAnother: () => void;
  debugCleanup?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function outputFileName(name: string) {
  return `${name.replace(/\.pdf$/i, "")}-clean.pdf`;
}

function representativePages(report: PdfCleanupReport) {
  const changedPages = [
    ...report.straightenedPages,
    ...report.rotatedPages,
    ...report.readabilityEnhancedPages,
    ...report.searchableTextPages,
    ...report.normalizedPages,
    ...report.optimizedPages,
  ].filter((page) => !report.removedBlankPages.includes(page));

  let originalPage = changedPages.length > 0 ? Math.min(...changedPages) : 1;

  if (report.removedBlankPages.includes(originalPage)) {
    const surviving = Array.from({ length: report.originalPageCount }, (_, index) => index + 1)
      .find((page) => !report.removedBlankPages.includes(page));
    originalPage = surviving ?? 1;
  }

  const removedBefore = report.removedBlankPages.filter((page) => page < originalPage).length;
  const outputPage = Math.max(1, Math.min(report.outputPageCount, originalPage - removedBefore));
  return { originalPage, outputPage };
}

function summaryItems(report: PdfCleanupReport) {
  const items: Array<{ label: string; value: string }> = [];

  if (report.straightenedPages.length > 0) {
    items.push({ label: "Straightened", value: `${report.straightenedPages.length} ${report.straightenedPages.length === 1 ? "page" : "pages"}` });
  }
  if (report.rotatedPages.length > 0) {
    items.push({ label: "Rotated", value: `${report.rotatedPages.length} ${report.rotatedPages.length === 1 ? "page" : "pages"}` });
  }
  if (report.searchableTextPages.length > 0) {
    items.push({ label: "Made searchable", value: `${report.searchableTextPages.length} ${report.searchableTextPages.length === 1 ? "page" : "pages"}` });
  }
  if (report.removedBlankPages.length > 0) {
    items.push({ label: "Blank pages removed", value: `${report.removedBlankPages.length}` });
  }
  if (report.normalizedPages.length > 0) {
    items.push({ label: "Page sizes normalized", value: `${report.normalizedPages.length}` });
  }
  if (report.optimizedPages.length > 0) {
    items.push({ label: "Scan pages optimized", value: `${report.optimizedPages.length}` });
  }
  if (report.readabilityEnhancedPages.length > 0) {
    items.push({ label: "Readability improved", value: `${report.readabilityEnhancedPages.length} ${report.readabilityEnhancedPages.length === 1 ? "page" : "pages"}` });
  }

  if (items.length === 0) {
    items.push({ label: "Pages processed", value: `${report.outputPageCount}` });
  }

  return items;
}

function sizeSummary(report: PdfCleanupReport) {
  if (report.bytesSaved > 0) {
    return `${formatFileSize(report.originalFileSizeBytes)} → ${formatFileSize(report.outputFileSizeBytes)} · ${report.sizeReductionPercent.toFixed(1)}% smaller`;
  }
  if (report.bytesSaved < 0) {
    return `${formatFileSize(report.originalFileSizeBytes)} → ${formatFileSize(report.outputFileSizeBytes)}`;
  }
  return formatFileSize(report.outputFileSizeBytes);
}

export function ResultExperience({
  file,
  result,
  downloadUrl,
  onCleanAnother,
  debugCleanup = false,
}: ResultExperienceProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cleanedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewSectionRef = useRef<HTMLDivElement | null>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"loading" | "ready" | "error">("loading");
  const [feedback, setFeedback] = useState<FeedbackChoice | null>(null);
  const pages = useMemo(() => representativePages(result.report), [result.report]);
  const items = useMemo(() => summaryItems(result.report), [result.report]);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderPreview() {
      const originalCanvas = originalCanvasRef.current;
      const cleanedCanvas = cleanedCanvasRef.current;
      if (!originalCanvas || !cleanedCanvas) return;

      setPreviewStatus("loading");

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

        async function renderOne(bytes: Uint8Array, pageNumber: number, canvas: HTMLCanvasElement) {
          const task = pdfjs.getDocument({ data: bytes });
          const documentProxy = await task.promise;
          try {
            const page = await documentProxy.getPage(pageNumber);
            const base = page.getViewport({ scale: 1 });
            const targetWidth = Math.min(520, Math.max(260, canvas.parentElement?.clientWidth ?? 420));
            const cssScale = Math.min(1.25, targetWidth / Math.max(1, base.width));
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            const viewport = page.getViewport({ scale: cssScale * pixelRatio });
            const context = canvas.getContext("2d", { alpha: false });
            if (!context) throw new Error("Canvas context unavailable.");

            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            canvas.style.width = `${Math.round(viewport.width / pixelRatio)}px`;
            canvas.style.height = `${Math.round(viewport.height / pixelRatio)}px`;

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({
              canvas,
              canvasContext: context,
              viewport,
              background: "#ffffff",
            }).promise;
          } finally {
            await task.destroy();
          }
        }

        const originalBytes = new Uint8Array(await file.arrayBuffer());
        if (cancelled) return;
        await renderOne(originalBytes, pages.originalPage, originalCanvas);
        if (cancelled) return;
        await renderOne(Uint8Array.from(result.bytes), pages.outputPage, cleanedCanvas);
        if (!cancelled) setPreviewStatus("ready");
      } catch {
        if (!cancelled) setPreviewStatus("error");
      }
    }

    void renderPreview();
    return () => {
      cancelled = true;
    };
  }, [file, pages.originalPage, pages.outputPage, result.bytes]);

  const report = result.report;
  const gotLarger = report.bytesSaved < 0;
  const hasVisiblePageChange =
    report.straightenedPages.length > 0 ||
    report.rotatedPages.length > 0 ||
    report.readabilityEnhancedPages.length > 0 ||
    report.normalizedPages.length > 0;
  const mainlyInvisibleChanges =
    !hasVisiblePageChange &&
    (report.searchableTextPages.length > 0 || report.optimizedPages.length > 0);

  return (
    <section className="result-card" aria-labelledby="result-heading">
      <div className="result-success-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m6.5 12.5 3.3 3.2 7.7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="section-kicker">Cleanup complete</p>
      <h2 ref={headingRef} id="result-heading" tabIndex={-1} className="result-title">Your PDF is ready</h2>
      <p className="result-copy">
        PDFBright finished the selected fixes and checked the output before enabling your download. Your original file was not changed.
      </p>

      <div className="result-size-card">
        <span>File size</span>
        <strong>{sizeSummary(report)}</strong>
        {gotLarger && report.searchableTextPages.length > 0 ? (
          <p>Searchable text was added, so the cleaned file is a little larger than the original.</p>
        ) : null}
      </div>

      <div className="result-summary-grid" role="group" aria-label="Cleanup summary">
        {items.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="result-actions">
        <a
          className="button button--primary result-download"
          href={downloadUrl}
          download={outputFileName(file.name)}
          onClick={() =>
            captureAnalyticsEvent("download_clicked", {
              local_vs_server: "local",
              page_count: result.report.outputPageCount,
            })
          }
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download Clean PDF
        </a>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            previewHeadingRef.current?.focus({ preventScroll: true });
            previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          View changes
        </button>
        <button type="button" className="result-clean-another" onClick={onCleanAnother}>
          Clean another PDF
        </button>
      </div>

      <div ref={previewSectionRef} className="result-preview-section">
        <div className="result-preview-heading">
          <div>
            <p className="section-kicker">Before & after</p>
            <h3 ref={previewHeadingRef} tabIndex={-1}>See a representative page</h3>
          </div>
          <span>Original page {pages.originalPage}</span>
        </div>

        {mainlyInvisibleChanges ? (
          <p className="result-preview-note">
            Visual appearance is intentionally preserved here; the main changes are searchability and file size.
          </p>
        ) : null}

        {previewStatus === "loading" ? (
          <div className="result-preview-loading" role="status">Preparing the page comparison…</div>
        ) : null}
        {previewStatus === "error" ? (
          <div className="result-preview-loading" role="status">The visual preview could not be rendered, but the validated PDF is still ready to download.</div>
        ) : null}

        <div className={`result-preview-grid ${previewStatus === "ready" ? "result-preview-grid--ready" : ""}`}>
          <figure className="result-preview-card">
            <figcaption><span>Original</span><small>Before cleanup</small></figcaption>
            <div className="result-canvas-shell"><canvas ref={originalCanvasRef} /></div>
          </figure>
          <figure className="result-preview-card result-preview-card--cleaned">
            <figcaption><span>Cleaned</span><small>Ready to use</small></figcaption>
            <div className="result-canvas-shell"><canvas ref={cleanedCanvasRef} /></div>
          </figure>
        </div>
        {report.removedBlankPages.length > 0 ? (
          <p className="result-preview-note">Removed blank pages are listed in the summary; the visual comparison uses a retained page.</p>
        ) : null}
      </div>

      <div className="result-feedback" aria-labelledby="result-feedback-heading">
        <div>
          <h3 id="result-feedback-heading">Did this fix what was wrong with your PDF?</h3>
          <p>Optional — answer after you have checked the downloaded file.</p>
        </div>
        <div className="result-feedback-options">
          {(["yes", "mostly", "no"] as FeedbackChoice[]).map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={feedback === choice}
              className={feedback === choice ? "result-feedback-option result-feedback-option--selected" : "result-feedback-option"}
              onClick={() => setFeedback(choice)}
            >
              {choice === "yes" ? "Yes" : choice === "mostly" ? "Mostly" : "No"}
            </button>
          ))}
        </div>
      </div>

      {debugCleanup ? (
        <CleanupDebugPanel fileName={file.name} result={result} downloadUrl={downloadUrl} />
      ) : null}
    </section>
  );
}
