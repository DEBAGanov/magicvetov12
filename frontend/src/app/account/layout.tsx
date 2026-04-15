/**
 * @file: app/account/layout.tsx
 * @description: Account layout with SEO metadata
 * @created: 2026-04-15
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: true },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
