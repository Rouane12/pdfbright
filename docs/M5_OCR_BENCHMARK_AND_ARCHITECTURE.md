# Milestone 5 OCR Benchmark and Architecture Decision

Date: 2026-09-13
Branch: `milestone-5-ocr-searchable-pdf`

## Decision

PDFBright will use a **hybrid OCR architecture**.

- Local browser OCR remains the preferred/default path for small OCR jobs.
- The initial local OCR limit is **10 OCR pages per document**.
- OCR jobs above 10 pages must not silently start a long browser workload.
- Heavy OCR is reserved for a future server-assisted path with explicit user disclosure and the privacy/retention controls defined by the project architecture and privacy specs.
- The local limit may be increased later only after broader device testing demonstrates reliable performance.

The server-assisted heavy OCR path is **not implemented in Milestone 5**. Until it exists, documents requiring OCR on more than 10 pages fail closed with a clear explanation instead of running a multi-minute local job.

## Functional proof

The M5 implementation was validated end-to-end on controlled image-only scan pages:

1. PDFBright detected non-searchable scan pages.
2. Tesseract.js OCR ran locally in the browser.
3. The original page visuals remained unchanged.
4. PDFBright added an invisible searchable text layer.
5. Search/select/copy worked in a normal PDF viewer.
6. OCR reading order was corrected by emitting one searchable text run per OCR line.
7. The output PDF reopened successfully and passed PDFBright's validation checks.
8. Re-uploading the OCR output produced `This PDF already looks tidy`, proving the analyzer recognized the new searchable text layer.

## Controlled benchmark

All benchmark files contained unique image-only pages with similar text density and used English OCR. The same M5 browser implementation and validation path was used for every run.

| OCR pages | OCR time | Total cleanup + validation | Approx. OCR/page | Result |
| ---: | ---: | ---: | ---: | --- |
| 1 | 751 ms | 902 ms | 0.75 s | Passed |
| 10 | 4,973 ms | 5,121 ms | 0.50 s | Passed |
| 25 | 194,911 ms | 195,095 ms | 7.80 s | Passed, but too slow for normal UX |
| 50 | 478,724 ms | 479,303 ms | 9.57 s | Passed, but impractical for local-only OCR |

## Interpretation

The OCR implementation is **correct but not predictably scalable for sustained large browser workloads**.

The 1-page and 10-page cases were fast enough for normal local use. The 25-page and 50-page cases remained functionally correct, but total latency increased to roughly 3 minutes 15 seconds and 8 minutes respectively. PDF reconstruction and validation added very little time; OCR itself was the bottleneck.

These numbers are a controlled baseline from one test environment, not universal performance guarantees. Real performance will vary by CPU, browser, memory pressure, image resolution, scan quality, language, and page complexity. The 10-page limit is therefore intentionally conservative.

## Current M5 policy

- `<= 10` OCR pages: local browser OCR is allowed.
- `> 10` OCR pages: local OCR is blocked immediately.
- Heavy/server OCR: future implementation; do not claim it is available yet.
- Original files remain unchanged if OCR fails or is blocked.
- OCR output must reopen successfully and expose enough extractable text before PDFBright can report success.

## Follow-up

Before increasing the local OCR limit, test a broader device matrix including lower-memory laptops and mobile hardware. Before enabling server-assisted OCR, implement explicit disclosure, short-lived private storage, automatic deletion, resource limits, and cost monitoring.
