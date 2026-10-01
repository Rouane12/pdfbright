import type { Metadata } from "next";
import { ChangeReceiptChecker } from "@/components/change-receipt-checker";
import { FreeToolHero } from "@/components/free-tool-hero";
import "../tools.css";
import "../tool-page-polish.css";

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
      <FreeToolHero
        icon="changes"
        eyebrow="Free PDF comparison receipt"
        title="Know what structurally changed between two PDFs."
        description="Compare an original and modified version for file size, page count, page dimensions, rotation, text-layer status, page profile, blankness, and common document metadata."
        privacy={[
          "No signup",
          "No extracted text is displayed or logged",
          "Both files stay in your browser",
        ]}
      />

      <ChangeReceiptChecker />
    </main>
  );
}
