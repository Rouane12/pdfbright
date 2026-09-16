import type { Metadata } from "next";
import { SeoUseCasePage, type SeoUseCasePageConfig } from "@/components/seo-use-case-page";

export const metadata: Metadata = {
  title: "Compress Scanned PDF Online — Reduce File Size",
  description:
    "Reduce scanned PDF file size with PDFBright's scan-aware optimization workflow. Diagnose oversized image-heavy pages, choose practical quality settings, and validate the output.",
  alternates: { canonical: "/compress-scanned-pdf" },
  openGraph: {
    type: "website",
    url: "/compress-scanned-pdf",
    title: "Compress Scanned PDF Online — Reduce File Size",
    description: "Reduce oversized scan-heavy PDFs with quality-aware optimization inside PDFBright's diagnose-first workflow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Compress Scanned PDF Online — Reduce File Size",
    description: "Reduce oversized scan-heavy PDFs with quality-aware optimization inside PDFBright's diagnose-first workflow.",
  },
};

const config: SeoUseCasePageConfig = {
  path: "/compress-scanned-pdf",
  eyebrow: "Scanned PDF compression",
  heading: "Reduce a scanned PDF's file size without treating every document the same.",
  intro:
    "Scanned PDFs can become surprisingly large because each page may contain a high-resolution image. PDFBright diagnoses the document first, then applies scan-aware optimization with practical quality modes and output checks.",
  trustLine: "Quality-aware optimization",
  benefitsHeading: "Compression should respond to what is actually making the PDF large.",
  benefitsIntro:
    "A scan-heavy PDF behaves differently from a small native-text document. PDFBright focuses optimization where image weight creates a realistic opportunity to shrink the file.",
  benefits: [
    { title: "Identify scan-heavy pages", body: "PDFBright analyzes document structure and scan signals before recommending file optimization." },
    { title: "Use practical quality modes", body: "Optimization can balance smaller output against ordinary readability instead of applying one destructive setting to every file." },
    { title: "Measure actual savings", body: "The cleanup report compares original and output sizes so the result reflects real bytes saved rather than a vague compression claim." },
    { title: "Skip ineffective compression", body: "If optimization is not applicable or does not produce a useful result, the workflow can avoid pretending the file was improved." },
    { title: "Combine with other fixes", body: "Large scans can also need OCR, straightening, rotation, blank-page cleanup, or normalization in the same run." },
    { title: "Validate the rebuilt PDF", body: "The final document is reopened and checked before download so a smaller file is not accepted if the output is invalid." },
  ],
  howHeading: "PDFBright optimizes after it understands the document.",
  howIntro:
    "The goal is not simply to chase the smallest possible number. A useful compressed PDF still needs to open correctly and remain readable for its intended job.",
  steps: [
    { title: "Analyze size and page makeup", body: "PDFBright inspects the PDF for scan-heavy content and other cleanup signals that affect the best processing path." },
    { title: "Apply a quality-aware profile", body: "When optimization is useful, PDFBright uses the selected compression mode rather than blindly flattening every document into low-quality images." },
    { title: "Compare and validate", body: "The output size is measured against the original, then the rebuilt PDF is validated before download." },
  ],
  explanationEyebrow: "Why scanned PDFs get large",
  explanationHeading: "A short document can still be huge when every page is a high-resolution picture.",
  explanationParagraphs: [
    "Scanner resolution, color pages, camera photos, image dimensions, and inefficient encoding can make a ten-page scan much larger than a far longer text-native PDF. The visible document may look simple while carrying many megabytes of image data behind the scenes.",
    "Useful compression therefore depends on the page content. Reducing image weight can help a scan-heavy document, while unnecessary rasterization can make a normal text PDF worse by damaging selectability or clarity.",
    "PDFBright keeps optimization inside the diagnosis-first workflow so file-size reduction can be combined with OCR and visual cleanup instead of becoming an isolated 'make it tiny at any cost' button.",
  ],
  bestForHeading: "Useful when…",
  bestFor: [
    "A scanned PDF is too large for email, upload portals, or routine sharing.",
    "A short document has an unexpectedly large file size because its pages are images.",
    "You want to see the actual size reduction instead of trusting a generic compression message.",
    "The same oversized scan also needs OCR, straightening, blank-page cleanup, or rotation.",
  ],
  cautionHeading: "Smaller is not automatically better.",
  cautionBody:
    "Aggressive image recompression can blur small print, signatures, diagrams, stamps, or fine document details. PDFBright's optimization goal is useful size reduction while protecting normal readability, not the smallest possible file at any quality cost.",
  faqHeading: "Questions about compressing scanned PDFs",
  faqs: [
    { question: "Why is my scanned PDF so large?", answer: "Each page may be stored as a high-resolution image. Resolution, color depth, photographs, page dimensions, and image encoding can make even a short scan surprisingly large." },
    { question: "Will compression make the text blurry?", answer: "Any image compression can affect visual detail if pushed too far. PDFBright uses quality-aware modes and treats readability as part of the result rather than optimizing for size alone." },
    { question: "Does every PDF benefit from scan compression?", answer: "No. Some PDFs are already efficient or mostly contain native text. PDFBright can skip or reject ineffective optimization rather than claiming every document can be meaningfully reduced." },
    { question: "Can I compress and OCR the same scan?", answer: "Yes when the document analysis supports both operations. PDFBright is designed to combine applicable cleanup fixes in one workflow rather than forcing separate tools." },
  ],
  finalHeading: "Have a scan that is much bigger than it should be?",
  finalBody: "Upload it to PDFBright and let the diagnosis determine whether scan-aware optimization is likely to help before the file is rebuilt.",
};

export default function CompressScannedPdfPage() {
  return <SeoUseCasePage config={config} />;
}
