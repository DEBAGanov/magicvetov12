/**
 * @file: app/dostavka-cvetov/page.tsx
 * @description: General delivery page redirecting to city pages
 */

import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "@/lib/seo/constants";

export const metadata: Metadata = {
  title: "Доставка цветов — Волжск и Зеленодольск",
  description: "Доставка свежих цветов по Волжску и Зеленодольску. Букеты на любой вкус с доставкой за 2 часа.",
  alternates: { canonical: "https://magiacvetov12.ru/dostavka-cvetov" },
};

const cities = [
  {
    name: "Волжск",
    slug: "volzhsk",
    region: "Республика Марий Эл",
    description: "Доставка по всем районам Волжска. Центр, Южный микрорайон, Красногорский.",
  },
  {
    name: "Зеленодольск",
    slug: "zelenodolsk",
    region: "Республика Татарстан",
    description: "Доставка по всем районам Зеленодольска. Центр, Мирный, Нижние Вязовые.",
  },
];

export default function DeliveryCitiesPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary-500">Главная</Link>
        <span>/</span>
        <span className="text-gray-700">Доставка цветов</span>
      </div>

      <h1 className="text-3xl font-bold mb-4">Доставка цветов</h1>
      <p className="text-gray-600 text-lg mb-8 max-w-2xl">
        «Магия Цветов» осуществляет доставку свежих букетов по городам Республики Марий Эл и Республики Татарстан.
        Выберите ваш город:
      </p>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        {cities.map((city) => (
          <Link
            key={city.slug}
            href={`/dostavka-cvetov/${city.slug}/`}
            className="group block p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-primary-300 hover:shadow-lg transition-all"
          >
            <h2 className="text-xl font-bold mb-1 group-hover:text-primary-500 transition-colors">
              {city.name}
            </h2>
            <p className="text-sm text-gray-400 mb-3">{city.region}</p>
            <p className="text-gray-600 text-sm">{city.description}</p>
            <div className="mt-4 text-primary-500 font-semibold text-sm">
              Подробнее &rarr;
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-6 bg-primary-50 rounded-2xl max-w-3xl">
        <h3 className="font-bold mb-2">Условия доставки</h3>
        <ul className="text-sm text-gray-600 space-y-1.5">
          <li>Доставка в течение 2 часов по городу</li>
          <li>Гарантия свежести 24 часа</li>
          <li>Бесплатная открытка к каждому заказу</li>
          <li>Оплата: карта, СБП, наличные</li>
          <li>Заказ по телефону: <strong>{STORE.phone}</strong></li>
        </ul>
      </div>
    </div>
  );
}
