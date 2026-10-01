import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolHero } from "@/components/free-tool-hero";
import { PageConsistencyMap } from "@/components/page-consistency-map";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "How can I check whether all pages in a PDF are the same size?",
    answer:
      "PDFBright compares every page against the dominant page-size pattern in the document and highlights pages that differ. The paper-size comparison is orientation-independent, so a rotated A4 page is not treated as a different paper size simply because width and height are swapped.",
  },
  {
    question: "Why do mixed page sizes matter in a PDF?",
    answer:
      "Mixed page sizes can be intentional, but they can also come from scanning, combining files, or export mistakes. Unexpected outliers may cause awkward printing, inconsistent viewing, or rejection by systems that expect uniform pages.",
  },
  {
    question: "Does a landscape page automatically count as inconsistent?",
    answer:
      "No. Orientation is reported as its own structural property. Page-size comparison treats the same underlying paper size consistently even when width and height are swapped, while the map can still show that the page orientation differs from the dominant pattern.",
  },
  {
    question: "Does an outlier mean the page is wrong?",
    answer:
      "Not necessarily. The map identifies pages that differ from the dominant document pattern. Some differences are intentional, so PDFBright presents them for review rather than automatically calling every outlier an error.",
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
      name: "PDF Page Consistency Map",
      item: "https://pdfbright.app/tools/page-consistency",
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
  title: "Check PDF Page Size & Orientation Consistency | Free Tool",
  description:
    "Check a PDF page by page for size, orientation, rotation, searchability, blankness, and content-pattern outliers. Find unusual pages free in your browser.",
  alternates: {
    canonical: "/tools/page-consistency",
  },
};

export default function PageConsistencyPage() {
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
        icon="consistency"
        eyebrow="Free PDF structure map"
        title="Find the one weird page hiding in an otherwise consistent PDF."
        description="Compare page size, orientation, content pattern, searchability, rotation, and blankness across the entire document in one visual matrix."
        privacy={[
          "No signup",
          "No extracted text is displayed or logged",
          "Analysis runs in your browser",
        ]}
      />

      <PageConsistencyMap />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Why consistency matters
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              One unusual page can be easy to miss in a long PDF.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                PDFs assembled from scans, exports, and merged files can contain a page with a different size, orientation, rotation, searchability state, or content pattern even when the rest of the document looks uniform.
              </p>
              <p>
                PDFBright compares each page with the dominant document pattern so unusual pages stand out. A difference is a review signal, not an automatic claim that the page is wrong.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              What this map compares
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Structural outliers across the whole document.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Page size compared with the dominant paper-size pattern.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Portrait or landscape orientation differences.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Rotation, blankness, and searchability differences.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Content-pattern differences that make a page structurally unusual.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="page-consistency-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="page-consistency-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found a page that does not match the rest?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Check the destination requirements if this PDF is being submitted to a portal, or run the main PDFBright cleanup workflow when the document needs broader diagnosis before you send it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/tools/upload-readiness">
              Check upload readiness
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/#upload">
              Diagnose and clean this PDF
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="page-consistency-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="page-consistency-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              PDF page consistency questions
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
