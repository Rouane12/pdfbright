# Milestone 10 — SEO / Analytics Foundation

Status: implementation complete on `m10/seo-analytics-foundation`
Last updated: 2026-09-16

## Goal

Make PDFBright discoverable and measurable without turning the product into a thin SEO page farm or collecting document content.

## SEO foundation

- Root metadata defines the PDFBright site identity, title template, description, Open Graph and Twitter metadata.
- Public routes use canonical URLs.
- `/sitemap.xml` includes the homepage, the first useful SEO/use-case page, and public trust/legal routes.
- `/robots.txt` allows public crawling, points to the sitemap, and keeps API routes out of search crawling.
- Authentication/account routes use `noindex` metadata.
- `pdfbright.app` is the canonical production host.
- Optional Google Search Console URL-prefix verification is supported through the server-only `GOOGLE_SITE_VERIFICATION` environment variable.

## First useful indexable page

Route: `/clean-scanned-pdf`

This is a functioning workflow page, not a keyword doorway. It includes the real PDF uploader and original guidance covering:

- crooked scanned pages
- sideways pages
- image-only/searchability problems
- OCR behavior and limitations
- likely blank-page review
- scan-heavy file size
- inconsistent pages
- current privacy/processing behavior
- scanned-PDF FAQs

The page has its own title, description, canonical, Open Graph URL/copy and Twitter metadata and is included in the sitemap.

## Analytics foundation

PostHog is configured with deliberate manual capture:

- autocapture disabled
- automatic pageview/pageleave capture disabled
- session recording disabled
- document content and filenames excluded from analytics design

Acquisition landing paths currently measured:

- `/`
- `/clean-scanned-pdf`

`landing_view` includes `landing_path` so SEO/use-case acquisition can be separated from homepage acquisition.

Core product funnel events include:

- `landing_view`
- `pricing_view`
- `how_it_works_view`
- `upload_started`
- `upload_completed`
- `analysis_started`
- `analysis_completed`
- `diagnosis_viewed`
- `cleanup_started`
- `cleanup_completed`
- `download_clicked`

Commercial events include trusted checkout and webhook-side purchase/subscription events, including purchase completion, renewals and cancellations.

## Error monitoring

Handled PDF workflow failures and unhandled App Router runtime failures are sent through sanitized PostHog exception capture. The analytics layer avoids forwarding document text, filenames or page images.

Billing/webhook failures also use server-side sanitized exception capture.

## Search Console activation

The codebase is ready for either Search Console verification approach:

1. Preferred for full-domain ownership: create a Domain property for `pdfbright.app` and verify the DNS TXT record in Cloudflare. No app environment variable is required.
2. Alternative URL-prefix verification: set `GOOGLE_SITE_VERIFICATION` to the token supplied by Search Console and redeploy. Next.js will emit the Google verification meta tag.

After the production M10 deployment is live:

- verify the Search Console property
- submit `https://pdfbright.app/sitemap.xml`
- inspect `/`
- inspect `/clean-scanned-pdf`
- monitor queries/impressions before adding any further SEO pages

Do not create additional search pages until they provide genuinely distinct utility or guidance.

## M10 acceptance checklist

- [x] metadata
- [x] sitemap
- [x] robots
- [x] canonical URLs
- [x] Search Console verification support
- [x] event analytics
- [x] conversion funnel measurement
- [x] error monitoring
- [x] initial useful guide/use-case page
- [x] SEO landing acquisition measurement
- [ ] Search Console property ownership verified externally after production deployment
- [ ] production sitemap submitted in Search Console after verification

The last two items are production account actions, not missing application implementation. They should be performed when the M10 branch is promoted/merged to the production site.
