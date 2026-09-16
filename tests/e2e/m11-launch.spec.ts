import fs from "node:fs/promises";
import path from "node:path";
import { expect, test } from "@playwright/test";
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
  await expect(mobileNav.getByRole("link", { name: "Pricing" })).toBeVisible();
  await expect(mobileNav.getByRole("link", { name: /Sign in|Account/ })).toBeVisible();

  await testInfo.attach("mobile-nav-state", {
    body: Buffer.from(`viewport=${viewport.width}x${viewport.height}`),
    contentType: "text/plain",
  });
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

test("checkout rejects an unauthenticated upgrade attempt", async ({ request }) => {
  const response = await request.post("/api/billing/checkout", {
    data: { plan: "monthly" },
  });
  expect(response.status()).toBe(401);
});

test("Lemon Squeezy webhook rejects an unsigned payload", async ({ request }) => {
  const response = await request.post("/api/webhooks/lemon-squeezy", {
    data: {
      meta: { event_name: "subscription_created" },
      data: { type: "subscriptions", id: "qa-unsigned" },
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

  await expect(page.getByText(/25 pages.*Free limit is 10 pages/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator(".diagnosis-workspace")).toHaveCount(0);
});

test("Free file-size limit rejects a PDF above 10 MB before parsing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Safety-limit behavior only needs one deterministic browser pass.");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.getByLabel("Choose a PDF file").setInputFiles(path.resolve(".qa-corpus/free-file-size-limit.pdf"));

  await expect(page.getByText(/larger than the Free 10 MB limit/i)).toBeVisible({ timeout: 20_000 });
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