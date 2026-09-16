import type { Metadata } from "next";
import { SeoUseCasePage, type SeoUseCasePageConfig } from "@/components/seo-use-case-page";

export const metadata: Metadata = {
  title: "Remove Blank Pages from PDF Scans Online",
  description:
    "Find likely blank pages in scanned PDFs, review them before deletion, and remove approved scanner blanks with PDFBright's safety-first cleanup workflow.",
  alternates: { canonical: "/remove-blank-pages" },
  openGraph: {
    type: "website",
    url: "/remove-blank-pages",
    title: "Remove Blank Pages from PDF Scans Online",
    description: "Detect likely scanner blanks, review them, and remove only the pages you approve in PDFBright.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Remove Blank Pages from PDF Scans Online",
    description: "Detect likely scanner blanks, review them, and remove only the pages you approve in PDFBright.",
  },
};

const config: SeoUseCasePageConfig = {
  path: "/remove-blank-pages",
  eyebrow: "Blank-page cleanup",
  heading: "Find blank scanner pages before you delete them.",
  intro:
    "Duplex scans and large paper batches often leave empty backs, separators, or near-blank pages inside the PDF. PDFBright can flag likely blanks for review so destructive page removal stays under your control.",
  trustLine: "Review before destructive removal",
  benefitsHeading: "Blank-page detection should assist your decision, not silently make it.",
  benefitsIntro:
    "A scanned blank page is often still an image containing paper texture, shadows, dust, or scanner edges. PDFBright treats blankness as a heuristic and keeps review in the workflow.",
  benefits: [
    { title: "Detect probable blanks", body: "Page rendering and blankness signals help identify pages that look empty even when the PDF technically contains a full-page scan image." },
    { title: "Review before removal", body: "Likely blank pages are surfaced as candidates so you can confirm destructive changes rather than discovering missing pages afterward." },
    { title: "Keep uncertain pages", body: "Low-confidence pages should stay in the document instead of being aggressively deleted because they contain little visible content." },
    { title: "Preserve page order", body: "Approved removals rebuild the PDF with the remaining pages in their original sequence." },
    { title: "Combine with scan cleanup", body: "The same diagnosis can also identify skew, orientation, OCR, page-size, and file-size problems in the uploaded scan." },
    { title: "Verify output page count", body: "PDFBright validates the rebuilt document and compares the intended and actual output page count before download." },
  ],
  howHeading: "The detector finds candidates; you decide what leaves the PDF.",
  howIntro:
    "That review step matters because a page with a faint signature, stamp, handwritten note, or light photocopy can look almost blank to automated analysis.",
  steps: [
    { title: "Analyze page content", body: "PDFBright inspects rendered pages and estimates which ones contain very little visible content." },
    { title: "Review likely blanks", body: "Candidates are presented as probable blanks rather than guaranteed empty pages so destructive cleanup can be checked." },
    { title: "Remove approved pages", body: "Only selected blank-page removals are applied, then the rebuilt PDF is validated before download." },
  ],
  explanationEyebrow: "Why scanner blanks are tricky",
  explanationHeading: "An empty-looking scan is rarely an actually empty PDF page.",
  explanationParagraphs: [
    "A duplex scanner may capture the blank back of a sheet as a full-page image. That image can contain off-white paper, scanner noise, dark borders, punch holes, or shadows even though the page carries no useful document content.",
    "That is why simple rules such as 'delete pages with no text objects' are not enough for scanned documents. A blank scan can contain an image, while a meaningful page can contain only a faint mark.",
    "PDFBright therefore uses a probable-blank signal and keeps human review in the destructive step instead of promising perfectly automatic deletion.",
  ],
  bestForHeading: "Useful when…",
  bestFor: [
    "Duplex scanning inserted empty backs between real pages.",
    "A large batch scan contains separators or accidental blank sheets.",
    "You want likely blanks pre-identified instead of checking every page manually.",
    "You need to clean a scan without risking silent deletion of uncertain pages.",
  ],
  cautionHeading: "Almost blank is not always blank.",
  cautionBody:
    "A light signature, faint pencil mark, small stamp, page number, watermark, or very pale photocopy can be meaningful. PDFBright should keep uncertain cases reviewable rather than making irreversible assumptions.",
  faqHeading: "Questions about removing blank pages from scanned PDFs",
  faqs: [
    { question: "Why does a scanned blank page still count as content?", answer: "Scanners usually save the whole sheet as an image. Even a visually empty sheet can therefore contain image data, paper texture, shadows, or scanner artifacts." },
    { question: "Does PDFBright delete blank pages automatically?", answer: "Likely blank pages are treated as heuristic findings. The product is designed to give you a review opportunity before destructive page removal." },
    { question: "Can a nearly blank page be kept?", answer: "Yes. Review exists specifically so faint or intentionally sparse pages can remain when they are meaningful." },
    { question: "Will removing blanks change the order of the other pages?", answer: "The cleanup flow is intended to remove only approved pages while keeping the remaining pages in their existing order, followed by output validation." },
  ],
  finalHeading: "Have a batch scan full of empty backs and separator pages?",
  finalBody: "Upload the PDF and let PDFBright flag likely blanks for review before anything is removed.",
};

export default function RemoveBlankPagesPage() {
  return <SeoUseCasePage config={config} />;
}
