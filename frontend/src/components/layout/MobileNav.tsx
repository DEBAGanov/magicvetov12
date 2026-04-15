/**
 * @file: components/layout/MobileNav.tsx
 * @description: Fixed bottom navigation for mobile (5 icons)
 * @created: 2026-04-15
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Главная", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
  { href: "/catalog", label: "Каталог", icon: "M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" },
  { href: "/cart", label: "Корзина", icon: "M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.04-.12.94-1.7h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020.01 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" },
  { href: "tel:+79001234567", label: "Звонок", icon: "M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" },
  { href: "/account", label: "Профиль", icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const isPhone = item.href.startsWith("tel:");
          const isCart = item.href === "/cart";

          const content = (
            <div className="flex flex-col items-center gap-0.5">
              <svg viewBox="0 0 24 24" className={cn("w-5 h-5", isActive ? "fill-primary-500" : "fill-gray-400")}>
                <path d={item.icon} />
              </svg>
              <span className={cn("text-[10px]", isActive ? "text-primary-500 font-semibold" : "text-gray-400")}>
                {item.label}
              </span>
              {isCart && (
                <span className="absolute -top-0.5 right-1/2 -translate-x-3 min-w-[16px] h-4 bg-accent-500 text-[9px] font-bold rounded-full flex items-center justify-center text-gray-800">
                  0
                </span>
              )}
            </div>
          );

          if (isPhone) {
            return (
              <a key={item.href} href={item.href} className="relative flex items-center justify-center w-16 h-full">
                {content}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("relative flex items-center justify-center w-16 h-full", isActive && "text-primary-500")}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
