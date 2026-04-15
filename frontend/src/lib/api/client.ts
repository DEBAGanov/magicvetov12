/**
 * @file: api/client.ts
 * @description: Base fetch wrapper for API communication with session and auth support
 * @dependencies: types/index.ts
 * @created: 2026-04-15
 */

import type { CartDTO, AddToCartRequest, UpdateCartItemRequest } from "@/lib/types";

const API_BASE = "/api/v1";
const INTERNAL_API_BASE = process.env.INTERNAL_API_URL
  ? `${process.env.INTERNAL_API_URL}/api/v1`
  : API_BASE;

function getBaseUrl(): string {
  if (typeof window === "undefined") return INTERNAL_API_BASE;
  return API_BASE;
}

function getSessionId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/CART_SESSION_ID=([^;]+)/);
  if (match) return match[1];
  const id = "mc_" + crypto.randomUUID();
  document.cookie = `CART_SESSION_ID=${id}; max-age=${30 * 24 * 3600}; path=/; samesite=lax`;
  return id;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mc_token");
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  session?: boolean;
}

async function apiRequest<T>(pathOrMethod: string, pathOrOptions?: string | RequestOptions, maybeOptions?: RequestOptions): Promise<T> {
  let method: string;
  let path: string;
  let options: RequestOptions = {};

  if (pathOrOptions === undefined || typeof pathOrOptions === 'object') {
    method = "GET";
    path = pathOrMethod;
    options = (pathOrOptions as RequestOptions) || {};
  } else {
    method = pathOrMethod;
    path = pathOrOptions as string;
    options = maybeOptions || {};
  }


  const { body, auth = false, session = true, ...init } = options;

  const headers: Record<string, string> = {};
  if (body) headers["Content-Type"] = "application/json";
  if (session) headers["X-Session-Id"] = getSessionId();
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  if (res.status === 204) return null as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// Products
export const productsApi = {
  getAll: (page = 0, size = 20) =>
    apiRequest<import("@/lib/types").ProductPage>(`/products?page=${page}&size=${size}`),
  getById: (id: number) =>
    apiRequest<import("@/lib/types").ProductDTO>(`/products/${id}`),
  getByCategory: (categoryId: number, page = 0, size = 20) =>
    apiRequest<import("@/lib/types").ProductPage>(`/products/category/${categoryId}?page=${page}&size=${size}`),
  getSpecialOffers: () =>
    apiRequest<import("@/lib/types").ProductDTO[]>("/products/special-offers"),
  search: (query: string, categoryId?: number, page = 0, size = 20) => {
    let url = `/products/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return apiRequest<import("@/lib/types").ProductPage>(url);
  },
};

// Categories
export const categoriesApi = {
  getAll: () => apiRequest<import("@/lib/types").CategoryDTO[]>("/categories"),
  getById: (id: number) => apiRequest<import("@/lib/types").CategoryDTO>(`/categories/${id}`),
};

// Cart
export const cartApi = {
  get: () => apiRequest<CartDTO>("/cart"),
  addItem: (data: AddToCartRequest) => apiRequest<CartDTO>("/cart/items", { method: "POST", body: data }),
  updateItem: (productId: number, data: UpdateCartItemRequest) =>
    apiRequest<CartDTO>(`/cart/items/${productId}`, { method: "PUT", body: data }),
  removeItem: (productId: number) =>
    apiRequest<CartDTO>(`/cart/items/${productId}`, { method: "DELETE" }),
  clear: () => apiRequest<CartDTO>("/cart", { method: "DELETE" }),
  merge: () => apiRequest<CartDTO>("/cart/merge", { method: "POST", auth: true }),
};

// Orders
export const ordersApi = {
  create: (data: import("@/lib/types").CreateOrderRequest) =>
    apiRequest<import("@/lib/types").OrderDTO>("/orders", { method: "POST", body: data }),
  getById: (id: number) =>
    apiRequest<import("@/lib/types").OrderDTO>(`/orders/${id}`, { auth: true }),
  getPaymentUrl: (id: number) =>
    apiRequest<import("@/lib/types").PaymentUrlResponse>(`/orders/${id}/payment-url`, { auth: true }),
  getUserOrders: (page = 0, size = 10) =>
    apiRequest<import("@/lib/types").OrderPage>(`/orders?page=${page}&size=${size}`, { auth: true }),
};

// Auth
export const authApi = {
  login: (data: import("@/lib/types").AuthRequest) =>
    apiRequest<import("@/lib/types").AuthResponse>("/auth/login", { method: "POST", body: data, session: false }),
  register: (data: import("@/lib/types").RegisterRequest) =>
    apiRequest<import("@/lib/types").AuthResponse>("/auth/register", { method: "POST", body: data, session: false }),
  sendSmsCode: (data: import("@/lib/types").SendSmsCodeRequest) =>
    apiRequest<{ requestId: string }>("/auth/sms/send-code", { method: "POST", body: data, session: false }),
  verifySmsCode: (data: import("@/lib/types").VerifySmsCodeRequest) =>
    apiRequest<import("@/lib/types").AuthResponse>("/auth/sms/verify-code", { method: "POST", body: data, session: false }),
};

// Delivery
export const deliveryApi = {
  getAddressSuggestions: (query: string) =>
    apiRequest<import("@/lib/types").AddressSuggestion[]>(`/delivery/address-suggestions?query=${encodeURIComponent(query)}`),
  getLocations: () =>
    apiRequest<import("@/lib/types").DeliveryLocationDTO[]>("/delivery/locations"),
};
