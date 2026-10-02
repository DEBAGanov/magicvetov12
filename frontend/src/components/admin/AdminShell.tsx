/**
 * @file: admin/AdminShell.tsx
 * @description: Каркас админки: проверка прав, меню, выход.
 *
 * Проверка роли здесь — только для интерфейса: не открывать экраны и не рисовать
 * меню тому, кто не администратор. Настоящая защита на бэкенде
 * (SecurityConfig + @PreAuthorize); подделанная роль в localStorage нарисует
 * меню, но ни один запрос не выполнится — вернётся 403.
 *
 * На узком экране меню переезжает в нижнюю панель: админкой пользуются с
 * телефона, а боковая колонка там съела бы половину ширины.
 *
 * @created: 2026-10-02
 */
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUser, isAdmin, logout, type AdminUser } from '@/lib/admin/api'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/admin', label: 'Сводка', exact: true },
  { href: '/admin/products', label: 'Товары' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // localStorage доступен только в браузере, поэтому проверяем после
    // монтирования. До этого показываем заглушку, а не содержимое: иначе
    // экран админки мигнул бы и у неадминистратора.
    if (!isAdmin()) {
      const from = encodeURIComponent(pathname)
      router.replace(`/admin/login?from=${from}`)
      return
    }
    setUser(getUser())
    setChecked(true)
  }, [pathname, router])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Проверяем доступ…</p>
      </div>
    )
  }

  function isActive(item: (typeof NAV)[number]): boolean {
    return item.exact ? pathname === item.href : pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-gray-900">Магия Цветов</span>
            {/* Меню в шапке — только на широком экране */}
            <nav className="hidden gap-1 sm:flex" aria-label="Разделы админки">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item) ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors',
                    isActive(item)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:inline">{user?.username}</span>
            <button
              type="button"
              onClick={logout}
              className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* pb-20 на узком экране — место под нижнюю панель, иначе она
          перекрывает последнюю строку списка */}
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-20 sm:pb-8">{children}</main>

      {/* Нижняя панель — только на телефоне. Разделов два, предел в 5 соблюдён.
          safe-area — чтобы панель не уезжала под жест-бар iPhone. */}
      <nav
        aria-label="Разделы админки"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <div className="flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                isActive(item) ? 'text-primary-700' : 'text-gray-500',
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
