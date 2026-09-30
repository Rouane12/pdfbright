import type { Metadata } from "next";
import Link from "next/link";
import { ChangeReceiptChecker } from "@/components/change-receipt-checker";
import "../tools.css";

export const metadata: Metadata = {
  title: "PDF Change Receipt",
  description:
    "Compare an original and modified PDF and get a structural receipt for file size, page count, dimensions, rotation, searchability, page profile, blankness, and common metadata.",
  alternates: {
    canonical: "/tools/change-receipt",
  },
};

export default function ChangeReceiptPage() {
  return (
    <main className="tools-page">
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF comparison receipt</p>
          <h1>Know what structurally changed between two PDFs.</h1>
          <p>
            Compare an original and modified version for file size, page count, page dimensions,
            rotation, text-layer status, page profile, blankness, and common document metadata.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No extracted text is displayed or logged</span>
            <span>Both files stay in your browser</span>
          </div>
        </div>
      </section>

      <ChangeReceiptChecker />
    </main>
  );
}
