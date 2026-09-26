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
