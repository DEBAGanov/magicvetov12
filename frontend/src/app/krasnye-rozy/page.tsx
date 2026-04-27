import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Красные розы с доставкой — заказать букет | Магия Цветов",
  description: "❤️ Красные розы с доставкой по Волжску и Зеленодольску! Символ любви и страсти. Букеты от 990 ₽, доставка за 2 часа.",
  keywords: ["красные розы","букет красных роз","красные розы доставка","купить красные розы","красные розы волжск"],
  openGraph: { title: "Красные розы — от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/krasnye-rozy" },
};
export default async function Page() {
  let p: import("@/lib/types").ProductDTO[] = [];
  try { p = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return <OccasionLandingContent h1="Красные розы" subtitle="Символ любви и страсти — самый популярный букет в мире"
    breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Розы", url: "https://magiacvetov12.ru/rozy" },{ name: "Красные розы", url: "https://magiacvetov12.ru/krasnye-rozy" }]}
    products={p}
    faqs={[
      { q: "Сколько красных роз подарить?", a: "3 — «я люблю тебя», 7 — «я увлечён», 15 — признание, 25 — пылкая любовь, 51 — «единственная навсегда»." },
      { q: "Кому дарить красные розы?", a: "Жене, девушке, маме. Красные розы — прежде всего символ романтической любви." },
    ]}
    seoText={<><h2>Красные розы — символ любви</h2><p>Красные розы — самый узнаваемый символ любви в мире. Букет красных роз скажет о ваших чувствах лучше любых слов. От 3 роз для первого свидания до 101 розы для предложения — выберите свой масштаб любви.</p><p>Закажите красные розы с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>} />;
}
