import { absoluteUrl, siteConfig } from "@/lib/seo";

export default function sitemap() {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs/api"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/docs/api/en"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];
}
