/**
 * @file: admin/types.ts
 * @description: Типы админского API.
 *
 * Отдельно от `lib/types/index.ts`: витрина и админка получают товар РАЗНЫМИ
 * эндпоинтами и в разной форме. Самое заметное различие — галерея:
 * у витрины `additionalImages: string[]` (только готовые ссылки),
 * у админки `AdminProductImage[]` — пары «ключ + URL». Ключ нужен, чтобы
 * сервер понял, какие файлы остались, а какие удалить из бакета; по одному
 * URL он этого сделать не может.
 *
 * @created: 2026-10-02
 */

/** Ответ POST /api/v1/auth/login. */
export interface AdminLoginResult {
  token: string
  userId?: number
  username?: string
  email?: string
  /** ROLE_ADMIN / ROLE_USER. Нужны, чтобы не рисовать админку покупателю. */
  roles?: string[]
}

/** Одна картинка галереи. */
export interface AdminProductImage {
  /** Ключ объекта в бакете: products/uuid.jpg. Его форма отправляет обратно. */
  key: string
  /** Готовая ссылка для превью. Только на чтение — сервер собирает её сам. */
  url: string
}

export interface AdminProductDTO {
  id: number
  name: string
  description: string | null
  price: number
  discountedPrice: number | null
  categoryId: number | null
  categoryName: string | null
  /** Готовая ссылка на главную картинку. */
  imageUrl: string | null
  /** Ключ главной картинки — его отправляем при сохранении. */
  imageKey: string | null
  additionalImages: AdminProductImage[]
  weight: number | null
  isAvailable: boolean
  isSpecialOffer: boolean
  isPreorder: boolean
  discountPercent: number | null
}

export interface AdminProductPage {
  content: AdminProductDTO[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

/**
 * Тело запроса на сохранение товара.
 *
 * `imageKey` различает три состояния, и это важно не перепутать:
 *   undefined — поле не передаём, картинку не меняем;
 *   ''        — снять картинку (файл удалится из бакета);
 *   'products/...' — поставить эту картинку.
 */
export interface UpdateProductBody {
  name: string
  description?: string | null
  price: number
  discountedPrice?: number | null
  categoryId: number
  imageKey?: string
  /** Галерея целиком, в нужном порядке. Чего нет в списке — удалится. */
  additionalImages?: { key: string }[]
  weight?: number | null
  isAvailable?: boolean
  isSpecialOffer?: boolean
  isPreorder?: boolean
  discountPercent?: number | null
}

export type CreateProductBody = UpdateProductBody

/** Ответ POST /api/v1/admin/upload. */
export interface UploadResult {
  /** Ключ в бакете — сохраняем в форме и отправляем с товаром. */
  objectName: string
  /** Постоянная публичная ссылка для превью. */
  url: string
}

/** Ответ GET /api/v1/admin/stats. */
export interface AdminStats {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalCategories: number
  ordersToday: number
  revenueToday: number
  popularProducts: {
    productId: number
    productName: string
    totalSold: number
    totalRevenue: number
  }[]
  orderStatusStats: Record<string, number>
}
