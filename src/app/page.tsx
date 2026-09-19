import "./diagnosis.css";
import "./cleanup.css";
import "./brand-sections.css";
import "./identity-v2.css";
import { UploadDropzone } from "@/components/upload-dropzone";

type FixIconKind = "straighten" | "rotate" | "ocr" | "blank" | "compress" | "normalize";

const fixes: Array<{ title: string; description: string; icon: FixIconKind }> = [
  {
    title: "Crooked pages",
    description: "Straighten scanned pages without making you tune technical settings.",
    icon: "straighten",
  },
  {
    title: "Sideways pages",
    description: "Detect pages that need rotation and orient them correctly.",
    icon: "rotate",
  },
  {
    title: "Unsearchable scans",
    description: "Make image-only pages searchable when OCR is available.",
    icon: "ocr",
  },
  {
    title: "Blank pages",
    description: "Flag likely scanner blanks so you can review them safely.",
    icon: "blank",
  },
  {
    title: "Large file sizes",
    description: "Reduce oversized PDFs while protecting normal readability.",
    icon: "compress",
  },
  {
    title: "Inconsistent pages",
    description: "Normalize awkward page sizes and orientation where appropriate.",
    icon: "normalize",
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

function ProblemIcon({ kind }: { kind: FixIconKind }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "straighten") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="m7 4 9-1 2 15-9 1L7 4Z" />
        <path {...common} d="M4 20h16M7 16l11-1" />
      </svg>
    );
  }

  if (kind === "rotate") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7.2 7.4A7 7 0 1 1 5 13" />
        <path {...common} d="M7.2 3.8v3.6H3.6" />
        <rect {...common} x="9" y="8" width="7" height="9" rx="1.4" />
      </svg>
    );
  }

  if (kind === "ocr") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M6 3.5h8l4 4V20H6V3.5Z" />
        <path {...common} d="M14 3.8V8h4M9 12h6M9 15h4" />
        <path {...common} d="m16.5 16.5 3 3M18.6 15.2a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" />
      </svg>
    );
  }

  if (kind === "blank") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M6 3.5h8l4 4V20H6V3.5Z" />
        <path {...common} d="M14 3.8V8h4" />
        <path {...common} d="M9 14h6" />
      </svg>
    );
  }

  if (kind === "compress") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M8 3.5h8v17H8z" />
        <path {...common} d="m3.5 9 3 3-3 3M20.5 9l-3 3 3 3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect {...common} x="4" y="5" width="7" height="11" rx="1.4" />
      <rect {...common} x="13" y="8" width="7" height="11" rx="1.4" />
      <path {...common} d="M8 19h8M10 17l-2 2 2 2M14 17l2 2-2 2" />
    </svg>
  );
}

