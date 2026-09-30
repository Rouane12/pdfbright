import type { Metadata } from "next";
import Link from "next/link";
import "./tools.css";
import "./tools-hub-polish.css";

export const metadata: Metadata = {
  title: "Free PDF Tools",
  description:
    "Free PDF diagnostics from PDFBright: check upload readiness, scan quality, hidden document baggage, searchability, page consistency, and document changes without a signup.",
  alternates: {
    canonical: "/tools",
  },
};

type ToolIconName =
  | "readiness"
  | "scan"
  | "send"
  | "search"
  | "consistency"
  | "changes";

function ToolIcon({ name }: { name: ToolIconName }) {
  const shared = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "readiness") {
    return (
      <svg {...shared}>
        <path d="M9 5h6" />
        <path d="M9 3h6a2 2 0 0 1 2 2v1h2v15H5V6h2V5a2 2 0 0 1 2-2Z" />
        <path d="m8 13 2.3 2.3L16 9.7" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg {...shared}>
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M7 12h10" />
        <path d="M8 9h8" />
        <path d="M9 15h6" />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg {...shared}>
        <path d="M12 3 5.5 5.8v5.1c0 4.1 2.5 7.8 6.5 10.1 4-2.3 6.5-6 6.5-10.1V5.8L12 3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...shared}>
        <circle cx="10.5" cy="10.5" r="5.5" />
        <path d="m15 15 5 5" />
        <path d="M8 9h5" />
        <path d="M8 12h3" />
      </svg>
    );
  }

  if (name === "consistency") {
    return (
      <svg {...shared}>
        <rect x="4" y="4" width="6" height="7" rx="1" />
        <rect x="14" y="4" width="6" height="7" rx="1" />
        <rect x="4" y="15" width="6" height="5" rx="1" />
        <rect x="14" y="15" width="6" height="5" rx="1" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path d="M7 4h8l3 3v13H7z" />
      <path d="M15 4v4h4" />
      <path d="m9.5 12 2-2 2 2" />
      <path d="M11.5 10v6" />
      <path d="m14.5 14 2 2 2-2" />
    </svg>
  );
}

const tools: Array<{
  title: string;
  description: string;
  href: string;
  live: boolean;
  icon: ToolIconName;
}> = [
  {
    title: "PDF Upload Readiness Checker",
    description:
      "Check a PDF against file-size, page-count, page-format, searchability, and consistency requirements before you submit it.",
    href: "/tools/upload-readiness",
    live: true,
    icon: "readiness",
  },
  {
    title: "PDF Scan Quality Map",
    description:
      "See which pages look crooked, blank, image-only, low quality, or difficult to search in one page-by-page map.",
    href: "/tools/scan-quality",
    live: true,
    icon: "scan",
  },
  {
    title: "Before You Send Checker",
    description:
      "Inspect document baggage and privacy-sensitive details before a PDF leaves your hands.",
    href: "/tools/before-you-send",
    live: true,
    icon: "send",
  },
  {
    title: "PDF Searchability Test",
    description:
      "Find the exact pages where searchable text is missing instead of relying on a document-wide yes or no.",
    href: "/tools/searchability",
    live: true,
    icon: "search",
  },
  {
    title: "PDF Page Consistency Map",
    description:
      "Visualize page sizes, orientation, text presence, and structural outliers across the whole document.",
    href: "/tools/page-consistency",
    live: true,
    icon: "consistency",
  },
  {
    title: "PDF Change Receipt",
    description:
      "Compare an original and modified PDF and get a plain-language receipt of the structural changes.",
    href: "/tools/change-receipt",
    live: true,
    icon: "changes",
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
              <div className="tool-card__top">
                <span className="tool-card__icon">
                  <ToolIcon name={tool.icon} />
                </span>
                <span className="tool-card__badge">Available now</span>
              </div>
              <div className="tool-card__copy">
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
              </div>
              <Link className="tool-card__link" href={tool.href}>
                Open free tool <span aria-hidden="true">→</span>
              </Link>
            </article>
          ) : (
            <article className="tool-card" key={tool.title}>
              <div className="tool-card__top">
                <span className="tool-card__icon">
                  <ToolIcon name={tool.icon} />
                </span>
                <span className="tool-card__badge tool-card__badge--next">Coming next</span>
              </div>
              <div className="tool-card__copy">
                <h2>{tool.title}</h2>
                <p>{tool.description}</p>
              </div>
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
