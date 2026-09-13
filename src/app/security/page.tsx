import type { Metadata } from "next";
import Link from "next/link";
import {
  CURRENT_PROCESSING_CLASS,
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
  MAX_PAGE_DIMENSION_POINTS,
  PROCESSING_POLICY_LAST_UPDATED,
  SERVER_ASSISTED_PROCESSING_ENABLED,
} from "@/lib/security/processing-policy";

export const metadata: Metadata = {
  title: "Security",
  description: "PDFBright's current security model, safeguards and limitations.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <Link href="/privacy" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Privacy
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Security overview</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Security designed around untrusted PDFs.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          PDF files are untrusted input. PDFBright is designed to fail closed when it cannot safely understand, transform or validate a document.
        </p>
        <p className="mt-3 text-sm text-slate-500">Last updated: {PROCESSING_POLICY_LAST_UPDATED}</p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Processing architecture</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The current processing class is <strong>{CURRENT_PROCESSING_CLASS}</strong>. Supported analysis, cleanup, OCR and optimization run in the browser; there is no active document-processing API or server worker receiving uploaded PDFs in the current product.
            </p>
            {!SERVER_ASSISTED_PROCESSING_ENABLED ? (
              <p className="mt-3 leading-7 text-slate-600">
                Because server-assisted document processing is not enabled, server file isolation, temporary object storage, deletion jobs and processing-rate limits are not active paths today. They become required before any future server-processing feature is enabled.
              </p>
            ) : null}
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Input safeguards</h2>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li>• PDF-only file selection plus a PDF header check before full analysis.</li>
              <li>• Current file-size limit: {MAX_FILE_SIZE_MB} MB.</li>
              <li>• Current page-count limit: {MAX_PAGE_COUNT} pages.</li>
              <li>• Unusually large page dimensions are rejected above {MAX_PAGE_DIMENSION_POINTS.toLocaleString()} PDF points.</li>
              <li>• Password-protected/encrypted PDFs are rejected in V1 rather than prompting for or storing a password.</li>
              <li>• Malformed, unreadable, memory-exhausting and validation-timeout cases are mapped to controlled user-facing errors instead of raw stack traces.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Browser and transformation safeguards</h2>
            <ul className="mt-4 space-y-3 text-slate-600">
              <li>• Low-resolution analysis is separated from heavier visual cleanup work.</li>
              <li>• Rendering and compression paths use bounded render dimensions instead of blindly rasterizing at arbitrary page size.</li>
              <li>• Local OCR is capped at 10 scanned target pages based on measured browser-performance testing.</li>
              <li>• Pages with annotations are skipped by destructive visual replacement instead of silently flattening interactive content.</li>
              <li>• Canvases and PDF worker/task resources are released when work completes or is cancelled where supported.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Output validation</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Before the download is presented as successful, PDFBright reopens the generated PDF and checks that it is a valid PDF, that the expected page count survived, that native text was not unexpectedly lost, that OCR text remains searchable on OCR pages, and that visual pages still contain drawing operations. A failed validation does not become a success screen.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Web-app hardening</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The deployed site uses HTTPS through its hosting platform. PDFBright also sends browser security headers that disable framing, prevent MIME sniffing, restrict referrer leakage and disable unused sensitive browser capabilities such as camera, microphone and geolocation access.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Dependency maintenance</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Production dependencies are checked in CI for high/critical npm advisories in addition to lint, TypeScript and production-build checks. Library upgrades still require PDF regression testing because a security update must not silently break document integrity.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Claims PDFBright does not make</h2>
            <p className="mt-3 leading-7 text-slate-600">
              PDFBright does not claim to be “military-grade,” “zero knowledge,” independently security-certified or impossible to compromise. A browser-local architecture reduces some document-handling risk, but browser engines, PDF parsers, dependencies and the user&apos;s own device still have security boundaries and failure modes.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Future server processing</h2>
            <p className="mt-3 leading-7 text-slate-600">
              If heavy OCR later moves to a server worker, PDFBright&apos;s architecture requires isolated processing, strict CPU/RAM/time limits, private temporary storage, short-lived signed access, automatic deletion, retryable deletion jobs, document-content-free logs and explicit disclosure before the document is sent.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-indigo-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-indigo-700 hover:underline" href="/privacy">Read the privacy policy</Link>
        </div>
      </div>
    </main>
  );
}
