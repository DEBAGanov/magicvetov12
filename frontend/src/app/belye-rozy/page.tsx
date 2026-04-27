import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Белые розы с доставкой — заказать букет белых роз | Магия Цветов",
  description: "🤍 Белые розы с доставкой по Волжску и Зеленодольску! Символ чистоты и искренности. Букеты от 990 ₽, доставка за 2 часа.",
  keywords: ["белые розы","букет белых роз","белые розы доставка","купить белые розы","белые розы волжск"],
  openGraph: { title: "Белые розы — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/belye-rozy" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="Белые розы" subtitle="Чистота, невинность и искренность — букет белых роз"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Розы", url: "https://magiacvetov12.ru/rozy" },{ name: "Белые розы", url: "https://magiacvetov12.ru/belye-rozy" }]}
    products={p}
    faqs={[
      { q: "Что символизируют белые розы?", a: "Чистоту, невинность, искренность, начало нового. Идеальны для свадьбы, извинения, рождения ребёнка." },
      { q: "Кому дарят белые розы?", a: "Невесте, маме, на извинение, на рождение ребёнка, коллеге. Универсальный и элегантный цветок." },
    ]}
    seoText={<><h2>Белые розы — символ чистоты</h2><p>Белые розы — элегантные и универсальные. Они символизируют чистоту намерений, искренность и начало нового. Букет белых роз уместен на свадьбе, при извинении, на рождении ребёнка и просто чтобы сказать «я восхищаюсь тобой».</p><p>Закажите белые розы с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
