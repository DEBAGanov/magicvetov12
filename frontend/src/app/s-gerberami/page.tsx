import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Букеты с герберами с доставкой — заказать | Магия Цветов",
  description: "🌻 Букеты с герберами с доставкой по Волжску и Зеленодольску! Яркие солнечные цветы от 990 ₽. Доставка за 2 часа!",
  keywords: ["букет с герберами","герберы доставка","купить герберы","герберы волжск","букет гербер"],
  openGraph: { title: "Букеты с герберами — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/s-gerberami" },
};
export default async function SGerberamiPage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent
      h1="Букеты с герберами"
      subtitle="Яркие солнечные цветы — поднимут настроение с первого взгляда"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "С герберами", url: "https://magiacvetov12.ru/s-gerberami" }]}
      products={products}
      faqs={[
        { q: "Сколько стоят герберы?", a: "Букеты с герберами от 990 ₽. Это одни из самых доступных и ярких цветов." },
        { q: "Как долго стоят герберы?", a: "Герберы стоят 7-10 дней. Они неприхотливы — достаточно менять воду и подрезать стебли." },
      ]}
      seoText={<><h2>Букеты с герберами — солнечное настроение</h2><p>Герберы — яркие, позитивные цветы, похожие на большие ромашки. Их солнечная энергетика поднимает настроение мгновенно. Букет гербер — отличный подарок для тех, кто любит яркие краски и позитив.</p><p>Закажите букет с герберами с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
