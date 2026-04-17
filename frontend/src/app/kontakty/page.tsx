/**
 * @file: app/kontakty/page.tsx
 * @description: Contacts page with address, phone, map
 */

import type { Metadata } from "next";
import Link from "next/link";
import { STORE } from "@/lib/seo/constants";
import { JsonLd, floristSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Контакты — Магия Цветов | Волжск",
  description: "Контактная информация цветочного магазина «Магия Цветов». Адрес, телефон, часы работы. Волжск, ул. Володарского, 5.",
  alternates: { canonical: "https://magiacvetov12.ru/kontakty" },
};

export default function ContactsPage() {
  return (
    <>
      <JsonLd data={floristSchema()} />
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <span className="text-gray-700">Контакты</span>
        </div>

        <h1 className="text-3xl font-bold mb-6">Контакты</h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h2 className="font-bold mb-3">Адрес магазина</h2>
              <p className="text-gray-700">{STORE.address}</p>
              <p className="text-gray-500 text-sm">{STORE.city}, {STORE.region}</p>
            </div>

            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h2 className="font-bold mb-3">Телефон</h2>
              <a href={`tel:${STORE.phoneLink}`} className="text-xl font-bold text-primary-500 hover:underline">
                {STORE.phone}
              </a>
              <p className="text-gray-500 text-sm mt-1">Звонок бесплатный</p>
            </div>

            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h2 className="font-bold mb-3">Email</h2>
              <a href={`mailto:${STORE.email}`} className="text-primary-500 hover:underline">
                {STORE.email}
              </a>
            </div>

            <div className="p-5 bg-primary-50/50 rounded-xl">
              <h2 className="font-bold mb-3">Часы работы</h2>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Понедельник — Пятница</span>
                  <span className="font-medium">{STORE.hoursWeekday}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Суббота — Воскресенье</span>
                  <span className="font-medium">{STORE.hoursWeekend}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
            <div className="text-center p-6">
              <div className="text-5xl mb-3">📍</div>
              <p className="font-semibold mb-1">Магия Цветов</p>
              <p className="text-sm text-gray-500">{STORE.address}</p>
              <p className="text-sm text-gray-400">{STORE.city}</p>
              <a
                href={`https://yandex.ru/maps/-/CDaZiE~P`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm text-primary-500 font-medium hover:underline"
              >
                Открыть на карте &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
