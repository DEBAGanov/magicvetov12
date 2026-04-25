/**
 * @file: app/otzyvy/page.tsx
 * @description: Reviews page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { REVIEWS, STORE } from "@/lib/seo/constants";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Отзывы о Магии Цветов — доставка цветов | Рейтинг и оценки",
  description: "Читайте реальные отзывы о доставке цветов Магия Цветов. Рейтинг 4.8 из 5. Доставка по Зеленодольску и Волжску. Свежие цветы, быстрая доставка.",
  keywords: ["магия цветов отзывы", "отзывы доставка цветов волжск", "цветочный магазин отзывы зеленодольск", "отзывы о цветочной доставке"],
  alternates: { canonical: "https://magiacvetov12.ru/otzyvy" },
  openGraph: {
    title: "Отзывы о Магии Цветов — рейтинг 4.8 из 5",
    description: "Реальные отзывы клиентов о доставке цветов в Волжске и Зеленодольске.",
    locale: "ru_RU",
    type: "website",
  },
};

export default function ReviewsPage() {
  const reviewSchemas = REVIEWS.map((review) => ({
    "@type": "Review",
    author: { "@type": "Person", name: review.name },
    datePublished: review.date,
    reviewBody: review.text,
    reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
    itemReviewed: { "@type": "Florist", name: "Магия Цветов", address: STORE.address },
  }));

  const aggregateSchema = {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemReviewed: { "@type": "Florist", name: "Магия Цветов" },
    ratingValue: "4.8",
    bestRating: "5",
    worstRating: "1",
    ratingCount: String(REVIEWS.length),
  };

  return (
    <>
      <JsonLd data={[aggregateSchema, ...reviewSchemas, breadcrumbSchema([
        { name: "Главная", url: "https://magiacvetov12.ru" },
        { name: "Отзывы", url: "https://magiacvetov12.ru/otzyvy" },
      ])]} />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">Отзывы</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Отзывы наших клиентов</h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex text-yellow-400 text-lg">{"★★★★★"}</div>
            <span className="font-bold text-lg">4.8</span>
            <span className="text-gray-400 text-sm">из 5</span>
          </div>
          <p className="text-gray-500 text-sm">На основе {REVIEWS.length} отзывов</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {REVIEWS.map((review, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                  {review.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{review.name}</div>
                  <div className="text-xs text-gray-400">{review.date}</div>
                </div>
                <div className="ml-auto text-yellow-400 text-sm">★★★★★</div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center p-6 bg-primary-50 rounded-2xl">
          <p className="text-gray-600 mb-3">Закажите букет и оставьте свой отзыв!</p>
          <Link href="/catalog" className="inline-block px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors">
            Перейти в каталог
          </Link>
        </div>
      </div>
    </>
  );
}
