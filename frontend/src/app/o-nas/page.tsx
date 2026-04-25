/**
 * @file: app/o-nas/page.tsx
 * @description: About us page
 */

import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "@/lib/seo/constants";
import { JsonLd, organizationSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "О компании Магия Цветов — доставка цветов по Зеленодольску и Волжску",
  description: "Магия Цветов — сервис доставки свежих цветов по Зеленодольску, Волжску и Казани. Собираем букеты за 30 минут, доставляем за 2 часа.",
  keywords: ["магия цветов отзывы", "цветочный магазин волжск", "доставка цветов зеленодольск"],
  alternates: { canonical: "https://magiacvetov12.ru/o-nas" },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">О нас</span>
        </div>

        <h1 className="text-3xl font-bold mb-6">О магазине «Магия Цветов»</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-lg text-gray-600 leading-relaxed">
            «Магия Цветов» — это цветочный магазин в городе Волжске, который создаёт и доставляет
            свежие букеты по Волжску и Зеленодольску. Мы верим, что цветы — это не просто подарок,
            а способ передать эмоции, заботу и любовь.
          </p>

          <h2>Наша миссия</h2>
          <p>
            Мы стремимся сделать каждый день наших клиентов немного ярче. Букет свежих цветов,
            доставленный вовремя и с заботой — это наш способ создавать радость. Для нас важен каждый
            заказ — будь то скромный букетик тюльпанов или роскошная корзина из 101 розы.
          </p>

          <h2>Почему выбирают нас</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            {[
              { icon: "🌸", title: "Свежие цветы", desc: "Закупаем цветы напрямую у проверенных поставщиков. Каждый букет — гарантия свежести 24 часа." },
              { icon: "🎨", title: "Авторские букеты", desc: "Наши флористы создают уникальные композиции. Не шаблоны, а индивидуальный подход к каждому заказу." },
              { icon: "🚀", title: "Быстрая доставка", desc: "Доставляем по Волжску и Зеленодольску за 2 часа. Бережная транспортировка сохранит красоту букета." },
              { icon: "💳", title: "Удобная оплата", desc: "Банковская карта онлайн, СБП или наличные при получении. Выбирайте удобный способ." },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-primary-50/50 rounded-xl">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm mb-1">{item.title}</div>
                <div className="text-xs text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>

          <h2>Контакты</h2>
          <p>
            Приходите к нам в магазин по адресу: <strong>{STORE.address}</strong>, {STORE.city}.
            Работаем ежедневно: Пн-Пт {STORE.hoursWeekday}, Сб-Вс {STORE.hoursWeekend}.
            Телефон: <strong>{STORE.phone}</strong>.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/catalog" className="inline-block px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors">
            Перейти в каталог
          </Link>
        </div>
      </div>
    </>
  );
}
