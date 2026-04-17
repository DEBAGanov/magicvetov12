/**
 * @file: app/cart/page.tsx
 * @description: Cart page with items, quantity controls, totals
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cartApi } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import type { CartDTO, CartItemDTO } from "@/lib/types";

export default function CartPage() {
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchCartStore = useCartStore((s) => s.fetchCart);

  const fetchCart = async () => {
    try {
      const data = await cartApi.get();
      setCart(data);
      fetchCartStore();
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (productId: number, qty: number) => {
    if (qty <= 0) {
      await cartApi.removeItem(productId);
    } else {
      await cartApi.updateItem(productId, { quantity: qty });
    }
    fetchCart();
  };

  const removeItem = async (productId: number) => {
    await cartApi.removeItem(productId);
    fetchCart();
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка корзины...</div>;
  }

  if (!cart || !cart.items?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-2">Корзина пуста</h2>
        <p className="text-gray-400 mb-6">Добавьте красивый букет из нашего каталога</p>
        <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-500">Главная</Link><span>/</span>
        <span className="text-gray-700">Корзина</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Корзина ({cart.items.length})</h1>

      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        {/* Items */}
        <div className="space-y-4">
          {cart.items.map((item: CartItemDTO) => (
            <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
              <Link href={`/catalog/0/${item.productId}`} className="shrink-0">
                {item.productImageUrl ? (
                  <Image src={item.productImageUrl} alt={item.productName} width={90} height={90} className="rounded-lg object-cover" />
                ) : (
                  <div className="w-[90px] h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-3xl">🌸</div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/catalog/0/${item.productId}`} className="font-semibold text-sm hover:text-primary-500 line-clamp-1">
                  {item.productName}
                </Link>
                <div className="text-primary-500 font-bold mt-1">{formatPrice(item.subtotal)}</div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:border-primary-300">−</button>
                  <span className="font-semibold w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-lg hover:border-primary-300">+</button>
                </div>
              </div>
              <button onClick={() => removeItem(item.productId)} className="text-gray-300 hover:text-red-500 text-sm self-start">✕</button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-xl p-6 h-fit sticky top-24">
          <h3 className="font-bold mb-4">Итого</h3>
          <div className="flex justify-between text-sm py-2">
            <span>Товары ({cart.items.length})</span>
            <span>{formatPrice(cart.totalAmount)}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span>Доставка</span>
            <span className="text-secondary-500">Бесплатно</span>
          </div>
          <div className="border-t mt-2 pt-3 flex justify-between font-bold text-lg">
            <span>К оплате</span>
            <span>{formatPrice(cart.totalAmount)}</span>
          </div>
          <Link href="/checkout" className="block mt-4 px-6 py-3 bg-primary-500 text-white rounded-full font-semibold text-center hover:bg-primary-600 transition-colors">
            Оформить заказ
          </Link>
        </div>
      </div>
    </div>
  );
}
