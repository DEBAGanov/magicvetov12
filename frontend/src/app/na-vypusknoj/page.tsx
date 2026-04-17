/**
 * @file: app/na-vypusknoj/page.tsx
 * @description: Landing — Цветы на выпускной и последний звонок
 */

import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
import { FAQ } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Цветы на выпускной и последний звонок — доставка букетов | Волжск, Зеленодольск",
  description:
    "Букеты цветов на выпускной и последний звонок с доставкой по Волжску и Зеленодольску. Яркие букеты для выпускников и учителей.",
  keywords: [
    "цветы на выпускной", "цветы на последний звонок", "букет на выпускной",
    "цветы учителю", "выпускной букет", "последний звонок цветы",
  ],
  alternates: { canonical: "https://magiacvetov12.ru/na-vypusknoj" },
};

export default async function GraduationPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}

  return (
    <OccasionLandingContent
      h1="Цветы на выпускной и последний звонок"
      subtitle="Яркие букеты для выпускников, учеников и учителей с доставкой"
      breadcrumbs={[
        { name: "Главная", url: "https://magiacvetov12.ru" },
        { name: "Цветы на выпускной", url: "https://magiacvetov12.ru/na-vypusknoj" },
      ]}
      products={products}
      faqs={[...FAQ.graduation]}
      seoText={
        <>
          <h2>Цветы на выпускной — яркие букеты для важных моментов</h2>
          <p>
            Выпускной и последний звонок — трогательные события, которые хочется запомнить навсегда.
            Букет цветов станет прекрасным дополнением к этому дню. Мы предлагаем букеты для
            выпускников, учителей и родителей в широком ценовом диапазоне.
          </p>
          <p>
            Для выпускниц популярны яркие букеты из гербер, хризантем и роз. Для учителей —
            элегантные композиции в сдержанных тонах. Также можно заказать небольшие букетики
            для всего класса.
          </p>
          <h3>Заказ букетов на выпускной</h3>
          <p>
            Рекомендуем заказывать цветы заранее, особенно если нужен большой заказ на весь класс.
            Мы доставим букеты точно ко времени мероприятия по любому адресу в Волжске или
            Зеленодольске. При заказе от 10 букетов действует скидка.
          </p>
        </>
      }
    />
  );
}
