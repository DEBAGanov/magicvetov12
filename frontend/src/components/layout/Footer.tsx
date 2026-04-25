/**
 * @file: components/layout/Footer.tsx
 * @description: 5-column footer with NAP contacts, cross-linking, cities, occasions
 * @created: 2026-04-15
 */

import Link from "next/link";

const OCCASION_LINKS = [
  { href: "/na-den-rozhdeniya", label: "День рождения" },
  { href: "/pozdravlenie-s-dnem-rozhdeniya", label: "Поздравление" },
  { href: "/na-yubilej", label: "Юбилей" },
  { href: "/na-svadbu", label: "Свадьба" },
  { href: "/na-rozhdenie-rebenka", label: "Рождение ребёнка" },
  { href: "/na-14-fevralya", label: "14 февраля" },
  { href: "/na-8-marta", label: "8 марта" },
  { href: "/na-svidanie", label: "Свидание" },
  { href: "/na-vypusknoj", label: "Выпускной" },
  { href: "/na-1-sentyabrya", label: "1 сентября" },
  { href: "/na-den-materi", label: "День матери" },
  { href: "/na-novyj-god", label: "Новый год" },
  { href: "/izvinenie", label: "Извинение" },
  { href: "/spasibo", label: "Спасибо" },
  { href: "/na-korporativ", label: "Корпоратив" },
  { href: "/otkrytka", label: "Открытка" },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {/* About + NAP */}
          <div>
            <div className="text-lg font-bold text-primary-300 mb-2">Магия Цветов</div>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">
              Доставка свежих цветов по Волжску и Зеленодольску.
            </p>
            <address className="not-italic text-xs text-gray-500 space-y-0.5">
              <p>ул. Володарского, 5, Волжск</p>
              <a href="tel:+79648612370" className="block text-gray-300 hover:text-primary-300">+7 (964) 861-23-70</a>
              <p>Пн-Пт 7:30–20:00, Сб-Вс 8:00–20:00</p>
            </address>
          </div>

          {/* Каталог */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Каталог</div>
            <div className="flex flex-col gap-1.5">
              <Link href="/catalog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Все цветы</Link>
              <Link href="/rozy" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Розы</Link>
              <Link href="/tyulpany" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Тюльпаны</Link>
              <Link href="/cvety-v-korobke" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">В коробке</Link>
              <Link href="/korziny-s-cvetami" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Корзины</Link>
              <Link href="/nedorogie-cvety" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Недорогие</Link>
            </div>
          </div>

          {/* Поводы 1 */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Поводы</div>
            <div className="flex flex-col gap-1.5">
              {OCCASION_LINKS.slice(0, 6).map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Поводы 2 */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">&nbsp;</div>
            <div className="flex flex-col gap-1.5">
              {OCCASION_LINKS.slice(6, 12).map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Поводы 3 + Информация */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">&nbsp;</div>
            <div className="flex flex-col gap-1.5 mb-4">
              {OCCASION_LINKS.slice(12).map((link) => (
                <Link key={link.href} href={link.href} className="text-sm text-gray-300 hover:text-primary-300 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Информация</div>
            <div className="flex flex-col gap-1.5">
              <Link href="/o-nas" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">О нас</Link>
              <Link href="/otzyvy" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Отзывы</Link>
              <Link href="/kontakty" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Контакты</Link>
              <Link href="/blog" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Блог</Link>
              <Link href="/faq" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Доставка */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Доставка</div>
            <div className="flex flex-col gap-1.5 mb-4">
              <Link href="/dostavka-cvetov/volzhsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Волжск</Link>
              <Link href="/dostavka-cvetov/zelenodolsk" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Зеленодольск</Link>
              <Link href="/dostavka" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">Условия доставки</Link>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Контакты</div>
            <div className="flex flex-col gap-1">
              <a href="tel:+79648612370" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">+7 (964) 861-23-70</a>
              <a href="mailto:info@magiacvetov12.ru" className="text-sm text-gray-300 hover:text-primary-300 transition-colors">info@magiacvetov12.ru</a>
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
