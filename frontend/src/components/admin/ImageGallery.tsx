/**
 * @file: admin/ImageGallery.tsx
 * @description: Менеджер картинок товара: загрузка нескольких, порядок, главная.
 *
 * Задача 3.7 из docs/ADMIN_PANEL_PLAN.md — единственное место, которое пришлось
 * писать с нуля: в проекте-образце загрузчик одиночный (одна планировка), а
 * букету нужна галерея.
 *
 * Два решения, которые стоит объяснить:
 *
 * 1. Крест НЕ удаляет файл из бакета, только из списка в форме. Файл удалит
 *    сервер при сохранении товара, сравнив наборы ключей. Иначе админ, убравший
 *    картинку и закрывший форму без сохранения, потерял бы файл при живой
 *    ссылке в БД. Исключение — картинка, загруженная в этом же сеансе и ещё не
 *    сохранённая: её удаляем сразу, иначе она осталась бы в бакете навсегда.
 *
 * 2. Порядок меняется и перетаскиванием, и кнопками «вверх/вниз». Кнопки — не
 *    дубль для удобства, а требование WCAG 2.2 AA (Dragging Movements):
 *    перетаскивание не должно быть единственным способом. На телефоне ими
 *    к тому же проще пользоваться.
 *
 * @created: 2026-10-02
 */
'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'
import { AdminApiError, deleteUnsavedImage, uploadImage } from '@/lib/admin/api'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, Button, PlusIcon, StarIcon, TrashIcon } from './ui'

/** Картинка в форме. */
export interface GalleryItem {
  /** Ключ объекта в бакете: products/uuid.jpg. */
  key: string
  /** Ссылка для превью. */
  url: string
  /**
   * Загружена в текущем сеансе и ещё не сохранена с товаром.
   * Только такие можно удалять из бакета сразу по кресту.
   */
  unsaved?: boolean
}

interface UploadingFile {
  id: string
  name: string
  percent: number
  error?: string
}

const MAX_FILES = 10

