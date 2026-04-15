/**
 * @file: app/search/layout.tsx
 * @description: Search layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Поиск",
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
