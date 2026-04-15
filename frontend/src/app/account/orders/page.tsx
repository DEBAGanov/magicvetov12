/**
 * @file: app/account/orders/page.tsx
 * @description: Order history page (auth required)
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth-store";
import { ordersApi } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import type { OrderDTO } from "@/lib/types";

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-purple-100 text-purple-700",
  READY: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { isAuthenticated, restoreSession } = useAuthStore();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isAuthenticated) return;
    ordersApi
      .getUserOrders(page, 10)
      .then((data) => {
        setOrders(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold mb-2">Войдите в аккаунт</h2>
        <p className="text-gray-400 mb-6">Чтобы увидеть свои заказы</p>
        <Link href="/account/login" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-500">Главная</Link><span>/</span>
        <Link href="/account" className="hover:text-primary-500">Кабинет</Link><span>/</span>
        <span className="text-gray-700">Заказы</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Мои заказы</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400 mb-4">У вас пока нет заказов</p>
          <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="block p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">Заказ #{order.id}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[order.status] || "bg-gray-100 text-gray-600"}`}>
                    {order.statusDescription || order.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{order.items.length} товар(ов)</span>
                  <span className="font-bold text-primary-500">{formatPrice(order.totalAmount)}</span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${page === i ? "bg-primary-500 text-white" : "border border-gray-200 text-gray-600 hover:border-primary-300"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
