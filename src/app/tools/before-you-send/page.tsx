import type { Metadata } from "next";
import Link from "next/link";
import { BeforeSendChecker } from "@/components/before-send-checker";
import "../tools.css";

export const metadata: Metadata = {
  title: "Before You Send PDF Checker",
  description:
    "Check a PDF for metadata, comments, forms, external links, embedded files, scripts, signatures, and security signals before you share it.",
  alternates: {
    canonical: "/tools/before-you-send",
  },
};

export default function BeforeYouSendPage() {
  return (
    <main className="tools-page">
      <section className="tool-page-hero">
        <div className="tool-page-inner">
          <Link className="tool-page-hero__back" href="/tools">
            ← All free tools
          </Link>
          <p className="tools-eyebrow">Free PDF privacy & structure check</p>
          <h1>Know what you&apos;re sending besides the visible pages.</h1>
          <p>
            Inspect the PDF for metadata, review annotations, forms, links, embedded files,
            automatic actions, signatures, and security signals before it leaves your hands.
          </p>
          <div className="tool-privacy-line" aria-label="Tool privacy details">
            <span>No signup</span>
            <span>No extracted text shown or logged</span>
            <span>Inspection runs in your browser</span>
          </div>
        </div>
      </section>

      <BeforeSendChecker />
    </main>
  );
}
