import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты от 2500 до 3500 рублей с доставкой | Магия Цветов",
  description: "💐 Букеты 2500-3500 ₽ с доставкой по Волжску и Зеленодольску! Солидные букеты роз, авторские композиции. Доставка за 2 часа!",
  keywords: ["букеты 2500-3500","цветы от 2500 до 3500","букет средняя цена","заказать букет 3000"],
  openGraph: { title: "Букеты 2500-3500 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/ot-2500-do-3500" },
};
export default async function Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try {
    const data = await productsApi.getAll(0, 500);
    const all = data?.content || [];
    products = all.filter((p) => { const pr = p.discountedPrice || p.price; return pr > 2500 && pr <= 3500; }).slice(0, 8);
  } catch {}
  return <OccasionLandingContent h1="Букеты 2 500 — 3 500 ₽" subtitle="Солидные букеты для хорошего впечатления"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "2500-3500 ₽", url: "https://magiacvetov12.ru/ot-2500-do-3500" }]}
    products={products}
    faqs={[
      { q: "Что можно купить за 2500-3500 ₽?", a: "Букет из 15 роз, авторскую композицию, цветы в шляпной коробке, букет с хризантемами и розами." },
      { q: "Подойдёт ли для подарка?", a: "Да! Это оптимальный ценовой диапазон для красивого подарка — солидно и не слишком дорого." },
    ]}
    seoText={<><h2>Букеты 2500-3500 ₽ — оптимальное соотношение</h2><p>Это самый популярный ценовой диапазон. За 2500-3500 ₽ вы получите солидный букет из 15 роз, стильную авторскую композицию или цветы в шляпной коробке. Букет выглядит впечатляюще, но не разорит бюджет.</p><p>Закажите букет 2500-3500 ₽ с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
