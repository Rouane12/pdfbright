import fs from "node:fs/promises";
import path from "node:path";
import { expect, test, type CDPSession, type Locator, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

const publicRoutes = [
  "/",
  "/clean-scanned-pdf",
  "/make-pdf-searchable",
  "/straighten-pdf",
  "/remove-blank-pages",
  "/compress-scanned-pdf",
  "/improve-scanned-pdf",
  "/privacy",
  "/security",
  "/terms",
  "/data-deletion",
];

async function extractPdfTextByPage(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: Uint8Array.from(bytes) });
  const documentProxy = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= documentProxy.numPages; pageNumber += 1) {
      const pdfPage = await documentProxy.getPage(pageNumber);
      try {
        const content = await pdfPage.getTextContent();
        const text = content.items
          .map((item) => ("str" in item && typeof item.str === "string" ? item.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        pages.push(text);
      } finally {
        pdfPage.cleanup();
      }
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages;
}

async function tabTo(page: Page, target: Locator, maxTabs = 60) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) {
      await expect(target).toBeFocused();
      return;
    }
  }

  throw new Error(`Keyboard focus did not reach target after ${maxTabs} Tab presses.`);
}

async function chromiumJsHeapUsedBytes(session: CDPSession) {
  await session.send("Performance.enable");
  const result = await session.send("Performance.getMetrics");
  const heap = result.metrics.find((metric) => metric.name === "JSHeapUsedSize")?.value;
  return typeof heap === "number" && Number.isFinite(heap) ? heap : null;
}

async function collectChromiumGarbage(session: CDPSession) {
  await session.send("HeapProfiler.collectGarbage");
  await new Promise((resolve) => setTimeout(resolve, 250));
}

