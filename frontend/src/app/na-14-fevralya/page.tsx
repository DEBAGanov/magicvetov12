/**
 * @file: app/na-14-fevralya/page.tsx
 * @description: Landing — Цветы на 14 февраля
 */

import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
import { FAQ } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Букеты на 14 февраля — День святого Валентина | Доставка цветов",
  description:
    "Закажите букет роз на 14 февраля с доставкой по Волжску и Зеленодольску. Красные, розовые и белые розы. Доставка за 2 часа.",
  keywords: [
    "цветы на 14 февраля", "букет на 14 февраля", "розы на 14 февраля",
    "день святого валентина цветы", "14 февраля доставка цветов",
  ],
  alternates: { canonical: "https://magiacvetov12.ru/na-14-fevralya" },
};

export default async function Feb14Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}

  return (
    <OccasionLandingContent
      h1="Цветы на 14 февраля"
      subtitle="Романтические букеты роз для вашего любимого человека"
      breadcrumbs={[
        { name: "Главная", url: "https://magiacvetov12.ru" },
        { name: "Цветы на 14 февраля", url: "https://magiacvetov12.ru/na-14-fevralya" },
      ]}
      products={products}
      faqs={[...FAQ.feb14]}
      seoText={
        <>
          <h2>Букеты на 14 февраля — скажите любовь цветами</h2>
          <p>
            День святого Валентина — праздник влюблённых, и нет лучшего способа выразить свои чувства,
            чем подарить букет роз. Красные розы символизируют страсть, розовые — нежность,
            белые — чистоту чувств. В «Магии Цветов» вы найдёте букеты на любой вкус.
          </p>
          <p>
            Мы предлагаем букеты из 3, 5, 7, 9, 15, 25, 51 и 101 розы. Каждое число имеет
            своё значение. Классический выбор — 15 или 25 красных роз. Для первого свидания
            подойдёт букет из 5-7 роз. А 101 роза — это заявление о большой любви.
          </p>
          <h3>Доставка букета на 14 февраля</h3>
          <p>
            Доставим букет по Волжску или Зеленодольску за 2 часа. Можно заказать доставку
            на работу — сделаем сюрприз. К каждому букету — бесплатная открытка-валентинка
            с вашим поздравлением.
          </p>
        </>
      }
    />
  );
}
