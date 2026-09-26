import path from "node:path";
import { expect, test } from "@playwright/test";

test("free tools hub exposes the upload readiness checker", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Free-tools interaction coverage uses one deterministic desktop browser.",
  );

  await page.goto("/tools", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Useful PDF checks most tool directories forget." })).toBeVisible();

  const readinessLink = page.locator('a[href="/tools/upload-readiness"]');
  await expect(readinessLink).toBeVisible();
  await readinessLink.click();

  await expect(page.getByRole("heading", { name: "Will this PDF upload successfully?" })).toBeVisible();
});

test("upload readiness checker recomputes against user requirements", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Readiness analysis coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/upload-readiness", { waitUntil: "domcontentloaded" });

  await page.locator('input[type="file"]').setInputFiles(
    path.resolve(".qa-corpus/native-text.pdf"),
  );

  await expect(
    page.getByRole("heading", { name: "This PDF matches your requirements" }),
  ).toBeVisible({ timeout: 45_000 });

  const pageLimit = page.getByLabel("Maximum pages");
  await pageLimit.fill("1");

  await expect(
    page.getByRole("heading", { name: "This PDF may be rejected" }),
  ).toBeVisible();

  const pageCountCheck = page.locator(".readiness-check").filter({
    has: page.getByRole("heading", { name: "Page count ≤ 1" }),
  });
  await expect(pageCountCheck.getByText("Fail", { exact: true })).toBeVisible();
});


test("scan quality map flags reliable page-level issues", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Scan-quality interaction coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/scan-quality", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for scan quality analysis").setInputFiles(
    path.resolve(".qa-corpus/rotated-and-landscape.pdf"),
  );

  await expect(page.getByRole("heading", { name: /Excellent|Good|Needs review|Poor/ })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole("region", { name: "Page quality heatmap" })).toBeVisible();
  await expect(page.getByText("Rotated 90°", { exact: true })).toBeVisible();
  await expect(page.getByText("Page 1", { exact: true })).toBeVisible();
});


test("scan quality map keeps clean native-text PDFs clean", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Scan-quality clean-baseline coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/scan-quality", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for scan quality analysis").setInputFiles(
    path.resolve(".qa-corpus/native-text.pdf"),
  );

  await expect(page.getByRole("heading", { name: "Excellent", exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByText("Nothing obvious needs attention", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Page quality heatmap" })).toBeVisible();
});


test("before-you-send checker keeps a simple PDF clear", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Before-send clean-baseline coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/before-you-send", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for before-send inspection").setInputFiles(
    path.resolve(".qa-corpus/native-text.pdf"),
  );

  await expect(
    page.getByRole("heading", { name: "No obvious send-risk signals detected" }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("No obvious hidden baggage", { exact: true })).toBeVisible();
});

test("before-you-send checker finds synthetic metadata, forms, attachments, and scripts", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Before-send baggage coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/before-you-send", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for before-send inspection").setInputFiles(
    path.resolve(".qa-corpus/before-send-baggage.pdf"),
  );

  await expect(
    page.getByRole("heading", { name: "This PDF contains items worth checking carefully" }),
  ).toBeVisible({ timeout: 45_000 });

  await expect(page.getByText("Personal metadata is present", { exact: true })).toBeVisible();
  await expect(page.getByText("Interactive form fields are present", { exact: true })).toBeVisible();
  await expect(page.getByText("Embedded files are present", { exact: true })).toBeVisible();
  await expect(page.getByText("Automatic actions or JavaScript are present", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic QA Author", { exact: true })).toBeVisible();
});


test("searchability test reports fully searchable native-text PDFs", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Searchability clean-baseline coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/searchability", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for searchability testing").setInputFiles(
    path.resolve(".qa-corpus/native-text.pdf"),
  );

  await expect(
    page.getByRole("heading", { name: "Every content page is searchable" }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Page searchability map" })).toBeVisible();
});

test("searchability test isolates the scanned page in a mixed PDF", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Searchability mixed-document coverage uses one deterministic desktop browser.",
  );
  test.setTimeout(60_000);

  await page.goto("/tools/searchability", { waitUntil: "domcontentloaded" });

  await page.getByLabel("Choose a PDF for searchability testing").setInputFiles(
    path.resolve(".qa-corpus/mixed-native-and-ocr-scan.pdf"),
  );

  await expect(
    page.getByRole("heading", { name: "Only part of this PDF is searchable" }),
  ).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("50%", { exact: true })).toBeVisible();

  const pageOne = page.locator(".searchability-detail").filter({ hasText: "Page 1" });
  const pageTwo = page.locator(".searchability-detail").filter({ hasText: "Page 2" });
  await expect(pageOne.getByText("Searchable", { exact: true })).toBeVisible();
  await expect(pageTwo.getByText("Needs OCR", { exact: true })).toBeVisible();
});
