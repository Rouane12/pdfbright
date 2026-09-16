import type { Metadata } from "next";
import { SeoUseCasePage, type SeoUseCasePageConfig } from "@/components/seo-use-case-page";

export const metadata: Metadata = {
  title: "Improve Scanned PDF Quality & Readability Online",
  description:
    "Improve supported scanned PDF readability with conservative cleanup for faint, dull, or uneven scan pages while keeping PDFBright's diagnose-first workflow and output checks.",
  alternates: { canonical: "/improve-scanned-pdf" },
  openGraph: {
    type: "website",
    url: "/improve-scanned-pdf",
    title: "Improve Scanned PDF Quality & Readability Online",
    description: "Apply conservative readability cleanup to supported scan pages without turning the workflow into aggressive image filtering.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Improve Scanned PDF Quality & Readability Online",
    description: "Apply conservative readability cleanup to supported scan pages without turning the workflow into aggressive image filtering.",
  },
};

const config: SeoUseCasePageConfig = {
  path: "/improve-scanned-pdf",
  eyebrow: "Scan readability cleanup",
  heading: "Improve hard-to-read scanned PDF pages without over-processing them.",
  intro:
    "Faded text, dull contrast, grey paper, and uneven scan appearance can make a document tiring to read. PDFBright can apply conservative readability enhancement to supported scan pages while keeping the cleanup focused on preserving meaningful content.",
  trustLine: "Conservative visual cleanup",
  benefitsHeading: "Readability enhancement should clarify the scan, not erase the document.",
  benefitsIntro:
    "Aggressive filters can make a scan look cleaner while destroying faint handwriting, stamps, signatures, or small print. PDFBright treats visual enhancement as a bounded cleanup operation rather than a dramatic image effect.",
  benefits: [
    { title: "Target scan pages", body: "Visual cleanup is intended for pages that behave like scans rather than automatically transforming native-text pages." },
    { title: "Improve ordinary contrast", body: "Supported pages can receive conservative brightness, contrast, or background cleanup aimed at easier reading." },
    { title: "Protect faint content", body: "The workflow avoids aggressive settings that could erase light text, signatures, stamps, or other meaningful details." },
    { title: "Pair with straightening", body: "A page that is both visually weak and crooked can be improved within the same diagnosis-first cleanup run." },
    { title: "Prepare for OCR", body: "Clearer scan appearance can help recognition conditions on pages that also need searchable text, although OCR accuracy is never guaranteed." },
    { title: "Track what changed", body: "The cleanup report records which pages received readability enhancement so the result is explainable rather than opaque." },
  ],
  howHeading: "PDFBright enhances readability only where the diagnosis supports it.",
  howIntro:
    "The safest scan cleanup is selective. The tool should preserve pages that are already good and avoid treating every document like a photo-editing project.",
  steps: [
    { title: "Inspect visual scan conditions", body: "PDFBright analyzes supported scan pages and other document signals before recommending visual cleanup." },
    { title: "Apply conservative enhancement", body: "Selected pages can receive bounded readability adjustments rather than aggressive whitening or sharpening that risks losing faint content." },
    { title: "Rebuild and validate", body: "The enhanced pages are returned inside a validated PDF alongside any other approved cleanup fixes." },
  ],
  explanationEyebrow: "What 'improve scan quality' should mean",
  explanationHeading: "The useful goal is readability, not making every page look artificially perfect.",
  explanationParagraphs: [
    "Poor scans can come from low contrast, faded originals, grey or yellowish paper, uneven scanner exposure, shadows, or weak photocopies. Some of those problems can be reduced, but no filter can recreate detail that was never captured in the source scan.",
    "Heavy background whitening or sharpening can also backfire. A setting that makes dark printed text look crisp may wipe out pencil marks, pale stamps, thin signatures, or subtle diagrams.",
    "PDFBright therefore frames scan enhancement as conservative readability cleanup and keeps it alongside deskewing, OCR, blank-page review, and file optimization rather than promising magical restoration.",
  ],
  bestForHeading: "Useful when…",
  bestFor: [
    "Scanned pages look dull, grey, washed out, or low-contrast.",
    "Printed text is readable but tiring to follow because the page background is uneven.",
    "You want modest cleanup before OCR or archiving rather than dramatic image processing.",
    "The same document also needs straightening, OCR, rotation, blank-page cleanup, or compression.",
  ],
  cautionHeading: "Enhancement cannot restore information that the scan never captured.",
  cautionBody:
    "Severe blur, missing pixels, clipped text, motion blur, extreme shadows, or very low resolution may not be recoverable. Important originals should be rescanned when possible if critical content is genuinely absent or unreadable.",
  faqHeading: "Questions about improving scanned PDF readability",
  faqs: [
    { question: "Can PDFBright make a blurry scan sharp again?", answer: "It can improve supported readability conditions conservatively, but it cannot recreate detail that was never captured. Severe blur or missing information may require a better rescan." },
    { question: "Will background cleanup remove handwriting or stamps?", answer: "PDFBright's visual cleanup is intentionally conservative because faint handwriting, signatures, stamps, and pale printed content can be meaningful. Aggressive erasure is not the goal." },
    { question: "Can scan enhancement help OCR?", answer: "Cleaner contrast and straighter pages can improve recognition conditions, but OCR accuracy still depends on the source resolution, language, typography, page layout, and other factors." },
    { question: "Does every scanned page need enhancement?", answer: "No. Pages that are already readable should not be transformed just because they came from a scanner. PDFBright aims to apply fixes only where analysis supports them." },
  ],
  finalHeading: "Have a scan that is readable, but harder to read than it should be?",
  finalBody: "Upload it to PDFBright and let the diagnosis determine whether conservative readability cleanup is appropriate for the supported pages.",
};

export default function ImproveScannedPdfPage() {
  return <SeoUseCasePage config={config} />;
}
