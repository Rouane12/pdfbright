import type { Metadata } from "next";
import Link from "next/link";
import { SearchabilityChecker } from "@/components/searchability-checker";
import "../tools.css";

export const metadata: Metadata = {
  title: "PDF Searchability Test",
  description:
    "Check whether every page in a PDF is searchable. Find exact pages with missing text layers and identify likely OCR candidates for free in your browser.",
  alternates: {
    canonical: "/tools/searchability",
  },
};

export default function SearchabilityPage() {
  return (
    <main className="tools-page">
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF searchability test</p>
          <h1>Don&apos;t ask whether the PDF is searchable. Find the exact pages that aren&apos;t.</h1>
          <p>
            Test every page for reliable extractable text, see your true search coverage,
            and identify which pages are likely scans that need OCR.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No extracted text is displayed or logged</span>
            <span>Analysis runs in your browser</span>
          </div>
        </div>
      </section>

      <SearchabilityChecker />
    </main>
  );
}
