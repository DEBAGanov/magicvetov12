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
    default: "Магия Цветов — доставка цветов по Зеленодольску и Волжску | Заказать букет с доставкой",
    template: "%s — Магия Цветов",
  },
  description:
    "Доставка свежих цветов по Зеленодольску, Волжску и Казани! Букеты от 990 ₽, доставка за 2 часа. Розы, тюльпаны, пионы. Фото ДО оплаты. Закажите онлайн!",
  keywords: [
    "доставка цветов", "букеты", "розы", "тюльпаны", "цветы с доставкой",
    "доставка цветов волжск", "доставка цветов зеленодольск",
    "доставка цветов казань", "купить цветы волжск",
    "заказать букет зеленодольск", "цветочный магазин волжск",
    "букет на день рождения", "свадебные букеты", "цветы на 8 марта",
    "заказать цветы недорого", "доставка роз",
  ],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Магия Цветов — доставка цветов по Зеленодольску и Волжску",
    description: "Доставка свежих цветов по Зеленодольску и Волжску! Букеты от 990 ₽, доставка за 2 часа. Розы, тюльпаны, пионы.",
    url: "https://magiacvetov12.ru",
    siteName: "Магия Цветов",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Магия Цветов — Доставка цветов по Зеленодольску и Волжску",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Магия Цветов — доставка цветов по Зеленодольску и Волжску",
    description: "Доставка свежих цветов! Букеты от 990 ₽, доставка за 2 часа. Розы, тюльпаны, пионы.",
    images: ["/og-image.jpg"],
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
  other: {
    "theme-color": "#DC2626",
    "msapplication-TileColor": "#DC2626",
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
