# Milestone 10 — SEO / Analytics Foundation

Status: implementation complete on `m10/seo-analytics-foundation`, extended post-launch for Free Tools
Last updated: 2026-09-30

## Goal

Make PDFBright discoverable and measurable without turning the product into a thin SEO page farm or collecting document content.

The search objective is deliberately narrow: own the scanned-PDF cleanup category rather than compete as a generic PDF utility directory.

## SEO foundation

- Root metadata defines the PDFBright site identity, title template, description, Open Graph and Twitter metadata.
- Public routes use canonical URLs.
- `/sitemap.xml` includes the homepage, the scanned-PDF search cluster, Free Tools, and public trust/legal routes.
- `/robots.txt` allows public crawling, points to the sitemap, and keeps API routes out of search crawling.
- Authentication/account routes use `noindex` metadata.
- `pdfbright.app` is the canonical production host.
- Optional Google Search Console URL-prefix verification is supported through the server-only `GOOGLE_SITE_VERIFICATION` environment variable.

## Scanned-PDF search cluster

PDFBright uses one broad pillar and five genuinely distinct search-intent pages. Every page contains the real uploader and enters the same diagnose-first cleanup workflow.

### Pillar

- `/clean-scanned-pdf` — broad messy/scanned-PDF cleanup intent

### Focused search intents

- `/make-pdf-searchable` — searchable PDF, OCR scanned PDF, image-only text
- `/straighten-pdf` — deskew PDF, straighten scanned PDF, fix crooked scans
- `/remove-blank-pages` — scanner blank pages and reviewed destructive removal
- `/compress-scanned-pdf` — reduce scan-heavy PDF file size with quality-aware optimization
- `/improve-scanned-pdf` — conservative scan readability/quality enhancement

Keyword variants that represent the same underlying intent belong on the same canonical page. Do not create duplicate URLs such as separate `/deskew-pdf`, `/fix-crooked-pdf`, and `/straighten-scanned-pdf` pages.

Each search page has:

- its own H1 and intent-specific explanatory content
- the functioning PDF upload/diagnosis entry point
- unique title and description metadata
- its own canonical URL
- unique Open Graph/Twitter URL and copy
- intent-specific safety/limitations language
- intent-specific FAQs
- contextual links across the scanned-PDF cluster
- a path back into the broader cleanup workflow

The original `/clean-scanned-pdf` page acts as the category pillar and links into all focused search pages. Focused pages link across the same cluster, creating a coherent topic network without exposing a giant generic tools directory in the primary product navigation.

## Free Tools discovery layer

The production Free Tools category adds six real diagnostic utilities under `/tools`:

- `/tools/upload-readiness`
- `/tools/scan-quality`
- `/tools/before-you-send`
- `/tools/searchability`
- `/tools/page-consistency`
- `/tools/change-receipt`

These are functioning utilities rather than thin landing pages. They are included in the sitemap and post-launch acquisition measurement while the homepage remains focused on the core one-click cleanup workflow.

## Analytics foundation

PostHog is configured with deliberate manual capture:

- autocapture disabled
- automatic pageview/pageleave capture disabled
- session recording disabled
- document content and filenames excluded from analytics design

Acquisition landing paths currently measured:

- `/`
- `/clean-scanned-pdf`
- `/make-pdf-searchable`
- `/straighten-pdf`
- `/remove-blank-pages`
- `/compress-scanned-pdf`
- `/improve-scanned-pdf`
- `/tools`
- all six individual Free Tool routes

`landing_view` includes `landing_path` so acquisition can be separated by search entry page.

Workflow events also include `entry_path` when the session starts on a measured acquisition route. That lets PDFBright compare which search intent drives uploads, completed diagnoses, cleanups, and downloads rather than judging pages only by visits.

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

Free Tools post-launch funnel events include:

- `free_tools_hub_viewed`
- `free_tool_opened`
- `free_tool_viewed`
- `free_tool_file_selected`
- `free_tool_analysis_started`
- `free_tool_analysis_completed`
- `free_tool_analysis_failed`
- `free_tool_core_cta_clicked`

Free Tools analytics only carries controlled categorical/coarse properties: tool ID, file-size bucket, result category, duration bucket, navigation source/target, and original/modified role for Change Receipt. Filenames, exact file size, extracted text, OCR text, page images, attachment contents, and metadata values are not intentionally captured.

Change Receipt is measured as one paired comparison after both files are selected rather than two independent conversions.

Commercial events include trusted checkout and webhook-side purchase/subscription events, including purchase completion, renewals and cancellations.

## Error monitoring

Handled PDF workflow failures and unhandled App Router runtime failures are sent through sanitized PostHog exception capture. The analytics layer avoids forwarding document text, filenames or page images.

Billing/webhook failures also use server-side sanitized exception capture.

Free Tools use a separate categorical failure event tied to the existing tool error UI. The displayed error message is not sent.

## Search Console activation

The codebase is ready for either Search Console verification approach:

1. Preferred for full-domain ownership: create a Domain property for `pdfbright.app` and verify the DNS TXT record in Cloudflare. No app environment variable is required.
2. Alternative URL-prefix verification: set `GOOGLE_SITE_VERIFICATION` to the token supplied by Search Console and redeploy. Next.js will emit the Google verification meta tag.

After production deployment:

- verify the Search Console property
- submit `https://pdfbright.app/sitemap.xml`
- inspect `/`
- inspect the scanned-PDF search routes
- inspect `/tools` and all six Free Tool routes
- monitor impressions, clicks, average positions, and the queries attached to each route
- compare Free Tool landing traffic with valid-file selection, completion, failure, and core-cleanup CTA rates
- improve titles/content where real query data shows impressions without useful click-through
- add future pages only for genuinely distinct user problems that PDFBright actually solves

Traffic strategy should evolve from real query data rather than manufacturing near-duplicate pages for keyword variants.

## M10 acceptance checklist

- [x] metadata
- [x] sitemap
- [x] robots
- [x] canonical URLs
- [x] Search Console verification support
- [x] event analytics
- [x] conversion funnel measurement
- [x] error monitoring
- [x] scanned-PDF category pillar
- [x] five distinct focused search-intent pages
- [x] contextual cluster internal linking
- [x] SEO landing acquisition measurement
- [x] workflow attribution by SEO entry path
- [x] Free Tools acquisition measurement
- [x] Free Tools analysis/completion/failure funnel
- [x] Free Tools → core cleanup CTA measurement
- [x] dedicated source QA for Free Tools analytics privacy
- [ ] Search Console property ownership verified externally after production deployment
- [ ] production sitemap submitted in Search Console after verification

The last two items are production account actions, not missing application implementation. They should be performed when account access is available.
