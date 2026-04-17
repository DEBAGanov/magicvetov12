/**
 * @file: components/seo/OccasionLandingContent.tsx
 * @description: Reusable occasion landing page content
 */

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import SeoText from "@/components/seo/SeoText";
import { JsonLd, faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { STORE } from "@/lib/seo/constants";
import type { ProductDTO } from "@/lib/types";

export default function OccasionLandingContent({
  h1,
  subtitle,
  breadcrumbs,
  products,
  faqs,
  seoText,
}: {
  h1: string;
  subtitle: string;
  breadcrumbs: { name: string; url: string }[];
  products: ProductDTO[];
  faqs: { q: string; a: string }[];
  seoText: React.ReactNode;
}) {
  return (
    <>
      <JsonLd data={[faqSchema(faqs), breadcrumbSchema(breadcrumbs)]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Доставка по Волжску и Зеленодольску
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">{h1}</h1>
            <p className="text-gray-600 text-lg mb-6">{subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors">
                Выбрать букет
              </Link>
              <a href={`tel:${STORE.phoneLink}`} className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors">
                {STORE.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="contents">
              {i > 0 && <span>/</span>}
              {i < breadcrumbs.length - 1 ? (
                <Link href={crumb.url.replace(STORE.siteUrl, "")} className="hover:text-primary-500">{crumb.name}</Link>
              ) : (
                <span className="text-gray-700">{crumb.name}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Products */}
      {products.length > 0 && (
        <section className="bg-gray-50/50">
          <div className="container mx-auto px-4 py-10">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Подходящие букеты</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/catalog" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
                Смотреть все букеты
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Advantages */}
      <section className="container mx-auto px-4 py-10 border-t border-gray-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { icon: "🚀", title: "Доставка за 2 часа", desc: "По Волжску и Зеленодольску" },
            { icon: "🌸", title: "Свежие цветы", desc: "Гарантия свежести 24 часа" },
            { icon: "💳", title: "Удобная оплата", desc: "Карта, СБП, наличные" },
            { icon: "📝", title: "Открытка бесплатно", desc: "С вашим поздравлением" },
          ].map((item, i) => (
            <div key={i} className="text-center p-4 bg-primary-50/50 rounded-xl">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50/50">
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Часто задаваемые вопросы</h2>
          <div className="max-w-2xl mx-auto divide-y divide-gray-200">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4">
                <h3 className="font-semibold text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Text */}
      <SeoText>{seoText}</SeoText>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Закажите букет прямо сейчас</h2>
          <p className="opacity-90 mb-6">Доставим свежие цветы за 2 часа по Волжску и Зеленодольску</p>
          <Link href="/catalog" className="inline-block px-8 py-3 bg-white text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors">
            Выбрать букет
          </Link>
        </div>
      </section>
    </>
  );
}
