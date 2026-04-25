/**
 * @file: components/layout/Footer.tsx
 * @description: 5-column footer with NAP contacts, cross-linking, cities, occasions
 * @created: 2026-04-15
 */

import Link from "next/link";

const OCCASION_LINKS = [
  { href: "/na-den-rozhdeniya", label: "День рождения" },
  { href: "/na-yubilej", label: "Юбилей" },
  { href: "/na-svadbu", label: "Свадьба" },
  { href: "/na-14-fevralya", label: "14 февраля" },
  { href: "/na-8-marta", label: "8 марта" },
  { href: "/na-vypusknoj", label: "Выпускной" },
  { href: "/na-1-sentyabrya", label: "1 сентября" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* About + NAP Волжск */}
          <div>
            <div className="text-lg font-bold text-primary-300 mb-2">Магия Цветов</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Доставка свежих цветов по Волжску и Зеленодольску. Авторские букеты, композиции и цветы на любой повод.
            </p>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Волжск</div>
            <address className="not-italic text-sm text-gray-400 space-y-1">
              <p>ул. Володарского, 5</p>
              <p>Республика Марий Эл</p>
              <a href="tel:+79648612370" className="block text-gray-300 hover:text-primary-300 transition-colors">
                +7 (964) 861-23-70
              </a>
              <p>Пн-Пт 7:30 — 20:00</p>
              <p>Сб-Вс 8:00 — 20:00</p>
            </address>
          </div>

          {/* NAP Зеленодольск + Каталог */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Зеленодольск</div>
            <address className="not-italic text-sm text-gray-400 space-y-1 mb-4">
              <p>Республика Татарстан</p>
              <a href="tel:+79648612370" className="block text-gray-300 hover:text-primary-300 transition-colors">
                +7 (964) 861-23-70
              </a>
              <p>Пн-Пт 7:30 — 20:00</p>
              <p>Сб-Вс 8:00 — 20:00</p>
            </address>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Каталог</div>
            <div className="flex flex-col gap-2">
              <Link href="/catalog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Все цветы</Link>
              <Link href="/catalog?filter=special" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Акции</Link>
            </div>
          </div>

          {/* Доставка по городам + Поводы */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Доставка цветов</div>
            <div className="flex flex-col gap-2 mb-4">
              <Link href="/dostavka-cvetov/volzhsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Волжск</Link>
              <Link href="/dostavka-cvetov/zelenodolsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Зеленодольск</Link>
              <Link href="/dostavka" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Условия доставки</Link>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Поводы</div>
            <div className="flex flex-col gap-2">
              {OCCASION_LINKS.slice(0, 4).map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Ещё поводы + Информация */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Ещё поводы</div>
            <div className="flex flex-col gap-2 mb-4">
              {OCCASION_LINKS.slice(4).map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Информация</div>
            <div className="flex flex-col gap-2">
              <Link href="/o-nas" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">О нас</Link>
              <Link href="/otzyvy" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Отзывы</Link>
              <Link href="/kontakty" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Контакты</Link>
              <Link href="/blog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Блог</Link>
              <Link href="/faq" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Вопросы и ответы</Link>
            </div>
          </div>

          {/* Контакты */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Контакты</div>
            <div className="flex flex-col gap-2">
              <a href="tel:+79648612370" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                +7 (964) 861-23-70
              </a>
              <a href="mailto:info@magiacvetov12.ru" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                info@magiacvetov12.ru
              </a>
              <span className="text-sm text-gray-400">ул. Володарского, 5, Волжск</span>
              <span className="text-sm text-gray-400">Пн-Пт 7:30 — 20:00</span>
              <span className="text-sm text-gray-400">Сб-Вс 8:00 — 20:00</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-gray-500">
          <span>&copy; 2026 Магия Цветов. Все права защищены.</span>
          <span>Доставка цветов по Волжску и Зеленодольску</span>
        </div>
      </div>
    </footer>
  );
}
