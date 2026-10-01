import type { Metadata } from "next";
import Link from "next/link";
import { BeforeSendChecker } from "@/components/before-send-checker";
import { FreeToolHero } from "@/components/free-tool-hero";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "What should I check in a PDF before sending it?",
    answer:
      "Visible pages are only part of a PDF. It can also contain document metadata, comments, forms, links, embedded files, automatic actions, signatures, security restrictions, and other structural features that may matter before sharing.",
  },
  {
    question: "Can a PDF contain metadata that I do not see on the page?",
    answer:
      "Yes. Common PDF metadata can include fields such as author, title, subject, and keywords. PDFBright reports whether common metadata is present so you can review it before sharing the file.",
  },
  {
    question: "Does this checker read or display my document text?",
    answer:
      "No. The Before You Send Checker is designed to inspect structural and privacy-related signals without displaying or logging extracted document text. Current inspection runs in your browser.",
  },
  {
    question: "Does a clear result guarantee that a PDF is safe to share?",
    answer:
      "No. This checker reports the structural signals it can detect, but it cannot guarantee that visible page content is appropriate to share. You should still review the actual document before sending it.",
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
      name: "Before You Send PDF Checker",
      item: "https://pdfbright.app/tools/before-you-send",
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
  title: "Check a PDF Before Sending | Metadata & Privacy Checker",
  description:
    "Check a PDF for metadata, comments, forms, links, attachments, scripts, signatures, and security signals before you share it. Free browser-based inspection.",
  alternates: {
    canonical: "/tools/before-you-send",
  },
};

export default function BeforeYouSendPage() {
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
        icon="send"
        eyebrow="Free PDF privacy & structure check"
        title="Know what you are sending besides the visible pages."
        description="Inspect the PDF for metadata, review annotations, forms, links, embedded files, automatic actions, signatures, and security signals before it leaves your hands."
        privacy={[
          "No signup",
          "No extracted text shown or logged",
          "Inspection runs in your browser",
        ]}
      />

      <BeforeSendChecker />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Why check before sharing</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              A PDF can carry more than the pages you can see.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                PDFs can include metadata, annotations, form fields, external links, embedded files, automatic actions, digital signatures, and security restrictions that are not obvious from a quick visual review.
              </p>
              <p>
                PDFBright checks for the presence of these structural signals so you can decide what deserves attention before you send, upload, archive, or publish the document.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">What this checker looks for</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Structural signals that are easy to miss in a normal PDF viewer.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Common document metadata such as author, title, subject, and keywords.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Comments, annotations, interactive forms, and external links.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Embedded attachments, scripts or automatic actions, signatures, and security restrictions.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Portfolio or collection structures and XFA-related document features when present.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="before-send-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="before-send-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found something that deserves review?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Use the main PDFBright cleanup workflow when the document needs broader cleanup, or compare an original and modified copy with Change Receipt before you send the final version.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/#upload">
              Clean this PDF before sharing
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/tools/change-receipt">
              Compare the final PDF
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="before-send-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="before-send-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Questions to ask before sharing a PDF
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
