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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* About */}
          <div>
            <div className="text-lg font-bold text-primary-300 mb-2">Магия Цветов</div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Доставка свежих цветов по Волжску и Зеленодольску. Авторские букеты, композиции и цветы на любой повод.
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

          {/* Occasions */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Поводы</div>
            <div className="flex flex-col gap-2">
              <Link href="/na-den-rozhdeniya" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">День рождения</Link>
              <Link href="/na-yubilej" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Юбилей</Link>
              <Link href="/na-svadbu" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Свадьба</Link>
              <Link href="/na-14-fevralya" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">14 февраля</Link>
              <Link href="/na-8-marta" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">8 марта</Link>
              <Link href="/na-vypusknoj" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Выпускной</Link>
              <Link href="/na-1-sentyabrya" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">1 сентября</Link>
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Информация</div>
            <div className="flex flex-col gap-2">
              <Link href="/dostavka-cvetov/volzhsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Доставка Волжск</Link>
              <Link href="/dostavka-cvetov/zelenodolsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Доставка Зеленодольск</Link>
              <Link href="/dostavka" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Доставка и оплата</Link>
              <Link href="/o-nas" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">О нас</Link>
              <Link href="/otzyvy" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Отзывы</Link>
              <Link href="/kontakty" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Контакты</Link>
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">Контакты</div>
            <div className="flex flex-col gap-2">
              <a href="tel:+79648612370" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                +7 (964) 861-23-70
              </a>
              <a href="mailto:info@magiacvetov12.ru" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                info@magiacvetov12.ru
              </a>
              <span className="text-sm text-gray-400">ул. Володарского, 5</span>
              <span className="text-sm text-gray-400">Пн-Пт 7:30 — 20:00</span>
              <span className="text-sm text-gray-400">Сб-Вс 8:00 — 20:00</span>
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
