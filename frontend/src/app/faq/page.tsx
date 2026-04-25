/**
 * @file: app/faq/page.tsx
 * @description: FAQ page with FAQPage Schema.org for Rich Snippets
 */

import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Часто задаваемые вопросы — доставка цветов | Магия Цветов",
  description:
    "Ответы на популярные вопросы о доставке цветов в Зеленодольске и Волжске. Как заказать, сколько стоит доставка, способы оплаты, гарантии свежести.",
  keywords: [
    "как заказать цветы", "сколько стоит доставка цветов", "доставка цветов вопросы",
    "оплата цветов", "гарантия свежести цветов", "доставка цветов зеленодольск FAQ",
  ],
  openGraph: {
    title: "Часто задаваемые вопросы — Магия Цветов",
    description: "Ответы на вопросы о доставке цветов в Зеленодольске и Волжске.",
    locale: "ru_RU",
    type: "website",
  },
  alternates: { canonical: "https://magiacvetov12.ru/faq" },
};

const FAQ_SECTIONS = [
  {
    category: "Заказ и доставка",
    items: [
      {
        q: "Как заказать цветы с доставкой в Зеленодольске?",
        a: "Заказать цветы очень просто: выберите букет в каталоге на сайте, добавьте в корзину, укажите адрес доставки и оплатите онлайн. Также можно заказать по телефону +7 (964) 861-23-70. Среднее время доставки — 2 часа.",
      },
      {
        q: "Сколько стоит доставка цветов по Зеленодольску?",
        a: "Доставка по Зеленодольску бесплатна при заказе от 3000 ₽. Для заказов до 3000 ₽ стоимость доставки — 200 ₽. Доставка в пригород уточняется индивидуально.",
      },
      {
        q: "Можно ли заказать цветы в Волжске с доставкой в тот же день?",
        a: "Да! Мы доставляем цветы по Волжску за 1-2 часа с момента подтверждения заказа. Перед отправкой обязательно присылаем фото букета для согласования.",
      },
      {
        q: "Доставляете ли вы цветы за город?",
        a: "Да, возможна доставка за город. Стоимость зависит от расстояния — уточняйте у менеджера по телефону +7 (964) 861-23-70.",
      },
      {
        q: "Можно ли выбрать время доставки?",
        a: "Да, при оформлении заказа вы можете указать точную дату и время доставки. Мы доставим букет точно в назначенный час.",
      },
    ],
  },
  {
    category: "Оплата",
    items: [
      {
        q: "Какие способы оплаты доступны?",
        a: "Мы принимаем: банковские карты онлайн (Visa, MasterCard, МИР), СБП (Система быстрых платежей) и наличные при получении. Все онлайн-платежи защищены.",
      },
      {
        q: "Можно ли оплатить заказ наличными?",
        a: "Да, вы можете оплатить заказ наличными при получении. Просто выберите «Оплата при получении» при оформлении заказа.",
      },
    ],
  },
  {
    category: "Качество и гарантии",
    items: [
      {
        q: "Что если цветы завянут?",
        a: "Мы гарантируем свежесть каждого букета в течение 24 часов. Если цветы завянут — заменим букет бесплатно. Все цветы поступают к нам свежими каждый день.",
      },
      {
        q: "Как вы гарантируете свежесть цветов?",
        a: "Мы работаем напрямую с поставщиками, цветы поступают свежими каждый день. Букет собирается непосредственно перед доставкой. Перед отправкой мы фотографируем букет и отправляем фото вам.",
      },
      {
        q: "Отправляете ли вы фото букета перед доставкой?",
        a: "Да! Это наша стандартная процедура. Перед отправкой мы фотографируем готовый букет и отправляем фото вам. Вы оплачиваете только если результат вам понравился.",
      },
    ],
  },
  {
    category: "Букеты и ассортимент",
    items: [
      {
        q: "Можно ли заказать букет по своей фотографии?",
        a: "Да, наши флористы соберут букет по вашему фото или описанию. Отправьте фотографию через мессенджер или по email, и мы рассчитаем стоимость.",
      },
      {
        q: "Какие цветы самые популярные для подарка?",
        a: "Самые популярные: красные розы (классика), тюльпаны (весна), пионы (лето), хризантемы (долго стоят). Для оригинального подарка рекомендуем цветы в шляпной коробке.",
      },
      {
        q: "Делаете ли вы букет-дублёр для свадьбы?",
        a: "Да, мы изготавливаем точную копию букета невесты для традиции бросания. Заказывайте букет-дублёр вместе с основным букетом.",
      },
    ],
  },
  {
    category: "Дополнительные услуги",
    items: [
      {
        q: "Можно ли добавить открытку к букету?",
        a: "Да, к каждому заказу прилагается бесплатная открытка. Вы можете написать текст поздравления — мы его аккуратно перепишем от руки.",
      },
      {
        q: "Доставляете ли вы цветы анонимно?",
        a: "Да, мы можем доставить букет анонимно — курьер не назовёт ваше имя, если вы этого не хотите. Ваши контактные данные нужны только для согласования заказа.",
      },
      {
        q: "Можно ли заказать цветы через Telegram?",
        a: "Да! У нас есть Telegram-бот для быстрого заказа. Найдите нас в Telegram и закажите букет за пару минут.",
      },
    ],
  },
];

const ALL_FAQS = FAQ_SECTIONS.flatMap((s) => s.items);

export default function FAQPage() {
  const breadcrumbs = [
    { name: "Главная", url: "https://magiacvetov12.ru" },
    { name: "Вопросы и ответы", url: "https://magiacvetov12.ru/faq" },
  ];

  return (
    <>
      <JsonLd data={[faqSchema(ALL_FAQS), breadcrumbSchema(breadcrumbs)]} />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">Вопросы и ответы</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Часто задаваемые вопросы</h1>
        <p className="text-gray-500 mb-8">
          Ответы на популярные вопросы о доставке цветов в Зеленодольске и Волжске
        </p>

        {FAQ_SECTIONS.map((section) => (
          <section key={section.category} className="mb-10">
            <h2 className="text-xl font-bold mb-4 text-primary-600">{section.category}</h2>
            <div className="space-y-4">
              {section.items.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-white border border-gray-100 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-5 font-medium hover:bg-gray-50 transition-colors list-none">
                    <span className="pr-4">{faq.q}</span>
                    <span className="text-primary-500 text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <div className="mt-10 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Не нашли ответ?</h2>
          <p className="text-gray-600 mb-4">Свяжитесь с нами — мы с радостью поможем!</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:+79648612370"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
            >
              Позвонить: +7 (964) 861-23-70
            </a>
            <Link
              href="/catalog"
              className="inline-block px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors"
            >
              Смотреть каталог
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
