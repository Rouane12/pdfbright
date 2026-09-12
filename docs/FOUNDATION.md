# PDFBright — Milestone 0 Foundation

Status: in progress
Last updated: 2026-09-12

## Locked decisions

- Public brand: PDFBright
- Core promise: Fix messy PDFs in one click.
- Target production domain: `pdfbright.app` (selected; ownership pending purchase)
- Domain registrar / DNS: Cloudflare
- Application: Next.js App Router + TypeScript + React
- Styling: Tailwind CSS
- Runtime baseline: Node.js 24 LTS
- Frontend hosting: Vercel
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

## Remaining Milestone 0 gates

- Purchase and secure `pdfbright.app` in Cloudflare.
- Import `Rouane12/pdfbright` into Vercel and obtain a minimal preview deployment.
- Verify the preview deployment, then merge the foundation PR to `main`.

Billing, authentication, and OCR architecture remain intentionally deferred implementation decisions. Their candidates are recorded now; they are finalized in the milestones where those systems are actually built or benchmarked.