function BrighteningDemo() {
  return (
    <div className="bright-demo" role="img" tabIndex={0} aria-label="Illustration of a messy PDF becoming cleaner and more usable">
      <div className="bright-demo-header" aria-hidden="true">
        <span className="bright-demo-label">Before</span>
        <span className="bright-demo-label bright-demo-label--after">After PDFBright</span>
      </div>

      <div className="bright-demo-stage" aria-hidden="true">
        <div className="demo-page demo-page--before">
          <span className="demo-page-fold" />
          <div className="demo-page-title" />
          <div className="demo-line demo-line--mid" />
          <div className="demo-line demo-line--short" />
          <div className="demo-scan-block" />
          <div className="demo-page-meta">
            <span className="demo-chip">crooked</span>
            <span className="demo-chip">image-only</span>
            <span className="demo-chip">oversized</span>
          </div>
        </div>

        <span className="demo-arrow">→</span>

        <div className="demo-page demo-page--after">
          <span className="demo-page-fold" />
          <div className="demo-page-title" />
          <div className="demo-line demo-line--mid" />
          <div className="demo-line demo-line--short" />
          <div className="demo-scan-block" />
          <div className="demo-page-meta">
            <span className="demo-chip">straightened</span>
            <span className="demo-chip">searchable</span>
            <span className="demo-chip">optimized</span>
          </div>
        </div>
      </div>

      <div className="demo-outcomes" aria-hidden="true">
        <span className="demo-outcome">Straightened</span>
        <span className="demo-outcome">Searchable</span>
        <span className="demo-outcome">Optimized</span>
        <span className="demo-outcome demo-outcome--spark">Still your document</span>
      </div>
    </div>
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

          <div id="upload" className="hero-upload hero-reveal hero-reveal--4 mx-auto mt-10 max-w-4xl scroll-mt-24 sm:mt-12">
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

      <section className="section-shell brand-band brand-band--white border-y border-slate-200/80" aria-labelledby="fixes-heading">
        <div className="section-inner section-reveal">
          <div className="max-w-2xl">
            <p className="section-kicker section-kicker--spark">One focused workflow</p>
            <h2 id="fixes-heading" className="section-title">The annoying PDF problems, handled together.</h2>
            <p className="section-copy">
              Instead of making you choose between a dozen separate tools, PDFBright is designed to diagnose the document first and recommend the fixes that actually apply.
            </p>
          </div>

          <div className="feature-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fixes.map((fix) => (
              <article key={fix.title} className="feature-card">
                <div className="problem-icon" aria-hidden="true">
                  <ProblemIcon kind={fix.icon} />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-slate-950">{fix.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{fix.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell identity-demo-section" aria-labelledby="bright-demo-heading">
        <div className="section-inner section-reveal identity-demo-layout">
          <div className="identity-demo-copy">
            <p className="section-kicker section-kicker--spark">The PDFBright effect</p>
            <h2 id="bright-demo-heading" className="section-title">Messy in. Clear out.</h2>
            <p className="section-copy">
              PDFBright is built around one visual idea: the document stays yours while the annoying parts get straightened, clarified, and cleaned up around it.
            </p>
            <p className="mt-5 text-sm font-semibold text-slate-500">Hover or focus the preview to see the brightening sweep.</p>
          </div>
          <BrighteningDemo />
        </div>
      </section>

      <section id="how-it-works" className="section-shell brand-band brand-band--soft" aria-labelledby="how-heading">
        <div className="section-inner section-reveal">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker section-kicker--spark">How it works</p>
            <h2 id="how-heading" className="section-title">From messy file to usable PDF.</h2>
            <p className="section-copy mx-auto">
              The workflow stays simple even when the document is not.
            </p>
          </div>

          <div className="steps-grid mt-10 grid gap-4 lg:grid-cols-3">
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

      <section className="section-shell brand-band brand-band--mist border-y border-slate-200/80" aria-labelledby="privacy-heading">
        <div className="section-inner section-reveal grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="section-kicker section-kicker--spark">Privacy by design</p>
            <h2 id="privacy-heading" className="section-title">Your document is not our product.</h2>
            <p className="section-copy">
              Keep the workflow simple without turning your files into somebody else&apos;s dataset.
            </p>
          </div>
          <div className="trust-card">
            <div className="trust-label">Local-first by default</div>
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

      <section id="pricing" className="section-shell brand-band brand-band--white" aria-labelledby="pricing-heading">
        <div className="section-inner section-reveal">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker section-kicker--spark">Free Early Access</p>
            <h2 id="pricing-heading" className="section-title">PDFBright is free while we learn from real documents.</h2>
            <p className="section-copy mx-auto">
              Use the core cleanup workflow without a subscription. We are launching early so real usage can show us what people value before paid plans return.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <article className="pricing-card pricing-card--featured">
              <span className="pricing-badge">Early Access</span>
              <div className="pricing-price-row">
                <span className="pricing-price">$0</span>
                <span className="pricing-period">while Early Access is active</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">Clean everyday PDFs without a subscription</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Upload a PDF, let PDFBright diagnose what can be improved, apply the recommended cleanup, and download the result.
              </p>
              <ul className="pricing-list">
                <li>Core diagnosis and cleanup workflow</li>
                <li>Up to 10 MB and 10 pages per PDF</li>
                <li>Up to 3 OCR pages per document</li>
                <li>Local-first processing for supported operations</li>
                <li>No account required to clean a PDF</li>
              </ul>
              <a className="button button--primary mt-6 inline-flex" href="#upload">Clean a PDF for free</a>
              <p className="pricing-note">
                Paid plans are intentionally paused during Early Access. Real usage will help us decide what deserves a paid tier later.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section-shell brand-band brand-band--soft border-t border-slate-200/80" aria-labelledby="faq-heading">
        <div className="section-inner section-reveal grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="section-kicker section-kicker--spark">FAQ</p>
            <h2 id="faq-heading" className="section-title">A few useful answers.</h2>
            <p className="section-copy">Short answers to the things people should know before trusting a PDF tool with their documents.</p>
          </div>
          <div className="space-y-3">
            <details className="faq-item">
              <summary>Do I need an account?</summary>
              <p>No. PDFBright is designed to show value before asking you to create an account.</p>
            </details>
            <details className="faq-item">
              <summary>Is PDFBright really free right now?</summary>
              <p>Yes. PDFBright is launching in free Early Access so we can learn from real usage before enabling paid plans.</p>
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
