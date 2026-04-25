/**
 * @file: app/na-8-marta/page.tsx
 * @description: Landing — Цветы на 8 марта
 */

import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
import { FAQ } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Цветы на 8 Марта с доставкой — заказать весенний букет | Магия Цветов",
  description:
    "🌷 Весенние букеты на 8 Марта с доставкой! Тюльпаны, розы, мимоза от 990 ₽. Доставка по Зеленодольску и Волжску. Закажите заранее!",
  keywords: [
    "цветы на 8 марта", "букет на 8 марта", "тюльпаны 8 марта",
    "доставка цветов 8 марта", "8 марта волжск", "мимоза 8 марта",
    "тюльпаны зеленодольск", "весенние цветы 8 марта",
  ],
  openGraph: {
    title: "Цветы на 8 Марта с доставкой | Магия Цветов",
    description: "🌷 Тюльпаны, розы, мимоза на 8 Марта! Доставка по Зеленодольску и Волжску.",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: "https://magiacvetov12.ru/na-8-marta" },
};

export default async function March8Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}

  return (
    <OccasionLandingContent
      h1="Цветы на 8 марта"
      subtitle="Весенние букеты тюльпанов, роз и мимозы с доставкой в праздник"
      breadcrumbs={[
        { name: "Главная", url: "https://magiacvetov12.ru" },
        { name: "Цветы на 8 марта", url: "https://magiacvetov12.ru/na-8-marta" },
      ]}
      products={products}
      faqs={[...FAQ.march8]}
      seoText={
        <>
          <h2>Цветы на 8 марта — подарок, который всегда уместен</h2>
          <p>
            8 марта — самый цветочный праздник в году. Тюльпаны, розы, мимоза, нарциссы — каждый
            букет несёт в себе весеннее тепло и нежность. В «Магии Цветов» вы найдёте букеты
            на 8 марта для мамы, жены, подруги, коллеги и бабушки.
          </p>
          <p>
            Мы предлагаем широкий выбор весенних букетов по доступным ценам. От компактных
            букетиков тюльпанов до роскошных корзин роз — у нас есть вариант на любой бюджет.
            Доставка по Волжску и Зеленодольску в день заказа.
          </p>
          <h3>Заказывайте заранее</h3>
          <p>
            8 марта — самый загруженный день для цветочных магазинов. Рекомендуем оформить
            заказ за 3-5 дней до праздника, чтобы гарантировать наличие нужных цветов и удобное
            время доставки. Мы доставим букет точно в срок.
          </p>
        </>
      }
    />
  );
}
