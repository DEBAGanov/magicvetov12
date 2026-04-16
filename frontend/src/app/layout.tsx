/**
 * @file: layout.tsx
 * @description: Root layout with Mulish font, Header, Footer, MobileNav
 * @dependencies: globals.css, components/layout/*
 * @created: 2026-04-15
 */

import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const mulish = Mulish({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Магия Цветов — Доставка цветов | Букеты с доставкой",
    template: "%s — Магия Цветов",
  },
  description:
    "Закажите букеты цветов с быстрой доставкой. Свежие розы, тюльпаны, пионы и авторские букеты. Доставка в день заказа.",
  keywords: "доставка цветов, букеты, розы, тюльпаны, цветы с доставкой",
  openGraph: {
    title: "Магия Цветов — Доставка цветов",
    description: "Свежие цветы с быстрой доставкой. Букеты на любой вкус.",
    url: "https://magiacvetov12.ru",
    siteName: "Магия Цветов",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={mulish.variable}>
      <body className="font-sans text-gray-900 bg-white min-h-screen flex flex-col">
        <ToastProvider>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <MobileNav />
        </ToastProvider>
      </body>
    </html>
  );
}
