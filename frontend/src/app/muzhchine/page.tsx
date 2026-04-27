import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы мужчине с доставкой — мужские букеты | Магия Цветов",
  description: "Букеты для мужчины с доставкой! Строгие мужские композиции из гербер, хризантем, ирисов. Доставка по Волжску и Зеленодольску от 1500 ₽.",
  keywords: ["цветы мужчине","мужской букет","букет для мужчины","доставка цветов мужчине","мужские цветы волжск"],
  openGraph: { title: "Цветы мужчине — мужские букеты | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/muzhchine" },
};
export default async function MuzhchinePage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent h1="Цветы мужчине" subtitle="Строгие мужские букеты — элегантность без лишней нежности"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Мужчине", url: "https://magiacvetov12.ru/muzhchine" }]}
      products={products}
      faqs={[
        { q: "Какие цветы дарят мужчинам?", a: "Герберы, хризантемы, ирисы, гладиолусы, каллы. Выбирайте тёмные или насыщенные цвета: бордо, фиолетовый, тёмно-синий." },
        { q: "Уместно ли дарить цветы мужчине?", a: "Да! Мужские букеты — это стильный и необычный подарок на юбилей, повышение, день рождения." },
      ]}
      seoText={<><h2>Мужские букеты — стильный подарок</h2><p>Цветы — это не только женский подарок. Строгий букет в тёмных тонах из гербер, хризантем или ирисов — отличный подарок мужчине на юбилей, повышение или день рождения. Мужские букеты отличаются лаконичностью и строгостью форм.</p><p>Закажите мужской букет с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
