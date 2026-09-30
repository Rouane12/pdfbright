import type { Metadata } from "next";
import Link from "next/link";
import { PageConsistencyMap } from "@/components/page-consistency-map";
import "../tools.css";

export const metadata: Metadata = {
  title: "PDF Page Consistency Map",
  description:
    "Compare every page in a PDF for size, orientation, content type, searchability, rotation, and blankness. Find structural outliers for free in your browser.",
  alternates: {
    canonical: "/tools/page-consistency",
  },
};

export default function PageConsistencyPage() {
  return (
    <main className="tools-page">
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF structure map</p>
          <h1>Find the one weird page hiding in an otherwise consistent PDF.</h1>
          <p>
            Compare page size, orientation, content pattern, searchability, rotation,
            and blankness across the entire document in one visual matrix.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No extracted text is displayed or logged</span>
            <span>Analysis runs in your browser</span>
          </div>
        </div>
      </section>

      <PageConsistencyMap />
    </main>
  );
}
