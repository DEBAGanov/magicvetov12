/**
 * @file: admin/categories/page.tsx
 * @description: Категории: список, создание, правка, удаление.
 *
 * Задача 3.8 из docs/ADMIN_PANEL_PLAN.md.
 *
 * Правка здесь прямо в списке, а не на отдельной странице: полей мало (название,
 * описание, картинка, порядок, показ), категорий немного, и переход на отдельный
 * маршрут ради пяти полей — лишний шаг. У товара обратная ситуация, там форма
 * большая и живёт отдельно.
 *
 * @created: 2026-10-02
 */
'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { AdminApiError, adminApi } from '@/lib/admin/api'
import type { AdminCategoryDTO, SaveCategoryBody } from '@/lib/admin/types'
import { AdminShell } from '@/components/admin/AdminShell'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { SingleImageField, type SingleImage } from '@/components/admin/SingleImageField'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Button,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  PlusIcon,
  TableSkeleton,
  inputClass,
  textareaClass,
} from '@/components/admin/ui'

export default function AdminCategoriesPage() {
  return (
    <AdminShell>
      <CategoryList />
    </AdminShell>
  )
}

function CategoryList() {
  const [categories, setCategories] = useState<AdminCategoryDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  /** id правимой категории, 'new' — создание, null — ничего не открыто. */
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<AdminCategoryDTO | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCategories(await adminApi.categories.list())
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось загрузить категории')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    try {
      await adminApi.categories.remove(toDelete.id)
      setToDelete(null)
      await load()
    } catch (err) {
      // 409 — в категории есть товары. Сообщение с бэкенда объясняет, что делать.
      setError(err instanceof AdminApiError ? err.message : 'Не удалось удалить категорию')
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  /** Меняет порядок местами с соседом и сохраняет оба. */
  async function swapOrder(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length) return

    setError(null)
    try {
      // Отдельная ручка вместо двух update: тот перезаписывает описание, и
      // перестановка стёрла бы описания категорий.
      await adminApi.categories.swapOrder(categories[index].id, categories[target].id)
      await load()
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось изменить порядок')
    }
  }

  return (
    <>
      <PageHeader title="Категории" count={categories.length}>
        <Button variant="primary" onClick={() => setEditing('new')} disabled={editing === 'new'}>
          <PlusIcon className="h-4 w-4" />
          Добавить
        </Button>
      </PageHeader>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} />
        </div>
      )}

      {editing === 'new' && (
        <div className="mb-4">
          <CategoryForm
            onSaved={() => {
              setEditing(null)
              void load()
            }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {loading && <TableSkeleton rows={4} />}

      {!loading && categories.length === 0 && editing !== 'new' && (
        <EmptyState
          title="Категорий пока нет"
          hint="Категория нужна, чтобы добавить товар — создайте первую."
        >
          <Button variant="primary" onClick={() => setEditing('new')}>
            Добавить категорию
          </Button>
        </EmptyState>
      )}

      {!loading && categories.length > 0 && (
        <ul className="space-y-2">
          {categories.map((category, index) =>
            editing === category.id ? (
              <li key={category.id}>
                <CategoryForm
                  category={category}
                  onSaved={() => {
                    setEditing(null)
                    void load()
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  {category.imageUrl && (
                    <Image
                      src={category.imageUrl}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{category.name}</span>
                    {!category.isActive && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
                        Скрыта
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {category.productCount === 0
                      ? 'Нет товаров'
                      : `Товаров: ${category.productCount}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void swapOrder(index, -1)}
                    disabled={index === 0}
                    aria-label={`Переместить «${category.name}» выше`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => void swapOrder(index, 1)}
                    disabled={index === categories.length - 1}
                    aria-label={`Переместить «${category.name}» ниже`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(category.id)}
                    className="h-11 cursor-pointer rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Изменить
                  </button>
                  {/* Непустую категорию удалить нельзя: каскад унёс бы её
                      товары. Кнопку не прячем, а отключаем с объяснением —
                      иначе непонятно, почему удалить не получается. */}
                  <button
                    type="button"
                    onClick={() => setToDelete(category)}
                    disabled={category.productCount > 0}
                    title={
                      category.productCount > 0
                        ? 'Сначала перенесите или удалите товары категории'
                        : undefined
                    }
                    aria-label={`Удалить категорию ${category.name}`}
                    className="h-11 cursor-pointer rounded-lg border border-red-300 px-3 text-xs font-medium text-red-700 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить категорию?"
        message={
          toDelete
            ? `«${toDelete.name}» будет удалена вместе с картинкой из хранилища. Отменить это нельзя.`
            : ''
        }
        busy={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  )
}

/** Форма создания и правки — раскрывается на месте строки списка. */
function CategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category?: AdminCategoryDTO
  onSaved: () => void
  onCancel: () => void
}) {
  const isEdit = category !== undefined
  const fieldId = `category-${category?.id ?? 'new'}`

  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [image, setImage] = useState<SingleImage | null>(
    category?.imageKey && category.imageUrl
      ? { key: category.imageKey, url: category.imageUrl }
      : null,
  )
  const [nameError, setNameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaveError(null)

    if (!name.trim()) {
      setNameError('Укажите название категории')
      return
    }
    if (name.trim().length > 100) {
      setNameError('Название длиннее 100 символов')
      return
    }
    setNameError(null)
    setSaving(true)

    const body: SaveCategoryBody = {
      name: name.trim(),
      description: description.trim() || null,
      // '' — снять картинку; сервер отличает её от отсутствия поля.
      imageKey: image ? image.key : '',
      isActive,
    }

    try {
      if (isEdit) {
        await adminApi.categories.update(category.id, body)
      } else {
        await adminApi.categories.create(body)
      }
      onSaved()
    } catch (err) {
      setSaveError(err instanceof AdminApiError ? err.message : 'Не удалось сохранить категорию')
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-primary-300 bg-white p-4"
    >
      <h2 className="text-base font-semibold text-gray-900">
        {isEdit ? `Правка: ${category.name}` : 'Новая категория'}
      </h2>

      {saveError && <ErrorState message={saveError} />}

      <Field label="Название" htmlFor={`${fieldId}-name`} required error={nameError ?? undefined}>
        <input
          id={`${fieldId}-name`}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setNameError(null)
          }}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? `${fieldId}-name-error` : undefined}
          className={inputClass}
        />
      </Field>

      <Field label="Описание" htmlFor={`${fieldId}-description`} hint="Необязательно">
        <textarea
          id={`${fieldId}-description`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-describedby={`${fieldId}-description-hint`}
          className={textareaClass}
        />
      </Field>

      <Field label="Картинка">
        <SingleImageField value={image} onChange={setImage} disabled={saving} />
      </Field>

      <label
        htmlFor={`${fieldId}-active`}
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 hover:bg-gray-50"
      >
        <input
          id={`${fieldId}-active`}
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-200"
        />
        <span className="min-w-0">
          <span className="block text-sm text-gray-900">Показывать на витрине</span>
          <span className="block text-xs text-gray-500">
            Скрытая категория остаётся здесь, но покупатели её не видят
          </span>
        </span>
      </label>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать'}
        </Button>
        <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
