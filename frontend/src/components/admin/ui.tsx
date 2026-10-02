/**
 * @file: admin/ui.tsx
 * @description: Мелкие общие части экранов админки.
 *
 * Здесь то, что повторяется на каждом экране: заголовок, состояния
 * «загружается» / «пусто» / «ошибка», пагинация, поля ввода. Отдельный файл,
 * чтобы экраны занимались своим делом, а не рамкой.
 *
 * Все интерактивные элементы — не меньше 44 px по высоте: админка нужна
 * владельцу магазина с телефона, а мелкие кнопки пальцем не попадаются.
 *
 * @created: 2026-10-02
 */
'use client'

import { cn } from '@/lib/utils'

/** Заголовок экрана с местом под кнопки справа. */
export function PageHeader({
  title,
  count,
  children,
}: {
  title: string
  /** Число записей рядом с заголовком — сразу виден масштаб. */
  count?: number
  children?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
        {title}
        {count !== undefined && (
          <span className="ml-2 text-base font-normal text-gray-500">{count}</span>
        )}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}

/**
 * Заглушка на время загрузки.
 *
 * Силуэт строк, а не крутящийся кружок: место под содержимое резервируется
 * заранее, и страница не прыгает, когда данные приходят (CLS).
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  )
}

/** Пустой список — с объяснением и, если есть, действием. */
export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
      <p className="text-base font-medium text-gray-900">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">{hint}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  )
}

/**
 * Ошибка запроса.
 *
 * role="alert" — чтобы экранный диктор прочитал сообщение сразу, а не только
 * показал красную рамку. Текст берём с бэкенда: он объясняет причину по-русски.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 min-h-11 cursor-pointer text-sm font-medium text-red-700 underline"
        >
          Повторить
        </button>
      )}
    </div>
  )
}

/** Постраничная навигация. */
export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
}: {
  page: number
  totalPages: number
  totalElements: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const buttonClass =
    'flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40'

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">
        Страница {page + 1} из {totalPages}
        <span className="hidden sm:inline"> · всего {totalElements}</span>
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page === 0}
          aria-label="Предыдущая страница"
          className={buttonClass}
        >
          <ChevronLeftIcon />
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page + 1 >= totalPages}
          aria-label="Следующая страница"
          className={buttonClass}
        >
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}

/**
 * Обёртка поля ввода.
 *
 * Подсказка и ошибка стоят рядом с полем и связаны через aria-describedby:
 * общий список ошибок сверху не говорит, к какому полю относится сообщение.
 */
export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-gray-900">
          {label}
          {required && (
            <span className="ml-0.5 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={htmlFor && `${htmlFor}-hint`} className="mt-1 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={htmlFor && `${htmlFor}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Сводка ошибок над формой (WCAG 2.2: Focusable Error Summary).
 *
 * Дополняет ошибки у полей, а не заменяет их: по ссылке можно сразу перейти к
 * проблемному полю, что на длинной форме с телефона экономит много прокрутки.
 */
export function ErrorSummary({ errors }: { errors: Record<string, string> }) {
  const entries = Object.entries(errors)
  if (entries.length === 0) return null

  return (
    <div
      role="alert"
      tabIndex={-1}
      aria-labelledby="form-error-title"
      className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3"
    >
      <h2 id="form-error-title" className="text-sm font-semibold text-red-700">
        Не удалось сохранить: проверьте поля
      </h2>
      <ul className="mt-2 space-y-1">
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`} className="text-sm text-red-700 underline">
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Общие классы полей — чтобы вид не разъезжался по экранам. */
export const inputClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-200 disabled:opacity-50'

export const selectClass = cn(inputClass, 'cursor-pointer')

export const textareaClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-200 disabled:opacity-50'

/** Кнопка. primary — основное действие, остальные — вспомогательные. */
export function Button({
  variant = 'secondary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 border-transparent',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300',
    danger: 'bg-white text-red-700 hover:bg-red-50 border-red-300',
  }

  return (
    <button
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * Метка доступности товара.
 *
 * Состояние передаётся и цветом, и текстом: по одному цвету его не различить
 * при цветовой слепоте (WCAG 1.4.1). Каждый вариант использует свой оттенок
 * фона и текста из одного семейства — серый текст на цветном фоне выглядит
 * выцветшим.
 */
export function AvailabilityBadge({ available }: { available: boolean }) {
  const styles = available
    ? 'bg-green-100 text-green-800'
    : 'bg-slate-200 text-slate-800'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        styles,
      )}
    >
      {available ? 'В продаже' : 'Снят'}
    </span>
  )
}

// ---------- Иконки ----------
// Инлайновые SVG, а не emoji и не иконочный шрифт: emoji выглядят по-разному
// на разных системах, шрифт — лишняя загрузка ради десяти значков.

export function ChevronLeftIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L9.06 10l3.71 3.71a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.08.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L10.94 10 7.23 6.29a.75.75 0 111.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.08-.02z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 5a.75.75 0 01.75.75v3.5h3.5a.75.75 0 010 1.5h-3.5v3.5a.75.75 0 01-1.5 0v-3.5h-3.5a.75.75 0 010-1.5h3.5v-3.5A.75.75 0 0110 5z" />
    </svg>
  )
}

export function TrashIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.75 1h2.5a1 1 0 011 1v1h3.25a.75.75 0 010 1.5h-.564l-.82 11.07A2.25 2.25 0 0111.873 18H8.127a2.25 2.25 0 01-2.243-2.43L5.064 4.5H4.5a.75.75 0 010-1.5h3.25V2a1 1 0 011-1zm-.5 6a.75.75 0 011.5 0v6a.75.75 0 01-1.5 0V7zm3.5-.75a.75.75 0 00-.75.75v6a.75.75 0 001.5 0V7a.75.75 0 00-.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ArrowUpIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 17a.75.75 0 01-.75-.75V5.56L5.3 9.51a.75.75 0 11-1.06-1.06l5.23-5.23a.75.75 0 011.06 0l5.23 5.23a.75.75 0 11-1.06 1.06l-3.95-3.95v10.69A.75.75 0 0110 17z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function ArrowDownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.69l3.95-3.95a.75.75 0 111.06 1.06l-5.23 5.23a.75.75 0 01-1.06 0l-5.23-5.23a.75.75 0 111.06-1.06l3.95 3.95V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function StarIcon({
  className = 'h-4 w-4',
  filled = false,
}: {
  className?: string
  filled?: boolean
}) {
  return filled ? (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.78L10 14.77l-5.2 2.73.99-5.78-4.21-4.1 5.82-.85L10 1.5z" />
    </svg>
  ) : (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M10 2.6l2.35 4.76 5.26.77-3.8 3.7.9 5.22L10 14.57l-4.7 2.48.9-5.22-3.81-3.7 5.26-.77L10 2.6z" />
    </svg>
  )
}
