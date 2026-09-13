import type { PdfAnalysisResult } from "@/lib/pdf-analysis/types";

interface AnalysisDebugPanelProps {
  result: PdfAnalysisResult;
}

export function AnalysisDebugPanel({ result }: AnalysisDebugPanelProps) {
  return (
    <section className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">
            Milestone 2 diagnostics
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
            Structured analysis output
          </h2>
        </div>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          {result.durationMs} ms
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">Pages</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">{result.pageCount}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">Textless</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">
            {result.summary.pagesWithoutExtractableText}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">Probable scans</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">
            {result.summary.probableScanPages.length}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="text-slate-500">Blank candidates</dt>
          <dd className="mt-1 text-lg font-semibold text-slate-950">
            {result.summary.blankPageCandidates.length}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
        <span className="rounded-full border border-slate-200 px-3 py-1.5">
          Rotated metadata: {result.summary.pagesWithRotationMetadata.length}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1.5">
          Likely skew: {result.summary.likelySkewedPages.length}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1.5">
          Mixed sizes: {result.summary.hasInconsistentPageSizes ? "yes" : "no"}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1.5">
          Mixed orientation: {result.summary.hasMixedPageOrientations ? "yes" : "no"}
        </span>
      </div>

      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-950 text-slate-100">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
          View structured JSON
        </summary>
        <pre className="max-h-[32rem] overflow-auto border-t border-slate-800 p-4 text-xs leading-5">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        This panel is intentionally gated behind <code>?debug=analysis</code> and is not the
        Milestone 3 diagnosis experience.
      </p>
    </section>
  );
}
