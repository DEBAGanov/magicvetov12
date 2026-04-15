/**
 * @file: components/home/FAQSection.tsx
 * @description: FAQ accordion section
 * @created: 2026-04-15
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "Как быстро доставят букет?", a: "Стандартная доставка занимает 2 часа с момента подтверждения заказа. Вы также можете выбрать удобное время доставки." },
  { q: "Какие способы оплаты доступны?", a: "Банковская карта онлайн, СБП (Система быстрых платежей) и наличными при получении." },
  { q: "Можно ли заказать на определённую дату?", a: "Да, при оформлении выберите дату и время доставки. Мы доставим букет точно в срок." },
  { q: "Что если цветы завянут?", a: "Гарантируем свежесть. Если букет завянет в течение 24 часов — заменим бесплатно." },
  { q: "Есть ли доставка за город?", a: "Доставка за город возможна, стоимость зависит от расстояния. Уточняйте у менеджера." },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-gray-50/50">
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Часто задаваемые вопросы</h2>
        <div className="max-w-2xl mx-auto">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center py-4 text-left font-semibold text-gray-800 hover:text-primary-500 transition-colors"
              >
                {faq.q}
                <svg viewBox="0 0 24 24" className={cn("w-5 h-5 fill-current shrink-0 ml-2 transition-transform", open === i && "rotate-180")}>
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                </svg>
              </button>
              <div className={cn("overflow-hidden transition-all", open === i ? "max-h-40 pb-4" : "max-h-0")}>
                <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
