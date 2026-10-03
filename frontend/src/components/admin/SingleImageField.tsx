/**
 * @file: admin/SingleImageField.tsx
 * @description: Одна картинка — для категории.
 *
 * Отдельно от ImageGallery: у категории ровно одна картинка, и порядок с
 * «главной» ей не нужны. Переиспользовать галерею значило бы показывать админу
 * кнопки, которые ничего не делают.
 *
 * Правило удаления то же, что в галерее: крест убирает картинку из формы, а
 * файл удаляет сервер при сохранении. Исключение — только что загруженная и
 * ещё не сохранённая: её убираем из бакета сразу.
 *
 * @created: 2026-10-02
 */
'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AdminApiError, deleteUnsavedImage, uploadImage } from '@/lib/admin/api'
import { cn } from '@/lib/utils'
import { Button, PlusIcon, TrashIcon } from './ui'

export interface SingleImage {
  key: string
  url: string
  /** Загружена в этом сеансе и ещё не сохранена. */
  unsaved?: boolean
}

export function SingleImageField({
  value,
  onChange,
  disabled,
}: {
  value: SingleImage | null
  onChange: (value: SingleImage | null) => void
  disabled?: boolean
}) {
  const [percent, setPercent] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setError(null)
    setPercent(0)
    try {
      const result = await uploadImage(file, setPercent, 'categories')
      // Прежнюю незакреплённую картинку убираем из бакета: иначе при повторной
      // загрузке до сохранения она осталась бы там навсегда.
      if (value?.unsaved) {
        void deleteUnsavedImage(value.key).catch(() => {})
      }
      onChange({ key: result.objectName, url: result.url, unsaved: true })
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Не удалось загрузить')
    } finally {
      setPercent(null)
    }
  }

  async function remove() {
    const current = value
    onChange(null)
    if (current?.unsaved) {
      try {
        await deleteUnsavedImage(current.key)
      } catch {
        /* подчистится ревизией сирот */
      }
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
          event.target.value = ''
        }}
        disabled={disabled}
        className="hidden"
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
            <Image src={value.url} alt="" fill sizes="64px" className="object-cover" unoptimized />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-gray-400">{value.key}</p>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="h-11 cursor-pointer rounded-lg border border-gray-300 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
            >
              Заменить
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={disabled}
              aria-label="Убрать картинку категории"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (disabled) return
            const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
            if (file) void upload(file)
          }}
          className={cn(
            'rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
            dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
            disabled && 'opacity-60',
          )}
        >
          <p className="text-sm text-gray-600">Перетащите картинку сюда или</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-2"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <PlusIcon className="h-4 w-4" />
            Выбрать файл
          </Button>
          <p className="mt-2 text-xs text-gray-500">JPG, PNG или WebP, до 5 МБ</p>
        </div>
      )}

      {percent !== null && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Загрузка картинки"
        >
          <div
            className="h-full rounded-full bg-primary-600 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
