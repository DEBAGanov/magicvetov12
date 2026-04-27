import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты с эустомой с доставкой — заказать | Магия Цветов",
  description: "🌸 Букеты с эустомой с доставкой по Волжску и Зеленодольску! Нежные розоподобные цветы от 1200 ₽. Доставка за 2 часа!",
  keywords: ["букет с эустомой","эустома доставка","купить эустому","эустома волжск","букет эустомы"],
  openGraph: { title: "Букеты с эустомой — от 1200 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/s-eustomoy" },
};
export default async function SEustomoyPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent
      h1="Букеты с эустомой"
      subtitle="Нежные розоподобные цветы — утончённость и воздушность"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "С эустомой", url: "https://magiacvetov12.ru/s-eustomoy" }]}
      products={products}
      faqs={[
        { q: "Что такое эустома?", a: "Эустома (лизиантус) — нежный цветок, похожий на полураскрытую розу. Бывают белые, розовые, сиреневые, кремовые. Воздушные и романтичные." },
        { q: "Сколько стоит букет эустомы?", a: "Букеты с эустомой от 1200 ₽. Эустома добавляет букету воздушности и нежности." },
      ]}
      seoText={<><h2>Букеты с эустомой — воздушная нежность</h2><p>Эустома — один из самых нежных цветов. Её полураскрытые бутоны напоминают миниатюрные розы, а многослойные лепестки создают эффект невесомости. Букет с эустомой выглядит романтично и утончённо — идеальный выбор для тех, кто ценит элегантность.</p><p>Закажите букет с эустомой с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
