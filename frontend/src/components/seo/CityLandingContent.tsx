/**
 * @file: components/seo/CityLandingContent.tsx
 * @description: Reusable city landing page content
 */

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import SeoText from "@/components/seo/SeoText";
import { JsonLd, floristSchema, faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { ADVANTAGES, REVIEWS, FAQ, STORE, type CitySlug } from "@/lib/seo/constants";
import type { ProductDTO, CategoryDTO } from "@/lib/types";

export default function CityLandingContent({
  city,
  products,
  categories,
  seoText,
}: {
  city: CitySlug;
  products: ProductDTO[];
  categories: CategoryDTO[];
  seoText: React.ReactNode;
}) {
  const cityData = {
    volzhsk: {
      name: "Волжск",
      namePrepositional: "Волжске",
      region: "Республика Марий Эл",
      h1: "Доставка цветов в Волжске",
      subtitle: "Свежие букеты с быстрой доставкой по всему городу",
      deliveryZones: [
        "Центр города",
        "Ул. Володарского и окрестности",
        "Микрорайон Южный",
        "Посёлок Красногорский",
        "Ул. Ленинградская",
        "Район железнодорожного вокзала",
      ],
    },
    zelenodolsk: {
      name: "Зеленодольск",
      namePrepositional: "Зеленодольске",
      region: "Республика Татарстан",
      h1: "Доставка цветов в Зеленодольске",
      subtitle: "Свежие букеты с быстрой доставкой по всему городу",
      deliveryZones: [
        "Центр города",
        "Ул. Ленина и окрестности",
        "Микрорайон Мирный",
        "Посёлок Нижние Вязовые",
        "Ул. Строителей",
        "Район площади Победы",
      ],
    },
  }[city];

  const cityFaqs = FAQ.general.map((f) => ({
    ...f,
    a: f.a.replace("по городу", `по ${cityData.namePrepositional}`),
  }));

  const breadcrumbs = [
    { name: "Главная", url: STORE.siteUrl },
    { name: `Доставка цветов в ${cityData.namePrepositional}`, url: `${STORE.siteUrl}/dostavka-cvetov/${city}` },
  ];

  return (
    <>
      <JsonLd data={[floristSchema(), faqSchema(cityFaqs), breadcrumbSchema(breadcrumbs)]} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Доставка по {cityData.namePrepositional}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
              {cityData.h1}
            </h1>
            <p className="text-gray-600 text-lg mb-6">{cityData.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors">
                Заказать букет
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
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">{cityData.h1}</span>
        </div>
      </div>

      {/* Popular bouquets */}
      {products.length > 0 && (
        <section className="bg-gray-50/50">
          <div className="container mx-auto px-4 py-10">
            <h2 className="text-xl md:text-2xl font-bold mb-6">Популярные букеты в {cityData.namePrepositional}</h2>
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

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">Каталог цветов</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className="group flex flex-col items-center text-center p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all"
              >
                {cat.imageUrl ? (
                  <span className="text-3xl mb-1">🌸</span>
                ) : (
                  <span className="text-3xl mb-1">🌸</span>
                )}
                <span className="text-xs font-semibold text-gray-800 group-hover:text-primary-500">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Advantages */}
      <section className="container mx-auto px-4 py-10 border-t border-gray-100">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-8">Почему выбирают Магию Цветов в {cityData.namePrepositional}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ADVANTAGES.map((item, i) => (
            <div key={i} className="text-center p-4 bg-primary-50/50 rounded-xl">
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-semibold text-sm">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery zones */}
      <section className="bg-gray-50/50">
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Зоны доставки по {cityData.namePrepositional}</h2>
          <p className="text-gray-600 text-center mb-6">Доставляем букеты по всем районам {cityData.namePrepositional} ({cityData.region})</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {cityData.deliveryZones.map((zone, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                <span className="text-primary-500 text-sm">✓</span>
                <span className="text-sm text-gray-700">{zone}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">
            Не нашли свой район? Позвоните нам <a href={`tel:${STORE.phoneLink}`} className="text-primary-500 font-medium">{STORE.phone}</a>
          </p>
          <div className="mt-6 rounded-xl overflow-hidden max-w-3xl mx-auto">
            <iframe
              src="https://yandex.ru/map-widget/v1/?z=15&ol=biz&oid=174166621256"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              title={`Магия Цветов на карте — ${cityData.name}`}
            />
          </div>
          <p className="text-center mt-3">
            <a
              href="https://yandex.ru/maps/org/magiya_tsvetov/174166621256/?ll=48.335696%2C55.870339&z=17"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-500 font-medium hover:underline"
            >
              Открыть на Яндекс Картах &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* Reviews */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Отзывы наших клиентов</h2>
        <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {REVIEWS.slice(0, 3).map((review, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                  {review.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm">{review.name}</div>
                  <div className="text-xs text-gray-400">{review.date}</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50/50" id="faq">
        <div className="container mx-auto px-4 py-10">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6">Часто задаваемые вопросы</h2>
          <div className="max-w-2xl mx-auto divide-y divide-gray-200">
            {cityFaqs.map((faq, i) => (
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

      {/* Cross-links: occasions */}
      <section className="container mx-auto px-4 py-10 border-t border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-center">Цветы на любой повод в {cityData.namePrepositional}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
          {[
            { href: "/na-den-rozhdeniya", label: "День рождения", emoji: "🎂" },
            { href: "/na-yubilej", label: "Юбилей", emoji: "🎉" },
            { href: "/na-svadbu", label: "Свадьба", emoji: "💍" },
            { href: "/na-14-fevralya", label: "14 февраля", emoji: "❤️" },
            { href: "/na-8-marta", label: "8 марта", emoji: "🌷" },
            { href: "/na-vypusknoj", label: "Выпускной", emoji: "🎓" },
            { href: "/na-1-sentyabrya", label: "1 сентября", emoji: "📚" },
            { href: "/faq", label: "Вопросы и ответы", emoji: "❓" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all text-sm"
            >
              <span>{link.emoji}</span>
              <span className="font-medium text-gray-700 group-hover:text-primary-500">{link.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-link: other city */}
      {city === "volzhsk" ? (
        <section className="bg-primary-50/30">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600 mb-2">Также осуществляем доставку в соседний город:</p>
            <Link href="/dostavka-cvetov/zelenodolsk" className="text-primary-500 font-bold text-lg hover:underline">
              Доставка цветов по Зеленодольску &rarr;
            </Link>
          </div>
        </section>
      ) : (
        <section className="bg-primary-50/30">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600 mb-2">Также осуществляем доставку в соседний город:</p>
            <Link href="/dostavka-cvetov/volzhsk" className="text-primary-500 font-bold text-lg hover:underline">
              Доставка цветов по Волжску &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Закажите букет с доставкой в {cityData.namePrepositional}</h2>
          <p className="opacity-90 mb-6">Доставим свежие цветы за 2 часа по всему городу</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/catalog" className="inline-block px-8 py-3 bg-white text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors">
              Выбрать букет
            </Link>
            <a href={`tel:${STORE.phoneLink}`} className="inline-block px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors">
              Позвонить
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
