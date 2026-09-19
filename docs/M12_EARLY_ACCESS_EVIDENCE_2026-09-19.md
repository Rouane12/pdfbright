# M12 Early Access Evidence — 2026-09-19

This file preserves the first production evidence gathered after PDFBright moved to Free Early Access.

## Release mode

- Public mode: Free Early Access
- Public domain: `https://pdfbright.app`
- Anonymous core cleanup remains available
- Paid billing remains disabled by feature flags
- Paddle implementation remains preserved for later activation

## Production surface evidence

Homepage rendered successfully with HTTP 200.

Rendered-page checks reported:

- correct homepage canonical
- one homepage H1
- no broken links
- no broken resources
- no resource errors

Public crawl infrastructure:

- `/sitemap.xml` — HTTP 200, `application/xml`
- `/robots.txt` — HTTP 200, `text/plain`

Search-entry routes checked successfully:

- `/clean-scanned-pdf`
- `/make-pdf-searchable`
- `/straighten-pdf`
- `/remove-blank-pages`
- `/compress-scanned-pdf`
- `/improve-scanned-pdf`

Each returned HTTP 200 and exposed its own canonical/title/H1 without broken links/resources in the rendered audit.

## Accessibility evidence

Initial public Lighthouse audit exposed:

- prohibited ARIA usage on the keyboard-focusable PDFBright before/after illustration
- insufficient mobile contrast on the “Bright” portion of the wordmark

PR #18 changed only those two concerns.

Preview verification after the fix:

- desktop Lighthouse accessibility: 100
- mobile Lighthouse accessibility: 100
- ARIA prohibited-attribute check: pass
- color-contrast check: pass

Repository verification:

- CI run #262: success
- production dependency audit: success
- lint: success
- typecheck: success
- M11 source/corpus QA: success
- build: success
- cross-browser Playwright launch smoke: success

Playwright matrix:

- Chromium desktop
- Firefox desktop
- WebKit desktop
- Chromium 320px
- Chromium 390px

Production merge:

- commit `d5e02f85800b3425e5061116ef42f2290ddb2352`
- Vercel status: success

Public-domain re-check after production deployment:

- desktop Lighthouse accessibility: 100
- mobile Lighthouse accessibility: 100
- prohibited ARIA: pass
- contrast: pass

## Support-channel evidence

Existing mailbox evidence proves `support@pdfbright.app` works in both directions:

- inbound test mail reached the connected inbox
- a reply was successfully sent using the PDFBright Support sender identity

No test correspondent addresses are recorded in this project file.

## Data-deletion review

The current `/data-deletion` page correctly routes requests through `support@pdfbright.app` and describes the deletion scope conservatively.

It does not promise deletion of:

- external Google/Facebook identity-provider accounts
- provider records that may need to be retained for tax/accounting/fraud/dispute/legal obligations
- a cloud PDF library that PDFBright does not currently maintain

Not yet proven:

- one destructive end-to-end test-account deletion
- confirmed removal of intended Supabase auth/profile/account records

Do not mark that destructive gate complete until a specific disposable test account is intentionally selected and verified.

## Remaining M12 manual gates

- keyboard-only full workflow pass
- focus-state/manual screen-reader-oriented review
- real-device Android Chrome smoke
- real-device iOS Safari smoke
- representative PDF manual/output checks across the remaining corpus
- representative performance/memory checks
- account deletion end-to-end proof
- real-user Early Access feedback/failure observation
- Paddle Live activation only after external approval and a fresh live lifecycle proof
