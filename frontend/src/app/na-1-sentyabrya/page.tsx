/**
 * @file: app/na-1-sentyabrya/page.tsx
 * @description: Landing — Цветы на 1 сентября
 */

import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
import { FAQ } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Цветы на 1 сентября — букеты для учителей с доставкой | Магия Цветов",
  description:
    "📚 Букеты на 1 сентября с доставкой по Зеленодольску и Волжску! Гладиолусы, астры, хризантемы для учителей. Доставка за 2 часа.",
  keywords: [
    "цветы на 1 сентября", "букет на 1 сентября", "цветы учителю",
    "1 сентября цветы", "гладиолусы 1 сентября", "букет учителю",
    "цветы на день знаний зеленодольск", "букет учителю волжск",
  ],
  openGraph: {
    title: "Цветы на 1 сентября с доставкой | Магия Цветов",
    description: "📚 Букеты для учителей на 1 сентября! Гладиолусы, астры, хризантемы.",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: "https://magiacvetov12.ru/na-1-sentyabrya" },
};

export default async function Sept1Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}

  return (
    <OccasionLandingContent
      h1="Цветы на 1 сентября"
      subtitle="Букеты цветов для учителей и первоклассников ко Дню знаний"
      breadcrumbs={[
        { name: "Главная", url: "https://magiacvetov12.ru" },
        { name: "Цветы на 1 сентября", url: "https://magiacvetov12.ru/na-1-sentyabrya" },
      ]}
      products={products}
      faqs={[...FAQ.sept1]}
      seoText={
        <>
          <h2>Цветы на 1 сентября — традиции Дня знаний</h2>
          <p>
            1 сентября — День знаний, когда ученики дарят цветы своим учителям. Гладиолусы и астры —
            традиционные осенние цветы для этого праздника. Также популярны хризантемы, розы
            и красивые осенние букеты.
          </p>
          <p>
            В «Магии Цветов» вы найдёте букеты на 1 сентября для классного руководителя,
            директора, предметников и молодого учителя. У нас можно заказать как один букет,
            так и набор для всего педагогического коллектива.
          </p>
          <h3>Заказ букетов на День знаний</h3>
          <p>
            Принимаем заказы на 1 сентября заранее. При заказе нескольких букетов для класса
            действует специальная цена. Доставим букеты рано утром ко времени линейки
            по любому адресу в Волжске или Зеленодольске.
          </p>
        </>
      }
    />
  );
}
