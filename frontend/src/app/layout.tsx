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
import Analytics from "@/components/Analytics";
import MaxBotPopup from "@/components/MaxBotPopup";
import "./globals.css";

const mulish = Mulish({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://magiacvetov12.ru"),
  title: {
    default: "Магия Цветов — Доставка цветов в Волжске и Зеленодольске | Букеты с доставкой",
    template: "%s — Магия Цветов",
  },
  description:
    "Доставка цветов по Волжску и Зеленодольску. Свежие розы, тюльпаны, пионы и авторские букеты. Доставка за 2 часа. Заказывайте на magiacvetov12.ru",
  keywords: [
    "доставка цветов", "букеты", "розы", "тюльпаны", "цветы с доставкой",
    "доставка цветов волжск", "доставка цветов зеленодольск",
    "купить цветы волжск", "заказать букет", "цветочный магазин",
    "букет на день рождения", "свадебные букеты", "цветы на 8 марта",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Магия Цветов — Доставка цветов в Волжске и Зеленодольске",
    description: "Свежие цветы с быстрой доставкой по Волжску и Зеленодольску. Букеты на любой вкус. Доставка за 2 часа.",
    url: "https://magiacvetov12.ru",
    siteName: "Магия Цветов",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Магия Цветов — Доставка цветов",
    description: "Доставка свежих цветов по Волжску и Зеленодольску за 2 часа",
  },
  alternates: {
    canonical: "https://magiacvetov12.ru",
  },
  verification: {
    yandex: "a971f18e03c62121",
    google: "Tdi5meg0b55kSN0H3yQGnGmyj96HFKA4EunwMJm19p0",
  },
  robots: {
    index: true,
    follow: true,
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
          <MaxBotPopup />
          <Analytics />
        </ToastProvider>
      </body>
    </html>
  );
}
