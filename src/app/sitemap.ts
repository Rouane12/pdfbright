import type { MetadataRoute } from "next";

const baseUrl = "https://pdfbright.app";
const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

const scannedPdfSearchRoutes = [
  "/clean-scanned-pdf",
  "/make-pdf-searchable",
  "/straighten-pdf",
  "/remove-blank-pages",
  "/compress-scanned-pdf",
  "/improve-scanned-pdf",
] as const;

const freeToolRoutes = [
  "/tools",
  "/tools/upload-readiness",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-19");

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...scannedPdfSearchRoutes.map((path, index) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: index === 0 ? 0.85 : 0.8,
    })),
    ...freeToolRoutes.map((path, index) => ({
      url: `${baseUrl}${path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: index === 0 ? 0.75 : 0.8,
    })),
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/security`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    ...(billingEnabled
      ? [
          {
            url: `${baseUrl}/refund-policy`,
            lastModified,
            changeFrequency: "monthly" as const,
            priority: 0.3,
          },
        ]
      : []),
    {
      url: `${baseUrl}/data-deletion`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
