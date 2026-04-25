/**
 * @file: app/blog/page.tsx
 * @description: Blog listing page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_ARTICLES } from "@/lib/seo/blog-articles";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Блог о цветах — советы, тренды и руководство по выбору букетов | Магия Цветов",
  description:
    "Полезные статьи о цветах: как выбрать букет, значение цветов, уход за растениями, тренды флористики. Советы от Магии Цветов — Зеленодольск и Волжск.",
  keywords: [
    "блог о цветах", "как выбрать букет", "значение цветов",
    "уход за цветами", "советы флориста", "тренды букетов",
  ],
  openGraph: {
    title: "Блог о цветах — Магия Цветов",
    description: "Полезные статьи о цветах, советы по выбору букетов и уходу.",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: "https://magiacvetov12.ru/blog" },
};

export default function BlogPage() {
  const breadcrumbs = [
    { name: "Главная", url: "https://magiacvetov12.ru" },
    { name: "Блог", url: "https://magiacvetov12.ru/blog" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(breadcrumbs)} />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">Блог</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Блог о цветах</h1>
        <p className="text-gray-500 mb-8 text-lg">
          Полезные статьи о выборе букетов, значении цветов, уходе и трендах флористики
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {BLOG_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group block bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-primary-200 transition-all"
            >
              <time className="text-xs text-gray-400">{new Date(article.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time>
              <h2 className="text-lg font-bold mt-2 mb-2 group-hover:text-primary-500 transition-colors line-clamp-2">
                {article.title}
              </h2>
              <p className="text-gray-500 text-sm line-clamp-3">{article.excerpt}</p>
              <span className="inline-block mt-3 text-primary-500 text-sm font-medium group-hover:underline">
                Читать далее →
              </span>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Нужен букет?</h2>
          <p className="text-gray-600 mb-4">Закажите цветы с доставкой по Зеленодольску и Волжску</p>
          <Link
            href="/catalog"
            className="inline-block px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
          >
            Смотреть каталог
          </Link>
        </div>
      </div>
    </>
  );
}
