/**
 * @file: admin/page.tsx
 * @description: Сводка: заказы, выручка, товары.
 * @created: 2026-10-02
 */
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminApi } from '@/lib/admin/api'
import type { AdminStats } from '@/lib/admin/types'
import { AdminShell } from '@/components/admin/AdminShell'
import { Button, ErrorState, PageHeader, TableSkeleton } from '@/components/admin/ui'
import { formatPrice } from '@/lib/utils'

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  )
}

function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await adminApi.stats())
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось загрузить сводку')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <PageHeader title="Сводка">
        <Link href="/admin/products">
          <Button variant="primary">Товары</Button>
        </Link>
      </PageHeader>

      {loading && <TableSkeleton rows={3} />}
      {error && !loading && <ErrorState message={error} onRetry={() => void load()} />}

      {stats && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Заказов всего" value={String(stats.totalOrders ?? 0)} />
            <StatCard label="Заказов сегодня" value={String(stats.ordersToday ?? 0)} />
            <StatCard label="Выручка всего" value={formatPrice(stats.totalRevenue ?? 0)} />
            <StatCard label="Выручка сегодня" value={formatPrice(stats.revenueToday ?? 0)} />
            <StatCard label="Товаров" value={String(stats.totalProducts ?? 0)} />
            <StatCard label="Категорий" value={String(stats.totalCategories ?? 0)} />
          </div>

          {stats.popularProducts?.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-base font-semibold text-gray-900">Чаще покупают</h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {stats.popularProducts.map((product) => (
                  <li
                    key={product.productId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="min-w-0 truncate text-sm text-gray-900">
                      {product.productName}
                    </span>
                    <span className="shrink-0 text-sm text-gray-500">
                      {product.totalSold} шт · {formatPrice(product.totalRevenue ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      {/* tabular-nums — чтобы цифры не «дёргались» при обновлении */}
      <p className="mt-1 text-xl font-semibold text-gray-900 tabular-nums">{value}</p>
    </div>
  )
}
