/**
 * @file: components/home/HeroBanner.tsx
 * @description: Full-width hero banner with CTA
 * @created: 2026-04-15
 */

import Link from "next/link";

export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-br from-primary-50 via-white to-primary-50/30">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4">
              Доставка по Волжску и Зеленодольску
            </span>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              Доставка цветов по Волжску и Зеленодольску — букеты, которые <span className="text-primary-500">говорят</span> за вас
            </h1>
            <p className="text-gray-600 text-lg mb-6 max-w-lg">
              Свежие цветы с доставкой за 2 часа. Авторские букеты, розы, тюльпаны и цветы на любой повод в Волжске и Зеленодольске.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors">
                Смотреть каталог
              </Link>
              <Link href="/catalog?filter=special" className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors">
                Акции
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-80 h-80 bg-primary-100 rounded-3xl flex items-center justify-center text-8xl">
              💐
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
