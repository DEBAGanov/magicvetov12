/**
 * @file: admin/ProductForm.tsx
 * @description: Форма товара — одна на создание и на правку.
 *
 * Галерея и главная картинка — один список (ImageGallery): первая картинка
 * считается главной. Так для админа это одно понятное действие «расставить
 * фотографии», а не два отдельных поля, между которыми надо что-то
 * перекладывать. При сохранении список разбирается обратно: первый элемент
 * уходит в imageKey, остальные — в additionalImages.
 *
 * @created: 2026-10-02
 */
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { AdminApiError, adminApi } from '@/lib/admin/api'
import type { AdminCategoryDTO, AdminProductDTO, UpdateProductBody } from '@/lib/admin/types'
import { ImageGallery, type GalleryItem } from './ImageGallery'
import {
  Button,
  ErrorState,
  ErrorSummary,
  Field,
  inputClass,
  selectClass,
  textareaClass,
} from './ui'

interface FormState {
  name: string
  description: string
  price: string
  discountedPrice: string
  categoryId: string
  weight: string
  discountPercent: string
  isAvailable: boolean
  isSpecialOffer: boolean
  isPreorder: boolean
}

/** Пустые строки, а не нули: иначе в поле цены стоит «0», и его надо стирать. */
const EMPTY: FormState = {
  name: '',
  description: '',
  price: '',
  discountedPrice: '',
  categoryId: '',
  weight: '',
  discountPercent: '',
  isAvailable: true,
  isSpecialOffer: false,
  isPreorder: false,
}

