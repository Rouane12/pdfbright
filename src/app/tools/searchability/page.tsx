import type { Metadata } from "next";
import { FreeToolHero } from "@/components/free-tool-hero";
import { SearchabilityChecker } from "@/components/searchability-checker";
import "../tools.css";
import "../tool-page-polish.css";

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
    </main>
  );
}
