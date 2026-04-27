import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты с альстромериями с доставкой — заказать | Магия Цветов",
  description: "🌷 Букеты с альстромериями с доставкой по Волжску и Зеленодольску! Изящные цветы от 990 ₽. Доставка за 2 часа, фото перед отправкой.",
  keywords: ["букет с альстромериями","альстромерии доставка","купить альстромерии","альстромерии волжск","букет альстромерий"],
  openGraph: { title: "Букеты с альстромериями — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/s-alstromeriyami" },
};
export default async function SAlstromeriyamiPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent
      h1="Букеты с альстромериями"
      subtitle="Изящные и нежные — альстромерии для любого повода"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "С альстромериями", url: "https://magiacvetov12.ru/s-alstromeriyami" }]}
      products={products}
      faqs={[
        { q: "Что такое альстромерии?", a: "Альстромерия (перуанская лилия) — нежный цветок с лепестками в крапинку. Бывают белые, розовые, оранжевые, красные, фиолетовые. Стоят в вазе 10-14 дней." },
        { q: "Кому подарить альстромерии?", a: "Универсальный подарок: подруге, маме, коллеге, девушке. Нежные и не слишком личные — уместны в любой ситуации." },
      ]}
      seoText={<><h2>Букеты с альстромериями — нежность и изящество</h2><p>Альстромерии — удивительно красивые цветы, похожие на миниатюрные лилии. Их нежные лепестки с изящными крапинками покоряют с первого взгляда. Букет альстромерий — элегантный подарок для любого случая.</p><p>Закажите букет с альстромериями с доставкой по Волжску и Зеленодольску. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