export function ProductForm({ product }: { product?: AdminProductDTO }) {
  const router = useRouter()
  const isEdit = product !== undefined

  const [form, setForm] = useState<FormState>(
    product
      ? {
          name: product.name,
          description: product.description ?? '',
          price: String(product.price),
          discountedPrice: product.discountedPrice ? String(product.discountedPrice) : '',
          categoryId: product.categoryId ? String(product.categoryId) : '',
          weight: product.weight ? String(product.weight) : '',
          discountPercent: product.discountPercent ? String(product.discountPercent) : '',
          isAvailable: product.isAvailable,
          isSpecialOffer: product.isSpecialOffer,
          isPreorder: product.isPreorder,
        }
      : EMPTY,
  )

  // Главная картинка идёт первой — тем же порядком, в каком её покажет каталог.
  const [images, setImages] = useState<GalleryItem[]>(() => {
    if (!product) return []
    const main: GalleryItem[] =
      product.imageKey && product.imageUrl
        ? [{ key: product.imageKey, url: product.imageUrl }]
        : []
    return [...main, ...(product.additionalImages ?? [])]
  })

  const [categories, setCategories] = useState<AdminCategoryDTO[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    adminApi.categories
      .list()
      .then(setCategories)
      .catch(() => setSaveError('Не удалось загрузить категории — выбрать категорию не получится'))
  }, [])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    // Ошибку поля снимаем сразу при правке: держать её до повторной отправки
    // значит показывать админу то, что он уже исправил.
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }

  /** Проверки дублируют серверные — чтобы не ждать ответа на очевидном. */
  function validate(): Record<string, string> {
    const found: Record<string, string> = {}

    if (!form.name.trim()) found.name = 'Укажите название товара'
    else if (form.name.trim().length > 100) found.name = 'Название длиннее 100 символов'

    const price = Number(form.price)
    if (!form.price.trim()) found.price = 'Укажите цену'
    else if (!Number.isFinite(price) || price <= 0) found.price = 'Цена должна быть больше нуля'

    if (form.discountedPrice.trim()) {
      const discounted = Number(form.discountedPrice)
      if (!Number.isFinite(discounted) || discounted <= 0) {
        found.discountedPrice = 'Цена со скидкой должна быть больше нуля'
      } else if (Number.isFinite(price) && discounted >= price) {
        // Серверной проверки на это нет, а ошибка дорогая: товар уехал бы в
        // каталог с «скидкой» выше обычной цены.
        found.discountedPrice = 'Цена со скидкой должна быть меньше обычной'
      }
    }

    if (!form.categoryId) found.categoryId = 'Выберите категорию'

    if (form.description.length > 1000) {
      found.description = 'Описание длиннее 1000 символов'
    }

    if (form.discountPercent.trim()) {
      const percent = Number(form.discountPercent)
      if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
        found.discountPercent = 'Процент скидки — целое число от 0 до 100'
      }
    }

    return found
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaveError(null)

    const found = validate()
    if (Object.keys(found).length > 0) {
      setErrors(found)
      // Переводим фокус на сводку — иначе с телефона непонятно, почему
      // ничего не произошло: ошибка может быть выше области просмотра.
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }

    setErrors({})
    setSaving(true)

    // Первая картинка — главная, остальные — галерея.
    // Пустая строка в imageKey означает «снять картинку»: сервер различает
    // её и отсутствие поля.
    const [main, ...rest] = images
    const body: UpdateProductBody = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      discountedPrice: form.discountedPrice.trim() ? Number(form.discountedPrice) : null,
      categoryId: Number(form.categoryId),
      imageKey: main ? main.key : '',
      additionalImages: rest.map((image) => ({ key: image.key })),
      weight: form.weight.trim() ? Number(form.weight) : null,
      discountPercent: form.discountPercent.trim() ? Number(form.discountPercent) : null,
      isAvailable: form.isAvailable,
      isSpecialOffer: form.isSpecialOffer,
      isPreorder: form.isPreorder,
    }

    try {
      if (isEdit) {
        await adminApi.products.update(product.id, body)
      } else {
        await adminApi.products.create(body)
      }
      // refresh перед уходом — чтобы список показал свежие данные, а не
      // закешированные с прошлого посещения.
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setSaveError(err instanceof AdminApiError ? err.message : 'Не удалось сохранить товар')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* ref нужен, чтобы перевести сюда фокус после неудачной отправки */}
      <div ref={summaryRef} tabIndex={-1} className="outline-none">
        <ErrorSummary errors={errors} />
      </div>

      {saveError && (
        <div className="mb-4">
          <ErrorState message={saveError} />
        </div>
      )}

      <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <Field label="Название" htmlFor="name" required error={errors.name}>
          <input
            id="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          label="Описание"
          htmlFor="description"
          error={errors.description}
          hint={`${form.description.length} из 1000 символов`}
        >
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            aria-describedby={errors.description ? 'description-error' : 'description-hint'}
            aria-invalid={errors.description ? true : undefined}
            className={textareaClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Цена, ₽" htmlFor="price" required error={errors.price}>
            <input
              id="price"
              // inputMode numeric — на телефоне открывается цифровая клавиатура
              inputMode="decimal"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              aria-describedby={errors.price ? 'price-error' : undefined}
              aria-invalid={errors.price ? true : undefined}
              className={inputClass}
            />
          </Field>

          <Field
            label="Цена со скидкой, ₽"
            htmlFor="discountedPrice"
            error={errors.discountedPrice}
            hint="Оставьте пустым, если скидки нет"
          >
            <input
              id="discountedPrice"
              inputMode="decimal"
              value={form.discountedPrice}
              onChange={(e) => set('discountedPrice', e.target.value)}
              aria-describedby={
                errors.discountedPrice ? 'discountedPrice-error' : 'discountedPrice-hint'
              }
              aria-invalid={errors.discountedPrice ? true : undefined}
              className={inputClass}
            />
          </Field>

          <Field label="Категория" htmlFor="categoryId" required error={errors.categoryId}>
            <select
              id="categoryId"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
              aria-invalid={errors.categoryId ? true : undefined}
              className={selectClass}
            >
              <option value="">Выберите категорию</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Вес, г" htmlFor="weight" hint="Необязательно">
            <input
              id="weight"
              inputMode="numeric"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              aria-describedby="weight-hint"
              className={inputClass}
            />
          </Field>

          <Field
            label="Процент скидки"
            htmlFor="discountPercent"
            error={errors.discountPercent}
            hint="Для метки в каталоге"
          >
            <input
              id="discountPercent"
              inputMode="numeric"
              value={form.discountPercent}
              onChange={(e) => set('discountPercent', e.target.value)}
              aria-describedby={
                errors.discountPercent ? 'discountPercent-error' : 'discountPercent-hint'
              }
              aria-invalid={errors.discountPercent ? true : undefined}
              className={inputClass}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-gray-900">Показ в каталоге</legend>
          <div className="space-y-1">
            <Checkbox
              id="isAvailable"
              label="В продаже"
              hint="Снятый товар не показывается в каталоге, но остаётся здесь"
              checked={form.isAvailable}
              onChange={(value) => set('isAvailable', value)}
            />
            <Checkbox
              id="isSpecialOffer"
              label="Специальное предложение"
              checked={form.isSpecialOffer}
              onChange={(value) => set('isSpecialOffer', value)}
            />
            <Checkbox
              id="isPreorder"
              label="Под заказ"
              checked={form.isPreorder}
              onChange={(value) => set('isPreorder', value)}
            />
          </div>
        </fieldset>
      </div>

      <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">Фотографии</h2>
        <ImageGallery items={images} onChange={setImages} disabled={saving} />
      </section>

      {/* Кнопки прилипают к низу: на длинной форме с телефона иначе надо
          каждый раз докручивать до конца, чтобы сохранить. */}
      <div className="sticky bottom-16 z-10 mt-5 flex gap-2 rounded-xl border border-gray-200 bg-white/95 p-3 backdrop-blur sm:bottom-0">
        <Button type="submit" variant="primary" disabled={saving} className="flex-1 sm:flex-none">
          {saving ? 'Сохраняем…' : isEdit ? 'Сохранить' : 'Создать товар'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={saving}
          onClick={() => router.push('/admin/products')}
          className="flex-1 sm:flex-none"
        >
          Отмена
        </Button>
      </div>
    </form>
  )
}

/** Флажок с подписью. Вся строка — цель нажатия, не только квадратик. */
function Checkbox({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 hover:bg-gray-50"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-200"
      />
      <span className="min-w-0">
        <span className="block text-sm text-gray-900">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  )
}
