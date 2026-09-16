import type { Metadata } from "next";
import Link from "next/link";
import { SeoClusterLinks } from "@/components/seo-cluster-links";
import { UploadDropzone } from "@/components/upload-dropzone";
import {
  CURRENT_PROCESSING_CLASS,
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
  SERVER_ASSISTED_PROCESSING_ENABLED,
} from "@/lib/security/processing-policy";

export const metadata: Metadata = {
  title: "Clean Scanned PDF Online — OCR, Straighten & Optimize",
  description:
    "Clean scanned PDFs in one workflow: straighten crooked pages, fix rotation, make supported scans searchable with OCR, review blank pages, and reduce file size.",
  alternates: {
    canonical: "/clean-scanned-pdf",
  },
  openGraph: {
    type: "website",
    url: "/clean-scanned-pdf",
    title: "Clean Scanned PDF Online — OCR, Straighten & Optimize",
    description:
      "Clean scanned PDFs in one workflow: straighten pages, fix rotation, add searchable text to supported scans, review blank pages, and optimize file size.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clean Scanned PDF Online — OCR, Straighten & Optimize",
    description:
      "Clean scanned PDFs in one workflow: straighten pages, fix rotation, add searchable text to supported scans, review blank pages, and optimize file size.",
  },
};

const cleanupItems = [
  {
    title: "Crooked scan pages",
    body: "PDFBright can detect pages that appear skewed and apply conservative straightening when the correction is safe.",
  },
  {
    title: "Sideways pages",
    body: "Pages with the wrong orientation can be identified and rotated so the document reads naturally again.",
  },
  {
    title: "Image-only text",
    body: "Supported scanned pages can use OCR so words become searchable while the visible page remains familiar.",
  },
  {
    title: "Likely blank pages",
    body: "Probable scanner blanks are surfaced for review instead of being silently removed when confidence is uncertain.",
  },
  {
    title: "Oversized scan files",
    body: "PDFBright can optimize scan-heavy PDFs with quality-aware settings instead of blindly turning every page into a low-quality image.",
  },
  {
    title: "Inconsistent pages",
    body: "Awkward page dimensions or orientation can be normalized where doing so will not crop meaningful content.",
  },
];

const faqItems = [
  {
    question: "What is a scanned PDF?",
    answer:
      "A scanned PDF is usually made from page images produced by a scanner or phone camera. It can look like a normal PDF while lacking selectable or searchable text.",
  },
  {
    question: "Can PDFBright make a scanned PDF searchable?",
    answer:
      "For supported image-only pages, PDFBright can run OCR and add searchable text while preserving the page's visual appearance. OCR is not perfect, so important text should still be checked when exact transcription matters.",
  },
  {
    question: "Will PDFBright remove blank pages automatically?",
    answer:
      "PDFBright treats blank-page detection as a heuristic. Pages that only appear blank should be reviewed before removal rather than deleted aggressively.",
  },
  {
    question: "Does cleaning a PDF change the original file?",
    answer:
      "No. PDFBright builds a new output file. Your original local file is not overwritten by the cleanup workflow.",
  },
  {
    question: "What PDFs can I upload right now?",
    answer: `The current V1 accepts supported PDF files up to ${MAX_FILE_SIZE_MB} MB and ${MAX_PAGE_COUNT} pages. Password-protected, malformed, or unsupported PDFs may be rejected safely instead of processed partially.`,
  },
];

const sectionClass = "rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-8";

