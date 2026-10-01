import type { Metadata } from "next";
import { BeforeSendChecker } from "@/components/before-send-checker";
import { FreeToolHero } from "@/components/free-tool-hero";
import "../tools.css";
import "../tool-page-polish.css";

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
      <FreeToolHero
        icon="send"
        eyebrow="Free PDF privacy & structure check"
        title="Know what you're sending besides the visible pages."
        description="Inspect the PDF for metadata, review annotations, forms, links, embedded files, automatic actions, signatures, and security signals before it leaves your hands."
        privacy={[
          "No signup",
          "No extracted text shown or logged",
          "Inspection runs in your browser",
        ]}
      />

      <BeforeSendChecker />
    </main>
  );
}
