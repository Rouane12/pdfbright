import Link from "next/link";
import { UploadDropzone } from "@/components/upload-dropzone";
import { SeoClusterLinks } from "@/components/seo-cluster-links";
import {
  CURRENT_PROCESSING_CLASS,
  MAX_FILE_SIZE_MB,
  MAX_PAGE_COUNT,
  SERVER_ASSISTED_PROCESSING_ENABLED,
} from "@/lib/security/processing-policy";

type CopyBlock = {
  title: string;
  body: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

export type SeoUseCasePageConfig = {
  path: string;
  eyebrow: string;
  heading: string;
  intro: string;
  trustLine: string;
  benefitsHeading: string;
  benefitsIntro: string;
  benefits: CopyBlock[];
  howHeading: string;
  howIntro: string;
  steps: CopyBlock[];
  explanationEyebrow: string;
  explanationHeading: string;
  explanationParagraphs: string[];
  bestForHeading: string;
  bestFor: string[];
  cautionHeading: string;
  cautionBody: string;
  faqHeading: string;
  faqs: FaqItem[];
  finalHeading: string;
  finalBody: string;
};

const cardClass =
  "rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-8";

export function SeoUseCasePage({ config }: { config: SeoUseCasePageConfig }) {
  const processingCopy = !SERVER_ASSISTED_PROCESSING_ENABLED
    ? `The current ${CURRENT_PROCESSING_CLASS.toLowerCase()} workflow processes supported cleanup in your browser. There is no active document-processing API receiving uploaded PDFs today.`
    : "Some operations may use disclosed server-assisted processing when required. PDFBright explains that before the document is sent.";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-950">
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(224,242,254,0.9),_transparent_36%),radial-gradient(circle_at_85%_18%,_rgba(238,242,255,0.9),_transparent_32%),#f8fbff]">
        <div className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">{config.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              {config.heading}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {config.intro}
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl sm:mt-12">
            <UploadDropzone />
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm font-medium text-slate-500">
            <span>{config.trustLine}</span>
            <span aria-hidden="true">•</span>
            <span>PDF only in V1</span>
            <span aria-hidden="true">•</span>
            <Link className="font-semibold text-indigo-700 hover:underline" href="/privacy">
              Processing & privacy
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="use-case-benefits-heading">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Built around the actual document</p>
          <h2 id="use-case-benefits-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            {config.benefitsHeading}
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{config.benefitsIntro}</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {config.benefits.map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-sm font-bold text-indigo-700" aria-hidden="true">✦</span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70" aria-labelledby="use-case-how-heading">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">How PDFBright handles it</p>
              <h2 id="use-case-how-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{config.howHeading}</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">{config.howIntro}</p>
            </div>

            <ol className="space-y-4">
              {config.steps.map((step, index) => (
                <li key={step.title} className={cardClass}>
                  <div className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 leading-7 text-slate-600">{step.body}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="use-case-explanation-heading">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className={cardClass}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{config.explanationEyebrow}</p>
            <h2 id="use-case-explanation-heading" className="mt-3 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
              {config.explanationHeading}
            </h2>
            {config.explanationParagraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 leading-7 text-slate-600">{paragraph}</p>
            ))}
          </article>

          <div className="grid gap-6">
            <article className={cardClass}>
              <h2 className="text-xl font-bold tracking-tight">{config.bestForHeading}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {config.bestFor.map((item) => (
                  <li key={item} className="flex gap-3"><span className="font-bold text-indigo-600" aria-hidden="true">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </article>
            <article className={cardClass}>
              <h2 className="text-xl font-bold tracking-tight">{config.cautionHeading}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{config.cautionBody}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-slate-950 text-white" aria-labelledby="use-case-privacy-heading">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">Document privacy</p>
            <h2 id="use-case-privacy-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em]">The privacy claim follows the actual processing architecture.</h2>
            <p className="mt-4 leading-7 text-slate-300">{processingCopy}</p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link className="rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-slate-100" href="/privacy">Privacy policy</Link>
            <Link className="rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-white transition hover:border-slate-500" href="/security">Security overview</Link>
          </div>
        </div>
      </section>

      <SeoClusterLinks currentPath={config.path} />

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-20" aria-labelledby="use-case-faq-heading">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">FAQ</p>
          <h2 id="use-case-faq-heading" className="mt-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">{config.faqHeading}</h2>
        </div>

        <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {config.faqs.map((item) => (
            <article key={item.question} className="p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight">{item.question}</h3>
              <p className="mt-2 leading-7 text-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-indigo-100 bg-[linear-gradient(135deg,#eef2ff_0%,#f0f9ff_55%,#ffffff_100%)] px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
          <h2 className="text-3xl font-bold tracking-[-0.035em]">{config.finalHeading}</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">{config.finalBody}</p>
          <Link className="mt-6 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800" href="/#upload">
            Clean a PDF
          </Link>
          <p className="mt-4 text-xs text-slate-500">Current V1 limits: supported PDFs up to {MAX_FILE_SIZE_MB} MB and {MAX_PAGE_COUNT} pages.</p>
        </div>
      </section>
    </main>
  );
}
