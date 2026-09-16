import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy | PDFBright",
  description: "Refund and subscription cancellation information for PDFBright Pro purchases processed by Paddle.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
            <Link href="/terms" className="hover:text-slate-950">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-950">Privacy</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Refund Policy</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Refunds and cancellations for PDFBright Pro.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          PDFBright Pro purchases are processed by Paddle, our merchant of record. Paddle handles subscription payments, receipts, taxes, cancellations, and approved refunds for purchases made through Paddle checkout.
        </p>
        <p className="mt-3 text-sm text-slate-500">Last updated: 16 September 2026</p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Requesting a refund</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Refund eligibility is determined under Paddle&apos;s buyer refund policy and applicable consumer-protection law. To request a refund, use the support link in your Paddle receipt or billing portal, or visit Paddle&apos;s buyer support site.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              You can also contact <a className="font-semibold text-indigo-700 hover:underline" href="mailto:support@pdfbright.app">support@pdfbright.app</a> if you need help identifying a PDFBright transaction or troubleshooting a product issue before requesting a refund.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Subscription cancellations</h2>
            <p className="mt-3 leading-7 text-slate-600">
              PDFBright Pro subscriptions can be cancelled through the Paddle customer portal. Unless Paddle or applicable law provides otherwise, cancellation takes effect at the end of the current paid billing period, and Pro access remains available until that period ends.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Technical problems</h2>
            <p className="mt-3 leading-7 text-slate-600">
              If a material technical problem prevents you from using PDFBright Pro as described, contact us first at <a className="font-semibold text-indigo-700 hover:underline" href="mailto:support@pdfbright.app">support@pdfbright.app</a>. We will try to resolve the issue promptly and, where appropriate, help you provide the information Paddle needs to review a refund request.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Mandatory consumer rights</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Nothing in this policy limits any non-waivable refund, withdrawal, or consumer rights that apply to you under applicable law. Where Paddle&apos;s buyer terms or refund policy provide greater rights, those rights apply.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Paddle refund terms</h2>
            <p className="mt-3 leading-7 text-slate-600">
              The current Paddle Refund Policy is available directly from Paddle. Paddle&apos;s buyer terms and refund policy govern payment-side refund processing for PDFBright Pro purchases made through Paddle.
            </p>
            <a
              className="mt-4 inline-flex font-semibold text-indigo-700 hover:underline"
              href="https://www.paddle.com/legal/refund-policy"
              target="_blank"
              rel="noreferrer"
            >
              View Paddle&apos;s Refund Policy
            </a>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Questions about PDFBright Pro, billing access, or a transaction can be sent to <a className="font-semibold text-indigo-700 hover:underline" href="mailto:support@pdfbright.app">support@pdfbright.app</a>.
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link className="text-indigo-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-indigo-700 hover:underline" href="/terms">Terms of Use</Link>
          <Link className="text-indigo-700 hover:underline" href="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}