export function ImageGallery({
  items,
  onChange,
  disabled,
}: {
  items: GalleryItem[]
  onChange: (items: GalleryItem[]) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const draggedIndex = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Актуальный список для асинхронной загрузки: она длится секунды, и
  // полагаться на значение из замыкания нельзя.
  const itemsRef = useRef(items)
  itemsRef.current = items

  const upload = useCallback(
    async (files: File[]) => {
      const room = MAX_FILES - items.length
      if (room <= 0) return
      const accepted = files.slice(0, room)

      // Каждый файл грузим отдельно и показываем свой прогресс: при пяти фото
      // по 5 МБ общий индикатор ничего не говорит о том, что происходит.
      const pending: UploadingFile[] = accepted.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        percent: 0,
      }))
      setUploading((prev) => [...prev, ...pending])

      // allSettled, а не all: отказ одного файла не должен отменять остальные.
      // Результаты собираем по индексу, а не push в порядке завершения, иначе
      // порядок зависел бы от скорости загрузки — а он здесь значимый
      // (первая картинка главная).
      const results = await Promise.allSettled(
        accepted.map(async (file, index) => {
          const entry = pending[index]
          const result = await uploadImage(file, (percent) => {
            setUploading((prev) => prev.map((u) => (u.id === entry.id ? { ...u, percent } : u)))
          })
          return { key: result.objectName, url: result.url, unsaved: true } as GalleryItem
        }),
      )

      const uploaded: GalleryItem[] = []
      results.forEach((result, index) => {
        const entry = pending[index]
        if (result.status === 'fulfilled') {
          uploaded.push(result.value)
          setUploading((prev) => prev.filter((u) => u.id !== entry.id))
        } else {
          // Отказ оставляем на экране с причиной: молча пропавший файл
          // админ воспримет как «загрузилось».
          const message =
            result.reason instanceof AdminApiError
              ? result.reason.message
              : 'Не удалось загрузить'
          setUploading((prev) =>
            prev.map((u) => (u.id === entry.id ? { ...u, error: message } : u)),
          )
        }
      })

      if (uploaded.length > 0) {
        // itemsRef, а не items из замыкания: пока шла загрузка, список мог
        // измениться (например, админ убрал другую картинку), и items здесь
        // уже устарел — изменение бы потерялось.
        onChange([...itemsRef.current, ...uploaded])
      }
    },
    [items.length, onChange],
  )

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) void upload(files)
    // Сбрасываем, иначе повторный выбор того же файла не вызовет change.
    event.target.value = ''
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setDragOver(false)
    if (disabled) return
    const files = Array.from(event.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/'),
    )
    if (files.length > 0) void upload(files)
  }

  async function remove(index: number) {
    const item = items[index]
    onChange(items.filter((_, i) => i !== index))

    if (item.unsaved) {
      // Файл ещё не привязан к товару — убираем из бакета сразу.
      // Ошибку не показываем: список уже изменён, а потерянный файл подчистит
      // ревизия сирот на бэкенде.
      try {
        await deleteUnsavedImage(item.key)
      } catch {
        /* подчистится ревизией сирот */
      }
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  /** Делает картинку главной: просто переносит её в начало списка. */
  function makeMain(index: number) {
    move(index, 0)
  }

  const full = items.length >= MAX_FILES

  return (
    <div>
      {/* Зона загрузки */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
          (disabled || full) && 'opacity-60',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          // Атрибут capture здесь НЕ нужен. С capture="environment" телефон
          // открывал камеру сразу, минуя выбор, и загрузить уже снятое фото из
          // галереи было невозможно. Без него Android и iOS сами показывают
          // меню «Камера / Галерея / Файлы» — сфотографировать по-прежнему
          // можно, но это выбор владельца, а не навязанный путь.
          onChange={handleSelect}
          disabled={disabled || full}
          className="hidden"
          id="gallery-file-input"
        />

        <p className="text-sm text-gray-600">
          Перетащите фотографии сюда или
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-2"
          disabled={disabled || full}
          onClick={() => inputRef.current?.click()}
        >
          <PlusIcon className="h-4 w-4" />
          Выбрать файлы
        </Button>
        <p className="mt-2 text-xs text-gray-500">
          JPG, PNG или WebP, до 5 МБ. Не больше {MAX_FILES} фотографий.
          {full && ' Достигнут предел.'}
        </p>
      </div>

      {/* Прогресс загрузки */}
      {uploading.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploading.map((file) => (
            <li key={file.id} className="rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-gray-700">{file.name}</span>
                {file.error ? (
                  <button
                    type="button"
                    onClick={() => setUploading((prev) => prev.filter((u) => u.id !== file.id))}
                    className="shrink-0 cursor-pointer text-xs text-gray-500 underline"
                  >
                    Скрыть
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-gray-500">{file.percent}%</span>
                )}
              </div>
              {file.error ? (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {file.error}
                </p>
              ) : (
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-valuenow={file.percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Загрузка ${file.name}`}
                >
                  <div
                    className="h-full rounded-full bg-primary-600 transition-[width]"
                    style={{ width: `${file.percent}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Список картинок */}
      {items.length > 0 && (
        <>
          <p className="mt-4 mb-2 text-xs text-gray-500">
            Первая фотография — главная, она показывается в каталоге. Порядок можно
            менять перетаскиванием или кнопками.
          </p>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.key}
                draggable={!disabled}
                onDragStart={() => {
                  draggedIndex.current = index
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (draggedIndex.current !== null && draggedIndex.current !== index) {
                    move(draggedIndex.current, index)
                  }
                  draggedIndex.current = null
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-white p-2',
                  index === 0 ? 'border-primary-300' : 'border-gray-200',
                )}
              >
                {/* Превью. unoptimized: картинка только что загружена, и
                    оптимизатор Next ещё не может её забрать — отдаём напрямую. */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={item.url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {index === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                      <StarIcon className="h-3 w-3" filled />
                      Главная
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeMain(index)}
                      disabled={disabled}
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1 text-xs text-gray-600 underline disabled:pointer-events-none"
                    >
                      <StarIcon className="h-3 w-3" />
                      Сделать главной
                    </button>
                  )}
                  <p className="mt-0.5 truncate text-xs text-gray-400">{item.key}</p>
                </div>

                {/* Кнопки порядка: обязательная альтернатива перетаскиванию */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={disabled || index === 0}
                    aria-label={`Переместить вверх: позиция ${index + 1}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={disabled || index === items.length - 1}
                    aria-label={`Переместить вниз: позиция ${index + 1}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(index)}
                    disabled={disabled}
                    aria-label={`Убрать фотографию ${index + 1}`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:pointer-events-none disabled:opacity-30"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
