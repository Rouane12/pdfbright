# Google Drive Picker hotfix QA

Manual production validation after deploy:

1. Open `https://pdfbright.app`.
2. Choose **Google Drive** from the PDF source menu.
3. Complete OAuth using an allowed tester while the app is in Testing status.
4. Confirm Picker either opens normally or returns control to PDFBright with a visible error; the page must never remain under a blank blocking overlay.
5. Select a PDF and confirm the existing local analysis pipeline starts.
6. Cancel the Picker and confirm the page becomes interactive immediately.

Regression: local device upload remains unchanged.
