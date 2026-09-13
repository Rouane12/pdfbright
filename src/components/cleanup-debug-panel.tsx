"use client";

import type { PdfCleanupResult } from "@/lib/pdf-cleanup/types";

interface CleanupDebugPanelProps {
  fileName: string;
  result: PdfCleanupResult;
  downloadUrl: string;
}

function pageList(pages: number[]) {
  return pages.length > 0 ? pages.join(", ") : "None";
}

export function CleanupDebugPanel({ fileName, result, downloadUrl }: CleanupDebugPanelProps) {
  const outputName = `${fileName.replace(/\.pdf$/i, "")}-clean.pdf`;
  const { report, validation } = result;

  return (
    <section className="cleanup-debug-panel" aria-labelledby="cleanup-debug-heading">
      <div className="cleanup-debug-header">
        <div>
          <p className="section-kicker">Milestone 5 validation</p>
          <h3 id="cleanup-debug-heading">Validated searchable cleanup output</h3>
        </div>
        <span className="cleanup-debug-time">{report.durationMs} ms</span>
      </div>

      <div className="cleanup-debug-grid">
        <div>
          <span>Pages</span>
          <strong>{report.originalPageCount} → {report.outputPageCount}</strong>
        </div>
        <div>
          <span>Native text pages checked</span>
          <strong>{validation.checkedTextPages}</strong>
        </div>
        <div>
          <span>OCR pages checked</span>
          <strong>{validation.checkedOcrPages}</strong>
        </div>
        <div>
          <span>Validation</span>
          <strong>{validation.valid ? "Passed" : "Failed"}</strong>
        </div>
      </div>

      <dl className="cleanup-debug-details">
        <div><dt>Searchable text added</dt><dd>{pageList(report.searchableTextPages)}</dd></div>
        <div><dt>OCR language</dt><dd>{report.ocrLanguage ?? "None"}</dd></div>
        <div><dt>OCR text runs / characters</dt><dd>{report.ocrWordCount} / {report.ocrCharacterCount}</dd></div>
        <div><dt>OCR time</dt><dd>{report.ocrDurationMs} ms</dd></div>
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
