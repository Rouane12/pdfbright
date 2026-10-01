import { expect, test } from "@playwright/test";

const toolPages = [
  { route: "/tools/upload-readiness", icon: "readiness" },
  { route: "/tools/scan-quality", icon: "scan" },
  { route: "/tools/before-you-send", icon: "send" },
  { route: "/tools/searchability", icon: "search" },
  { route: "/tools/page-consistency", icon: "consistency" },
  { route: "/tools/change-receipt", icon: "changes" },
] as const;

test("Free Tools hub renders all six distinctive icons", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Presentation regression uses one deterministic desktop browser.",
  );

  await page.goto("/tools", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".tool-card__icon")).toHaveCount(6);

  for (const tool of toolPages) {
    await expect(page.locator(`.tool-card__icon--${tool.icon}`)).toHaveCount(1);
  }
});

test("Free Tool heroes preserve headline, description, and privacy spacing", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-desktop",
    "Presentation spacing regression uses one deterministic desktop browser.",
  );

  for (const tool of toolPages) {
    await page.goto(tool.route, { waitUntil: "domcontentloaded" });

    const icon = page.locator(`.tool-page-hero__icon--${tool.icon}`);
    const heading = page.locator(".tool-page-hero h1");
    const description = page.locator(".tool-page-hero__description");
    const privacy = page.locator(".tool-page-hero .tool-privacy-line");

    await expect(icon).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(description).toBeVisible();
    await expect(privacy).toBeVisible();

    const headingBox = await heading.boundingBox();
    const descriptionBox = await description.boundingBox();
    const privacyBox = await privacy.boundingBox();

    expect(headingBox, `${tool.route} heading should have geometry`).not.toBeNull();
    expect(descriptionBox, `${tool.route} description should have geometry`).not.toBeNull();
    expect(privacyBox, `${tool.route} privacy row should have geometry`).not.toBeNull();

    const headingGap = descriptionBox!.y - (headingBox!.y + headingBox!.height);
    const privacyGap = privacyBox!.y - (descriptionBox!.y + descriptionBox!.height);

    expect(headingGap, `${tool.route} headline/description gap`).toBeGreaterThanOrEqual(14);
    expect(privacyGap, `${tool.route} description/privacy gap`).toBeGreaterThanOrEqual(14);
  }
});
