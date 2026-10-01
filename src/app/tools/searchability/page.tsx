import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolHero } from "@/components/free-tool-hero";
import { SearchabilityChecker } from "@/components/searchability-checker";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "How can I tell if a PDF is searchable?",
    answer:
      "A searchable PDF has a usable text layer behind the visible page. PDFBright checks every non-blank page for reliable extractable text and shows exactly which pages are searchable, which are likely scans, and which need review.",
  },
  {
    question: "Why does Ctrl+F not work in some PDFs?",
    answer:
      "Many scanned PDFs contain page images rather than stored text. The words are visible to you, but there may be no text layer for a PDF viewer to search. Those pages usually need OCR before Ctrl+F can work reliably.",
  },
  {
    question: "Does every scanned PDF need OCR?",
    answer:
      "Not necessarily. Some scanned-looking PDFs already include an OCR text layer. This test checks the actual page structure instead of assuming that every scan needs OCR.",
  },
  {
    question: "Does a searchable PDF guarantee accurate OCR?",
    answer:
      "No. A detected text layer means the page is structurally searchable, but it does not guarantee that every recognized word is correct. OCR accuracy still depends on scan quality, language, contrast, skew, and the OCR engine used.",
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
      name: "PDF Searchability Test",
      item: "https://pdfbright.app/tools/searchability",
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
  title: "Is My PDF Searchable? Free PDF Searchability Test",
  description:
    "Check whether a PDF is searchable page by page. Find missing text layers, likely scanned pages, and pages that may need OCR — free in your browser.",
  alternates: {
    canonical: "/tools/searchability",
  },
};

export default function SearchabilityPage() {
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
        icon="search"
        eyebrow="Free PDF searchability test"
        title="Don't ask whether the PDF is searchable. Find the exact pages that aren't."
        description="Test every page for reliable extractable text, see your true search coverage, and identify which pages are likely scans that need OCR."
        privacy={[
          "No signup",
          "No extracted text is displayed or logged",
          "Analysis runs in your browser",
        ]}
      />

      <SearchabilityChecker />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Why search fails
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              A PDF can look like text without actually containing searchable text.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                A PDF created from a word processor usually stores real characters. A scanned PDF can instead contain only page images, so the words are visible but there is nothing reliable for Ctrl+F to search.
              </p>
              <p>
                OCR can add a text layer to image-based pages. PDFBright checks the document first so you can see which pages already have usable text and which pages are likely OCR candidates.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              What this test tells you
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Searchability page by page, not a vague yes or no.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Which non-blank pages contain reliable extractable text.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Which pages look image-based and are likely to need OCR.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Which pages are uncertain and should be reviewed instead of guessed.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Your search coverage across the document, excluding likely blank pages.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="searchability-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="searchability-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found pages without a text layer?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Use PDFBright&apos;s OCR workflow when the problem is missing searchable text, or check scan quality first when skew, softness, contrast, or dark pages may reduce OCR quality.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/make-pdf-searchable">
              Make this PDF searchable
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/tools/scan-quality">
              Check scan quality
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="searchability-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="searchability-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              PDF searchability questions
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
