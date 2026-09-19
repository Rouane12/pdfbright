# M11 Launch Evidence — 2026-09-16

This file records launch-candidate evidence gathered on top of `billing/paddle-migration`, which is stacked on `m11/full-qa-launch-candidate`.

## Automated CI evidence

GitHub Actions CI run #230 completed successfully on commit `37102f3919b4a84f2424ed1db62b61667d6cead9`.

Green steps:
- production dependency audit
- lint
- typecheck
- M11 source/corpus QA
- production build
- Playwright browser install
- M11 cross-browser launch smoke

Current automated browser coverage includes Chromium, Firefox, WebKit, 320px mobile Chromium, and 390px mobile Chromium.

Automated launch smoke currently verifies:
- all intended public routes render successfully
- one H1 per public page
- no horizontal overflow on tested projects/viewports
- one authoritative global header
- mobile navigation opens and exposes core navigation
- `/sitemap.xml` returns successfully and includes the scanned-PDF SEO cluster
- anonymous entitlement remains Free with 10 MB / 10 pages / 3 OCR pages
- unauthenticated checkout is rejected
- unsigned Paddle webhook payload is rejected
- malformed PDF is rejected safely
- native-text PDF reaches diagnosis
- Free 10-page limit rejects the 25-page fixture
- Free 10 MB limit rejects an oversized fixture
- unsafe page dimensions are rejected
- a cleanup output downloads, reopens with `pdf-lib`, and preserves the expected 2-page count

## Auth evidence

Manual preview verification completed:
- dedicated `/signup` flow tested with a fresh email
- signup verification email opened successfully
- verification link created the account and established an authenticated session
- account page loaded the signed-in identity
- sign-in/signup messaging was separated so registration and authentication have distinct user intent

## Paddle sandbox billing evidence

The complete sandbox path was exercised manually against the deployed Preview.

Verified:
- authenticated monthly checkout opened at $7.99
- Paddle sandbox payment completed
- `subscription.created` delivered successfully
- `transaction.completed` delivered successfully
- Supabase entitlement changed Free -> Pro
- PDFBright account displayed active Pro entitlement
- Paddle customer portal opened through Manage billing
- subscription cancellation was scheduled for the end of the paid billing period
- `subscription.updated` delivered successfully
- PDFBright correctly preserved Pro while the subscription remained active
- account UI now displays the scheduled cancellation date and states that Pro remains active until then
- Vercel Preview Protection was re-enabled after webhook testing

Production/live Paddle setup remains a launch gate; sandbox proof does not substitute for live-mode configuration and validation.

## Privacy / analytics evidence

Live PostHog schema review found PDFBright workflow events such as landing/upload/analysis/cleanup/download/checkout/subscription events.

Observed custom workflow properties did not include:
- PDF filename
- OCR text
- extracted text
- page images
- document contents/subject

Privacy policy was updated during M11 to disclose active PostHog usage, localStorage persistence, standard browser/network metadata, IP-derived approximate location, and the disabled autocapture/pageview/pageleave/session-recording configuration.

## Supabase security evidence

The live project security review was healthy except for one auth-hardening warning: leaked-password protection is disabled. This remains a pre-launch configuration/decision gate.

## Account deletion evidence

The published deletion flow currently uses `support@pdfbright.app` and covers authentication/account records, profile state, entitlement/subscription identifiers no longer required by PDFBright, while acknowledging payment-provider retention obligations.

Still required before launch:
- verify the support address actually receives requests
- exercise one deletion request/manual deletion path end to end against a test account
- confirm deletion removes the intended Supabase auth/profile/account state without claiming deletion of legally retained Paddle records

## Remaining launch gates

The following are not yet considered closed by this evidence file:
- Paddle live-mode credentials/prices/webhook/domain/account approval and one live payment proof
- leaked-password protection decision/configuration
- account deletion support-path proof
- broader keyboard/focus/contrast accessibility pass
- real-device Android Chrome and iOS Safari smoke where practical
- deeper representative PDF output checks for OCR/searchability, blank-page preservation/removal, forms, mixed native/scanned content, and password/encrypted rejection
- performance/memory verification on representative Free/Pro-limit workloads
- production `pdfbright.app` sitemap/Search Console live-fetch verification after promotion

## Launch policy

Do not mark M11 complete while an unresolved P0/P1 remains. PR #15 and PR #14 remain draft until the remaining launch gates are closed or explicitly documented as non-blocking with evidence.
