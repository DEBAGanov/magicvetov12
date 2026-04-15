/**
 * @file: app/sitemap.ts
 * @description: Dynamic sitemap for SEO
 * @created: 2026-04-15
 */

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://magiacvetov12.ru";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/cart`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${SITE_URL}/checkout`, lastModified: new Date(), changeFrequency: "always", priority: 0.5 },
    { url: `${SITE_URL}/account`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const apiBase = process.env.INTERNAL_API_URL
      ? `${process.env.INTERNAL_API_URL}/api/v1`
      : `${SITE_URL}/api/v1`;

    const [categories, products] = await Promise.all([
      fetch(`${apiBase}/categories`).then((r) => r.json() as Promise<{ id: number }[]>).catch(() => []),
      fetch(`${apiBase}/products?page=0&size=500`).then((r) => r.json() as Promise<{ content: { id: number; categoryId: number }[] }>).then((d) => d.content || []).catch(() => []),
    ]);

    for (const cat of categories) {
      entries.push({
        url: `${SITE_URL}/catalog?category=${cat.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const p of products) {
      entries.push({
        url: `${SITE_URL}/catalog/0/${p.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // sitemap will contain only static pages if API is unavailable
  }

  return entries;
}
