# PDFBright — Foundation and Current Milestone State

Status: Milestones 0–2 complete
Last updated: 2026-09-13

## Locked decisions

- Public brand: PDFBright
- Core promise: Fix messy PDFs in one click.
- Production domain: `pdfbright.app`
- Domain registrar / DNS: Cloudflare
- Application: Next.js App Router + TypeScript + React
- Styling: Tailwind CSS
- Runtime baseline: Node.js 24 LTS
- Frontend hosting: Vercel
- Vercel project: `pdfbright`
- Git integration: `Rouane12/pdfbright` → Vercel
- First Vercel deployment: READY on 2026-09-12
- `pdfbright.app` connected to Vercel Production with valid DNS configuration on 2026-09-12
- PDF inspection/rendering: Mozilla PDF.js 6.2.108
- PDF manipulation candidate: pdf-lib, subject to compatibility testing
- OCR prototype: Tesseract.js in workers
- Processing model: local-first; server-assisted only where quality/performance requires it
- Analytics: PostHog, with document content and filenames prohibited from event payloads
- Authentication candidate: Supabase Auth; no account required before first product value
- Billing candidate: Lemon Squeezy

## Environment rules

- Local secrets belong in `.env.local`; `.env*` files are ignored except `.env.example`.
- Browser-visible values must use the `NEXT_PUBLIC_` prefix intentionally.
- Service-role, billing, webhook, and other privileged secrets must never be exposed to client bundles.
- Production secrets are configured in the deployment platform, not committed to Git.

## Engineering conventions

- TypeScript `strict` mode stays enabled.
- New application code lives under `src/`.
- Prefer server components by default; use client components only for browser interaction.
- PDF/OCR-heavy libraries must not enter the initial marketing bundle unnecessarily.
- Long-running PDF/OCR work must not block the UI thread.
- Never log filenames, extracted/OCR text, page images, or document content.
- No V1 feature is added unless it supports Upload → Diagnose → Fix → Download, commercial viability, or privacy/security.

## Completed Milestone 0 — Product Foundation

- Public product name selected: PDFBright.
- Naming/domain research completed sufficiently for foundation work.
- Repository created and foundation scaffold established.
- Next.js + TypeScript + React + Tailwind stack confirmed.
- Node.js 24 LTS baseline established.
- Environment/secrets conventions documented.
- Analytics, billing, auth, PDF, and OCR candidates documented.
- GitHub Actions quality checks passed for lint, typecheck, and production build.
- Foundation PR merged into `main`.
- `Rouane12/pdfbright` imported into Vercel.
- Vercel detected Next.js correctly and deployed the foundation successfully.
- `pdfbright.app` purchased through Cloudflare.
- Cloudflare DNS configured for Vercel with proxy disabled as required.
- Vercel reports `pdfbright.app` as `Valid Configuration` on Production.

## Completed Milestone 1 — Marketing Shell + Upload UX

- Marketing homepage shell implemented.
- Accessible PDF-only upload/drop zone implemented.
- File validation, selected-file state, replace/remove controls, and friendly invalid-file handling implemented.
- Responsive behavior verified at 390 px and 320 px widths.
- Desktop and mobile visual acceptance completed.
- PR #2 merged into `main` and deployed to `pdfbright.app`.

## Completed Milestone 2 — PDF Analysis Engine

- PDF.js 6.2.108 integrated with a matching self-hosted worker.
- Local browser analysis implemented without modifying the source PDF.
- Page count, dimensions, display dimensions, rotation, orientation, and extractable-text detection implemented.
- Image-backed/textless page classification implemented.
- Low-resolution analysis rendering and a dedicated pixel-analysis Web Worker implemented.
- Blank-page heuristic prototype implemented.
- Skew-detection heuristic prototype implemented and tuned against a controlled fixture.
- Mixed page-size and mixed-orientation detection implemented.
- Typed fact-vs-heuristic structured result schema implemented.
- Real progress, cancellation, and friendly analysis failure states implemented.
- Gated `?debug=analysis` diagnostics view added for engineering validation only.
- Clean 10-page text PDF validated with no false problem findings.
- Controlled 5-page messy fixture validated with expected output: 3 textless pages, 2 probable scans, 1 blank candidate, 1 rotated page, 1 likely skewed page, mixed sizes, and mixed orientation.
- GitHub CI passed lint, typecheck, and production build on the tested M2 head.
- PR #3 merged into `main` as merge commit `e7b7162cc24bf396ca4990e90ec9355b8fb5b5ce`.
- Vercel production deployment for the M2 merge completed successfully.

## Next milestone

Milestone 3 — Diagnosis Experience.

The next milestone converts the structured M2 analysis into clear human-readable findings and recommendations. It must not perform PDF cleanup yet.

Billing, authentication, OCR, and final cleanup architecture remain intentionally deferred to their planned milestones.
