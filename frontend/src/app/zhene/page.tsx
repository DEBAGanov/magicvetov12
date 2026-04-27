import type { Metadata } from "next";
import { productsApi } from "@/lib/api/client";
import OccasionLandingContent from "@/components/seo/OccasionLandingContent";
export const metadata: Metadata = {
  title: "Цветы жене с доставкой — букет для любимой жены | Магия Цветов",
  description: "❤️ Букет для жены с доставкой по Волжску и Зеленодольску! Романтические букеты от 990 ₽. Красные розы, пионы, эксклюзивные композиции.",
  keywords: ["цветы жене","букет жене","доставка цветов жене","купить цветы жене","букет для жены волжск"],
  openGraph: { title: "Цветы жене — букеты от 990 ₽ | Магия Цветов", locale: "ru_RU", type: "website" },
  alternates: { canonical: "https://magiacvetov12.ru/zhene" },
};
export default async function ZhenePage() {
  let products: import("@/lib/types").ProductDTO[] = [];
  try { products = (await productsApi.getAll(0, 8))?.content || []; } catch {}
  return (
    <OccasionLandingContent h1="Цветы жене" subtitle="Подарите любимой букет, который скажет больше, чем слова"
      breadcrumbs={[{ name: "Главная", url: "https://magiacvetov12.ru" },{ name: "Жене", url: "https://magiacvetov12.ru/zhene" }]}
      products={products}
      faqs={[
        { q: "Какие цветы подарить жене?", a: "Красные розы — признание в любви, 25-51 роза. Пионы — нежность. Орхидеи — роскошь. Цветы в шляпной коробке — стильный вариант." },
        { q: "Когда дарить цветы жене?", a: "Без повода! Годовщина, 8 марта, день рождения, дата свадьбы — обязательно. Но неожиданный букет ценится вдвойне." },
      ]}
      seoText={<><h2>Букет для жены — скажите «я люблю тебя» цветами</h2><p>Жена — самый близкий человек, и она заслуживает самого красивого букета. Красные розы — классика для выражения любви. Но можно удивить: роскошные пионы в сезон, экзотические орхидеи или авторская композиция от наших флористов.</p><p>Закажите букет жене с доставкой. Телефон: <strong>+7 (964) 861-23-70</strong>.</p></>}
    />
  );
}
