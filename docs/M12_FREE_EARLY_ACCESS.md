# Milestone 12 — Free Early Access / Soft Launch

Status: active
Started: 2026-09-19

## Goal

Use the public Free Early Access release to prove real-world reliability before expanding scope or re-enabling paid billing.

The product source plan defines soft launch as a period for limited real usage, failure discovery, copy refinement, reliability fixes and cost verification. PDFBright is now in that phase.

## Public release baseline

- Production: `https://pdfbright.app`
- Public mode: Free Early Access
- Billing: disabled by feature flags
- Anonymous cleanup: enabled
- Current Free limits: 10 MB / 10 pages / 3 OCR pages
- Paid Paddle implementation: preserved, not publicly active

## Non-negotiable guardrails

- do not add broad PDF-suite features
- do not expose Pro checkout while Paddle Live verification is incomplete
- do not weaken privacy language
- do not collect filenames, OCR text, extracted text, page images or document contents in analytics
- do not treat partial/corrupt output as success
- do not use private customer PDFs as permanent test fixtures without explicit permission

## Early Access acceptance loop

### 1. Production smoke

Verify:

- homepage and search-intent pages render
- upload and analysis start correctly
- diagnosis renders
- selected cleanup runs
- output validates
- download works
- clean-another flow works
- unsupported files fail safely
- public paid controls remain absent/disabled

### 2. Support and account operations

Verify:

- `support@pdfbright.app` receives support requests
- published account-deletion instructions are actionable
- one test-account deletion path is exercised end to end
- Supabase auth/profile/account state is removed as promised
- payment-provider retention is not overclaimed

### 3. Manual accessibility/device closure

Finish/document:

- keyboard-only core workflow
- visible focus
- semantic labels
- progress/live-status behavior
- contrast
- reduced-motion behavior
- 320px and 390px layouts
- Android Chrome smoke
- iOS Safari smoke

### 4. Representative document closure

Exercise legal/non-sensitive fixtures covering:

- native text
- image-only scan
- mixed native/scanned document
- blank and near-blank pages
- rotated/landscape pages
- mixed page sizes
- form fields
- annotations where supported
- malformed PDF
- password/encrypted rejection
- representative OCR/searchability
- representative file optimization

### 5. Observe product behavior

Track only privacy-safe product events.

Watch:

- upload → diagnosis rate
- diagnosis → cleanup rate
- cleanup success rate
- cleanup → download rate
- failure category
- processing duration
- returning-user sessions
- second document processed

Do not optimize for time-on-site. A short successful cleanup session is a success.

## Evidence checkpoint — 2026-09-19

### Production/public surface

Verified against `https://pdfbright.app`:

- homepage returns HTTP 200
- canonical/title/description are present
- one homepage H1 is present
- no broken homepage links/resources were reported by the rendered-page audit
- `/sitemap.xml` returns HTTP 200 as `application/xml`
- `/robots.txt` returns HTTP 200 as `text/plain`

The scanned-PDF search cluster was also checked in production. All six routes returned HTTP 200 with their own canonical, title and intent-specific H1, with no broken links/resource errors reported:

- `/clean-scanned-pdf`
- `/make-pdf-searchable`
- `/straighten-pdf`
- `/remove-blank-pages`
- `/compress-scanned-pdf`
- `/improve-scanned-pdf`

### Accessibility defect found and fixed

The first production Lighthouse pass found two concrete homepage issues:

1. the keyboard-focusable before/after illustration used an `aria-label` on a plain `div` without a valid semantic role
2. the blue “Bright” wordmark failed WCAG AA contrast on the mobile audit

PR #18 fixed only those defects:

- the illustration now uses `role="img"` with its existing accessible name
- the wordmark now uses the existing `--accent-strong` brand token

Evidence:

- Vercel preview: Ready
- GitHub Actions CI run #262: success
- production dependency audit: success
- lint: success
- typecheck: success
- M11 source/corpus QA: success
- production build: success
- five-project Playwright smoke (Chromium, Firefox, WebKit, 320px Chromium, 390px Chromium): success
- merge commit: `d5e02f85800b3425e5061116ef42f2290ddb2352`
- production Vercel deployment for that merge: success
- public-domain Lighthouse re-check after deployment:
  - desktop accessibility: 100
  - mobile accessibility: 100
  - prohibited-ARIA audit: pass
  - color-contrast audit: pass

This closes the automated homepage accessibility defects found in this checkpoint. It does not replace the remaining manual keyboard/real-device checks.

### Support channel

The connected support mailbox already contains successful test evidence for `support@pdfbright.app`:

- an inbound test message addressed to `support@pdfbright.app` was received
- a reply was successfully sent from `PDFBright Support <support@pdfbright.app>`

Therefore the “support address receives requests” gate is proven.

### Account deletion

The published `/data-deletion` page was reviewed against the implementation and current providers.

The page:

- tells the user to email the live support address from the account email
- describes identity/control verification before deletion
- limits the promise to PDFBright-controlled auth/account/profile/entitlement data
- does not claim that deleting PDFBright also deletes Google/Facebook identity-provider accounts
- does not overpromise deletion of legally retained payment-provider records
- accurately states that the current local-first workflow does not create a PDFBright cloud document library

Still open:

- exercise one known test-account deletion end to end
- verify the expected Supabase auth/profile/account state is removed
- retain evidence of the completed deletion without storing unnecessary personal data

### Billing state

Public paid billing remains intentionally disabled for Free Early Access. This checkpoint does not activate Paddle Live checkout or billing controls.

## Defect policy

- P0/P1: fix immediately; do not knowingly continue a harmful release
- P2: fix during Early Access when practical
- P3: backlog unless it harms comprehension, accessibility or trust

## Paddle Live activation gate

Paid billing may be re-enabled only after:

1. Paddle Live account/domain verification is approved
2. production credentials/prices/webhook configuration is confirmed
3. one production lifecycle is proven:
   checkout → transaction/subscription webhook → server-side entitlement → account state → billing portal
4. cancellation/update behavior is verified
5. public pricing/terms/refund surfaces match the enabled state
6. Early Access billing feature flags are intentionally flipped

## Exit criteria

Milestone 12 is complete when:

- real users can successfully process real non-test documents
- no known P0/P1 reliability/privacy issue remains
- support/deletion operations are proven
- recurring failure categories are understood
- the first product changes are chosen from observed behavior rather than imagination

After this, move into the first 30-day optimization cycle and decide when to activate paid billing separately.
