/**
 * @file: admin/layout.tsx
 * @description: Разметка раздела админки.
 *
 * Серверный компонент: сам каркас с проверкой прав — клиентский
 * (AdminShell), а здесь только метаданные. Страница входа в каркас не
 * оборачивается — она сама решает, что показать, иначе получился бы цикл
 * «нет прав → на вход → нет прав».
 *
 * noindex — админка не должна попадать в поиск.
 *
 * @created: 2026-10-02
 */
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Админка · Магия Цветов',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
