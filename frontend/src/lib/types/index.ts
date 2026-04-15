/**
 * @file: types/index.ts
 * @description: Re-exports all TypeScript type definitions for API DTOs
 * @dependencies: none
 * @created: 2026-04-15
 */

// Product
export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  discountedPrice: number | null;
  categoryId: number;
  categoryName: string;
  imageUrl: string;
  additionalImages?: string[];
  weight?: number;
  isAvailable: boolean;
  isSpecialOffer: boolean;
  isPreorder: boolean;
  discountPercent: number | null;
}

export interface ProductPage {
  content: ProductDTO[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Category
export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  displayOrder: number;
}

// Cart
export interface CartDTO {
  id: number;
  sessionId: string;
  totalAmount: number;
  items: CartItemDTO[];
}

export interface CartItemDTO {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  price: number;
  discountedPrice: number | null;
  quantity: number;
  subtotal: number;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Order
export type PaymentMethod = "CASH" | "SBP" | "BANK_CARD" | "YOOKASSA";

export interface OrderDTO {
  id: number;
  status: string;
  statusDescription: string;
  deliveryLocationId: number | null;
  deliveryLocationName: string | null;
  deliveryLocationAddress: string | null;
  deliveryAddress: string | null;
  totalAmount: number;
  deliveryCost: number | null;
  deliveryType: string;
  comment: string | null;
  contactName: string;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
}

export interface OrderItemDTO {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateOrderRequest {
  deliveryLocationId?: number;
  deliveryAddress?: string;
  deliveryType: string;
  comment?: string;
  contactName: string;
  contactPhone: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentUrlResponse {
  paymentUrl: string;
  confirmationUrl?: string;
}

// Auth
export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface SendSmsCodeRequest {
  phoneNumber: string;
}

export interface VerifySmsCodeRequest {
  phoneNumber: string;
  code: string;
}

// Delivery
export interface AddressSuggestion {
  value: string;
  unrestrictedValue?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

export interface DeliveryLocationDTO {
  id: number;
  name: string;
  address: string;
  description?: string;
}

// User profile
export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
}
