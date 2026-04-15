/**
 * @file: store/cart-store.ts
 * @description: Zustand store for shopping cart state management
 * @dependencies: api/client.ts, types/index.ts
 * @created: 2026-04-15
 */

import { create } from "zustand";
import { cartApi } from "@/lib/api/client";
import type { CartDTO, CartItemDTO } from "@/lib/types";

interface CartState {
  items: CartItemDTO[];
  totalAmount: number;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: () => number;
}

function setCart(state: CartState, cart: CartDTO): Partial<CartState> {
  return {
    items: cart.items || [],
    totalAmount: cart.totalAmount || 0,
    isLoading: false,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const cart = await cartApi.get();
      set(setCart(get(), cart));
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1) => {
    try {
      const cart = await cartApi.addItem({ productId, quantity });
      set(setCart(get(), cart));
    } catch (e) {
      throw e;
    }
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      return get().removeItem(productId);
    }
    try {
      const cart = await cartApi.updateItem(productId, { quantity });
      set(setCart(get(), cart));
    } catch (e) {
      throw e;
    }
  },

  removeItem: async (productId) => {
    try {
      const cart = await cartApi.removeItem(productId);
      set(setCart(get(), cart));
    } catch (e) {
      throw e;
    }
  },

  clearCart: async () => {
    try {
      await cartApi.clear();
      set({ items: [], totalAmount: 0 });
    } catch (e) {
      throw e;
    }
  },

  itemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
