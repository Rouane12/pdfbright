import type { Metadata } from "next";
import { FreeToolHero } from "@/components/free-tool-hero";
import { ScanQualityMap } from "@/components/scan-quality-map";
import "../tools.css";
import "../tool-page-polish.css";

export const metadata: Metadata = {
  title: "PDF Scan Quality Map",
  description:
    "Map PDF scan quality page by page. Find likely crooked, blank, unsearchable, low-contrast, soft, rotated, and visually problematic pages before you send or archive a document.",
  alternates: {
    canonical: "/tools/scan-quality",
  },
};

export default function ScanQualityPage() {
  return (
    <main className="tools-page">
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
    </main>
  );
}
