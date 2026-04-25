/**
 * @file: app/dostavka-cvetov/zelenodolsk/page.tsx
 * @description: City landing page — Доставка цветов в Зеленодольске
 */

import type { Metadata } from "next";
import { productsApi, categoriesApi } from "@/lib/api/client";
import CityLandingContent from "@/components/seo/CityLandingContent";

export const metadata: Metadata = {
  title: "Доставка цветов по Зеленодольску — заказать букет с доставкой | Магия Цветов",
  description:
    "🌸 Закажите цветы с доставкой по Зеленодольску! Букеты от 990 ₽, доставка за 2 часа. Фото ДО оплаты. Розы, тюльпаны, пионы. Круглосуточный приём!",
  keywords: [
    "доставка цветов зеленодольск", "букеты зеленодольск", "купить цветы зеленодольск",
    "заказать цветы зеленодольск", "цветочный магазин зеленодольск",
    "доставка цветов республика татарстан", "цветы на дом зеленодольск",
    "заказать букет зеленодольск недорого", "доставка роз зеленодольск",
  ],
  openGraph: {
    title: "Доставка цветов по Зеленодольску — Магия Цветов | Букеты от 990 ₽",
    description: "🌸 Цветы с доставкой по Зеленодольску! Букеты от 990 ₽, доставка за 2 часа.",
    locale: "ru_RU",
    type: "website",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  alternates: { canonical: "https://magiacvetov12.ru/dostavka-cvetov/zelenodolsk" },
};

export default async function ZelenodolskPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  let categories: import("@/lib/types").CategoryDTO[] = [];

  try {
    const [prodData, catData] = await Promise.all([
      productsApi.getAll(0, 8),
      categoriesApi.getAll(),
    ]);
    products = prodData?.content || [];
    categories = catData || [];
  } catch { /* API may be unavailable */ }

  return (
    <CityLandingContent
      city="zelenodolsk"
      products={products}
      categories={categories}
      seoText={
        <>
          <h2>Доставка цветов в Зеленодольске — свежие букеты с быстрой доставкой</h2>
          <p>
            «Магия Цветов» — это быстрая и бережная доставка свежих цветов по городу Зеленодольску
            (Республика Татарстан). Мы доставляем букеты по всему городу в течение 2 часов, чтобы ваши
            близкие получили цветы максимально свежими.
          </p>
          <p>
            Наш каталог включает более 100 видов букетов и композиций: от классических роз и тюльпанов
            до авторских работ наших флористов. У нас можно заказать букет на день рождения, свадьбу,
            юбилей, 8 марта, 14 февраля и любой другой праздник.
          </p>
          <h3>Заказ цветов с доставкой в Зеленодольске</h3>
          <p>
            Мы осуществляем доставку по всем районам Зеленодольска: центр города, микрорайон Мирный,
            посёлок Нижние Вязовые, улица Строителей и другие. Также возможна доставка в пригороды —
            уточняйте стоимость у менеджера.
          </p>
          <p>
            Для заказа букета с доставкой по Зеленодольску позвоните нам по телефону{" "}
            <strong>+7 (964) 861-23-70</strong> или оформите заказ на сайте. Принимаем оплату
            картой онлайн, через СБП и наличными. К каждому букету — бесплатная открытка.
          </p>
        </>
      }
    />
  );
}
