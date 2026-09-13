# Milestone 6 — File Optimization & Target-Size Feasibility

## Source requirements

Milestone 6 must provide:

- Balanced
- Smaller File
- Best Quality
- file-size comparison
- target-size feasibility research/prototype

Definition of done: output-size reductions are meaningful and do not visibly destroy normal documents.

The technical architecture also requires composition-aware compression: avoid re-rasterizing native vector/text PDFs unnecessarily; recompress/downsample raster scan pages where safe; never turn every PDF into low-quality screenshots just to claim compression.

## Implemented optimization policy

PDFBright optimizes only pages already classified as scan/image pages and eligible for visual replacement. Native text/vector pages are preserved as native PDF content.

Pages with annotations are skipped rather than flattened. Blank candidates are not treated as optimization targets. Existing cleanup safety and final PDF.js validation remain required before success is shown.

When OCR and optimization are both selected, the order is:

1. render/optimize eligible scan pages
2. apply structural page fixes
3. build the intermediate PDF
4. OCR the actual post-cleanup pages
5. add the invisible searchable text layer
6. save the final PDF
7. reopen and validate output integrity

This prevents optimization from erasing a searchable text layer that was already added.

## V1 profiles

### Balanced — default

- max render dimension: 2400 px
- max render scale: 3.2
- JPEG quality: 0.80
- goal: useful size reduction while retaining normal scanned-document readability

### Smaller File

- max render dimension: 1800 px
- max render scale: 2.5
- JPEG quality: 0.65
- goal: stronger reduction for sharing/storage when size matters most

### Best Quality

- max render dimension: 3200 px
- max render scale: 4.0
- JPEG quality: 0.92
- goal: lighter optimization while preserving more scan detail

## Meaningful-reduction guardrail

A compression-only job must not pretend success when the generated PDF is effectively the same size or larger.

Current minimum meaningful reduction:

- at least 2% smaller, and
- at least 1 KB saved

If compression is not applicable to the document, or compression-only output does not meet this threshold, the operation fails closed with a clear message and the original file remains untouched.

If other cleanup fixes were also requested, those fixes may still produce a valid result; the report must truthfully show the resulting size change rather than claim successful compression.

## Target-size feasibility prototype

A future request such as “make this PDF under 5 MB” cannot be guaranteed from a single fixed JPEG quality setting because encoded size depends heavily on page content, entropy, image dimensions, and the PDF structure around those images.

A reliable target-size implementation would therefore require measured candidate outputs and, when necessary, iterative encoding/search across quality and/or render-resolution parameters.

`src/lib/pdf-optimization/target-size-feasibility.ts` prototypes the decision layer after candidate sizes are known:

- if the original is already below target, do nothing;
- otherwise prefer the least aggressive profile that actually lands below target;
- if no known profile reaches the target, report that the target is below known profile outputs rather than falsely promising it;
- a future production version can then run a bounded iterative search if product limits and performance allow.

### M6 product decision

Do **not** expose an exact target-size control in the M6 visitor UI.

Reasons:

1. the functional spec marks target size as optional if reliably achievable;
2. the roadmap already places target file-size optimization in the initial Pro capability hypothesis;
3. repeated high-resolution rerenders can materially increase browser CPU/memory/time;
4. exact output-size guarantees require more benchmarking than the three stable quality profiles.

Keep the feasibility helper and research as the engineering foundation, then revisit the feature in the Pro/billing milestone after broader desktop/mobile performance testing.

## M6 acceptance matrix

Before merge, test at minimum:

1. **Image-heavy scan PDF**
   - Balanced produces a meaningful reduction
   - Smaller File is normally smaller than Balanced
   - Best Quality preserves more detail and is normally larger than Balanced
   - all outputs reopen and validate

2. **Native text/vector PDF**
   - native text remains extractable
   - compression does not rasterize normal text/vector pages
   - compression-only request safely reports not applicable when there are no eligible raster scan pages

3. **Mixed PDF**
   - only eligible scan/image pages are optimized
   - native text pages stay native
   - page count and intended structural changes remain correct

4. **OCR + compression**
   - optimized scans remain searchable after OCR
   - copied text still follows the M5 reading-order behavior
   - final validation checks OCR text

5. **Annotated scan page**
   - unsafe visual replacement is skipped rather than flattening annotations

6. **All three modes**
   - record original/output bytes and percent reduction
   - visually inspect representative text and graphics at normal zoom and zoomed view

## Merge rule

Milestone 6 is complete only when controlled acceptance proves meaningful file-size reduction without visibly destroying normal documents, CI/build is green, and the output integrity checks continue to pass.
