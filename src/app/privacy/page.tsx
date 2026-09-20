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
  description: "How PDFBright handles documents, accounts, and privacy.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <Link href="/security" className="text-sm font-semibold text-slate-600 hover:text-slate-950">Security overview</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Privacy</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Your document is not our product.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          PDFBright handles documents that may contain sensitive information. This page describes what the current product actually does, including local document processing, optional account authentication, billing, and limited product analytics.
        </p>
        <p className="mt-3 text-sm text-slate-500">Processing policy last updated: {PROCESSING_POLICY_LAST_UPDATED}</p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Current document processing</h2>
            <p className="mt-3 leading-7 text-slate-600">Supported PDF analysis, cleanup, OCR, preview generation, and file optimization currently run in your browser. PDFBright does not intentionally upload the PDF you select to a document-processing server.</p>
            <p className="mt-3 leading-7 text-slate-600">Your browser still makes ordinary network requests to load PDFBright and may download OCR/runtime assets. Those requests are separate from sending your document contents for processing.</p>
            {!SERVER_ASSISTED_PROCESSING_ENABLED ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">Server-assisted document processing is not enabled in the current product.</div> : null}
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">File lifecycle</h2>
            <p className="mt-3 leading-7 text-slate-600">The selected PDF and generated output are held by the browser for the active workflow. PDFBright does not currently provide cloud document storage, document history, or a document library.</p>
            <p className="mt-3 leading-7 text-slate-600">When you replace the file, clean another PDF, reload, or close the page, PDFBright releases the application references it created. Files you explicitly download are then controlled by your browser, operating system, and device storage settings.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Accounts and sign-in</h2>
            <p className="mt-3 leading-7 text-slate-600">The initial cleanup workflow can be used without an account. If you choose to sign in, PDFBright uses Supabase for authentication and account storage. Account data can include an internal user identifier, email address, authentication provider information, and a PDFBright profile record containing plan or entitlement state.</p>
            <p className="mt-3 leading-7 text-slate-600">Google and Facebook sign-in are optional identity-provider paths. When you use one, that provider and Supabase process the information required to authenticate you, such as your basic profile and email address. PDFBright does not request access to Gmail, Google Drive, Facebook posts, friends, advertising data, or other unrelated account content for sign-in.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">What PDFBright currently collects</h2>
            <p className="mt-3 leading-7 text-slate-600">For signed-in users, PDFBright stores the account data needed for access, plan status, billing/entitlement linkage, and future usage allowances. PDFBright application code does not intentionally send document contents, filenames, OCR text, extracted text, or page images to analytics.</p>
            <p className="mt-3 leading-7 text-slate-600">PDFBright uses PostHog for limited product analytics and error/performance monitoring. The events are designed around product actions such as landing, upload start, analysis, cleanup, download, checkout, and subscription state. Custom PDFBright properties are limited to non-content metadata such as entry path, coarse file-size bucket, processing mode, and plan/billing state where relevant.</p>
            <p className="mt-3 leading-7 text-slate-600">Like ordinary web infrastructure, the analytics service can also receive standard browser and network metadata associated with those requests, including requested/current URL, referrer, browser and operating-system information, device or viewport characteristics, IP-derived approximate location, and timing/performance information. Signed-in analytics can be associated with PDFBright&apos;s internal user identifier so product events can be attributed to the same account.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Analytics safeguards</h2>
            <p className="mt-3 leading-7 text-slate-600">PDFBright disables PostHog autocapture, automatic pageview/pageleave capture, and session recording. PDFBright sends deliberate product events instead of recording page contents or user sessions. Exception reporting is sanitized before application-defined error details are sent.</p>
            <p className="mt-3 leading-7 text-slate-600">Analytics is not used to upload, inspect, or reconstruct the PDF being processed. The document-processing workflow remains local even when a product analytics event is sent.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Payments and subscriptions</h2>
            <p className="mt-3 leading-7 text-slate-600">PDFBright uses Paddle as the billing and merchant-of-record provider for paid plans. Paddle handles checkout, payment details, applicable billing information, taxes, receipts, and subscription payment processing. PDFBright does not store full card details.</p>
            <p className="mt-3 leading-7 text-slate-600">To provide and manage Pro access, PDFBright receives and stores the billing linkage needed for the account, such as Paddle customer, transaction, and subscription identifiers, subscription status, selected plan, and billing-period information. This billing metadata is separate from the contents of PDFs you process.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Current safety limits</h2>
            <p className="mt-3 leading-7 text-slate-600">The current anonymous workflow accepts PDFs up to {MAX_FILE_SIZE_MB} MB and up to {MAX_PAGE_COUNT} pages. Local OCR also has a smaller scanned-page limit based on browser performance testing. These limits reduce memory and denial-of-service risk; later Free/Pro allowances may differ while hard safety controls remain in place.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Cookies and local storage</h2>
            <p className="mt-3 leading-7 text-slate-600">Authentication may use browser storage or cookies needed to maintain a secure signed-in session. PDFBright does not currently use advertising cookies. PostHog analytics uses browser local storage to maintain its analytics identifier/state under the current configuration; session recording and broad interaction autocapture are disabled.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Account deletion</h2>
            <p className="mt-3 leading-7 text-slate-600">You can request deletion of your PDFBright account data by following the instructions on our <Link className="font-semibold text-blue-700 hover:underline" href="/data-deletion">Data Deletion</Link> page. Deleting a PDFBright account does not delete your Google, Facebook, or other identity-provider account.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Future server-assisted processing</h2>
            <p className="mt-3 leading-7 text-slate-600">Heavy server-assisted OCR is a future architecture path, not a feature that is silently active today. Before any future operation sends a document or derived page data to a processing server, PDFBright will disclose that in the interface before processing and publish the actual retention/deletion behavior.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Contact and policy changes</h2>
            <p className="mt-3 leading-7 text-slate-600">Questions about privacy can be sent to <a className="font-semibold text-blue-700 hover:underline" href="mailto:support@pdfbright.app">support@pdfbright.app</a>. This policy will change as PDFBright changes accounts, billing, analytics, or processing architecture, and material changes should be reflected here before the corresponding behavior is made available.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link className="text-blue-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-blue-700 hover:underline" href="/security">Security overview</Link>
          <Link className="text-blue-700 hover:underline" href="/terms">Terms of Use</Link>
          <Link className="text-blue-700 hover:underline" href="/data-deletion">Data deletion</Link>
        </div>
      </div>
    </main>
  );
}