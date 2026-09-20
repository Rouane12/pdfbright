# M12 Representative Output PDF Validation

Date: 2026-09-20  
Branch: `qa/representative-output-validation`  
CI run: #290 (`35527768196`)  
Source commit: `be5c06c1eb20360773fb370c3b4ba7ffe5f64703`  
Artifact: `representative-output-pdfs` (`10610307730`)

## Purpose

Manually inspect representative PDFs produced by the real browser cleanup flow before launch. This supplements automated integrity checks with rendered-output review.

## Method

- Ran the full cross-browser launch smoke suite in CI.
- Preserved every PDF written by the successful Chromium output-integrity tests as a short-lived CI artifact.
- Downloaded the artifact and opened every PDF successfully.
- Inspected PDF structure/page counts with the PDF inspection tooling.
- Rendered all 13 output pages at 160 DPI and visually reviewed them for clipping, overlap, unexpected rotation, blanking, broken glyphs, or obvious corruption.
- Extracted text from OCR outputs.
- Inspected AcroForm fields in the form-preservation output.

## Results

| Output | Manual validation |
| --- | --- |
| `rotated-and-landscape-clean.pdf` | PASS - 2 pages reopen and render correctly; portrait and landscape content are upright and unclipped. |
| `keyboard-only-clean.pdf` | PASS - 2-page output matches the valid rotation/landscape cleanup result. |
| `blank-and-near-blank-clean.pdf` | PASS - 1 page remains; the faint non-blank signature is retained and visible. |
| `mixed-page-sizes-clean.pdf` | PASS - 3 pages remain; all output pages are normalized to the same 842 x 842 pt size and visible content is retained. |
| `form-clean.pdf` | PASS - renders correctly; AcroForm field `qa.name` survives with value `Synthetic QA`. |
| `ocr-image-only-clean.pdf` | PASS WITH KNOWN OCR LIMITATION - visual scan is preserved and the PDF contains selectable/searchable text. OCR is not a claim of perfect transcription on this synthetic pixel-font fixture. |
| `mixed-native-and-ocr-scan-clean.pdf` | PASS WITH KNOWN OCR LIMITATION - native page text remains intact; scanned page remains visually intact and receives a searchable text layer. |
| `scan-heavy-noise-clean.pdf` | PASS - 1-page image-heavy output reopens and renders across the full page without corruption; the automated test also verified a meaningful file-size reduction. |

## OCR note

The synthetic OCR fixture visibly reads `SEARCHABLE TEXT` and `SEARCHABLE TEST`. Text extraction from the generated searchable layer returned `SERECHHELE TEXT` and `TEST`.

This is recorded as an OCR-accuracy limitation rather than a PDF-integrity failure: the visible document is preserved, searchable text is genuinely added, and the separate low-confidence OCR test continues to fail safely rather than presenting unreliable output as complete. This evidence does not claim perfect OCR transcription.

## Gate result

**PASS for Free Early Access.**

No clipping, overlap, broken rendering, lost pages, accidental blank-page deletion, form-field loss, or output corruption was found in the representative output set.
