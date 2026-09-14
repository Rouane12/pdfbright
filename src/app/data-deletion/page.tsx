import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion | PDFBright",
  description: "How to request deletion of your PDFBright account data.",
};

const sectionClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8";

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="text-base font-bold tracking-[-0.03em]">PDFBright</Link>
          <Link href="/privacy" className="text-sm font-semibold text-slate-600 hover:text-slate-950">Privacy</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Account data deletion</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">Delete your PDFBright account data.</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
          PDFBright does not currently keep a cloud library of your PDFs. If you created an account and want the account information associated with PDFBright deleted, use the instructions below.
        </p>

        <div className="mt-10 space-y-5">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">How to request deletion</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-slate-600">
              <li>Email <a className="font-semibold text-blue-700 hover:underline" href="mailto:support@pdfbright.app?subject=Delete%20my%20PDFBright%20account">support@pdfbright.app</a> from the email address connected to your PDFBright account.</li>
              <li>Use the subject line <strong>Delete my PDFBright account</strong>.</li>
              <li>We may ask you to confirm control of the account before deletion is completed.</li>
              <li>We will confirm when the PDFBright account data covered by the request has been deleted.</li>
            </ol>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">What the request covers</h2>
            <p className="mt-3 leading-7 text-slate-600">The request covers PDFBright authentication/account records, the PDFBright profile record associated with that account, plan/entitlement state, and other account-level identifiers that PDFBright no longer needs to retain.</p>
            <p className="mt-3 leading-7 text-slate-600">Deleting a PDFBright account does not delete your Google, Facebook, or other identity-provider account. You can separately revoke PDFBright&apos;s access from that provider&apos;s account settings.</p>
          </section>

          <section className={sectionClass}>
            <h2 className="text-xl font-semibold tracking-tight">Documents and billing records</h2>
            <p className="mt-3 leading-7 text-slate-600">The current local-first cleanup workflow does not create a PDFBright cloud document library. Files you downloaded remain on your own device until you delete them there.</p>
            <p className="mt-3 leading-7 text-slate-600">If a paid transaction has occurred, a payment provider or merchant of record may retain transaction records when required for fraud prevention, accounting, tax, dispute handling, or legal compliance. Those records are governed by that provider&apos;s retention obligations.</p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
          <Link className="text-blue-700 hover:underline" href="/">Back to PDFBright</Link>
          <Link className="text-blue-700 hover:underline" href="/privacy">Privacy Policy</Link>
          <Link className="text-blue-700 hover:underline" href="/terms">Terms of Use</Link>
        </div>
      </div>
    </main>
  );
}
