import "./diagnosis.css";
import "./cleanup.css";
import { UploadDropzone } from "@/components/upload-dropzone";

const fixes = [
  {
    title: "Crooked pages",
    description: "Straighten scanned pages without making you tune technical settings.",
  },
  {
    title: "Sideways pages",
    description: "Detect pages that need rotation and orient them correctly.",
  },
  {
    title: "Unsearchable scans",
    description: "Make image-only pages searchable when OCR is available.",
  },
  {
    title: "Blank pages",
    description: "Flag likely scanner blanks so you can review them safely.",
  },
  {
    title: "Large file sizes",
    description: "Reduce oversized PDFs while protecting normal readability.",
  },
  {
    title: "Inconsistent pages",
    description: "Normalize awkward page sizes and orientation where appropriate.",
  },
];

const steps = [
  {
    number: "01",
    title: "Upload",
    description: "Drop in a PDF. No account is required to get started.",
  },
  {
    number: "02",
    title: "We analyze and fix",
    description: "PDFBright will identify the annoying parts and recommend safe fixes in plain language.",
  },
  {
    number: "03",
    title: "Download",
    description: "Review what changed and download a clean, usable PDF.",
  },
];

function BrandLogo() {
  return (
    <span className="brand-logo" aria-label="PDFBright">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <path d="M7.2 3.5h10.2l7.4 7.5v16.3c0 .7-.6 1.2-1.2 1.2H7.2c-.7 0-1.2-.6-1.2-1.2V4.8c0-.7.5-1.3 1.2-1.3Z" fill="white" stroke="currentColor" strokeWidth="2" />
          <path d="M17.4 3.8v6c0 .8.6 1.4 1.4 1.4h5.7" fill="#DDF3FF" stroke="currentColor" strokeWidth="2" />
          <path d="M10 13.5h7M10 17.3h8.5M10 21.1h5.8" stroke="#9FB2C8" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M22 16.2c.8 3.8 2.5 5.5 6.3 6.3-3.8.8-5.5 2.5-6.3 6.3-.8-3.8-2.5-5.5-6.3-6.3 3.8-.8 5.5-2.5 6.3-6.3Z" className="brand-spark" />
        </svg>
      </span>
      <span className="brand-wordmark" aria-hidden="true">
        <span className="brand-wordmark__pdf">PDF</span>
        <span className="brand-wordmark__bright">Br<span className="brand-wordmark__i">i</span>ght</span>
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f8fbff] text-slate-950">
      <header className="site-header">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="#top" className="group inline-flex items-center" aria-label="PDFBright home">
            <BrandLogo />
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex" aria-label="Primary navigation">
            <a className="nav-link" href="#how-it-works">How it works</a>
            <a className="nav-link" href="#pricing">Pricing</a>
            <span className="text-slate-400" aria-disabled="true" title="Accounts will be added later">
              Sign in
            </span>
          </nav>
        </div>
      </header>

      <div id="top" />

      <section className="hero-surface">
        <div className="hero-orb hero-orb--left" aria-hidden="true" />
        <div className="hero-orb hero-orb--right" aria-hidden="true" />
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="eyebrow hero-reveal hero-reveal--1 mx-auto">
              <span className="eyebrow-spark" aria-hidden="true">✦</span>
              A brighter way to clean PDFs
            </div>
            <h1 className="hero-title hero-reveal hero-reveal--2 mt-5 text-balance text-4xl font-bold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
              Fix messy PDFs in one click.
            </h1>
            <p className="hero-copy hero-reveal hero-reveal--3 mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Clean scans, straighten pages, make text searchable, and reduce file size automatically.
            </p>
          </div>

          <div className="hero-upload hero-reveal hero-reveal--4 mx-auto mt-10 max-w-4xl sm:mt-12">
            <UploadDropzone />
          </div>

          <a
            href="#how-it-works"
            className="hero-scroll hero-reveal hero-reveal--5 mx-auto mt-8 flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
          >
            See how it works
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      <section className="section-shell border-y border-slate-200/80 bg-white" aria-labelledby="fixes-heading">
        <div className="section-inner">
          <div className="max-w-2xl">
            <p className="section-kicker">One focused workflow</p>
            <h2 id="fixes-heading" className="section-title">The annoying PDF problems, handled together.</h2>
            <p className="section-copy">
              Instead of making you choose between a dozen separate tools, PDFBright is designed to diagnose the document first and recommend the fixes that actually apply.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fixes.map((fix) => (
              <article key={fix.title} className="feature-card">
                <div className="feature-dot" aria-hidden="true" />
                <h3 className="text-base font-semibold tracking-tight text-slate-950">{fix.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{fix.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-shell" aria-labelledby="how-heading">
        <div className="section-inner">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">How it works</p>
            <h2 id="how-heading" className="section-title">From messy file to usable PDF.</h2>
            <p className="section-copy mx-auto">
              The workflow stays simple even when the document is not.
            </p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell border-y border-slate-200/80 bg-white" aria-labelledby="privacy-heading">
        <div className="section-inner grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="section-kicker">Privacy by design</p>
            <h2 id="privacy-heading" className="section-title">Your document is not our product.</h2>
          </div>
          <div className="trust-card">
            <p className="text-base leading-7 text-slate-700">
              In the current version, supported analysis, cleanup, OCR and file optimization run in your browser. PDFBright does not intentionally upload the selected PDF to a document-processing server. Your browser may still make ordinary requests for app and OCR runtime assets.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              If a future heavy operation needs server processing, PDFBright will disclose that before the document is sent and publish the actual retention and deletion behavior.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="trust-pill">Current processing: local</span>
              <span className="trust-pill">No signup required</span>
              <span className="trust-pill">No document-content analytics</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
              <a className="brand-link" href="/privacy">Privacy details</a>
              <a className="brand-link" href="/security">Security overview</a>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section-shell" aria-labelledby="pricing-heading">
        <div className="section-inner">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Simple pricing</p>
            <h2 id="pricing-heading" className="section-title">Start free. Upgrade when your workflow gets heavier.</h2>
            <p className="section-copy mx-auto">
              Core cleanup is designed to stay useful for free. Pro will add more room for larger files, batch work, and heavier OCR usage.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
            <article className="pricing-card pricing-card--featured">
              <p className="brand-link text-sm font-semibold">Free</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Clean everyday PDFs</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Single-document cleanup with practical limits while we keep local processing generous.</p>
            </article>
            <article className="pricing-card">
              <p className="text-sm font-semibold text-slate-500">Pro · coming later</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">For repeat and heavy use</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Larger documents, batch workflows, higher OCR allowances, and faster server-assisted processing when needed.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-shell border-t border-slate-200/80 bg-white" aria-labelledby="faq-heading">
        <div className="section-inner grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="section-kicker">FAQ</p>
            <h2 id="faq-heading" className="section-title">A few useful answers.</h2>
          </div>
          <div className="space-y-3">
            <details className="faq-item">
              <summary>Do I need an account?</summary>
              <p>No. PDFBright is designed to show value before asking you to create an account.</p>
            </details>
            <details className="faq-item">
              <summary>Does PDFBright upload every file?</summary>
              <p>No. In the current version, supported document processing runs in your browser. If a future server-assisted operation is introduced, PDFBright will disclose it before the document is sent.</p>
            </details>
            <details className="faq-item">
              <summary>Can I use password-protected PDFs?</summary>
              <p>Password-protected files are not part of the initial supported workflow.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="launch-cta mx-auto max-w-4xl px-6 py-10 text-center sm:px-10 sm:py-12">
          <span className="launch-cta__spark" aria-hidden="true">✦</span>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Have a messy PDF?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
            Start with the file. PDFBright is designed to figure out the rest.
          </p>
          <a className="button button--primary mt-6 inline-flex" href="#upload">Clean a PDF</a>
        </div>
      </section>

      <footer className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 PDFBright</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 font-medium">
            <a className="footer-link" href="/privacy">Privacy</a>
            <a className="footer-link" href="/security">Security</a>
          </div>
          <p>Fix messy PDFs in one click.</p>
        </div>
      </footer>
    </main>
  );
}
