import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы коллегам с доставкой — корпоративные букеты | Магия Цветов",
  description: "🤝 Букеты для коллег с доставкой по Волжску и Зеленодольску! Нейтральные корпоративные букеты от 990 ₽. Оптовые заказы со скидкой!",
  keywords: ["цветы коллегам","букет коллеге","корпоративные цветы","доставка цветов коллеге","цветы в офис"],
  openGraph: { title: "Цветы коллегам — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/kollegam" },
};
export default async function KollegamPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent h1="Цветы коллегам" subtitle="Корпоративные букеты — элегантно и уместно"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Коллегам", url: "https://magiacvetov12.ru/kollegam" }]}
      products={products}
      faqs={[
        { q: "Какие цветы подарить коллеге?", a: "Нейтральные букеты без романтического подтекста: хризантемы, герберы, альстромерии, миксы. Избегайте красных роз." },
        { q: "Делаете ли вы массовые заказы?", a: "Да! Доставим 10-50 одинаковых букетов в офис. При оптовом заказе действует скидка." },
      ]}
      seoText={<><h2>Цветы коллегам — уместный корпоративный подарок</h2><p>Букет цветов — универсальный подарок для коллеги на день рождения, 8 марта, профессиональный праздник. Выбирайте нейтральные букеты в жёлто-оранжевых или пастельных тонах. Для массовых праздников организуем доставку одинаковых букетов для всего коллектива.</p><p>Закажите букеты коллегам. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
