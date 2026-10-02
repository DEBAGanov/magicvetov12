/**
 * @file: admin/products/page.tsx
 * @description: Список товаров: поиск, фильтр по категории, пагинация.
 *
 * На широком экране таблица, на узком — карточки. Это не два разных набора
 * данных, а одна разметка в двух видах: таблица на 390 px потребовала бы
 * горизонтальной прокрутки, а в ней легко потерять строку.
 *
 * @created: 2026-10-02
 */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminApi } from '@/lib/admin/api'
import type { AdminProductDTO, AdminProductPage } from '@/lib/admin/types'
import type { CategoryDTO } from '@/lib/types'
import { AdminShell } from '@/components/admin/AdminShell'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import {
  AvailabilityBadge,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  PlusIcon,
  TableSkeleton,
  inputClass,
  selectClass,
} from '@/components/admin/ui'
import { formatPrice } from '@/lib/utils'

export default function AdminProductsPage() {
  return (
    <AdminShell>
      <ProductList />
    </AdminShell>
  )
}

function ProductList() {
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [data, setData] = useState<AdminProductPage | null>(null)
  const [categories, setCategories] = useState<CategoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toDelete, setToDelete] = useState<AdminProductDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminApi.products.list({ page, query, categoryId }))
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }, [page, query, categoryId])

  // Поиск с задержкой: без неё запрос уходил бы на каждую букву.
  useEffect(() => {
    const timer = setTimeout(() => void load(), query ? 350 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  useEffect(() => {
    adminApi.categories().then(setCategories).catch(() => {
      // Фильтр — не главное на экране: без категорий список всё равно работает.
      setCategories([])
    })
  }, [])

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await adminApi.products.remove(toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось удалить товар')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader title="Товары" count={data?.totalElements}>
        <Link href="/admin/products/new">
          <Button variant="primary">
            <PlusIcon className="h-4 w-4" />
            Добавить
          </Button>
        </Link>
      </PageHeader>

      {/* Фильтры */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0) // иначе поиск применится к текущей странице и покажет пусто
          }}
          placeholder="Поиск по названию"
          aria-label="Поиск по названию"
          className={inputClass}
        />
        <select
          value={categoryId ?? ''}
          onChange={(e) => {
            setCategoryId(e.target.value ? Number(e.target.value) : undefined)
            setPage(0)
          }}
          aria-label="Категория"
          className={`${selectClass} sm:w-56`}
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <TableSkeleton />}
      {error && !loading && <ErrorState message={error} onRetry={() => void load()} />}

      {data && !loading && !error && data.content.length === 0 && (
        <EmptyState
          title="Товаров не найдено"
          hint={
            query || categoryId
              ? 'Измените условия поиска или сбросьте фильтр.'
              : 'Добавьте первый товар — он появится в каталоге.'
          }
        >
          {!query && !categoryId && (
            <Link href="/admin/products/new">
              <Button variant="primary">Добавить товар</Button>
            </Link>
          )}
        </EmptyState>
      )}

      {data && !loading && !error && data.content.length > 0 && (
        <>
          {/* Карточки — на телефоне */}
          <ul className="space-y-2 sm:hidden">
            {data.content.map((product) => (
              <li
                key={product.id}
                className="flex gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <Thumb product={product} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="block truncate text-sm font-medium text-gray-900 underline-offset-2 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-gray-500">{product.categoryName ?? '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                    <AvailabilityBadge available={product.isAvailable} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setToDelete(product)}
                  aria-label={`Удалить товар ${product.name}`}
                  className="h-11 shrink-0 cursor-pointer self-start rounded-lg border border-red-300 px-3 text-xs font-medium text-red-700"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>

          {/* Таблица — на широком экране */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
            <table className="w-full text-sm">
              <caption className="sr-only">Список товаров</caption>
              <thead className="border-b border-gray-200 bg-gray-50 text-left">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600">
                    Товар
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600">
                    Категория
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600">
                    Цена
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium text-gray-600">
                    Статус
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <span className="sr-only">Действия</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.content.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb product={product} />
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="font-medium text-gray-900 underline-offset-2 hover:underline"
                        >
                          {product.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{product.categoryName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-900 tabular-nums">
                      {formatPrice(product.price)}
                      {product.discountedPrice && (
                        <span className="ml-1 text-xs text-gray-400 line-through">
                          {formatPrice(product.discountedPrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AvailabilityBadge available={product.isAvailable} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setToDelete(product)}
                        aria-label={`Удалить товар ${product.name}`}
                        className="h-11 cursor-pointer rounded-lg px-3 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={data.number}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить товар?"
        message={
          toDelete
            ? `«${toDelete.name}» будет удалён вместе со всеми фотографиями из хранилища. Отменить это нельзя.`
            : ''
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

/** Превью товара. Пустой блок, если картинки нет — чтобы строки не прыгали. */
function Thumb({ product }: { product: AdminProductDTO }) {
  return (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          unoptimized
        />
      )}
    </div>
  )
}
