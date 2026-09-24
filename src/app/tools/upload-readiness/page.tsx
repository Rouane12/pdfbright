import type { Metadata } from "next";
import Link from "next/link";
import { UploadReadinessChecker } from "@/components/upload-readiness-checker";
import "../tools.css";

export const metadata: Metadata = {
  title: "PDF Upload Readiness Checker",
  description:
    "Check whether a PDF meets file-size, page-count, page-format, searchability, and page-consistency requirements before you upload or submit it.",
  alternates: {
    canonical: "/tools/upload-readiness",
  },
};

export default function UploadReadinessPage() {
  return (
    <main className="tools-page">
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF diagnostic</p>
          <h1>Will this PDF upload successfully?</h1>
          <p>
            Enter the destination&apos;s requirements, drop in your PDF, and PDFBright will tell
            you exactly what passes, what is close to the limit, and what may cause rejection.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No document-content analytics</span>
            <span>Current inspection runs in your browser</span>
          </div>
        </div>
      </section>

      <UploadReadinessChecker />
    </main>
  );
}