for (const route of publicRoutes) {
  test(`${route} renders without horizontal overflow`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route} should return a successful response`).toBeLessThan(400);

    await expect(page.locator("body")).not.toBeEmpty();
    await expect(page.locator("h1")).toHaveCount(1);

    const overflow = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(overflow.scroll, `${route} horizontally overflows`).toBeLessThanOrEqual(overflow.viewport + 1);
  });
}

test("homepage exposes only the authoritative visible header", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  await expect(page.locator(".global-site-header")).toBeVisible();
  await expect(page.locator("header.site-header")).toBeHidden();
  await expect(page.getByRole("link", { name: "PDFBright home" })).toBeVisible();
});

test("mobile navigation opens and exposes core navigation", async ({ page }, testInfo) => {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width > 500) {
    test.skip();
    return;
  }

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const menu = page.getByLabel("Open navigation menu");
  await expect(menu).toBeVisible();
  await menu.click();

  const mobileNav = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(mobileNav).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "How it works" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: "Free Early Access" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: /Sign in|Account/ })).toBeVisible();

  await testInfo.attach("mobile-nav-state", {
    body: Buffer.from(`viewport=${viewport.width}x${viewport.height}`),
    contentType: "text/plain",
  });
});

test("core cleanup flow is operable with keyboard only", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Keyboard-only launch gate uses one deterministic desktop browser.");
  test.setTimeout(120_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const hiddenFileInput = page.getByLabel("Choose a PDF file");
  await expect(hiddenFileInput).toHaveAttribute("tabindex", "-1");

  const chooseButton = page.getByRole("button", { name: "Choose a PDF", exact: true });
  await tabTo(page, chooseButton);
  expect(await chooseButton.evaluate((element) => element.matches(":focus-visible"))).toBe(true);

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(path.resolve(".qa-corpus/rotated-and-landscape.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });

  const rotateToggle = page.locator("#diagnosis-rotate");
  await expect(rotateToggle).toBeChecked();
  await tabTo(page, rotateToggle);
  await page.keyboard.press("Space");
  await expect(rotateToggle).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(rotateToggle).toBeChecked();

  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await tabTo(page, fixButton);
  expect(await fixButton.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await page.keyboard.press("Enter");

  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 45_000 });

  const downloadLink = page.getByRole("link", { name: "Download Clean PDF" });
  await tabTo(page, downloadLink);
  expect(await downloadLink.evaluate((element) => element.matches(":focus-visible"))).toBe(true);

  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Enter");
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("keyboard-only-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(2);
});

test("dynamic cleanup states expose predictable focus and screen-reader landmarks", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Focus and screen-reader launch gate uses one deterministic desktop browser.");
  test.setTimeout(120_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page.locator("#upload")).toHaveCount(1);

  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/rotated-and-landscape.pdf"));

  const diagnosisHeading = page.getByRole("heading", { name: "We found a few things we can improve" });
  await expect(diagnosisHeading).toBeVisible({ timeout: 45_000 });
  await expect(diagnosisHeading).toBeFocused();
  await expect(page.getByRole("region", { name: "We found a few things we can improve" })).toBeVisible();

  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await fixButton.click();

  const processingHeading = page.getByRole("heading", { name: "Making it brighter." });
  await expect(processingHeading).toBeFocused({ timeout: 10_000 });
  await expect(page.getByRole("region", { name: "Making it brighter." })).toBeVisible();
  await expect(page.getByRole("group", { name: "Processing safeguards" })).toBeVisible();

  const resultHeading = page.getByRole("heading", { name: "Your PDF is ready" });
  await expect(resultHeading).toBeVisible({ timeout: 45_000 });
  await expect(resultHeading).toBeFocused();
  await expect(page.getByRole("region", { name: "Your PDF is ready" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Cleanup summary" })).toBeVisible();

  await page.getByRole("button", { name: "View changes" }).click();
  await expect(page.getByRole("heading", { name: "See a representative page" })).toBeFocused();
});

test("near-limit 10-page scan analyzes without browser-memory failure", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Performance and memory stress gate uses one deterministic Chromium pass.");
  test.setTimeout(150_000);

  const sourcePath = path.resolve(".qa-corpus/near-limit-scan-10-pages.pdf");
  const sourceStat = await fs.stat(sourcePath);
  expect(sourceStat.size).toBeGreaterThanOrEqual(7_000_000);
  expect(sourceStat.size).toBeLessThanOrEqual(10 * 1024 * 1024);

  let crashed = false;
  page.on("crash", () => {
    crashed = true;
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const session = await page.context().newCDPSession(page);
  const heapBefore = await chromiumJsHeapUsedBytes(session);
  const startedAt = Date.now();

  await page.getByLabel("Choose a PDF file").setInputFiles(sourcePath);
  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 90_000 });

  const elapsedMs = Date.now() - startedAt;
  expect(elapsedMs).toBeLessThan(90_000);
  expect(crashed).toBe(false);
  await expect(page.getByText(/browser does not have enough memory|could not analyze this PDF/i)).toHaveCount(0);
  await expect(page.getByText(/MB · 10 pages/)).toBeVisible();

  await collectChromiumGarbage(session);
  const heapAfterGc = await chromiumJsHeapUsedBytes(session);
  if (heapAfterGc !== null) {
    expect(heapAfterGc).toBeLessThan(384 * 1024 * 1024);
  }

  await testInfo.attach("near-limit-scan-performance", {
    body: Buffer.from(JSON.stringify({
      sourceBytes: sourceStat.size,
      elapsedMs,
      heapBeforeBytes: heapBefore,
      heapAfterGcBytes: heapAfterGc,
      crashed,
    }, null, 2)),
    contentType: "application/json",
  });

  await session.detach();
});

test("three-page OCR ceiling completes without browser crash or retained heap spike", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Performance and memory stress gate uses one deterministic Chromium pass.");
  test.setTimeout(300_000);

  const sourcePath = path.resolve(".qa-corpus/ocr-three-pages.pdf");
  let crashed = false;
  page.on("crash", () => {
    crashed = true;
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const session = await page.context().newCDPSession(page);
  const heapBefore = await chromiumJsHeapUsedBytes(session);

  await page.getByLabel("Choose a PDF file").setInputFiles(sourcePath);
  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Text isn't searchable on 3 pages" })).toBeVisible();
  await expect(page.locator("#diagnosis-searchable-text")).toBeChecked();

  const cleanupStartedAt = Date.now();
  await page.getByRole("button", { name: "Fix My PDF" }).click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 210_000 });
  const cleanupElapsedMs = Date.now() - cleanupStartedAt;

  expect(cleanupElapsedMs).toBeLessThan(210_000);
  expect(crashed).toBe(false);
  await expect(page.getByText(/browser does not have enough memory|could not safely finish this cleanup/i)).toHaveCount(0);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("ocr-three-pages-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(3);

  await collectChromiumGarbage(session);
  const heapAfterGc = await chromiumJsHeapUsedBytes(session);
  if (heapAfterGc !== null) {
    expect(heapAfterGc).toBeLessThan(384 * 1024 * 1024);
  }

  await testInfo.attach("ocr-three-pages-performance", {
    body: Buffer.from(JSON.stringify({
      cleanupElapsedMs,
      outputBytes: bytes.length,
      heapBeforeBytes: heapBefore,
      heapAfterGcBytes: heapAfterGc,
      crashed,
      remainingWorkers: page.workers().length,
    }, null, 2)),
    contentType: "application/json",
  });

  await session.detach();
});

test("sitemap is fetchable and contains the scanned-PDF search cluster", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const body = await response.text();

  for (const route of [
    "/clean-scanned-pdf",
    "/make-pdf-searchable",
    "/straighten-pdf",
    "/remove-blank-pages",
    "/compress-scanned-pdf",
    "/improve-scanned-pdf",
  ]) {
    expect(body).toContain(`https://pdfbright.app${route}`);
  }
});

