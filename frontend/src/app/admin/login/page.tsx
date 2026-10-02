/**
 * @file: admin/login/page.tsx
 * @description: Вход в админку.
 *
 * Не обёрнут в AdminShell: каркас уводит на вход того, у кого нет прав, и
 * обёртка дала бы цикл.
 *
 * @created: 2026-10-02
 */
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { AdminApiError, login } from '@/lib/admin/api'
import { Button, Field, inputClass } from '@/components/admin/ui'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)

    try {
      await login(username, password)
      // Возвращаем туда, куда админ шёл до того, как его увели на вход.
      // Проверяем, что это внутренний путь: внешний адрес в параметре — это
      // открытый редирект, которым можно уводить на фишинговую страницу.
      const from = searchParams.get('from')
      const target = from && from.startsWith('/admin') ? from : '/admin'
      router.replace(target)
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Не удалось войти, попробуйте ещё раз',
      )
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6"
      >
        <h1 className="text-xl font-semibold text-gray-900">Вход в админку</h1>
        <p className="mt-1 text-sm text-gray-500">Магия Цветов</p>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 space-y-4">
          <Field label="Имя пользователя" htmlFor="username" required>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Пароль" htmlFor="password" required>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Button type="submit" variant="primary" disabled={busy} className="mt-6 w-full">
          {busy ? 'Проверяем…' : 'Войти'}
        </Button>
      </form>
    </div>
  )
}

export default function LoginPage() {
  // useSearchParams требует Suspense при статической генерации страницы.
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-500">Загрузка…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
