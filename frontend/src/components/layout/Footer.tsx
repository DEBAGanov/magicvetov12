/**
 * @file: components/layout/Footer.tsx
 * @description: 4-column footer with contacts, links, about
 * @created: 2026-04-15
 */

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="text-lg font-bold text-primary-300 mb-2">Магия Цветов</div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Доставка свежих цветов по городу. Авторские букеты, композиции и цветы на любой повод.
            </p>
          </div>

          {/* Catalog */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Каталог</div>
            <div className="flex flex-col gap-2">
              <Link href="/catalog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Все цветы</Link>
              <Link href="/catalog?filter=special" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Акции</Link>
              <Link href="/catalog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Розы</Link>
              <Link href="/catalog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Букеты</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Информация</div>
            <div className="flex flex-col gap-2">
              <Link href="/#delivery" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Доставка</Link>
              <Link href="/#faq" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">FAQ</Link>
              <Link href="/#reviews" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Отзывы</Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Контакты</div>
            <div className="flex flex-col gap-2">
              <a href="tel:+79001234567" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                +7 (900) 123-45-67
              </a>
              <a href="mailto:info@magiacvetov12.ru" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                info@magiacvetov12.ru
              </a>
              <span className="text-sm text-gray-400">Ежедневно 8:00 — 22:00</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>&copy; 2026 Магия Цветов. Все права защищены.</span>
          <span>Доставка цветов с любовью</span>
        </div>
      </div>
    </footer>
  );
}
