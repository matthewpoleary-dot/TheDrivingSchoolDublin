import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/**
 * Generated rather than a static file in public/, so it can never drift out of
 * date when a route is added or removed. /admin and /booking/* are absent on
 * purpose: they are private and marked noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE.url, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/book`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/prices`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/reviews`, lastModified, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE.url}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/contact`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];
}
