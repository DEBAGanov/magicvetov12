/**
 * @file: admin/ConfirmDialog.tsx
 * @description: Подтверждение необратимого действия.
 *
 * Своё модальное окно, а не window.confirm: нативный диалог нельзя оформить,
 * он не даёт объяснить последствия («вместе с товаром удалятся и фотографии из
 * хранилища») и по-разному выглядит на телефонах.
 *
 * Фокус переводится на окно при открытии и возвращается на кнопку при закрытии,
 * Esc закрывает — иначе с клавиатуры из окна не выйти.
 *
 * @created: 2026-10-02
 */
'use client'

import { useEffect, useRef } from 'react'
import { Button } from './ui'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    // Запоминаем, откуда пришли, чтобы вернуть фокус после закрытия.
    returnFocusRef.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      returnFocusRef.current?.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      // Клик по затемнению закрывает — привычное поведение. Проверяем target,
      // чтобы клик внутри окна не считался кликом по фону.
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        tabIndex={-1}
        className="w-full max-w-sm rounded-xl bg-white p-5 outline-none"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-gray-900">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-gray-600">
          {message}
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="danger" onClick={onConfirm} disabled={busy} className="flex-1">
            {busy ? 'Удаляем…' : confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={busy} className="flex-1">
            Отмена
          </Button>
        </div>
      </div>
    </div>
  )
}
