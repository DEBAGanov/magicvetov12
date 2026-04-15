/**
 * @file: app/catalog/layout.tsx
 * @description: Catalog layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог цветов",
  description: "Каталог свежих цветов и букетов с доставкой. Розы, тюльпаны, пионы и авторские букеты на любой случай.",
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
