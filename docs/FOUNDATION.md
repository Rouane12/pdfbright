# PDFBright — Milestone 0 Foundation

Status: complete
Last updated: 2026-09-12

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
- PDF inspection/rendering foundation: Mozilla PDF.js
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

## Completed Milestone 0 gates

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
- Vercel deployment state verified as `READY`.
- `pdfbright.app` purchased through Cloudflare.
- Cloudflare DNS configured for Vercel with proxy disabled as required.
- Vercel reports `pdfbright.app` as `Valid Configuration` on Production.

## Next milestone

Milestone 1 — Marketing Shell + Upload UX.

Billing, authentication, and OCR architecture remain intentionally deferred implementation decisions. Their candidates are recorded now; they are finalized in the milestones where those systems are actually built or benchmarked.
