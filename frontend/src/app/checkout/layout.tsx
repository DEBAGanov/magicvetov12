/**
 * @file: app/checkout/layout.tsx
 * @description: Checkout layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: true },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>}>{children}</Suspense>;
}
