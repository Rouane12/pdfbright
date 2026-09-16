# Milestone 11 — Full QA / Launch Candidate

Status: in progress on `m11/full-qa-launch-candidate`
Started: 2026-09-16

## Goal

Prove PDFBright is safe to launch. M11 is a verification/fix milestone, not a feature-expansion milestone.

Definition of done from the product source pack:

> No launch-blocking data-loss/output-corruption/security issue remains.

## Severity and launch policy

- **P0 — release blocker:** document exposure, output corruption/data loss at scale, payment/security breach.
- **P1 — release blocker unless explicitly proven isolated/mitigated:** major processing outage, widespread download failure, billing entitlement failure, destructive PDF transformation, privacy claim mismatch.
- **P2 — fix during M11 where practical:** isolated operation degradation, browser-specific bug, isolated output-quality issue.
- **P3 — post-launch backlog candidate:** cosmetic or low-impact polish that does not threaten comprehension, accessibility, trust, payment, or document integrity.

A launch candidate cannot be declared while an unresolved P0/P1 remains.

## Automated QA foundation

CI now runs `npm run qa` before the production build.

### `qa:source`

Checks launch invariants that should never silently regress:

- one authoritative root `GlobalSiteHeader`
- legacy homepage header suppressed from rendering/accessibility
- all scanned-PDF search routes present in sitemap
- API routes remain excluded by robots rules
- sitemap remains advertised in robots
- current document processing remains explicitly local
- server-assisted document processing remains disabled unless deliberately introduced and re-reviewed
- login/signup/account remain `noindex`
- product analytics source does not include filename/document-content fields

### `qa:corpus`

Generates a fresh, non-sensitive synthetic PDF corpus and validates its structure before it is used for workflow QA.

Generated cases:

- native text PDF
- rotated metadata + landscape pages
- blank + near-blank page
- mixed page sizes
- 25-page long document
- image-only scan-like PDF
- mixed native-text + image-only PDF
- interactive form PDF
- intentionally malformed PDF that must reject safely

Generated corpus lives in `.qa-corpus/` and is ignored by Git.

## Required corpus coverage

The final M11 corpus must cover the source-pack matrix. Generated fixtures cover many structural cases; the remaining cases require legal/non-sensitive manual fixtures or generated additions before launch.

| Corpus case | Coverage | Launch expectation |
| --- | --- | --- |
| Native text PDF | automated fixture | text preserved; no unnecessary rasterization |
| Image-only scan | automated fixture | diagnosis is safe; OCR path only when supported |
| Mixed text + scans | automated fixture | native text preserved; scan pages handled selectively |
| Landscape pages | automated fixture | orientation remains intentional |
| Rotated metadata pages | automated fixture | rotation detected/corrected when selected |
| Visibly skewed pages | manual/generated visual fixture required | conservative deskew; uncertain pages preserved |
| Blank pages | automated fixture | blank finding shown; no unsafe silent deletion |
| Near-blank/faint signature | automated fixture | must not be treated as certainly blank |
| Large embedded photos | additional generated fixture required | optimization must preserve usable quality |
| Black-and-white scan | manual/generated visual fixture required | readable output |
| Color scan | manual/generated visual fixture required | color/readability preserved |
| Low-resolution scan | manual/generated visual fixture required | no destructive enhancement claims |
| High-resolution scan | manual/generated visual fixture required | memory-safe processing |
| Mixed page sizes | automated fixture | normalization only when safe |
| Unusual fonts | manual fixture required | visible content preserved |
| Forms | automated fixture | no unexpected content loss |
| Annotations | manual fixture required | no unexpected content loss |
| Malformed PDF | automated fixture | safe rejection; no partial success |
| Password/encrypted PDF | manual fixture required | safe unsupported/rejection state |
| Very long document | automated 25-page V1-limit fixture | limits enforced and UI remains responsive |

Never promote private customer documents into permanent fixtures without explicit permission.

## Output-integrity matrix

For every cleanup mode/fixture where the operation is applicable, verify:

- [ ] output opens successfully after download
- [ ] expected page count
- [ ] expected page order
- [ ] no silent page omission
- [ ] intended orientation
- [ ] visible content preserved
- [ ] OCR pages are genuinely searchable
- [ ] copy/paste is reasonable on representative OCR samples
- [ ] no unexpected blank output
- [ ] metadata behavior matches policy
- [ ] output can be opened by at least browser viewer + a second major viewer
- [ ] failure never presents a partial/corrupt file as success
- [ ] original local file remains untouched

## Core workflow matrix

Test the full anonymous path:

