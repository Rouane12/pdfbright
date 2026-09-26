import type { Metadata } from "next";
import Link from "next/link";
import "./tools.css";

export const metadata: Metadata = {
  title: "Free PDF Tools",
  description:
    "Free PDF diagnostics from PDFBright: check upload readiness, scan quality, hidden document baggage, searchability, page consistency, and document changes without a signup.",
  alternates: {
    canonical: "/tools",
  },
};

const tools = [
  {
    title: "PDF Upload Readiness Checker",
    description:
      "Check a PDF against file-size, page-count, page-format, searchability, and consistency requirements before you submit it.",
    href: "/tools/upload-readiness",
    live: true,
  },
  {
    title: "PDF Scan Quality Map",
    description:
      "See which pages look crooked, blank, image-only, low quality, or difficult to search in one page-by-page map.",
    href: "/tools/scan-quality",
    live: true,
  },
  {
    title: "Before You Send Checker",
    description:
      "Inspect document baggage and privacy-sensitive details before a PDF leaves your hands.",
    href: "/tools/before-you-send",
    live: true,
  },
  {
    title: "PDF Searchability Test",
    description:
      "Find the exact pages where searchable text is missing instead of relying on a document-wide yes or no.",
    href: "/tools/searchability",
    live: true,
  },
  {
    title: "PDF Page Consistency Map",
    description:
      "Visualize page sizes, orientation, text presence, and structural outliers across the whole document.",
    live: false,
  },
  {
    title: "PDF Change Receipt",
    description:
      "Compare an original and modified PDF and get a plain-language receipt of the structural changes.",
    live: false,
  },
];

export default function ToolsPage() {
  return (
    <main className="tools-page">
      <section className="tools-hero">
        <div className="tools-hero__inner">
          <p className="tools-eyebrow">PDFBright Free Tools</p>
          <h1>Useful PDF checks most tool directories forget.</h1>
          <p>
            Diagnose, verify, and understand a PDF before you change it. The tools here are free,
            focused, and designed around the same local-first philosophy as PDFBright.
          </p>
        </div>
      </section>

      <section className="tools-grid" aria-label="PDFBright free tools">
        {tools.map((tool) =>
          tool.live && tool.href ? (
            <article className="tool-card tool-card--live" key={tool.title}>
              <span className="tool-card__badge">Available now</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
              <Link className="tool-card__link" href={tool.href}>
                Open free tool <span aria-hidden="true">→</span>
              </Link>
            </article>
          ) : (
            <article className="tool-card" key={tool.title}>
              <span className="tool-card__badge tool-card__badge--next">Coming next</span>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </article>
          ),
        )}
      </section>

      <section className="tools-footer-cta">
        <h2>Need the PDF fixed, not just checked?</h2>
        <p>
          PDFBright&apos;s main cleanup workflow diagnoses the document, recommends safe fixes,
          and returns a cleaner PDF without making you choose between a wall of utilities.
        </p>
        <Link className="button button--primary inline-flex" href="/#upload">
          Clean a PDF
        </Link>
      </section>
    </main>
  );
}
