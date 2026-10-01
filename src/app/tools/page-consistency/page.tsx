import type { Metadata } from "next";
import { FreeToolHero } from "@/components/free-tool-hero";
import { PageConsistencyMap } from "@/components/page-consistency-map";
import "../tools.css";
import "../tool-page-polish.css";

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
    </main>
  );
}
