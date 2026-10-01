import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolHero } from "@/components/free-tool-hero";
import { UploadReadinessChecker } from "@/components/upload-readiness-checker";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "How can I check whether a PDF is ready to upload?",
    answer:
      "Enter the destination requirements, then run the PDF through the checker. PDFBright compares the document against the limits you set for file size, page count, page format, searchability, and page consistency and reports Pass, Review, or Fail for each check.",
  },
  {
    question: "Why can a PDF be rejected even when it opens normally?",
    answer:
      "A PDF can open correctly and still miss the destination requirements. Common structural reasons include exceeding a file-size or page-count limit, using an unexpected page format, containing pages without searchable text, or mixing page dimensions when consistent pages are required.",
  },
  {
    question: "Does this checker know every website's upload rules?",
    answer:
      "No. You provide the rules that matter for the destination. The checker evaluates the PDF against those requirements instead of pretending that every portal uses the same limits.",
  },
  {
    question: "Does a Pass guarantee that a website will accept my PDF?",
    answer:
      "No. A Pass means the PDF satisfies the requirements you configured and the checks PDFBright can inspect locally. A website may still enforce additional account, naming, form, content, or server-side rules that this tool cannot see.",
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
      name: "PDF Upload Readiness Checker",
      item: "https://pdfbright.app/tools/upload-readiness",
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
  title: "Will My PDF Upload? Free PDF Readiness Checker",
  description:
    "Check whether a PDF meets upload requirements for file size, page count, page format, searchability, and page consistency before you submit it.",
  alternates: {
    canonical: "/tools/upload-readiness",
  },
};

export default function UploadReadinessPage() {
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
        icon="readiness"
        eyebrow="Free PDF upload readiness checker"
        title="Will this PDF upload successfully?"
        description="Enter the destination requirements, drop in your PDF, and PDFBright will tell you exactly what passes, what is close to the limit, and what may cause rejection."
        privacy={[
          "No signup",
          "No document-content analytics",
          "Current inspection runs in your browser",
        ]}
      />

      <UploadReadinessChecker />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Why uploads fail
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              A valid PDF can still be the wrong PDF for a specific upload destination.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                Upload portals often care about constraints that have nothing to do with whether the file opens: maximum size, maximum pages, expected paper format, searchable text, or consistent page dimensions.
              </p>
              <p>
                PDFBright lets you enter those requirements first and then checks the document against them, so you can fix obvious submission problems before discovering them at the final upload step.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              What this checker verifies
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              The requirements you set, checked against the actual PDF.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Whether the file stays within the maximum size you specify.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Whether the PDF stays within the allowed page count.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Whether pages match the A4, US Letter, or unrestricted format you choose.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Whether searchable text or consistent page dimensions are required and present.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="upload-readiness-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="upload-readiness-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found a requirement your PDF does not meet?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Use the main PDFBright cleanup workflow when the document needs fixing, or inspect page consistency when mixed page dimensions or orientations are the problem.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/#upload">
              Fix this PDF before uploading
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/tools/page-consistency">
              Check page consistency
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="upload-readiness-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="upload-readiness-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              PDF upload readiness questions
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
