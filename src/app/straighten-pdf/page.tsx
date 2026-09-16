import type { Metadata } from "next";
import { SeoUseCasePage, type SeoUseCasePageConfig } from "@/components/seo-use-case-page";

export const metadata: Metadata = {
  title: "Straighten PDF Online — Deskew Crooked Scans",
  description:
    "Straighten crooked scanned PDF pages online. PDFBright detects likely skew, recommends conservative deskewing, and validates the cleaned document before download.",
  alternates: { canonical: "/straighten-pdf" },
  openGraph: {
    type: "website",
    url: "/straighten-pdf",
    title: "Straighten PDF Online — Deskew Crooked Scans",
    description: "Detect tilted scan pages and apply conservative PDF deskewing inside PDFBright's diagnose-first cleanup workflow.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Straighten PDF Online — Deskew Crooked Scans",
    description: "Detect tilted scan pages and apply conservative PDF deskewing inside PDFBright's diagnose-first cleanup workflow.",
  },
};

const config: SeoUseCasePageConfig = {
  path: "/straighten-pdf",
  eyebrow: "PDF deskew & straightening",
  heading: "Straighten crooked PDF scans without guessing the rotation angle.",
  intro:
    "Pages scanned at a slight angle are harder to read and can make OCR less reliable. PDFBright estimates likely skew per page and applies conservative straightening only where the correction is supported.",
  trustLine: "Automatic detection before correction",
  benefitsHeading: "Deskewing should fix tilt, not introduce new distortion.",
  benefitsIntro:
    "A page can be slightly crooked without being fully sideways. PDFBright separates small-angle skew from page orientation so the cleanup recommendation matches the actual problem.",
  benefits: [
    { title: "Detect likely skew", body: "Rendered scan pages are analyzed for a likely tilt angle instead of requiring you to enter one manually." },
    { title: "Use sensible bounds", body: "Straightening is conservative so uncertain pages are not aggressively rotated based on a weak estimate." },
    { title: "Keep rotation separate", body: "A sideways page and a slightly crooked page are different problems and can be diagnosed independently." },
    { title: "Support OCR quality", body: "Straighter text lines can make later recognition easier on scan pages that also need searchable text." },
    { title: "Handle mixed documents", body: "Only affected pages need visual correction; normal pages can remain unchanged in the same PDF." },
    { title: "Validate after cleanup", body: "The rebuilt output is checked before download so a visual fix is not treated as complete until the PDF remains valid." },
  ],
  howHeading: "PDFBright measures the page before it straightens it.",
  howIntro:
    "Deskewing works best when the tool first distinguishes a real tilted scan from normal page design, rotated content, or a low-confidence visual pattern.",
  steps: [
    { title: "Render and inspect scan pages", body: "PDFBright analyzes supported page images and estimates whether text/content lines appear consistently tilted." },
    { title: "Recommend safe straightening", body: "Likely skewed pages are surfaced in the diagnosis while low-confidence cases can be skipped rather than forced." },
    { title: "Apply, rebuild, and validate", body: "Selected visual corrections are applied and the output PDF is checked before the cleaned file is offered for download." },
  ],
  explanationEyebrow: "Deskew vs rotation",
  explanationHeading: "A crooked scan is not the same thing as a page rotated 90 degrees.",
  explanationParagraphs: [
    "Deskewing corrects the small tilt introduced when paper feeds through a scanner at an angle or when a document photo is captured slightly off-axis. The correction is usually measured in a few degrees rather than quarter turns.",
    "Page rotation fixes a different problem: content that is fully sideways or upside down. Treating both problems as the same operation can create awkward results, which is why PDFBright diagnoses them separately.",
    "A straighter scan is easier on the eyes and can also give OCR cleaner text baselines to recognize when the same page needs searchable text.",
  ],
  bestForHeading: "Useful when…",
  bestFor: [
    "Text lines slope slightly upward or downward across scanned pages.",
    "A batch scanner produced pages with inconsistent small-angle tilt.",
    "OCR struggles on pages that are otherwise readable but visibly crooked.",
    "You want to straighten only affected pages instead of rotating the whole PDF.",
  ],
  cautionHeading: "Not every angled element means the page is skewed.",
  cautionBody:
    "Photos, diagrams, handwriting, decorative layouts, or sparse pages can make angle estimation uncertain. PDFBright is intentionally conservative rather than promising perfect deskewing on every visual page.",
  faqHeading: "Questions about straightening and deskewing PDFs",
  faqs: [
    { question: "What does deskew PDF mean?", answer: "Deskewing corrects small-angle tilt in a scanned page so text and page content sit closer to their intended horizontal or vertical alignment." },
    { question: "Is deskewing the same as rotating a PDF page?", answer: "No. Rotation usually fixes 90-degree or 180-degree orientation problems. Deskewing fixes smaller scan angles such as a page that was fed through a scanner slightly crooked." },
    { question: "Can straightening help OCR?", answer: "It can. Cleaner text baselines can make recognition easier, although OCR accuracy still depends on resolution, contrast, language, typography, and other scan conditions." },
    { question: "Will every page be straightened?", answer: "No. PDFBright is designed to target pages where analysis supports a correction and avoid changing unaffected pages unnecessarily." },
  ],
  finalHeading: "Have a scan that looks slightly crooked page after page?",
  finalBody: "Upload it to PDFBright and let the diagnosis identify likely skew before any straightening is applied.",
};

export default function StraightenPdfPage() {
  return <SeoUseCasePage config={config} />;
}
