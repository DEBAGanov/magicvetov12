/**
 * @file: admin/products/[id]/page.tsx
 * @description: Правка товара.
 *
 * Товар загружается в браузере, а не на сервере: запрос к /admin/products/{id}
 * требует токен администратора, а он лежит в localStorage и серверному
 * рендерингу недоступен.
 *
 * @created: 2026-10-02
 */
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminApi } from '@/lib/admin/api'
import type { AdminProductDTO } from '@/lib/admin/types'
import { AdminShell } from '@/components/admin/AdminShell'
import { ProductForm } from '@/components/admin/ProductForm'
import { ErrorState, PageHeader, TableSkeleton } from '@/components/admin/ui'

export default function EditProductPage() {
  return (
    <AdminShell>
      <EditProduct />
    </AdminShell>
  )
}

function EditProduct() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)

  const [product, setProduct] = useState<AdminProductDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError('Неверный адрес товара')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setProduct(await adminApi.products.get(id))
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось загрузить товар')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      <PageHeader title={product ? product.name : 'Товар'}>
        <Link href="/admin/products" className="text-sm text-gray-600 underline">
          К списку
        </Link>
      </PageHeader>

      {loading && <TableSkeleton rows={4} />}
      {error && !loading && <ErrorState message={error} onRetry={() => void load()} />}
      {/* key — чтобы форма пересобралась после перезагрузки товара, иначе
          useState сохранит прежние значения полей */}
      {product && !loading && !error && <ProductForm key={product.id} product={product} />}
    </>
  )
}