test("anonymous entitlement stays inside the Free envelope", async ({ request }) => {
  const response = await request.get("/api/account/entitlement");
  expect(response.status()).toBe(200);
  const payload = (await response.json()) as {
    plan?: unknown;
    authenticated?: unknown;
    limits?: { maxFileSizeMB?: unknown; maxPageCount?: unknown; maxOcrPages?: unknown };
  };

  expect(payload.plan).toBe("free");
  expect(payload.authenticated).toBe(false);
  expect(payload.limits?.maxFileSizeMB).toBe(10);
  expect(payload.limits?.maxPageCount).toBe(10);
  expect(payload.limits?.maxOcrPages).toBe(3);
});

test("free Early Access disables paid checkout at the server boundary", async ({ request }) => {
  const response = await request.post("/api/billing/checkout", {
    data: { plan: "monthly" },
  });
  expect(response.status()).toBe(503);
  const payload = (await response.json()) as { code?: unknown };
  expect(payload.code).toBe("billing_disabled");
});

test("homepage presents the free Early Access launch without paid CTAs", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "PDFBright is free while we learn from real documents." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Clean a PDF for free" })).toBeVisible();
  await expect(page.getByText("$7.99", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Choose monthly|Choose yearly/ })).toHaveCount(0);
  await expect(page.getByText("PDF only · Free Early Access: up to 10 MB / 10 pages", { exact: true })).toBeVisible();
  await expect(page.getByText(/Pro: up to 25 MB|PDFBright Pro supports/i)).toHaveCount(0);
});

test("Paddle webhook rejects an unsigned payload", async ({ request }) => {
  const response = await request.post("/api/webhooks/paddle", {
    data: {
      event_id: "evt_qa_unsigned",
      event_type: "subscription.created",
      occurred_at: new Date().toISOString(),
      data: { id: "sub_qa_unsigned", status: "active" },
    },
  });
  expect(response.status()).toBe(401);
});

