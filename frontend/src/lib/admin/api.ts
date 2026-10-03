/**
 * @file: admin/api.ts
 * @description: Клиент админского API.
 *
 * Отдельно от `lib/api/client.ts`: тот работает и на сервере, и без токена,
 * и ведёт корзину по cookie. Здесь каждый запрос идёт от имени администратора
 * и только из браузера.
 *
 * Токен в localStorage — тот же ключ `mc_token`, что у витрины: бэкенд выдаёт
 * один JWT на оба случая, и держать две копии одной сессии значило бы, что
 * выход в одном месте не выходит в другом. httpOnly-кука была бы надёжнее
 * против XSS, но требует общего домена фронта и API, а в dev они разные
 * (localhost:3000 и localhost:8080).
 *
 * @created: 2026-10-02
 */
'use client'

import type {
  AdminCategoryDTO,
  AdminLoginResult,
  AdminProductDTO,
  AdminProductPage,
  AdminStats,
  CreateProductBody,
  SaveCategoryBody,
  UpdateProductBody,
  UploadResult,
} from './types'

/** Те же ключи, что у витрины — сессия одна. */
const TOKEN_KEY = 'mc_token'
const USER_KEY = 'mc_admin_user'

const ADMIN_ROLE = 'ROLE_ADMIN'

/**
 * База API.
 *
 * В dev NEXT_PUBLIC_API_URL = http://localhost:8080 (бэкенд на другом порту),
 * в прод пусто — фронт и API на одном домене за nginx.
 */
function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
}

// ---------- Сессия ----------

export interface AdminUser {
  username: string
  email?: string
  roles: string[]
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AdminUser | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AdminUser
    // roles могли не прийти со старой версии бэкенда — приводим к массиву,
    // иначе isAdmin() упадёт на .includes у undefined.
    return { ...parsed, roles: Array.isArray(parsed.roles) ? parsed.roles : [] }
  } catch {
    return null
  }
}

/**
 * Есть ли права администратора.
 *
 * Это ТОЛЬКО для интерфейса: не рисовать меню и не открывать экраны тому, кто
 * не админ. Доступ проверяет бэкенд (SecurityConfig + @PreAuthorize), и
 * подделанный в localStorage список ролей не выполнит ни одного запроса —
 * вернётся 403.
 */
export function isAdmin(): boolean {
  return getUser()?.roles.includes(ADMIN_ROLE) ?? false
}

export function saveSession(token: string, user: AdminUser): void {
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}

// ---------- Ошибки ----------

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'AdminApiError'
  }
}

/** Уводит на вход, если сессия истекла. На самой странице входа — не уводит. */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname.endsWith('/admin/login')) return
  clearSession()
  // Запоминаем, куда админ шёл, чтобы вернуть его туда после входа.
  const from = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.href = `/admin/login?from=${from}`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl()}/api/v1${path}`, { ...options, headers })
  } catch {
    // fetch падает так и при обрыве сети, и при блокировке запроса браузером
    // (CORS). Английское «Failed to fetch» администратору ничего не объясняет.
    throw new AdminApiError('Сервер не отвечает. Проверьте соединение и доступность API', 0)
  }

  if (response.status === 401 || response.status === 403) {
    redirectToLogin()
    throw new AdminApiError('Нет доступа. Войдите заново', response.status)
  }

  if (!response.ok) {
    let message = `Ошибка ${response.status}`
    try {
      const data = await response.json()
      message = data.message || message
    } catch {
      /* тело не JSON — оставляем общий текст */
    }
    throw new AdminApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

// ---------- Вход ----------

export async function login(username: string, password: string): Promise<AdminUser> {
  let response: Response
  try {
    response = await fetch(`${baseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new AdminApiError('Сервер не отвечает. Проверьте соединение', 0)
  }

  if (!response.ok) {
    // 401 здесь — обычная опечатка в пароле, а не истёкшая сессия,
    // поэтому на вход не перенаправляем и сессию не чистим.
    const message =
      response.status === 401
        ? 'Неверное имя пользователя или пароль'
        : `Не удалось войти (ошибка ${response.status})`
    throw new AdminApiError(message, response.status)
  }

  const data: AdminLoginResult = await response.json()
  if (!data.token) {
    throw new AdminApiError('Сервер не вернул токен', 500)
  }

  const user: AdminUser = {
    username: data.username || username,
    email: data.email,
    roles: data.roles ?? [],
  }

  if (!user.roles.includes(ADMIN_ROLE)) {
    // Вход удался, но это обычный покупатель. Токен не сохраняем: иначе он
    // попадёт в localStorage витрины как побочный эффект попытки входа в
    // админку, а экраны всё равно не откроются — бэкенд вернёт 403.
    throw new AdminApiError('У этой учётной записи нет прав администратора', 403)
  }

  saveSession(data.token, user)
  return user
}

