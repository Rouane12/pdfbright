import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

test("Fit My PDF exposes target controls and preserves a PDF that already fits", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Target-size workflow regression uses one deterministic desktop browser.",
  );

  await page.goto("/fit-pdf-size", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("heading", { name: "Make the PDF fit the limit." })).toBeVisible();
  await expect(page.getByRole("button", { name: "500 KB" })).toBeVisible();
  await expect(page.getByRole("button", { name: "2 MB" })).toBeVisible();
  await expect(page.getByRole("button", { name: "10 MB" })).toBeVisible();

  const document = await PDFDocument.create();
  document.addPage([612, 792]);
  const bytes = await document.save();

  await page.locator('input[type="file"]').setInputFiles({
    name: "already-small.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(bytes),
  });

  await page.getByRole("button", { name: "10 MB" }).click();
  await page.getByRole("button", { name: /^Fit PDF under/ }).click();

  await expect(page.getByRole("heading", { name: "Your PDF already fits." })).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByRole("link", { name: "Download original PDF" })).toBeVisible();
});

test("Free Tools hub features Fit My PDF separately from diagnostic cards", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Tools-hub integration regression uses one deterministic desktop browser.",
  );

  await page.goto("/tools", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Need this PDF under 2 MB?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Fit My PDF/ })).toHaveAttribute(
    "href",
    "/fit-pdf-size",
  );
  await expect(page.locator(".tool-card__icon")).toHaveCount(6);
});
