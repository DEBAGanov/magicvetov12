import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы на годовщину с доставкой — букет на годовщину свадьбы | Магия Цветов",
  description: "💍 Букет на годовщину свадьбы с доставкой! Красные розы, романтические композиции от 990 ₽. Доставка по Волжску и Зеленодольску за 2 часа.",
  keywords: ["цветы на годовщину","букет на годовщину","доставка цветов годовщина","годовщина свадьбы цветы","букет жене годовщина"],
  openGraph: { title: "Цветы на годовщину | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/na-godovshchinu" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="Цветы на годовщину" subtitle="Отметьте годовщину свадьбы красивым букетом"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Годовщина", url: "https://magiacvetov12.ru/na-godovshchinu" }]}
    products={p}
    faqs={[
      { q: "Какие цветы на годовщину свадьбы?", a: "Красные розы — классика. Количество = число лет. Также подходят: пионы, орхидеи, цветы в шляпной коробке." },
      { q: "Сколько роз подарить на годовщину?", a: "Традиция: количество роз = число лет. 1 год — 1 роза, 5 лет — 5 роз, 25 лет — 25 роз. Но можно и больше!" },
    ]}
    seoText={<><h2>Годовщина свадьбы — букет, который скажет «я всё ещё люблю»</h2><p>Годовщина — повод вспомнить самый счастливый день и сказать «я люблю тебя» снова. Красные розы — классика, но можно удивить: цветы в шляпной коробке, корзина или авторская композиция. Традиция гласит: количество роз равно числу лет совместной жизни.</p><p>Закажите букет на годовщину с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
