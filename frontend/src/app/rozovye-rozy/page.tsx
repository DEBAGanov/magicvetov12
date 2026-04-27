import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Розовые розы с доставкой — нежные букеты | Магия Цветов",
  description: "🌸 Розовые розы с доставкой по Волжску и Зеленодольску! Нежность, восхищение и благодарность. Букеты от 990 ₽, доставка за 2 часа.",
  keywords: ["розовые розы","букет розовых роз","розовые розы доставка","купить розовые розы","нежные розы"],
  openGraph: { title: "Розовые розы — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/rozovye-rozy" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="Розовые розы" subtitle="Нежность, восхищение и благодарность — мягкие и женственные"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Розы", url: "https://magiacvetov12.ru/rozy" },{ name: "Розовые розы", url: "https://magiacvetov12.ru/rozovye-rozy" }]}
    products={p}
    faqs={[
      { q: "Что означают розовые розы?", a: "Нежность, восхищение, благодарность, изящество. Розовые розы мягче красных — уместны для мамы, подруги, коллеги." },
      { q: "Кому дарят розовые розы?", a: "Маме, девушке, подруге, невесте, коллеге. Универсальный цветок, который нравится всем." },
    ]}
    seoText={<><h2>Розовые розы — нежность и восхищение</h2><p>Розовые розы — нежнее красных, но не менее красивые. Они символизируют восхищение, благодарность и изящество. Букет розовых роз — универсальный подарок: маме, девушке, подруге, коллеге. Он всегда уместен и всегда вызывает улыбку.</p><p>Закажите розовые розы с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
