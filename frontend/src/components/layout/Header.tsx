/**
 * @file: components/layout/Header.tsx
 * @description: Sticky header with logo, navigation, search, cart, auth
 * @created: 2026-04-15
 */

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white border-b transition-shadow",
        scrolled ? "shadow-md" : "border-gray-100"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
              <path d="M12 2c-2 4-9 7-9 14a9 9 0 0018 0c0-7-7-10-9-14z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-bold text-primary-500 leading-tight">Магия Цветов</div>
            <div className="text-[11px] text-gray-400 leading-tight">Доставка цветов</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/catalog" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
            Каталог
          </Link>
          <Link href="/#delivery" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
            Доставка
          </Link>
          <Link href="/#faq" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
            FAQ
          </Link>
          <Link href="/#reviews" className="text-sm font-medium text-gray-700 hover:text-primary-500 transition-colors">
            Отзывы
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Phone */}
          <a
            href="tel:+79001234567"
            className="hidden lg:flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-primary-500"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary-500">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" />
            </svg>
            +7 (900) 123-45-67
          </a>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex items-center gap-1 px-3 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.16 14.26l.04-.12.94-1.7h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0020.01 4H5.21l-.94-2H1v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7.42c-.14 0-.25-.11-.25-.25z" />
            </svg>
            <span className="hidden sm:inline">Корзина</span>
            <CartBadge />
          </Link>

          {/* Mobile burger */}
          <button
            className="md:hidden flex flex-col gap-1 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            <span className={cn("w-5 h-0.5 bg-gray-800 transition-all", mobileMenuOpen && "rotate-45 translate-y-1.5")} />
            <span className={cn("w-5 h-0.5 bg-gray-800 transition-all", mobileMenuOpen && "opacity-0")} />
            <span className={cn("w-5 h-0.5 bg-gray-800 transition-all", mobileMenuOpen && "-rotate-45 -translate-y-1.5")} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-2">
            <Link href="/catalog" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-gray-800">
              Каталог
            </Link>
            <Link href="/#delivery" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-gray-800">
              Доставка
            </Link>
            <Link href="/#faq" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-gray-800">
              FAQ
            </Link>
            <Link href="/#reviews" onClick={() => setMobileMenuOpen(false)} className="py-3 text-base font-medium text-gray-800">
              Отзывы
            </Link>
            <a href="tel:+79001234567" className="py-3 text-base font-bold text-primary-500">
              +7 (900) 123-45-67
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

function CartBadge() {
  // Will be connected to cart store in later stages
  return <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent-500 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white" />;
}
