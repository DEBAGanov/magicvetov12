/**
 * @file: layout/StorefrontChrome.tsx
 * @description: Показывает каркас витрины везде, кроме админки.
 *
 * Зачем. Корневой layout в Next.js обязателен для всех маршрутов, поэтому
 * шапка, футер и нижняя панель витрины попадали и на страницы /admin.
 * На телефоне это мешало работать: нижних панелей становилось две (витринная
 * и админская), они накладывались друг на друга, а корзина и меню каталога
 * администратору в карточке товара не нужны.
 *
 * Разделить маршруты через route group ((shop)/(admin)) было бы чище, но это
 * перенос десятков SEO-страниц живого сайта ради одного экрана — риск
 * несопоставим с выгодой. Поэтому прячем каркас по адресу.
 *
 * @created: 2026-10-03
 */
'use client'

import { usePathname } from 'next/navigation'

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // У админки свой каркас (AdminShell) со своим меню и нижней панелью.
  if (pathname?.startsWith('/admin')) {
    return null
  }
  return <>{children}</>
}