- [ ] landing → upload
- [ ] preflight validation
- [ ] analysis progress
- [ ] diagnosis findings
- [ ] advanced fix selection
- [ ] Fix My PDF
- [ ] processing progress
- [ ] output validation
- [ ] result summary
- [ ] download
- [ ] clean another PDF
- [ ] invalid PDF rejection
- [ ] over-limit file rejection
- [ ] over-limit page-count rejection
- [ ] unsupported/password-protected rejection
- [ ] cancellation/failure recovery where available

## Browser and responsive matrix

### Desktop

- [ ] Chrome — common desktop width
- [ ] Edge — common desktop width
- [ ] Firefox — common desktop width
- [ ] Safari — common desktop width

### Mobile/tablet

- [ ] 320px viewport
- [ ] 390px viewport
- [ ] tablet viewport
- [ ] Chrome Android
- [ ] Safari iOS

For every representative viewport/browser verify:

- no horizontal overflow
- upload control remains usable
- filename/progress/error states do not collide
- diagnosis cards remain readable
- advanced controls are operable
- processing state does not trap navigation/focus
- result/download controls remain visible and usable
- global navigation has one visible header only
- mobile menu opens, closes/navigates, and has accessible labels

## Accessibility gate

Aim for WCAG AA-quality fundamentals:

- [ ] semantic landmarks/headings
- [ ] one logical H1 per page
- [ ] keyboard-only core workflow
- [ ] visible focus states
- [ ] adequate contrast
- [ ] screen-reader labels for upload/navigation/actions
- [ ] live progress/status announcements
- [ ] no pointer-only required interaction
- [ ] no motion required to understand processing/result state
- [ ] details/accordion controls keyboard operable
- [ ] reduced-motion behavior does not hide information

## Performance and memory gate

Marketing/search surfaces:

- [ ] PDF/OCR processing code is not unnecessarily executed before user intent
- [ ] no obvious layout instability on first load
- [ ] SEO pages remain responsive on mobile

Processing flow:

- [ ] heavy analysis/OCR work does not freeze the main UI for long periods
- [ ] canvases/temporary render state are released where applicable
- [ ] page processing stays within V1 25-page hard limit
- [ ] representative 10-page Free and 25-page Pro-limit documents complete or fail safely
- [ ] OCR cap behavior remains 3 pages Free / 10 pages Pro
- [ ] memory pressure does not produce corrupt success output

## Auth / billing / entitlement gate

M9 remains commercially incomplete until the real path is proven end to end.

- [ ] anonymous basic cleanup works without login
- [ ] signup/login works
- [ ] session persists appropriately
- [ ] monthly checkout starts only for authenticated user
- [ ] yearly checkout starts only for authenticated user
- [ ] successful Lemon Squeezy purchase webhook grants Pro
- [ ] entitlement endpoint reflects Pro server-side
- [ ] Pro 25 MB / 25-page limits are applied
- [ ] Pro OCR allowance is applied
- [ ] billing portal opens for entitled customer
- [ ] cancellation/update webhook changes entitlement correctly
- [ ] failed/invalid webhook does not grant entitlement
- [ ] frontend cannot grant itself Pro without server-side state

## Privacy / security / deletion gate

- [ ] published privacy wording matches local-first implementation
- [ ] selected PDF is not sent to a document-processing API in current V1
- [ ] analytics contain no filename
- [ ] analytics contain no extracted text/OCR content/page image/document subject
- [ ] errors are sanitized
- [ ] account/data deletion flow works as documented
- [ ] password/malformed files reject safely
- [ ] file/page/dimension/time safety limits hold
- [ ] production dependency audit passes

## SEO / production-readiness adjunct

This is not the core M11 definition of done, but it must be closed before public launch:

- [ ] production `https://pdfbright.app/sitemap.xml` returns HTTP 200
- [ ] sitemap contains all intended public/indexable routes
- [ ] Search Console live test can fetch the sitemap
- [ ] Search Console property verified
- [ ] sitemap resubmitted after the M10/M11 production promotion
- [ ] investigate if Search Console still reports `Couldn't fetch` after production is stable and Google has retried

## Defect ledger

### M11-001 — duplicate homepage header

**Severity:** P2 accessibility/navigation defect with launch impact.

**Found:** root layout renders `GlobalSiteHeader` while homepage retained the pre-global `.site-header` shell.

**Fix:** keep the root/global header authoritative and suppress the stale `.site-header` from layout/accessibility through the M11 launch-fix stylesheet. The global header retains the real auth-aware Sign in/Account navigation.

**Regression:** `qa:source` requires one root `GlobalSiteHeader` and the legacy header suppression rule.

**Status:** fixed in branch; browser verification pending.

## Launch-candidate decision

M11 is complete only when:

1. automated CI/QA is green,
2. required browser/mobile/accessibility checks are complete,
3. representative PDF corpus output has been reopened and checked,
4. billing/auth entitlement E2E is proven,
5. privacy/deletion behavior is proven,
6. no P0/P1 remains open.
