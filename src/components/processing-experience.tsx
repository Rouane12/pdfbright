"use client";

import { useEffect, useRef } from "react";
import type { PdfCleanupProgress } from "@/lib/pdf-cleanup/types";

interface ProcessingExperienceProps {
  fileName: string;
  progress: PdfCleanupProgress | null;
  onCancel: () => void;
}

function progressLabel(progress: PdfCleanupProgress | null) {
  if (!progress) return "Preparing your PDF…";

  switch (progress.phase) {
    case "preparing":
      return "Preparing your selected fixes…";
    case "rendering-visual-fixes":
      return progress.pageNumber && progress.pageCount
        ? `Cleaning scan ${progress.pageNumber} of ${progress.pageCount}…`
        : "Cleaning scanned pages…";
    case "optimizing-file-size":
      return progress.pageNumber && progress.pageCount
        ? `Optimizing scan ${progress.pageNumber} of ${progress.pageCount}…`
        : "Optimizing file size…";
    case "applying-page-fixes":
      return "Applying safe page fixes…";
    case "ocr-loading":
      return "Loading text recognition…";
    case "ocr-recognizing": {
      const page = progress.pageNumber && progress.pageCount
        ? `Page ${progress.pageNumber} of ${progress.pageCount}`
        : "Recognizing scanned text";
      const percent = typeof progress.pageProgress === "number"
        ? ` · ${Math.round(progress.pageProgress * 100)}%`
        : "";
      return `${page}${percent}`;
    }
    case "ocr-overlaying":
      return "Adding searchable text…";
    case "saving":
      return "Building your clean PDF…";
    case "validating":
      return "Checking the finished PDF…";
  }
}

function phaseHint(progress: PdfCleanupProgress | null) {
  if (!progress) return "PDFBright is getting the document ready.";

  if (progress.phase === "validating") {
    return "The download unlocks only after the finished PDF passes integrity checks.";
  }
  if (progress.phase.startsWith("ocr")) {
    return "Text recognition can take longer on scanned pages. Keep this tab open while it finishes.";
  }
  if (progress.phase === "optimizing-file-size") {
    return "Image-heavy scan pages are being optimized without flattening healthy native text pages.";
  }
  return "Your original file stays untouched while PDFBright builds a separate cleaned copy.";
}

export function ProcessingExperience({ fileName, progress, onCancel }: ProcessingExperienceProps) {
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section className="processing-card" aria-labelledby="processing-heading">
      <div className="processing-visual" aria-hidden="true">
        <div className="processing-orbit processing-orbit--outer" />
        <div className="processing-orbit processing-orbit--inner" />
        <div className="processing-document">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M7 3.75h6.4L18 8.35v11.9H7V3.75Z" stroke="currentColor" strokeWidth="1.6" />
            <path d="M13 3.9v4.6h4.6" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9 12.5h6M9 15.5h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <p className="section-kicker">Cleaning your PDF</p>
      <h2 ref={headingRef} id="processing-heading" tabIndex={-1} className="processing-title">Making it brighter.</h2>
      <p className="processing-file-name" title={fileName}>{fileName}</p>

      <div className="processing-status" role="status" aria-live="polite" aria-atomic="true">
        <span className="processing-status-dot" aria-hidden="true" />
        <strong>{progressLabel(progress)}</strong>
      </div>
      <p className="processing-hint">{phaseHint(progress)}</p>

      <div className="processing-trust-row" role="group" aria-label="Processing safeguards">
        <span>Original protected</span>
        <span>Real progress</span>
        <span>Validated before download</span>
      </div>

      <button type="button" className="processing-cancel" onClick={onCancel}>
        Cancel cleanup
      </button>
    </section>
  );
}
