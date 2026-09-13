# Milestone 8 — Privacy, Security & Trust

Date: 2026-09-13

## Decision

PDFBright's current document-processing class is **local**.

The current application has no active server-assisted document-processing route. Supported analysis, visual cleanup, OCR, file optimization, output reconstruction, validation and preview generation run in the browser.

This is a statement about the current implementation, not a permanent promise. The browser still makes ordinary network requests to load the application and OCR/runtime assets.

## Current document data flow

1. User selects a PDF in the browser.
2. PDFBright performs local preflight validation.
3. PDF.js parses/analyzes the document in browser-side code/workers.
4. Selected cleanup operations run locally.
5. Tesseract.js OCR runs locally for supported OCR target counts.
6. The output PDF is reconstructed and reopened locally for validation.
7. The result is exposed through a browser object URL for download.
8. Replacing/removing the file, starting another cleanup, navigating away or closing/reloading the page releases PDFBright's in-app references.

No PDFBright document-processing API currently receives selected PDF bytes.

## Current safety limits

Centralized in `src/lib/security/processing-policy.ts`:

- maximum file size: **25 MB**
- maximum document length: **25 pages**
- maximum page width/height: **7,200 PDF points**
- PDF header scan: first **1,024 bytes**
- PDF preflight parse timeout: **15 seconds**
- local OCR limit: **10 OCR target pages** (M5 benchmark decision)

M9 can layer plan/entitlement limits on top of these values. Hard safety limits must remain explicit and centralized.

## File validation hardening

Before full analysis PDFBright now:

- checks PDF filename/MIME intent
- rejects zero-byte files
- enforces the size limit
- checks for a `%PDF-` header within the first 1 KiB
- parses the PDF with PDF.js
- rejects password-protected/encrypted PDFs
- rejects malformed/unreadable PDFs with controlled errors
- enforces a page-count limit
- rejects invalid or pathological page dimensions
- times out preflight parsing
- maps unknown validation failures to a generic safe error rather than exposing stack traces

The existing analysis/cleanup layers continue to fail closed on unsupported or invalid output.

## Output integrity controls already proven before M8

- output must serialize as a PDF
- expected page count must match intended changes
- native text pages are checked for unexpected text loss
- OCR pages are checked for retained searchable text
- visual pages are checked for drawing operations
- annotated pages are skipped by visual raster replacement
- the original input File object is never modified

## Server isolation / deletion / rate limits

**Not applicable to the current document-processing path because server-assisted document processing is disabled.**

Before any future server-processing path is enabled, PDFBright must implement and disclose:

- isolated worker/container processing
- private temporary object storage
- opaque identifiers
- signed short-lived access
- CPU/RAM/time/job limits
- rate limits / anonymous quotas where server cost exists
- automatic deletion plus deletion retries
- no transient-file backups where avoidable
- document-content-free logs
- a published retention window
- clear in-product disclosure before the document is sent

The M5 architecture decision already requires heavy OCR to use a separate worker/queue/container rather than a long-running frontend serverless request.

## Error redaction

Current user-facing analysis, preflight and cleanup failures use controlled messages. Unknown errors fall back to generic failure text. Raw stack traces and arbitrary exception strings are not shown in the normal UI.

Debug panels expose structured engineering metrics only and are gated behind explicit `?debug=` query modes.

## Browser/web hardening

`next.config.ts` sends baseline security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- restrictive `Permissions-Policy` for camera, microphone, geolocation, payment and USB
- DNS prefetch disabled

A strict Content Security Policy is intentionally not claimed yet; OCR/PDF worker and runtime asset behavior should be fully inventoried before locking a CSP that could silently break document processing.

## Dependency audit

CI now runs `npm audit --omit=dev --audit-level=high` in addition to lint, typecheck and production build.

High/critical production dependency advisories are treated as M8 blockers unless a documented, non-exploitable exception is reviewed.

## Published trust surfaces

M8 adds:

- `/privacy`
- `/security`
- privacy link next to the upload trust copy
- homepage privacy/security links
- footer privacy/security links

Published wording deliberately avoids unsupported claims such as “100% private,” “zero knowledge,” “military-grade,” or a permanent guarantee that files can never leave the device.

## Policy update gates

The Privacy/Security pages describe the current product only. They must be reviewed again before:

- M9 authentication/billing
- M10 analytics/error monitoring
- any server-assisted OCR or other document upload path
- any cloud document history/storage feature

Terms of Service, cookie disclosure where applicable, and a production support/security contact remain launch-policy requirements and must be finalized before public launch.

## M8 definition-of-done interpretation

M8 is complete when:

1. the hardened preflight accepts normal PDFs and safely rejects invalid/oversized/over-page-limit inputs;
2. the current processing classification is accurately presented as local;
3. no server retention/deletion claim is invented while no server document storage exists;
4. dependency audit, lint, typecheck and build are green;
5. privacy/security pages match the actual current implementation;
6. desktop/mobile trust UI has no regression.
