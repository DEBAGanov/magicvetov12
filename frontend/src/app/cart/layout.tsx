/**
 * @file: app/cart/layout.tsx
 * @description: Cart layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Ваша корзина товаров",
  robots: { index: false, follow: true },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
