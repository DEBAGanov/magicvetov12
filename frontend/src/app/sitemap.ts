/**
 * @file: app/sitemap.ts
 * @description: Dynamic sitemap for SEO — includes city pages, occasion pages, info pages
 */

import type { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/seo/blog-articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://magiacvetov12.ru";

// Static pages with realistic lastModified dates
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: SITE_URL, lastModified: "2026-04-25", changeFrequency: "daily", priority: 1.0 },
  { url: `${SITE_URL}/catalog`, lastModified: "2026-04-25", changeFrequency: "daily", priority: 0.9 },

  // City landing pages
  { url: `${SITE_URL}/dostavka-cvetov/volzhsk`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.95 },
  { url: `${SITE_URL}/dostavka-cvetov/zelenodolsk`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.95 },

  // Occasion pages
  { url: `${SITE_URL}/na-den-rozhdeniya`, lastModified: "2026-04-20", changeFrequency: "weekly", priority: 0.85 },
  { url: `${SITE_URL}/na-yubilej`, lastModified: "2026-04-20", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-svadbu`, lastModified: "2026-04-20", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/na-vypusknoj`, lastModified: "2026-04-20", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/na-8-marta`, lastModified: "2026-04-20", changeFrequency: "monthly", priority: 0.85 },
  { url: `${SITE_URL}/na-14-fevralya`, lastModified: "2026-04-20", changeFrequency: "monthly", priority: 0.85 },
  { url: `${SITE_URL}/na-1-sentyabrya`, lastModified: "2026-04-20", changeFrequency: "monthly", priority: 0.75 },

  // Info pages
  { url: `${SITE_URL}/o-nas`, lastModified: "2026-04-15", changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/dostavka`, lastModified: "2026-04-15", changeFrequency: "monthly", priority: 0.65 },
  { url: `${SITE_URL}/kontakty`, lastModified: "2026-04-15", changeFrequency: "monthly", priority: 0.6 },
  { url: `${SITE_URL}/otzyvy`, lastModified: "2026-04-20", changeFrequency: "weekly", priority: 0.7 },

  // Blog
  { url: `${SITE_URL}/blog`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.75 },

  // FAQ
  { url: `${SITE_URL}/faq`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.7 },
];

// Blog articles
const BLOG_PAGES: MetadataRoute.Sitemap = BLOG_ARTICLES.map((a) => ({
  url: `${SITE_URL}/blog/${a.slug}`,
  lastModified: a.date,
  changeFrequency: "monthly" as const,
  priority: 0.7,
}));

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = [...STATIC_PAGES, ...BLOG_PAGES];

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
        lastModified: "2026-04-25",
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const p of products) {
      entries.push({
        url: `${SITE_URL}/catalog/${p.categoryId}/${p.id}`,
        lastModified: "2026-04-25",
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // sitemap will contain only static pages if API is unavailable
  }

  return entries;
}
