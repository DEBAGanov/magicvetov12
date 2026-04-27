import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты с гортензией с доставкой — заказать | Магия Цветов",
  description: "💐 Букеты с гортензией с доставкой по Волжску и Зеленодольску! Пышные шапки цветов от 1500 ₽. Доставка за 2 часа!",
  keywords: ["букет с гортензией","гортензия доставка","купить гортензию","гортензия волжск","букет гортензий"],
  openGraph: { title: "Букеты с гортензией — от 1500 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/s-gortenziey" },
};
export default async function SGortenzieyPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent
      h1="Букеты с гортензией"
      subtitle="Пышные шапки цветов — роскошь и объём"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "С гортензией", url: "https://magiacvetov12.ru/s-gortenziey" }]}
      products={products}
      faqs={[
        { q: "Сколько стоит букет с гортензией?", a: "Букеты с гортензией от 1500 ₽. Одна ветка гортензии — это уже полноценный букет благодаря объёмному соцветию." },
        { q: "Какие цвета гортензии бывают?", a: "Белые, розовые, голубые, сиреневые, зелёные. Белая гортензия — классика, голубая — необычный и стильный вариант." },
      ]}
      seoText={<><h2>Букеты с гортензией — пышная роскошь</h2><p>Гортензия — цветок с огромным пышным соцветием, похожим на пушистое облако. Даже одна ветка гортензии создаёт эффект полноценного букета. В сочетании с розами или эустомой получается воздушная и объёмная композиция.</p><p>Закажите букет с гортензией с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
