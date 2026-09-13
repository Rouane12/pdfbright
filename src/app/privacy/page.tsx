import type { Metadata } from "next";
import Link from "next/link";
import {
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
  PROCESSING_POLICY_LAST_UPDATED,
  SERVER_ASSISTED_PROCESSING_ENABLED,
} from "@/lib/security/processing-policy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How PDFBright handles documents and privacy in the current product.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <Link href="/security" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Security overview
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Privacy</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">How PDFBright handles your documents.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          PDFBright handles documents that may contain sensitive information, so this page explains what the current product actually does rather than making broad privacy claims.
        </p>
        <p className="mt-3 text-sm text-slate-500">Last updated: {PROCESSING_POLICY_LAST_UPDATED}</p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Current document processing</h2>
            <p className="mt-3 leading-7 text-slate-600">
              In the current version, supported PDF analysis, cleanup, OCR, preview generation and file optimization run in your browser. PDFBright does not intentionally upload the PDF you select to a document-processing server.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              Your browser still makes ordinary network requests to load the PDFBright application and may download OCR/runtime assets. Those requests are separate from sending your document contents for processing.
            </p>
            {!SERVER_ASSISTED_PROCESSING_ENABLED ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
                Server-assisted document processing is not enabled in the current product.
              </div>
            ) : null}
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">File lifecycle</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The selected PDF and generated output are held by the browser for the active workflow. PDFBright does not currently provide cloud document storage, document history or a document library.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              When you replace the file, clean another PDF, reload or close the page, PDFBright releases the application references it created. A file you explicitly download is then controlled by your browser, operating system and device storage settings.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              Because the current processing path does not store PDFs on a PDFBright processing server, there is no server-side PDF retention window to advertise today.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">What PDFBright currently collects</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The current anonymous cleanup flow does not require an account. PDFBright application code does not intentionally send document contents or filenames to an analytics service, and payment processing is not currently enabled.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              The site is hosted on infrastructure that may process ordinary web-request metadata needed to deliver the site, such as IP address, browser/user-agent information, requested URLs and timing/security logs. That is different from document processing.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              The result-screen feedback buttons are currently local interface state; they are not yet submitted to a feedback or analytics backend.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Current safety limits</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The current anonymous workflow accepts PDFs up to {MAX_FILE_SIZE_MB} MB and up to {MAX_PAGE_COUNT} pages. Local OCR also has a smaller scanned-page limit based on browser performance testing. These limits reduce memory and denial-of-service risk; later Free/Pro allowances may differ while hard safety controls remain in place.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Cookies and tracking</h2>
            <p className="mt-3 leading-7 text-slate-600">
              PDFBright application code does not currently use advertising or product-analytics cookies. Analytics, authentication and billing are not currently enabled. This policy must be updated before those systems are enabled if they introduce new data collection, cookies or third-party processing.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Future server-assisted processing</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Heavy server-assisted OCR is a future architecture path, not a feature that is silently active today. Before any future operation sends a document or derived page data to a processing server, PDFBright will disclose that in the interface before processing and publish the actual retention/deletion behavior.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Policy changes</h2>
            <p className="mt-3 leading-7 text-slate-600">
              This page describes the current implementation and will change as accounts, analytics, payments or server-assisted processing are introduced. Material changes should be reflected here before the corresponding feature is made available.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
          <Link className="text-indigo-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-indigo-700 hover:underline" href="/security">Read the security overview</Link>
        </div>
      </div>
    </main>
  );
}
