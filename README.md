# PDFBright

**Fix messy PDFs in one click.**

PDFBright is a focused PDF cleanup product. The intended workflow is:

**Upload → Diagnose → Fix → Validate → Download**

The product is deliberately not a broad PDF-tool directory. It will diagnose common scan/document problems, explain them in plain language, and apply safe cleanup operations with minimal user configuration.

## Foundation stack

- Next.js App Router
- TypeScript (strict)
- React
- Tailwind CSS
- Node.js 24 LTS baseline
- Vercel deployment target

PDF.js, PDF manipulation, and OCR dependencies are introduced in their dedicated milestones so heavy document-processing code does not enter the initial bundle prematurely.

## Local setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Or run all three:

```bash
npm run check
```

## Environment

Copy `.env.example` to `.env.local` when local configuration is needed. Never commit `.env.local` or privileged credentials.

## Project status

Milestone 0 — Product Foundation is in progress. See `docs/FOUNDATION.md` for the decisions and remaining gates.
