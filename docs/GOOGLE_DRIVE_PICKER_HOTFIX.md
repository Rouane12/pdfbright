# Google Drive Picker production hotfix

Observed during first production OAuth test on 2026-10-03: after consent, Google Picker could leave a blank modal backdrop that made the page appear white and non-interactive.

The legacy Picker callback can return `google.picker.Action.ERROR`. The initial integration handled only `PICKED` and `CANCEL`, so an error response could leave the Picker overlay mounted.

Hotfix:
- handle `Action.ERROR` explicitly
- close and dispose the Picker on error, cancel, invalid selection, and successful selection
- avoid forcing `setOrigin(...)` for PDFBright's top-level page; Google's current general web Picker sample does not require it outside iframe embedding
- surface a recoverable user-facing error instead of leaving the page blocked

No PDF content is sent through PDFBright servers; cloud import still downloads the selected Drive PDF into the browser and reuses the existing local processing pipeline.
