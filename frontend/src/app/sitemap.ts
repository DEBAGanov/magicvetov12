/**
 * @file: app/sitemap.ts
 * @description: Dynamic sitemap for SEO — includes city pages, occasion pages, info pages
 */

import type { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/seo/blog-articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://magiacvetov12.ru";

// Render at request time, NOT at build time. During `next build` (Docker builder
// stage) the backend (app:8080) is unreachable, so a statically-generated sitemap
// would silently drop all product/category URLs. Forcing dynamic rendering makes the
// sitemap query the live API on each request, when the backend IS reachable.
export const dynamic = "force-dynamic";

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
  { url: `${SITE_URL}/na-den-materi`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/na-novyj-god`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/na-rozhdenie-rebenka`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/na-svidanie`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.75 },
  { url: `${SITE_URL}/na-korporativ`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.75 },
  { url: `${SITE_URL}/pozdravlenie-s-dnem-rozhdeniya`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/otkrytka`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.7 },
  { url: `${SITE_URL}/izvinenie`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.75 },
  { url: `${SITE_URL}/spasibo`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.75 },
  { url: `${SITE_URL}/na-godovshchinu`, lastModified: "2026-04-25", changeFrequency: "monthly", priority: 0.8 },

  // Category pages
  { url: `${SITE_URL}/rozy`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.85 },
  { url: `${SITE_URL}/tyulpany`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/cvety-v-korobke`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/korziny-s-cvetami`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/nedorogie-cvety`, lastModified: "2026-04-25", changeFrequency: "weekly", priority: 0.8 },

  // Flower type pages
  { url: `${SITE_URL}/s-hrizantemami`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/s-alstromeriyami`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/s-gerberami`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/s-orhideyami`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/s-eustomoy`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },
  { url: `${SITE_URL}/s-gortenziey`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.75 },

  // Recipient pages
  { url: `${SITE_URL}/zhene`, lastModified: "2026-04-27", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/devushke`, lastModified: "2026-04-27", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/mame`, lastModified: "2026-04-27", changeFrequency: "monthly", priority: 0.8 },
  { url: `${SITE_URL}/muzhchine`, lastModified: "2026-04-27", changeFrequency: "monthly", priority: 0.75 },
  { url: `${SITE_URL}/kollegam`, lastModified: "2026-04-27", changeFrequency: "monthly", priority: 0.7 },

  // Rose type pages
  { url: `${SITE_URL}/51-roza`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/101-roza`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/belye-rozy`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/krasnye-rozy`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/rozovye-rozy`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },

  // Price pages
  { url: `${SITE_URL}/do-2500`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/ot-2500-do-3500`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/ot-3500-do-5000`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },
  { url: `${SITE_URL}/premium-bukety`, lastModified: "2026-04-27", changeFrequency: "weekly", priority: 0.8 },

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

  const apiBase = process.env.INTERNAL_API_URL
    ? `${process.env.INTERNAL_API_URL}/api/v1`
    : `${SITE_URL}/api/v1`;

  // Categories
  try {
    const categories = await fetch(`${apiBase}/categories`, { cache: "no-store" })
      .then((r) => r.json() as Promise<{ id: number }[]>);
    for (const cat of categories) {
      entries.push({
        url: `${SITE_URL}/catalog?category=${cat.id}`,
        lastModified: "2026-04-25",
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (e) {
    console.error("[sitemap] failed to fetch categories:", e);
  }

  // Products — paginate through ALL pages so the sitemap is never capped.
  try {
    const PAGE_SIZE = 200;
    let page = 0;
    let totalPages = 1;
    do {
      const data = await fetch(`${apiBase}/products?page=${page}&size=${PAGE_SIZE}`, { cache: "no-store" })
        .then((r) => r.json() as Promise<{ content: { id: number; categoryId: number }[]; totalPages: number }>);
      totalPages = data.totalPages ?? 1;
      for (const p of data.content || []) {
        if (p.categoryId == null || p.id == null) continue;
        entries.push({
          url: `${SITE_URL}/catalog/${p.categoryId}/${p.id}`,
          lastModified: "2026-04-25",
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
      page += 1;
    } while (page < totalPages);
  } catch (e) {
    console.error("[sitemap] failed to fetch products:", e);
  }

  return entries;
}
