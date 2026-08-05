import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private surfaces. Both are also noindex via headers in vercel.json.
      disallow: ["/admin", "/booking/", "/api/"],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
