import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "51 роза с доставкой — купить букет из 51 розы | Магия Цветов",
  description: "🌹 51 роза с доставкой по Волжску и Зеленодольску! Роскошный букет — «ты моя единственная навсегда». Красные, белые, розовые. Доставка за 2 часа!",
  keywords: ["51 роза","букет 51 роза","51 роза доставка","купить 51 розу","51 красная роза","51 белая роза"],
  openGraph: { title: "51 роза — роскошный букет | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/51-roza" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="51 роза" subtitle="«Ты моя единственная навсегда» — роскошный букет на особый случай"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Розы", url: "https://magiacvetov12.ru/rozy" },{ name: "51 роза", url: "https://magiacvetov12.ru/51-roza" }]}
    products={p}
    faqs={[
      { q: "Что означает 51 роза?", a: "51 роза — символ безусловной преданности: «ты моя единственная навсегда». Это масштабное признание, которое невозможно забыть." },
      { q: "Когда дарить 51 розу?", a: "Предложение, юбилей жены, годовщина свадьбы, день рождения — когда нужно невероятное впечатление." },
    ]}
    seoText={<><h2>51 роза — незабываемый подарок</h2><p>Букет из 51 розы — это не просто цветы, это событие. Огромный, роскошный, невероятно красивый — он буквально захватывает дух. Дарите на особые случаи, когда нужно сказать главное.</p><p>Закажите 51 розу с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
