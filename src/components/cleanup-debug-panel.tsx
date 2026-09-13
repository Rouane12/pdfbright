"use client";

import type { PdfCleanupResult } from "@/lib/pdf-cleanup/types";
import { PDF_COMPRESSION_PROFILES } from "@/lib/pdf-optimization/profiles";

interface CleanupDebugPanelProps {
  fileName: string;
  result: PdfCleanupResult;
  downloadUrl: string;
}

function pageList(pages: number[]) {
  return pages.length > 0 ? pages.join(", ") : "None";
}

function formatFileSize(bytes: number) {
  const absolute = Math.abs(bytes);
  if (absolute < 1024 * 1024) {
    return `${Math.max(1, Math.round(absolute / 1024))} KB`;
  }
  return `${(absolute / (1024 * 1024)).toFixed(1)} MB`;
}

function sizeChangeLabel(bytesSaved: number, percent: number) {
  if (bytesSaved > 0) {
    return `${formatFileSize(bytesSaved)} saved · ${percent.toFixed(1)}% smaller`;
  }
  if (bytesSaved < 0) {
    return `${formatFileSize(bytesSaved)} larger · ${Math.abs(percent).toFixed(1)}% increase`;
  }
  return "No size change";
}

export function CleanupDebugPanel({ fileName, result, downloadUrl }: CleanupDebugPanelProps) {
  const outputName = `${fileName.replace(/\.pdf$/i, "")}-clean.pdf`;
  const { report, validation } = result;
  const compressionLabel = report.compressionMode
    ? PDF_COMPRESSION_PROFILES[report.compressionMode].label
    : "None";

  return (
    <section className="cleanup-debug-panel" aria-labelledby="cleanup-debug-heading">
      <div className="cleanup-debug-header">
        <div>
          <p className="section-kicker">Milestone 6 validation</p>
          <h3 id="cleanup-debug-heading">Validated optimized cleanup output</h3>
        </div>
        <span className="cleanup-debug-time">{report.durationMs} ms</span>
      </div>

      <div className="cleanup-debug-grid">
        <div>
          <span>Pages</span>
          <strong>{report.originalPageCount} → {report.outputPageCount}</strong>
        </div>
        <div>
          <span>Original size</span>
          <strong>{formatFileSize(report.originalFileSizeBytes)}</strong>
        </div>
        <div>
          <span>Output size</span>
          <strong>{formatFileSize(report.outputFileSizeBytes)}</strong>
        </div>
        <div>
          <span>Validation</span>
          <strong>{validation.valid ? "Passed" : "Failed"}</strong>
        </div>
      </div>

      <dl className="cleanup-debug-details">
        <div><dt>Size change</dt><dd>{sizeChangeLabel(report.bytesSaved, report.sizeReductionPercent)}</dd></div>
        <div><dt>Optimization mode</dt><dd>{compressionLabel}</dd></div>
        <div><dt>Optimized scan pages</dt><dd>{pageList(report.optimizedPages)}</dd></div>
        <div><dt>Searchable text added</dt><dd>{pageList(report.searchableTextPages)}</dd></div>
        <div><dt>OCR language</dt><dd>{report.ocrLanguage ?? "None"}</dd></div>
        <div><dt>OCR text runs / characters</dt><dd>{report.ocrWordCount} / {report.ocrCharacterCount}</dd></div>
        <div><dt>OCR time</dt><dd>{report.ocrDurationMs} ms</dd></div>
        <div><dt>Native text pages checked</dt><dd>{validation.checkedTextPages}</dd></div>
        <div><dt>OCR pages checked</dt><dd>{validation.checkedOcrPages}</dd></div>
        <div><dt>Visual pages checked</dt><dd>{validation.checkedVisualPages}</dd></div>
        <div><dt>Rotated</dt><dd>{pageList(report.rotatedPages)}</dd></div>
        <div><dt>Straightened</dt><dd>{pageList(report.straightenedPages)}</dd></div>
        <div><dt>Readability enhanced</dt><dd>{pageList(report.readabilityEnhancedPages)}</dd></div>
        <div><dt>Blank pages removed</dt><dd>{pageList(report.removedBlankPages)}</dd></div>
        <div><dt>Page sizes normalized</dt><dd>{pageList(report.normalizedPages)}</dd></div>
        <div><dt>Visual cleanup skipped safely</dt><dd>{pageList(report.skippedVisualPages)}</dd></div>
      </dl>

      {report.warnings.length > 0 ? (
        <div className="cleanup-debug-warnings">
          {report.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : null}

      <a className="button button--primary cleanup-debug-download" href={downloadUrl} download={outputName}>
        Download test output
      </a>

      <p className="cleanup-debug-footnote">
        This validation/download surface is gated behind <code>?debug=cleanup</code>. The polished result experience belongs to Milestone 7.
      </p>
    </section>
  );
}
