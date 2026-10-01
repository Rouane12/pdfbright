import type { Metadata } from "next";
import Link from "next/link";
import { ChangeReceiptChecker } from "@/components/change-receipt-checker";
import { FreeToolHero } from "@/components/free-tool-hero";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "How can I compare two PDFs to see what changed?",
    answer:
      "PDFBright compares the original and modified PDF structurally. It checks file size, page count, page dimensions, rotation, searchability, page profile, blankness, and common metadata so you can review what changed after editing, cleanup, export, or optimization.",
  },
  {
    question: "Does Change Receipt compare the actual text in two PDFs?",
    answer:
      "No. Change Receipt is not a semantic text diff and it does not display or compare extracted document text. It focuses on structural properties that can reveal meaningful document-level changes without reading the page content.",
  },
  {
    question: "Can it prove that two PDFs look pixel-for-pixel identical?",
    answer:
      "No. A structural match does not prove visual or pixel-level identity. Rendering, fonts, compression, image quality, or other visual details can differ even when the structural receipt looks similar.",
  },
  {
    question: "Can it detect reordered pages?",
    answer:
      "Change Receipt compares pages positionally and does not infer page reordering. If page 3 in the modified file differs from page 3 in the original, the receipt can show the structural difference, but it does not claim that the page was moved from another position.",
  },
] as const;

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "PDFBright",
      item: "https://pdfbright.app/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Free Tools",
      item: "https://pdfbright.app/tools",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "PDF Change Receipt",
      item: "https://pdfbright.app/tools/change-receipt",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const metadata: Metadata = {
  title: "Compare Two PDFs for Structural Changes | PDF Change Receipt",
  description:
    "Compare an original and modified PDF for structural changes in file size, page count, dimensions, rotation, searchability, page profile, blankness, and metadata.",
  alternates: {
    canonical: "/tools/change-receipt",
  },
};

export default function ChangeReceiptPage() {
  return (
    <main className="tools-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <FreeToolHero
        icon="changes"
        eyebrow="Free PDF comparison receipt"
        title="Know what structurally changed between two PDFs."
        description="Compare an original and modified version for file size, page count, page dimensions, rotation, text-layer status, page profile, blankness, and common document metadata."
        privacy={[
          "No signup",
          "No extracted text is displayed or logged",
          "Both files stay in your browser",
        ]}
      />

      <ChangeReceiptChecker />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Verify the result
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              A smaller or cleaner PDF is useful only if the document still has the structure you expected.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                Editing, exporting, OCR, compression, and cleanup can change more than file size. Page count, dimensions, rotation, searchability, blank-page status, page profile, or metadata can also change along the way.
              </p>
              <p>
                Change Receipt gives you a before-and-after structural summary so you can review those changes instead of assuming that the modified PDF preserved everything important.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              What the receipt compares
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Structural differences, page by page and document by document.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Overall file size and page count.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Page dimensions and rotation at the same page positions.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Searchability, blankness, and page-profile changes.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Common document metadata differences.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50/60 p-6 sm:p-8" aria-labelledby="change-receipt-limits-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-amber-700">What this does not prove</p>
          <h2 id="change-receipt-limits-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            A structural match is not the same as semantic or pixel-perfect equality.
          </h2>
          <p className="mt-4 max-w-4xl text-[0.96rem] leading-7 text-slate-700">
            Change Receipt does not compare extracted text, prove that every rendered pixel is identical, or infer that pages were reordered. Pages are compared positionally, and the receipt should be used as a structural review aid rather than a universal PDF diff.
          </p>
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="change-receipt-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="change-receipt-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found an unexpected structural change?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Inspect the modified PDF before sharing it, or run the main PDFBright cleanup workflow when the document still has structural or scan-quality problems that need attention.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/tools/before-you-send">
              Check before you send
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/#upload">
              Diagnose and clean this PDF
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="change-receipt-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="change-receipt-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              PDF comparison questions
            </h2>
          </div>
          <div className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_45px_rgba(25,73,120,0.06)]">
            {faqs.map((faq) => (
              <article key={faq.question} className="p-6 sm:p-7">
                <h3 className="text-lg font-semibold tracking-[-0.015em] text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-[0.96rem] leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
