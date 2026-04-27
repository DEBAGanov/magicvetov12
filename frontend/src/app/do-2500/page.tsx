import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты до 2500 рублей с доставкой | Магия Цветов",
  description: "💰 Красивые букеты до 2500 ₽ с доставкой по Волжску и Зеленодольску! Свежие цветы по доступной цене. Доставка за 2 часа, бесплатная открытка!",
  keywords: ["букеты до 2500","цветы до 2500 рублей","недорогие букеты","бюджетные цветы","букет до 2500 волжск"],
  openGraph: { title: "Букеты до 2500 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/do-2500" },
};
export default async function Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try {
    const data = await productsApi.getAll(0, 500);
    const all = data?.content || [];
    products = all.filter((p) => (p.discountedPrice || p.price) <= 2500).slice(0, 8);
  } catch {}
  return <OccasionLandingContent h1="Букеты до 2 500 ₽" subtitle="Красивые цветы по доступной цене — от 990 до 2500 рублей"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "До 2500 ₽", url: "https://magiacvetov12.ru/do-2500" }]}
    products={products}
    faqs={[
      { q: "Какие букеты можно купить до 2500 ₽?", a: "Тюльпаны (15-25 шт), хризантемы, небольшие розы (5-9 шт), сезонные миксы, компактные авторские букеты." },
      { q: "Качество дешевле букетов дешевле?", a: "Нет! Все цветы свежие, от тех же поставщиков. Меньше размер — не меньше качество." },
    ]}
    seoText={<><h2>Букеты до 2500 ₽ — красиво и доступно</h2><p>Красивый букет не обязан стоить дорого. В этом ценовом диапазоне вы найдёте букеты тюльпанов, хризантем, небольшие букеты роз и авторские мини-композиции. Каждый букет составлен из свежих цветов с любовью и вниманием к деталям.</p><p>Закажите букет до 2500 ₽ с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
