import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты с орхидеями с доставкой — заказать | Магия Цветов",
  description: "🌺 Букеты с орхидеями с доставкой по Волжску и Зеленодольску! Роскошные экзотические цветы от 2000 ₽. Доставка за 2 часа!",
  keywords: ["букет с орхидеями","орхидеи доставка","купить орхидеи","орхидеи волжск","букет орхидей"],
  openGraph: { title: "Букеты с орхидеями — от 2000 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/s-orhideyami" },
};
export default async function SOrhideyamiPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent
      h1="Букеты с орхидеями"
      subtitle="Роскошные экзотические цветы — статусный подарок"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "С орхидеями", url: "https://magiacvetov12.ru/s-orhideyami" }]}
      products={products}
      faqs={[
        { q: "Сколько стоят орхидеи в букете?", a: "Букеты с орхидеями от 2000 ₽. Орхидея — премиальный цветок, букет с ней выглядит статусно и необычно." },
        { q: "Как долго стоят орхидеи?", a: "Срезанные орхидеи стоят 10-14 дней. Они неприхотливы и сохраняют красоту долго." },
      ]}
      seoText={<><h2>Букеты с орхидеями — экзотическая роскошь</h2><p>Орхидея — символ утончённости и роскоши. Букет с орхидеями — это статусный подарок, который выделяется среди обычных роз и тюльпанов. Фаленопсис, цимбидиум, дендробиум — мы используем разные сорта для создания уникальных композиций.</p><p>Закажите букет с орхидеями с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
