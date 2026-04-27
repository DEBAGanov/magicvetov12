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
        <div className="grid grid-cols-2 md:grid-cols-7 gap-5 text-sm">
          {/* About + NAP */}
          <div>
            <div className="text-lg font-bold text-primary-300 mb-2">Магия Цветов</div>
            <p className="text-gray-400 leading-relaxed mb-3">Доставка свежих цветов по Волжску и Зеленодольску.</p>
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
              <Link href="/catalog" className="text-gray-300 hover:text-primary-300">Все цветы</Link>
              <Link href="/rozy" className="text-gray-300 hover:text-primary-300">Розы</Link>
              <Link href="/tyulpany" className="text-gray-300 hover:text-primary-300">Тюльпаны</Link>
              <Link href="/s-hrizantemami" className="text-gray-300 hover:text-primary-300">Хризантемы</Link>
              <Link href="/s-gerberami" className="text-gray-300 hover:text-primary-300">Герберы</Link>
              <Link href="/s-orhideyami" className="text-gray-300 hover:text-primary-300">Орхидеи</Link>
              <Link href="/s-eustomoy" className="text-gray-300 hover:text-primary-300">Эустома</Link>
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

          {/* Доставка + Кому + По цене */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Доставка</div>
            <div className="flex flex-col gap-1.5 mb-3">
              <Link href="/dostavka-cvetov/volzhsk" className="text-gray-300 hover:text-primary-300">Волжск</Link>
              <Link href="/dostavka-cvetov/zelenodolsk" className="text-gray-300 hover:text-primary-300">Зеленодольск</Link>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Кому</div>
            <div className="flex flex-col gap-1.5 mb-3">
              <Link href="/zhene" className="text-gray-300 hover:text-primary-300">Жене</Link>
              <Link href="/devushke" className="text-gray-300 hover:text-primary-300">Девушке</Link>
              <Link href="/mame" className="text-gray-300 hover:text-primary-300">Маме</Link>
              <Link href="/muzhchine" className="text-gray-300 hover:text-primary-300">Мужчине</Link>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">По цене</div>
            <div className="flex flex-col gap-1.5">
              <Link href="/do-2500" className="text-gray-300 hover:text-primary-300">до 2 500 ₽</Link>
              <Link href="/ot-2500-do-3500" className="text-gray-300 hover:text-primary-300">2 500–3 500 ₽</Link>
              <Link href="/ot-3500-do-5000" className="text-gray-300 hover:text-primary-300">3 500–5 000 ₽</Link>
              <Link href="/premium-bukety" className="text-gray-300 hover:text-primary-300">Premium</Link>
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
