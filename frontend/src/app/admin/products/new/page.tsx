/**
 * @file: admin/products/new/page.tsx
 * @description: Создание товара.
 * @created: 2026-10-02
 */
'use client'

import Link from 'next/link'
import { AdminShell } from '@/components/admin/AdminShell'
import { ProductForm } from '@/components/admin/ProductForm'
import { PageHeader } from '@/components/admin/ui'

export default function NewProductPage() {
  return (
    <AdminShell>
      <PageHeader title="Новый товар">
        <Link href="/admin/products" className="text-sm text-gray-600 underline">
          К списку
        </Link>
      </PageHeader>
      <ProductForm />
    </AdminShell>
  )
}
