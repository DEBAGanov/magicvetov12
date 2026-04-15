/**
 * @file: app/checkout/layout.tsx
 * @description: Checkout layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
