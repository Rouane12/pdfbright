import type { Metadata } from "next";
import { SeoUseCasePage, type SeoUseCasePageConfig } from "@/components/seo-use-case-page";

export const metadata: Metadata = {
  title: "Make Scanned PDF Searchable Online with OCR",
  description:
    "Make supported scanned PDFs searchable with OCR. PDFBright detects image-only pages, adds searchable text where needed, and keeps the cleanup workflow focused.",
  alternates: { canonical: "/make-pdf-searchable" },
  openGraph: {
    type: "website",
    url: "/make-pdf-searchable",
    title: "Make Scanned PDF Searchable Online with OCR",
    description: "Detect image-only scan pages and add searchable text with OCR in PDFBright's diagnose-first cleanup workflow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Make Scanned PDF Searchable Online with OCR",
    description: "Detect image-only scan pages and add searchable text with OCR in PDFBright's diagnose-first cleanup workflow.",
  },
};

const config: SeoUseCasePageConfig = {
  path: "/make-pdf-searchable",
  eyebrow: "Searchable PDF OCR",
  heading: "Make a scanned PDF searchable without rebuilding the whole document.",
  intro:
    "If Ctrl+F finds nothing and text cannot be selected, the PDF may contain page images instead of useful text. PDFBright can identify supported image-only pages and add searchable text with OCR where it is actually needed.",
  trustLine: "No signup required to start",
  benefitsHeading: "OCR should target the pages that need OCR.",
  benefitsIntro:
    "A mixed PDF can contain normal text pages and scanned image pages together. PDFBright diagnoses that difference first so native text is not needlessly treated like a scan.",
  benefits: [
    { title: "Detect image-only pages", body: "PDFBright analyzes whether useful extractable text already exists before recommending OCR." },
    { title: "Add searchable text", body: "Supported scan pages can receive an OCR text layer so words become searchable and selectable." },
    { title: "Preserve the visible scan", body: "OCR is intended to add machine-readable text without re-typesetting the page into a different-looking document." },
    { title: "Avoid unnecessary OCR", body: "Pages that already contain useful text do not need to be recognized again just because other pages are scans." },
    { title: "Combine OCR with cleanup", body: "If the same document is crooked, sideways, oversized, or contains blank scanner pages, those findings can be handled in the same workflow." },
    { title: "Validate the output", body: "PDFBright checks the rebuilt PDF before presenting the final download instead of treating OCR completion alone as success." },
  ],
  howHeading: "From image-only scan to searchable PDF in three steps.",
  howIntro:
    "The important first step is not OCR itself. It is determining which pages actually need recognition and keeping the rest of the document intact.",
  steps: [
    { title: "Upload and analyze", body: "PDFBright inspects page structure and text presence to find pages that appear image-only or scan-backed." },
    { title: "Review the recommendation", body: "The diagnosis explains which pages need searchable text and can surface other scan problems at the same time." },
    { title: "Run OCR and validate", body: "Supported target pages are recognized, searchable text is added, and the rebuilt PDF is checked before download." },
  ],
  explanationEyebrow: "Why Ctrl+F can fail",
  explanationHeading: "A PDF can show perfectly readable words while containing almost no searchable text.",
  explanationParagraphs: [
    "A scanner or phone camera often stores each page primarily as an image. Your eyes can read the letters, but the PDF viewer may only see pixels, so search, selection, and copy-and-paste do not work normally.",
    "OCR, or optical character recognition, analyzes those page images and reconstructs text that software can search. Recognition quality depends on the scan, so important names, numbers, or legal text should still be checked when exact transcription matters.",
    "PDFBright treats OCR as one repair inside a broader scanned-document cleanup flow rather than forcing every uploaded page through recognition.",
  ],
  bestForHeading: "Useful when…",
  bestFor: [
    "Ctrl+F cannot find visible words in a scanned document.",
    "You cannot select or copy text from scan pages.",
    "A mixed PDF contains some normal text pages and some image-only pages.",
    "You want searchable archives, contracts, research scans, forms, or records without manually retyping them.",
  ],
  cautionHeading: "OCR is recognition, not guaranteed transcription.",
  cautionBody:
    "Faint print, unusual fonts, handwriting, low-resolution scans, skew, shadows, and unsupported scripts can reduce recognition accuracy. PDFBright should not imply that OCR output is automatically exact enough for high-stakes transcription.",
  faqHeading: "Questions about making a scanned PDF searchable",
  faqs: [
    { question: "Why is my PDF not searchable?", answer: "The visible page may be stored as an image without a useful text layer. In that case a PDF viewer has little or no machine-readable text to search." },
    { question: "Will OCR change how the PDF looks?", answer: "PDFBright's searchable-text workflow is designed to preserve the visible scan while adding machine-readable text to supported pages rather than rebuilding the layout from scratch." },
    { question: "Does every page need OCR?", answer: "No. A PDF can mix native-text and image-only pages. PDFBright diagnoses text presence first and targets supported pages that need recognition." },
    { question: "Is OCR always accurate?", answer: "No. OCR quality depends on scan clarity, resolution, language, orientation, typography, and other page conditions. Important recognized text should be checked when exact wording matters." },
  ],
  finalHeading: "Have a PDF that looks readable but cannot be searched?",
  finalBody: "Upload it to PDFBright. The diagnosis can identify which supported pages need OCR before cleanup begins.",
};

export default function MakePdfSearchablePage() {
  return <SeoUseCasePage config={config} />;
}