export function logout(): void {
  clearSession()
  window.location.href = '/admin/login'
}

// ---------- Товары ----------

export const adminApi = {
  products: {
    list: (params: { page?: number; size?: number; categoryId?: number; query?: string } = {}) => {
      const search = new URLSearchParams()
      search.set('page', String(params.page ?? 0))
      search.set('size', String(params.size ?? 20))
      if (params.categoryId) search.set('categoryId', String(params.categoryId))
      if (params.query?.trim()) search.set('query', params.query.trim())
      return request<AdminProductPage>(`/admin/products?${search.toString()}`)
    },

    get: (id: number) => request<AdminProductDTO>(`/admin/products/${id}`),

    create: (body: CreateProductBody) =>
      request<AdminProductDTO>('/admin/products', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: number, body: UpdateProductBody) =>
      request<AdminProductDTO>(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    remove: (id: number) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  },

  /** Сводка для дашборда. */
  stats: () => request<AdminStats>('/admin/stats'),

  categories: {
    /**
     * Все категории, включая отключённые, с числом товаров.
     *
     * Для выпадающего списка в форме товара тоже берём этот, а не витринный
     * /categories: иначе товар нельзя было бы положить в отключённую
     * категорию — а именно так и готовят раздел к публикации.
     */
    list: () => request<AdminCategoryDTO[]>('/admin/categories'),

    get: (id: number) => request<AdminCategoryDTO>(`/admin/categories/${id}`),

    create: (body: SaveCategoryBody) =>
      request<AdminCategoryDTO>('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: number, body: SaveCategoryBody) =>
      request<AdminCategoryDTO>(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    /**
     * Поменять две категории местами в порядке показа.
     *
     * Отдельная ручка, а не два update: тот принимает полное состояние
     * категории и перезаписывает описание, так что «только переставить» через
     * него стёрло бы описания.
     */
    swapOrder: (id: number, otherId: number) =>
      request<void>(`/admin/categories/${id}/swap-order/${otherId}`, { method: 'POST' }),

    /** Непустая категория не удалится: вернётся 409 с объяснением. */
    remove: (id: number) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
  },
}

// ---------- Файлы ----------

/**
 * Загрузка изображения с прогрессом.
 *
 * Отдельно от `request`, потому что нужен процент загрузки, а `fetch` его не
 * даёт — только XMLHttpRequest. Для фото букета на 5 МБ с телефона это
 * существенно: без прогресса кажется, что форма зависла.
 */
export function uploadImage(
  file: File,
  onProgress?: (percent: number) => void,
  type: 'products' | 'categories' = 'products',
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)
    // Определяет папку в бакете. Бэкенд принимает только эти два значения и
    // отклоняет остальное, а не молча кладёт в products.
    form.append('type', type)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${baseUrl()}/api/v1/admin/upload`)

    const token = getToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 401 || xhr.status === 403) {
        redirectToLogin()
        reject(new AdminApiError('Нет доступа. Войдите заново', xhr.status))
        return
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadResult)
        } catch {
          reject(new AdminApiError('Непонятный ответ сервера', xhr.status))
        }
        return
      }
      // Бэкенд объясняет причину отказа по-русски («Содержимое файла не
      // соответствует формату», «Файл больше 5 МБ») — показываем как есть.
      let message = `Ошибка загрузки (${xhr.status})`
      try {
        message = JSON.parse(xhr.responseText).message || message
      } catch {
        /* тело не JSON */
      }
      reject(new AdminApiError(message, xhr.status))
    })

    xhr.addEventListener('error', () => reject(new AdminApiError('Сеть недоступна', 0)))
    xhr.send(form)
  })
}

/**
 * Удаление файла, который ещё не привязан к товару.
 *
 * Только для отмены загрузки до сохранения карточки. Картинки сохранённого
 * товара удаляет сам сервер при PUT/DELETE — он знает все ключи товара из
 * product_images, и браузеру не нужно ему о них сообщать.
 */
export function deleteUnsavedImage(objectName: string): Promise<void> {
  return request<void>(`/admin/upload?objectName=${encodeURIComponent(objectName)}`, {
    method: 'DELETE',
  })
}
