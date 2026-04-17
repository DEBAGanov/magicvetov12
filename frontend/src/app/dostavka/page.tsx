/**
 * @file: app/dostavka/page.tsx
 * @description: Delivery and payment info page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "@/lib/seo/constants";
import { JsonLd, faqSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Доставка и оплата — Магия Цветов",
  description: "Условия доставки цветов по Волжску и Зеленодольску. Способы оплаты, зоны доставки, сроки.",
  alternates: { canonical: "https://magiacvetov12.ru/dostavka" },
};

const deliveryFaqs = [
  { q: "Сколько стоит доставка?", a: "Стоимость доставки зависит от зоны и суммы заказа. При заказе от определённой суммы доставка бесплатная. Точную стоимость рассчитаем при оформлении заказа." },
  { q: "Как быстро доставят букет?", a: "Стандартная доставка занимает 2 часа. Возможна срочная доставка за 1 час (дополнительно оплачивается)." },
  { q: "Доставляете ли вы в Зеленодольск?", a: "Да, мы доставляем букеты по всему Зеленодольску и Волжску, а также в ближайшие пригороды." },
];

export default function DeliveryPage() {
  return (
    <>
      <JsonLd data={faqSchema(deliveryFaqs)} />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">Доставка и оплата</span>
        </div>

        <h1 className="text-3xl font-bold mb-6">Доставка и оплата</h1>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Зоны доставки</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h3 className="font-bold mb-2">Волжск</h3>
              <p className="text-sm text-gray-600 mb-2">Республика Марий Эл</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Центр города</li>
                <li>Микрорайон Южный</li>
                <li>Посёлок Красногорский</li>
                <li>Ул. Володарского и окрестности</li>
                <li>Район вокзала</li>
              </ul>
              <Link href="/dostavka-cvetov/volzhsk" className="text-sm text-primary-500 font-medium mt-2 inline-block">Подробнее &rarr;</Link>
            </div>
            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h3 className="font-bold mb-2">Зеленодольск</h3>
              <p className="text-sm text-gray-600 mb-2">Республика Татарстан</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Центр города</li>
                <li>Микрорайон Мирный</li>
                <li>Посёлок Нижние Вязовые</li>
                <li>Ул. Строителей</li>
                <li>Площадь Победы</li>
              </ul>
              <Link href="/dostavka-cvetov/zelenodolsk" className="text-sm text-primary-500 font-medium mt-2 inline-block">Подробнее &rarr;</Link>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Условия доставки</h2>
          <div className="space-y-3">
            {[
              { label: "Срок доставки", value: "2 часа по городу" },
              { label: "Часы доставки", value: "07:30 – 20:00 (Пн-Пт), 08:00 – 20:00 (Сб-Вс)" },
              { label: "Гарантия свежести", value: "24 часа с момента доставки" },
              { label: "Открытка", value: "Бесплатно к каждому заказу" },
              { label: "Срочная доставка", value: "За 1 час (уточняйте у менеджера)" },
            ].map((item, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">{item.label}</span>
                <span className="font-medium text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Способы оплаты</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "💳", title: "Банковская карта", desc: "Visa, Mastercard, МИР — онлайн оплата на сайте" },
              { icon: "🏦", title: "СБП", desc: "Система быстрых платежей — моментальная оплата" },
              { icon: "💵", title: "Наличные", desc: "Оплата курьеру при получении заказа" },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Часто задаваемые вопросы</h2>
          <div className="divide-y divide-gray-200">
            {deliveryFaqs.map((faq, i) => (
              <div key={i} className="py-4">
                <h3 className="font-semibold text-gray-800 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 p-6 bg-primary-50 rounded-2xl text-center">
          <p className="text-gray-600 mb-2">Остались вопросы? Позвоните нам</p>
          <a href={`tel:${STORE.phoneLink}`} className="text-xl font-bold text-primary-500">{STORE.phone}</a>
        </div>
      </div>
    </>
  );
}
