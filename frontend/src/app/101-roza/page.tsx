import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "101 роза с доставкой — королевский букет | Магия Цветов",
  description: "🌹 101 роза с доставкой! Абсолютный знак обожания. Красные, белые, розовые розы. Доставка по Волжску и Зеленодольску за 2 часа.",
  keywords: ["101 роза","букет 101 роза","101 роза доставка","купить 101 розу","101 красная роза"],
  openGraph: { title: "101 роза — королевский букет | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/101-roza" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="101 роза" subtitle="Абсолютное обожание — букет, который невозможно забыть"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Розы", url: "https://magiacvetov12.ru/rozy" },{ name: "101 роза", url: "https://magiacvetov12.ru/101-roza" }]}
    products={p}
    faqs={[
      { q: "Что означает 101 роза?", a: "101 роза — максимальное выражение чувств: абсолютное обожание и преклонение. Самый масштабный букет-признание." },
      { q: "Как доставляют 101 розу?", a: "В специальной коробке или корзине. Курьер аккуратно несёт букет, защищая от ветра. Фото перед отправкой." },
    ]}
    seoText={<><h2>101 роза — максимальное выражение чувств</h2><p>Букет из 101 розы — это заявление. Абсолютное обожание, преклонение, вечная преданность. Такой подарок невозможно забыть никогда. Идеален для предложения, золотой годовщины или дня рождения любимой.</p><p>Закажите 101 розу с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
