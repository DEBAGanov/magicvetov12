import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Премиум букеты с доставкой — эксклюзивные цветы | Магия Цветов",
  description: "👑 Премиум букеты от 5000 ₽ с доставкой! Эксклюзивные композиции, 51+ роз, орхидеи, дизайнерские букеты. Доставка по Волжску и Зеленодольску.",
  keywords: ["премиум букеты","эксклюзивные цветы","дорогие букеты","букет от 5000","vip букет","люкс букет"],
  openGraph: { title: "Премиум букеты — от 5000 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/premium-bukety" },
};
export default async function Page() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try {
    const data = await productsApi.getAll(0, 500);
    const all = data?.content || [];
    products = all.filter((p) => (p.discountedPrice || p.price) > 5000).slice(0, 8);
  } catch {}
  return <OccasionLandingContent h1="Премиум букеты" subtitle="Эксклюзивные композиции от 5000 ₽ — для самых важных моментов"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Premium", url: "https://magiacvetov12.ru/premium-bukety" }]}
    products={products}
    faqs={[
      { q: "Что входит в премиум категорию?", a: "51+ роз, 101 роза, букеты с орхидеями, дизайнерские композиции, корзины премиум-класса, цветы в шляпных коробках." },
      { q: "Можно ли заказать индивидуальный дизайн?", a: "Да! Опишите свои пожелания — наши флористы создадут эксклюзивный букет по вашему описанию или фото." },
    ]}
    seoText={<><h2>Премиум букеты — для самых важных моментов</h2><p>Когда обычный букет недостаточен — выбирайте премиум. 51 или 101 роза, букеты с орхидеями, эксклюзивные дизайнерские композиции — это подарки уровня «запомнить навсегда». Наши лучшие флористы создадут шедевр специально для вас.</p><p>Закажите премиум букет с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
