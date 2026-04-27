import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы маме с доставкой — букет для мамы | Магия Цветов",
  description: "💐 Букет для мамы с доставкой по Волжску и Зеленодольску! Нежные цветы от 990 ₽. Бесплатная открытка, доставка за 2 часа!",
  keywords: ["цветы маме","букет маме","доставка цветов маме","купить цветы маме","букет для мамы волжск"],
  openGraph: { title: "Цветы маме — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/mame" },
};
export default async function MamePage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent h1="Цветы маме" subtitle="Скажите маме «спасибо» красивым букетом с бесплатной открыткой"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Маме", url: "https://magiacvetov12.ru/mame" }]}
      products={products}
      faqs={[
        { q: "Какие цветы подарить маме?", a: "Розовые розы — благодарность, хризантемы — стоят долго, пионы — нежность, цветы в коробке — практично. Мамы ценят внимание больше всего!" },
        { q: "Когда дарить цветы маме?", a: "День рождения, 8 марта, День матери — обязательно. Но неожиданный букет без повода — самый ценный подарок." },
      ]}
      seoText={<><h2>Цветы маме — самый тёплый подарок</h2><p>Мама — первый человек, который заслуживает цветы. Розовые розы скажут «спасибо», белые хризантемы будут радовать до 3 недель, а цветы в шляпной коробке — стильный и практичный подарок, который не требует вазы.</p><p>Закажите букет маме с доставкой прямо к ней домой — это будет приятный сюрприз! Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
