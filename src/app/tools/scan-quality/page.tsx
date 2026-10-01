import type { Metadata } from "next";
import Link from "next/link";
import { FreeToolHero } from "@/components/free-tool-hero";
import { ScanQualityMap } from "@/components/scan-quality-map";
import "../tools.css";
import "../tool-page-polish.css";

const faqs = [
  {
    question: "How can I check the quality of a scanned PDF?",
    answer:
      "PDFBright checks the document page by page and highlights likely scan-quality problems such as skew, rotation, blank pages, missing searchable text, low contrast, softness, and unusually dark pages. This makes isolated weak pages easier to find in long PDFs.",
  },
  {
    question: "Why do some scanned PDF pages look blurry or soft?",
    answer:
      "Soft-looking pages can come from low-resolution scans, motion, focus problems, aggressive compression, or poor source quality. PDFBright uses conservative visual heuristics to flag pages that may deserve review rather than claiming a print-quality measurement.",
  },
  {
    question: "Can poor scan quality affect OCR and PDF searchability?",
    answer:
      "Yes. Skew, weak contrast, softness, dark backgrounds, and noisy scans can make text recognition harder. A quality warning does not prove OCR will fail, but it can help explain why searchable text is missing or unreliable on particular pages.",
  },
  {
    question: "Does the Scan Quality Map change my PDF?",
    answer:
      "No. The Scan Quality Map is a diagnostic tool. It analyzes supported signals and shows which pages may need attention. You can then choose an appropriate PDFBright cleanup workflow if you want to modify the document.",
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
      name: "PDF Scan Quality Map",
      item: "https://pdfbright.app/tools/scan-quality",
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
  title: "PDF Scan Quality Checker – Find Blurry, Crooked & Weak Pages",
  description:
    "Check scanned PDF quality page by page. Find likely blurry, crooked, blank, low-contrast, dark, rotated, and unsearchable pages free in your browser.",
  alternates: {
    canonical: "/tools/scan-quality",
  },
};

export default function ScanQualityPage() {
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
        icon="scan"
        eyebrow="Free PDF diagnostic"
        title="See the weak pages before they become a problem."
        description="PDFBright turns a PDF into a page-by-page quality map so crooked, blank, unsearchable, soft, low-contrast, or unusually dark scan pages stand out immediately."
        privacy={[
          "No signup",
          "No document-content analytics",
          "Current inspection runs in your browser",
        ]}
      />

      <ScanQualityMap />

      <section className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              Why scan quality matters
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              A long scanned PDF can be mostly fine and still contain a few weak pages.
            </h2>
            <div className="mt-5 space-y-4 text-[0.96rem] leading-7 text-slate-600">
              <p>
                Scanner problems are often page-specific. One page may be rotated, another may be unusually dark, and a third may have weak contrast or no reliable searchable text layer.
              </p>
              <p>
                A page-by-page map makes those outliers visible before the PDF is submitted, archived, shared, or sent into OCR.
              </p>
            </div>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">
              What this map checks
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Several scan signals in one view.
            </h2>
            <ul className="mt-5 space-y-3 text-[0.96rem] leading-7 text-slate-600">
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Rotation and likely page skew.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Likely blank pages and missing searchable text.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Conservative low-contrast and softness signals.</span></li>
              <li className="flex gap-3"><span className="font-bold text-blue-600" aria-hidden="true">✓</span><span>Pages that appear unusually dark compared with a healthy scan.</span></li>
            </ul>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_16px_45px_rgba(25,73,120,0.06)] sm:p-8" aria-labelledby="scan-quality-next-step-heading">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">Next step</p>
          <h2 id="scan-quality-next-step-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Found weak scan pages?
          </h2>
          <p className="mt-4 max-w-3xl text-[0.96rem] leading-7 text-slate-600">
            Use the scanned-PDF cleanup workflow when several quality issues appear together, or straighten the document when skew is the main problem.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/improve-scanned-pdf">
              Improve this scanned PDF
            </Link>
            <Link className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700" href="/straighten-pdf">
              Straighten crooked pages
            </Link>
          </div>
        </section>

        <section className="mt-6" aria-labelledby="scan-quality-faq-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-blue-600">FAQ</p>
            <h2 id="scan-quality-faq-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              Scanned PDF quality questions
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
