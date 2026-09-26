# Free Diagnostic Tools Expansion

**Decision date:** 2026-09-24

## Decision

PDFBright may add a curated **Free Tools** category after the core cleanup product is live, provided the tools remain diagnostic, verification-oriented, or directly adjacent to document cleanup.

This is **not** a pivot into a broad general-purpose PDF suite.

## Product boundary

The tools layer should reinforce PDFBright's existing identity:

**Upload → understand the document → fix only what matters**

Avoid rebuilding commodity tool-directory categories simply because competitors offer them.

Examples that fit:

- upload-readiness checks
- scan-quality diagnostics
- searchability verification
- page-consistency maps
- before-you-send privacy/structure checks
- change receipts between PDF versions

Examples that remain outside this expansion unless future evidence justifies them:

- generic PDF-to-Word conversion
- generic image converters
- standalone merge/split clones
- dozens of unrelated utility buttons

## Free access

Diagnostic tools are intended to be free and usable without an account.

Local processing should be used where practical. Free diagnostics should not silently create server-side document storage.

## Current implementation

The first two live tools are:

1. **PDF Upload Readiness Checker**
2. **PDF Scan Quality Map**

The Scan Quality Map reuses PDFBright's page analysis and adds conservative visual signals for contrast, sharpness, darkness, alignment, blankness, rotation, scan classification, and searchability. These are presented as heuristics rather than print-quality certification.

The Upload Readiness Checker lets users define:

- maximum file size
- maximum page count
- required page format
- whether searchable text is required
- whether page dimensions must be consistent

The tool returns Pass / Review / Fail results and identifies the exact reason a document may be rejected.

## Initial tool backlog

1. PDF Upload Readiness Checker
2. PDF Scan Quality Map
3. Before You Send Checker
4. PDF Searchability Test
5. PDF Page Consistency Map
6. PDF Change Receipt

The first two tools are enabled. The remaining entries may be surfaced as clearly labeled upcoming tools until built and verified.

## Guardrails

- Keep the main homepage focused on the one-click cleanup workflow.
- Keep the tools catalog curated rather than exhaustive.
- Do not claim a tool is unique to PDFBright unless current research supports that exact claim.
- Every indexable tool page must provide real working utility, not thin SEO content.
- Tool analysis must not send filenames, extracted text, OCR content, or page images to analytics.
- New tools must pass the existing accessibility, mobile, privacy, and browser QA expectations before merge.
