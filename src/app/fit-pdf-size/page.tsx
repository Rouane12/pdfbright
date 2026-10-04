import type { Metadata } from "next";
import Link from "next/link";
import { FitPdfSizeTool } from "@/components/fit-pdf-size-tool";
import "./fit-pdf-size.css";

export const metadata: Metadata = {
  title: "Fit PDF to a File Size Limit",
  description:
    "Choose a PDF size limit such as 500 KB, 1 MB, 2 MB, 5 MB, or a custom target. PDFBright measures real compression outputs and uses the least aggressive validated profile that fits when safely achievable.",
  alternates: {
    canonical: "/fit-pdf-size",
  },
  openGraph: {
    title: "Fit My PDF — Compress to a File Size Limit | PDFBright",
    description:
      "Tell PDFBright the maximum file size. It measures real outputs and chooses the least aggressive validated compression profile that fits when safely achievable.",
    url: "/fit-pdf-size",
    type: "website",
  },
};

const faq = [
  {
    question: "Can PDFBright make a PDF exactly 2 MB?",
    answer:
      "PDF encoding is content-dependent, so PDFBright treats your number as a maximum limit rather than promising an exact byte-for-byte size. It measures real outputs and chooses the least aggressive validated profile that lands under the limit when one does.",
  },
  {
    question: "What happens if the target is too small?",
    answer:
      "PDFBright stops at its smallest validated profile and reports the best safe measured result instead of silently destroying readability or flattening content just to hit the number.",
  },
  {
    question: "Will PDFBright rasterize normal text pages?",
    answer:
      "No. The target-size workflow preserves native text and vector pages. Compression is applied only to scan or image pages that PDFBright can safely recompress.",
  },
  {
    question: "Does the PDF leave my browser?",
    answer:
      "The current target-size workflow runs locally in the browser. PDFBright does not need to upload the document to a PDF processing server for this feature.",
  },
];

export default function FitPdfSizePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
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
        name: "Fit PDF to Size",
        item: "https://pdfbright.app/fit-pdf-size",
      },
    ],
  };

  return (
    <main className="fit-size-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="fit-size-hero">
        <div className="fit-size-hero__inner">
          <p className="fit-size-eyebrow">✦ Fit My PDF</p>
          <h1>Make the PDF fit the limit.</h1>
          <p className="fit-size-hero__copy">
            Need a document under 2 MB, 500 KB, or another upload limit? Set the maximum size.
            PDFBright measures real outputs and keeps the least aggressive validated result that actually fits.
          </p>
          <div className="fit-size-hero__chips" aria-label="Feature highlights">
            <span>No signup required</span>
            <span>Local browser processing</span>
            <span>Preserves native text/vector pages</span>
            <span>Validated output before download</span>
          </div>
        </div>
      </section>

      <section className="fit-size-tool-shell" aria-label="Fit PDF to a file size limit">
        <FitPdfSizeTool />
      </section>

      <section className="fit-size-info-section" aria-label="How target-size fitting works">
        <div className="fit-size-info-grid">
          <article className="fit-size-info-card">
            <span>01 · Measure</span>
            <h2>No guessed compression slider</h2>
            <p>
              PDFBright creates measured candidate outputs instead of pretending a fixed percentage can
              predict the final PDF size.
            </p>
          </article>
          <article className="fit-size-info-card">
            <span>02 · Preserve</span>
            <h2>Do not flatten what already works</h2>
            <p>
              Native text and vector pages stay native. Only eligible scan/image pages are recompressed,
              helping preserve searchability and document structure.
            </p>
          </article>
          <article className="fit-size-info-card">
            <span>03 · Verify</span>
            <h2>A smaller file still has to reopen</h2>
            <p>
              Before the fitted PDF becomes downloadable, PDFBright reopens it and validates page count,
              visible content, and preserved text where applicable.
            </p>
          </article>
        </div>
      </section>

      <section className="fit-size-related">
        <h2>Trying to satisfy an upload portal?</h2>
        <p>
          Size is only one requirement. Check page count, page format, searchability, and consistency before
          you submit the final file.
        </p>
        <div className="fit-size-related__links">
          <Link href="/tools/upload-readiness">Check upload readiness →</Link>
          <Link href="/tools/change-receipt">Compare the final PDF →</Link>
          <Link href="/compress-scanned-pdf">Learn about scan compression →</Link>
        </div>
      </section>

      <section className="fit-size-info-section" aria-labelledby="fit-size-faq-heading">
        <div className="fit-size-hero__inner">
          <p className="fit-size-eyebrow">Questions</p>
          <h2 id="fit-size-faq-heading" style={{ marginTop: "0.7rem", fontSize: "clamp(2rem, 5vw, 3.2rem)", letterSpacing: "-0.045em" }}>
            What “fit to size” actually means.
          </h2>
        </div>
        <div className="fit-size-info-grid" style={{ marginTop: "1.5rem" }}>
          {faq.slice(0, 3).map((item) => (
            <article className="fit-size-info-card" key={item.question}>
              <h2>{item.question}</h2>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
