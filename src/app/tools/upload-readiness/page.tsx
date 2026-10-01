import type { Metadata } from "next";
import { FreeToolHero } from "@/components/free-tool-hero";
import { UploadReadinessChecker } from "@/components/upload-readiness-checker";
import "../tools.css";
import "../tool-page-polish.css";

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
      <FreeToolHero
        icon="readiness"
        eyebrow="Free PDF diagnostic"
        title="Will this PDF upload successfully?"
        description="Enter the destination's requirements, drop in your PDF, and PDFBright will tell you exactly what passes, what is close to the limit, and what may cause rejection."
        privacy={[
          "No signup",
          "No document-content analytics",
          "Current inspection runs in your browser",
        ]}
      />

      <UploadReadinessChecker />
    </main>
  );
}
