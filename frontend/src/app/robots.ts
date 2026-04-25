/**
 * @file: app/robots.ts
 * @description: Robots.txt configuration for search engine crawlers
 * @created: 2026-04-15
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://magiacvetov12.ru";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account/", "/checkout", "/cart", "/search"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
