# Post-Launch Analytics — Free Tools Funnel

**Status:** implemented on `feature/post-launch-analytics-funnel`  
**Started:** 2026-09-30

## Goal

Measure whether PDFBright's new Free Tools attract useful traffic and move users toward the core cleanup workflow without collecting document content.

The main post-launch question is:

> Which Free Tools bring people in, successfully diagnose a real PDF, and create meaningful interest in PDFBright's core cleanup workflow?

This is an optimization layer, not a new product-scope expansion.

## Funnel

The measured Free Tools funnel is:

**landing / tools hub → tool opened → tool viewed → valid PDF selected → analysis started → analysis completed or failed → core cleanup CTA**

The six measured tools are:

- `upload_readiness`
- `scan_quality`
- `before_send`
- `searchability`
- `page_consistency`
- `change_receipt`

`/tools` and all six individual tool routes are also included in `landing_view` acquisition measurement so direct search traffic can be compared with the existing scanned-PDF search cluster.

## Events

### `free_tools_hub_viewed`

Fires when the curated `/tools` hub is viewed.

No document properties are attached.

### `free_tool_opened`

Fires when a user opens a tool from the `/tools` hub.

Properties:

- `tool_id`
- `source = tools_hub`

### `free_tool_viewed`

Fires when an individual Free Tool route is viewed, including direct search/deep-link landings.

Properties:

- `tool_id`

### `free_tool_file_selected`

Fires after a locally selected file passes the analytics-side coarse safety check.

Properties:

- `tool_id`
- `file_size_bucket`
- `file_role` only for Change Receipt (`original` or `modified`)

The exact file size is not sent.

### `free_tool_analysis_started`

Fires when a valid tool run begins.

Properties:

- `tool_id`
- `input_mode = single | pair`

Change Receipt is measured as one paired comparison run after both original and modified files have been selected.

### `free_tool_analysis_completed`

Fires when the tool's existing result UI is rendered.

Properties:

- `tool_id`
- `outcome` — controlled categorical result from the tool UI
- `duration_bucket` — coarse elapsed-time bucket

Allowed outcomes are intentionally categorical. Examples include `pass`, `review`, `poor`, `fully-searchable`, `mixed`, `changed`, and `same`.

### `free_tool_analysis_failed`

Fires when an active tool run reaches the existing error UI.

Properties:

- `tool_id`
- `error_surface = tool_ui`
- `duration_bucket`

The displayed error message is not sent.

### `free_tool_core_cta_clicked`

Fires when a user moves from a completed tool toward PDFBright's main cleanup workflow.

Properties:

- `tool_id`
- `target = core_cleanup`

This is the primary Free Tools → core product conversion signal.

## Privacy boundary

Free Tools analytics must never intentionally capture:

- filenames
- exact file size
- extracted document text
- OCR text
- page text
- document subject/content
- page images or renders
- attachment contents
- script contents
- metadata values shown by Before You Send

Allowed document-derived analytics are limited to coarse operational categories such as:

- file-size bucket
- controlled result category
- coarse duration bucket
- tool identifier
- original/modified role for Change Receipt

PostHog remains manually captured with autocapture, automatic pageviews, pageleave capture, and session recording disabled.

## Implementation approach

The funnel is implemented in the existing global `ProductAnalytics` client layer rather than inside the PDF analysis engines.

This keeps measurement separate from document processing and avoids adding analytics side effects to local PDF parsing/cleanup code.

The analytics layer observes the existing stable tool inputs, result headings/classes, and error surfaces. It does not read rendered document content.

## QA guard

`scripts/qa-free-tools-analytics.mjs` runs as part of `npm run qa:source`.

It verifies:

- all six tool routes are mapped
- all six tool IDs are present
- every Free Tools funnel event remains registered
- Change Receipt remains a paired run
- file size is bucketed before capture
- result and duration values stay categorical/coarse
- forbidden filename/document-content tokens are absent from the analytics source

## First review questions

After enough real traffic exists, compare:

1. Which tool pages receive direct landing traffic?
2. Which tools have the highest valid-file selection rate?
3. Where do users abandon before a result?
4. Which tools have the highest completion rate?
5. Which result categories are most common?
6. Which tools create the most `core_cleanup` CTA clicks?
7. Which tool entry points eventually correlate with completed core cleanup/download events?
8. Are failures concentrated in a specific tool or document-size bucket?

Do not choose the next major feature from raw pageviews alone. Prioritize repeated user problems, successful usage, conversion behavior, support feedback, and Search Console query intent together.