export default function CleanScannedPdfPage() {
  const processingCopy = !SERVER_ASSISTED_PROCESSING_ENABLED
    ? `The current ${CURRENT_PROCESSING_CLASS.toLowerCase()} workflow processes supported document cleanup in your browser. There is no active document-processing API receiving uploaded PDFs today.`
    : "Some cleanup operations may use disclosed server-assisted processing when required. PDFBright explains that before the document is sent.";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-950">
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.9),_transparent_36%),radial-gradient(circle_at_85%_18%,_rgba(238,242,255,0.9),_transparent_32%),#f8fbff]">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Scanned PDF cleanup</p>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Clean scanned PDFs without juggling separate tools.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Upload one PDF and let PDFBright diagnose the scan first. Straighten crooked pages, fix orientation, make supported scans searchable, review likely blank pages, and optimize file size in one focused workflow.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
            <UploadDropzone />
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-500">
            <span>No signup required to start</span>
            <span aria-hidden="true">•</span>
            <span>PDF only in V1</span>
            <span aria-hidden="true">•</span>
            <Link className="font-semibold text-indigo-700 hover:underline" href="/privacy">Read how processing works</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="scan-fixes-heading">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">One diagnosis, several fixes</p>
          <h2 id="scan-fixes-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            What PDFBright can improve in a scanned PDF
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Scanning problems often arrive together. A document can be crooked, partly sideways, image-only, oversized, and mixed with empty scanner pages at the same time. PDFBright is designed around that combined problem instead of making you pick a tool before you know what is wrong.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cleanupItems.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700" aria-hidden="true">✦</span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70" aria-labelledby="how-cleanup-works-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">How it works</p>
              <h2 id="how-cleanup-works-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
                The scan is analyzed before anything is changed.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                That matters because not every PDF needs the same treatment. Native-text pages should not be needlessly rasterized, and uncertain cleanup should be skipped or reviewed instead of forced.
              </p>
            </div>

            <ol className="space-y-4">
              <li className={sectionClass}>
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">1</span>
                  <div>
                    <h3 className="text-lg font-semibold">Upload your PDF</h3>
                    <p className="mt-2 leading-7 text-slate-600">PDFBright validates the file and inspects page structure, orientation, text presence, likely scan pages, dimensions, and other cleanup signals.</p>
                  </div>
                </div>
              </li>
              <li className={sectionClass}>
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">2</span>
                  <div>
                    <h3 className="text-lg font-semibold">Review the diagnosis</h3>
                    <p className="mt-2 leading-7 text-slate-600">You see plain-language findings before cleanup begins, including review controls for changes such as blank-page removal.</p>
                  </div>
                </div>
              </li>
              <li className={sectionClass}>
                <div className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">3</span>
                  <div>
                    <h3 className="text-lg font-semibold">Fix and download</h3>
                    <p className="mt-2 leading-7 text-slate-600">Selected fixes are applied, the rebuilt PDF is validated, and the cleaned file is offered for download only after the output passes safety checks.</p>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="searchable-heading">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className={sectionClass}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Why scans are hard to search</p>
            <h2 id="searchable-heading" className="mt-3 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">A PDF can contain words you can see but your computer cannot search.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Many scanner-generated PDFs store each page primarily as an image. The letters are visible to you, but there may be no useful text layer behind them. That is why Ctrl+F, selection, and copy-and-paste can fail even though the page looks readable.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              OCR analyzes the page image and reconstructs searchable text. PDFBright only targets pages that need it rather than treating every PDF as an image-only document.
            </p>
          </article>

          <article className={sectionClass}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Why scans become huge</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">A few image-heavy pages can make a simple document surprisingly large.</h2>
            <p className="mt-4 leading-7 text-slate-600">
              Scan resolution, color depth, embedded photos, and inefficient image encoding can all increase file size. The right optimization depends on what the PDF actually contains.
            </p>
            <p className="mt-4 leading-7 text-slate-600">
              PDFBright avoids a one-size-fits-all approach. The goal is to reduce unnecessary weight while keeping ordinary text and document content readable.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-slate-950 text-white" aria-labelledby="privacy-heading">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Document privacy</p>
            <h2 id="privacy-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em]">Cleanup claims should match the architecture.</h2>
            <p className="mt-4 leading-7 text-slate-300">{processingCopy}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100" href="/privacy">Privacy policy</Link>
            <Link className="rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-white transition hover:border-slate-500" href="/security">Security overview</Link>
          </div>
        </div>
      </section>

      <SeoClusterLinks currentPath="/clean-scanned-pdf" />

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="faq-heading">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Scanned PDF FAQ</p>
          <h2 id="faq-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Common questions before cleaning a scan</h2>
        </div>

        <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {faqItems.map((item) => (
            <article key={item.question} className="p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight">{item.question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-indigo-100 bg-[linear-gradient(135deg,#eef2ff_0%,#f0f9ff_55%,#ffffff_100%)] px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
          <h2 className="text-3xl font-bold tracking-[-0.035em]">Have a messy scan right now?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Start with the document itself. PDFBright will diagnose the supported issues before asking you to apply fixes.</p>
          <Link className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/#upload">Clean a PDF</Link>
        </div>
      </section>
    </main>
  );
}
