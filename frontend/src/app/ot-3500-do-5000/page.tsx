import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты от 3500 до 5000 рублей с доставкой | Магия Цветов",
  description: "🌹 Букеты 3500-5000 ₽ с доставкой! Роскошные букеты роз, большие композиции. Доставка по Волжску и Зеленодольску за 2 часа.",
  keywords: ["букеты 3500-5000","цветы от 3500","дорогие букеты","букет 4000 рублей","премиум букет"],
  openGraph: { title: "Букеты 3500-5000 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/ot-3500-do-5000" },
};
export default async function Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try {
    const data = await productsApi.getAll(0, 500);
    const all = data?.content || [];
    products = all.filter((p) => { const pr = p.discountedPrice || p.price; return pr > 3500 && pr <= 5000; }).slice(0, 8);
  } catch {}
  return <OccasionLandingContent h1="Букеты 3 500 — 5 000 ₽" subtitle="Роскошные букеты для особых случаев"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "3500-5000 ₽", url: "https://magiacvetov12.ru/ot-3500-do-5000" }]}
    products={products}
    faqs={[
      { q: "Что входит в ценовую категорию 3500-5000 ₽?", a: "25 роз, большие авторские композиции, премиальные цветы в коробке, корзины с цветами." },
      { q: "На какой повод подойдёт?", a: "Юбилей, годовщина, день рождения, свадьба, признание в любви — когда нужен по-настоящему впечатляющий подарок." },
    ]}
    seoText={<><h2>Букеты 3500-5000 ₽ — роскошь и масштаб</h2><p>За 3500-5000 ₽ вы получаете роскошный букет, который произведёт впечатление. 25 роз, большая авторская композиция или шикарная корзина — это подарок, который запомнится надолго.</p><p>Закажите букет 3500-5000 ₽ с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
