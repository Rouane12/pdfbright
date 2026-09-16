import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | PDFBright",
  description: "Terms that apply when you use PDFBright.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link href="/privacy" className="hover:text-slate-950">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-slate-950">Refunds</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Terms of Use</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Simple terms for using PDFBright.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          These terms govern access to PDFBright, including the free browser-based cleanup workflow and any paid plan we make available.
        </p>
        <p className="mt-3 text-sm text-slate-500">Last updated: 16 September 2026</p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Using PDFBright</h2>
            <p className="mt-3 leading-7 text-slate-600">You may use PDFBright only for lawful purposes and only with files you are authorized to process. Do not use the service to violate another person&apos;s rights, distribute unlawful material, interfere with the service, or attempt to bypass technical or safety limits.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Your documents</h2>
            <p className="mt-3 leading-7 text-slate-600">You keep ownership of your documents. The current supported cleanup workflow is local-first and runs in your browser as described in our Privacy Policy. PDFBright does not claim ownership of document contents you process.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Paid plans</h2>
            <p className="mt-3 leading-7 text-slate-600">If you purchase PDFBright Pro, pricing and billing frequency are shown before checkout. Paddle acts as the merchant of record for PDFBright paid-plan checkout and subscription payment processing. Renewal, cancellation, refunds, taxes, receipts, and payment-method handling are subject to the checkout terms shown at purchase, our <Link className="font-semibold text-indigo-700 hover:underline" href="/refund-policy">Refund Policy</Link>, Paddle&apos;s buyer terms, and applicable law.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Availability and changes</h2>
            <p className="mt-3 leading-7 text-slate-600">PDFBright is evolving. Features, limits, supported file types, processing methods, and pricing may change. We may suspend or discontinue functionality when needed for security, reliability, legal compliance, or product changes.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">No guarantee of perfect output</h2>
            <p className="mt-3 leading-7 text-slate-600">PDF processing, OCR, blank-page detection, deskewing, compression, and other automated operations can make mistakes. Review important output before relying on it, especially for legal, financial, medical, academic, archival, or other high-stakes documents.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-3 leading-7 text-slate-600">Questions about these terms can be sent to <a className="font-semibold text-indigo-700 hover:underline" href="mailto:support@pdfbright.app">support@pdfbright.app</a>.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link className="text-indigo-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-indigo-700 hover:underline" href="/privacy">Privacy Policy</Link>
          <Link className="text-indigo-700 hover:underline" href="/refund-policy">Refund Policy</Link>
        </div>
      </div>
    </main>
  );
}
