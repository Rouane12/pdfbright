import type { MetadataRoute } from "next";

const baseUrl = "https://pdfbright.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-15");

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
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
    {
      url: `${baseUrl}/data-deletion`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