test("malformed PDF is rejected safely", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("Choose a PDF file");
  await input.setInputFiles(path.resolve(".qa-corpus/malformed.pdf"));

  await expect(page.getByText(/valid PDF header|damaged|invalid|could not safely validate/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("native-text PDF reaches diagnosis without losing the original workflow", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const input = page.getByLabel("Choose a PDF file");
  await input.setInputFiles(path.resolve(".qa-corpus/native-text.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("native-text.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Fix My PDF" })).toBeVisible();
  await expect(page.getByText(/KB · 2 pages/)).toBeVisible();
});

test("Free page limit rejects a 25-page PDF before analysis", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Safety-limit behavior only needs one deterministic browser pass.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/long-25-pages.pdf"));

  await expect(page.getByText(/25 pages.*Free Early Access limit is 10 pages/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("Free file-size limit rejects a PDF above 10 MB before parsing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Safety-limit behavior only needs one deterministic browser pass.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/free-file-size-limit.pdf"));

  await expect(page.getByText(/larger than the current Free Early Access 10 MB limit/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("unsafe page dimensions are rejected before analysis", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Safety-limit behavior only needs one deterministic browser pass.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/unsafe-page-dimensions.pdf"));

  await expect(page.getByText(/unusually large and cannot be processed safely/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("cleanup output downloads and reopens as a valid PDF", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "One deterministic output-integrity pass is enough for this fixture.");
  test.setTimeout(90_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/rotated-and-landscape.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await fixButton.click();

  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 45_000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("rotated-and-landscape-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(2);
});

test("blank-page cleanup removes only the confirmed blank page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Destructive blank-removal integrity only needs one deterministic browser pass.");
  test.setTimeout(90_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/blank-and-near-blank.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "1 page appears blank" })).toBeVisible();

  const removalToggle = page.locator("#diagnosis-remove-blank-pages");
  await expect(removalToggle).not.toBeChecked();

  const reviewButton = page.getByRole("button", { name: "Review pages" });
  await reviewButton.click();
  await expect(page.getByText("Pages 1", { exact: true })).toBeVisible();
  await removalToggle.check();

  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await fixButton.click();

  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 45_000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("blank-and-near-blank-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(1);
});

test("page normalization preserves all pages and makes dimensions consistent", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Page-normalization integrity only needs one deterministic browser pass.");
  test.setTimeout(90_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/mixed-page-sizes.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Page sizes are inconsistent" })).toBeVisible();
  await expect(page.locator("#diagnosis-normalize-pages")).toBeChecked();

  await page.getByRole("button", { name: "Fix My PDF" }).click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 45_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("mixed-page-sizes-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(3);

  const sizes = reopened.getPages().map((pdfPage) => pdfPage.getSize());
  for (const size of sizes.slice(1)) {
    expect(Math.abs(size.width - sizes[0].width)).toBeLessThan(0.6);
    expect(Math.abs(size.height - sizes[0].height)).toBeLessThan(0.6);
  }
});

test("form fields survive a benign cleanup pass", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Form-preservation integrity only needs one deterministic browser pass.");
  test.setTimeout(90_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/form.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await page.getByText("Customize fixes", { exact: true }).click();
  const normalizeOption = page.locator(".advanced-fix-option").filter({ hasText: "Make page sizes consistent" }).locator("input");
  await normalizeOption.check();

  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await fixButton.click();

  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 45_000 });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("form-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(1);
  expect(reopened.getForm().getTextField("qa.name").getText()).toBe("Synthetic QA");
});


test("password-protected PDF is rejected safely", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Encrypted-file rejection only needs one deterministic browser pass.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/password-protected.pdf"));

  await expect(page.getByText("Password-protected PDFs cannot currently be processed.")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("low-confidence OCR fails safely instead of claiming searchable output", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "OCR quality rejection only needs one deterministic browser pass.");
  test.setTimeout(180_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/ocr-low-confidence.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.locator("#diagnosis-searchable-text")).toBeChecked();

  await page.getByRole("button", { name: "Fix My PDF" }).click();
  await expect(page.getByText(/could not recognize enough reliable text/i)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toHaveCount(0);
});

test("OCR cleanup creates genuinely searchable text", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "OCR output integrity only needs one deterministic browser pass.");
  test.setTimeout(180_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/ocr-image-only.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Text isn't searchable on 1 page" })).toBeVisible();
  await expect(page.locator("#diagnosis-searchable-text")).toBeChecked();

  await page.getByRole("button", { name: "Fix My PDF" }).click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 120_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("ocr-image-only-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(1);

  const textByPage = await extractPdfTextByPage(Uint8Array.from(bytes));
  expect(textByPage).toHaveLength(1);
  expect(textByPage[0].toUpperCase()).toContain("TEXT");
  expect(textByPage[0].toUpperCase()).toContain("TEST");
});

test("mixed native text and scanned page both remain searchable after OCR", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Mixed-content OCR integrity only needs one deterministic browser pass.");
  test.setTimeout(180_000);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/mixed-native-and-ocr-scan.pdf"));

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "Text isn't searchable on 1 page" })).toBeVisible();
  await expect(page.locator("#diagnosis-searchable-text")).toBeChecked();

  await page.getByRole("button", { name: "Fix My PDF" }).click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 120_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("mixed-native-and-ocr-scan-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(2);

  const textByPage = await extractPdfTextByPage(Uint8Array.from(bytes));
  expect(textByPage).toHaveLength(2);
  expect(textByPage[0]).toContain("Mixed document native text must survive");
  expect(textByPage[1].toUpperCase()).toContain("TEXT");
  expect(textByPage[1].toUpperCase()).toContain("TEST");
});

test("scan-heavy optimization produces a meaningfully smaller valid PDF", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Compression output integrity only needs one deterministic browser pass.");
  test.setTimeout(180_000);

  const sourcePath = path.resolve(".qa-corpus/scan-heavy-noise.pdf");
  const sourceStat = await fs.stat(sourcePath);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(sourcePath);

  await expect(page.locator(".diagnosis-workspace")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("heading", { name: "This PDF can likely be made smaller" })).toBeVisible();
  await expect(page.locator("#diagnosis-compress")).toBeChecked();

  for (const id of [
    "straighten",
    "rotate",
    "searchable-text",
    "remove-blank-pages",
    "improve-readability",
    "normalize-pages",
  ]) {
    const control = page.locator(`#diagnosis-${id}`);
    if ((await control.count()) > 0 && (await control.isChecked())) {
      await control.uncheck();
    }
  }

  await page.getByText("Customize fixes", { exact: true }).click();
  await page.locator("#compression-mode").selectOption("smaller-file");

  const fixButton = page.getByRole("button", { name: "Fix My PDF" });
  await expect(fixButton).toBeEnabled();
  await fixButton.click();
  await expect(page.getByRole("heading", { name: "Your PDF is ready" })).toBeVisible({ timeout: 120_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download Clean PDF" }).click();
  const download = await downloadPromise;
  const savedPath = testInfo.outputPath("scan-heavy-noise-clean.pdf");
  await download.saveAs(savedPath);

  const bytes = await fs.readFile(savedPath);
  const reopened = await PDFDocument.load(bytes);
  expect(reopened.getPageCount()).toBe(1);
  expect(bytes.length).toBeLessThan(sourceStat.size * 0.98);
});
