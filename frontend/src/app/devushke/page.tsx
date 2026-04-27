import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы девушке с доставкой — букет для любимой | Магия Цветов",
  description: "💕 Букет для девушки с доставкой по Волжску и Зеленодольску! Нежные и романтические букеты от 990 ₽. Доставка за 2 часа!",
  keywords: ["цветы девушке","букет девушке","доставка цветов девушке","купить цветы девушке","букет для девушки"],
  openGraph: { title: "Цветы девушке — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/devushke" },
};
export default async function DevushkePage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent h1="Цветы девушке" subtitle="Нежные букеты — от первого свидания до признания в любви"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Девушке", url: "https://magiacvetov12.ru/devushke" }]}
      products={products}
      faqs={[
        { q: "Какие цветы подарить девушке?", a: "На первое свидание — 3-5 роз или тюльпанов. Для любимой — 15-25 роз. Нежные букеты из эустомы, тюльпанов, пионов — всегда выигрышный выбор." },
        { q: "Можно ли доставить букет девушке на работу?", a: "Да! Это очень романтично — получить букет прямо на рабочем месте. Укажите адрес и время доставки." },
      ]}
      seoText={<><h2>Букет для девушки — цветы, которые покорят сердце</h2><p>Букет цветов — лучший способ выразить симпатию и чувства. Для первого свидания подойдёт компактный букет из 3-5 роз. Для признания в любви — 15-25 роз. А если хотите удивить — закажите доставку букета ей на работу!</p><p>Закажите букет девушке с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
