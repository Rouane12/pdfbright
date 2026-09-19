# PDFBright — Foundation and Current Milestone State

Status: Free Early Access is live; paid Paddle billing remains gated
Last updated: 2026-09-19

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
- PDF inspection/rendering: Mozilla PDF.js 6.2.108
- PDF manipulation: pdf-lib 1.17.1
- OCR: Tesseract.js 7.0.0 for supported local workloads
- Processing model: local-first; server-assisted only where quality/performance requires it
- Analytics: PostHog, with document content and filenames prohibited from event payloads
- Authentication: Supabase Auth; no account required before first product value
- Billing provider: Paddle
- Initial Pro pricing target: $7.99/month or $59.99/year

## Current public mode — Free Early Access

PDFBright is publicly deployed from `main` as Free Early Access.

Paid billing is intentionally disabled while Paddle Live verification remains incomplete:

- `BILLING_ENABLED=false`
- `NEXT_PUBLIC_BILLING_ENABLED=false`

The Paddle implementation remains in the repository for later activation, but public checkout and billing controls must stay disabled until Live approval is complete and the production lifecycle is re-proven.

Current anonymous safety envelope:

- 10 MB maximum file size
- 10 page maximum document length
- 3 OCR pages
- anonymous basic cleanup remains available without account creation

## Completed implementation

Milestones 0–10 are implemented and the Milestone 11 automated launch-candidate foundation is integrated into `main`.

Implemented product capabilities include:

- marketing/upload experience
- local PDF analysis with fact-vs-heuristic findings
- plain-language diagnosis and optional customization
- rotation correction
- reviewed blank-page removal
- conservative straightening/readability cleanup
- safe page normalization
- searchable-PDF OCR for supported local workloads
- file optimization modes
- before/after review
- processing/result/download flow
- privacy/security hardening
- Supabase authentication/account foundation
- SEO/search pages, sitemap, canonicals and Search Console support
- privacy-conscious PostHog analytics
- Paddle sandbox billing lifecycle
- automated launch QA across Chromium, Firefox, WebKit and mobile viewport smoke tests

## OCR architecture decision

Measured browser OCR showed small workloads are practical, while large local jobs become too slow for normal UX.

Current policy:

- small supported OCR jobs may run locally
- large OCR jobs are not silently attempted in the browser
- a future heavy/server-assisted OCR path requires explicit disclosure, privacy controls and deletion handling before activation

## Paddle status

Sandbox lifecycle proof is complete:

- authenticated checkout
- subscription creation
- transaction completion
- Supabase Pro entitlement sync
- customer billing portal
- scheduled cancellation
- entitlement preservation through the paid period
- webhook rejection boundaries

Production paid launch remains gated by:

- Paddle Live account/domain approval
- final production Live configuration
- one production checkout → webhook → entitlement → portal lifecycle proof

Do not enable public paid checkout before those gates pass.

## Current launch/QA state

The Free Early Access release commit was merged to `main` on 2026-09-19 and Vercel reported a successful deployment.

Remaining Early Access reliability work:

1. finish/document production smoke checks on `pdfbright.app`
2. prove the published account-deletion/support path with a test account
3. finish manual keyboard/focus/contrast checks
4. perform real-device Android Chrome / iOS Safari smoke where practical
5. finish representative PDF output checks for OCR, blank-page behavior, forms, mixed content and password/encrypted rejection
6. verify representative performance/memory behavior
7. keep Paddle Live activation separate until external verification is complete

## Current core flow

**Upload → Analyze → Diagnose → Fix My PDF → Validate → Download**

## Scope guardrail

Do not expand PDFBright into a broad PDF-suite while Early Access reliability is still being proven.

No V1 feature should be added unless it strengthens the cleanup flow, commercial viability, or privacy/security.

## Next milestone

**Milestone 12 — Free Early Access / Soft Launch**

The immediate goal is not feature expansion. It is to observe real usage, collect failures/confusion, fix reliability issues, validate support operations, and build the first post-launch decisions from actual behavior.
