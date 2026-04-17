/**
 * @file: app/sitemap.ts
 * @description: Dynamic sitemap for SEO — includes city pages, occasion pages, info pages
 */

import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://magiacvetov12.ru";

// Static pages to include in sitemap
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
  { url: `${SITE_URL}/catalog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },

  // City landing pages
  { url: `${SITE_URL}/dostavka-cvetov`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${SITE_URL}/dostavka-cvetov/volzhsk`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
  { url: `${SITE_URL}/dostavka-cvetov/zelenodolsk`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },

  // Occasion pages
  { url: `${SITE_URL}/na-den-rozhdeniya`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-yubilej`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-svadbu`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-vypusknoj`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-8-marta`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-14-fevralya`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-1-sentyabrya`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },

  // Info pages
  { url: `${SITE_URL}/o-nas`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/dostavka`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/kontakty`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/otzyvy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = [...STATIC_PAGES];

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
        url: `${SITE_URL}/catalog/${p.categoryId}/${p.id}`,
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
