import type { Metadata } from "next";
import Link from "next/link";
import { ScanQualityMap } from "@/components/scan-quality-map";
import "../tools.css";

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
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF diagnostic</p>
          <h1>See the weak pages before they become a problem.</h1>
          <p>
            PDFBright turns a PDF into a page-by-page quality map so crooked, blank,
            unsearchable, soft, low-contrast, or unusually dark scan pages stand out immediately.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No document-content analytics</span>
            <span>Current inspection runs in your browser</span>
          </div>
        </div>
      </section>

      <ScanQualityMap />
    </main>
  );
}
