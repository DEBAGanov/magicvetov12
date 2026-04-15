/**
 * @file: app/account/orders/[orderId]/page.tsx
 * @description: Order detail page with payment button for unpaid orders
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.orderId);
  const { isAuthenticated, restoreSession } = useAuthStore();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isAuthenticated || !orderId) return;
    ordersApi
      .getById(orderId)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [isAuthenticated, orderId]);

  const handlePay = async () => {
    if (!order) return;
    setPaying(true);
    try {
      const payment = await ordersApi.getPaymentUrl(order.id);
      const url = payment?.paymentUrl || payment?.confirmationUrl;
      if (url) window.location.href = url;
    } catch {
      alert("Не удалось получить ссылку на оплату");
    } finally {
      setPaying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">Войдите в аккаунт</h2>
        <Link href="/account/login" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Войти
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-gray-400 mb-4">Заказ не найден</p>
        <Link href="/account/orders" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Мои заказы
        </Link>
      </div>
    );
  }

  const canPay = order.status === "PENDING" || order.status === "CONFIRMED";

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-500">Главная</Link><span>/</span>
        <Link href="/account" className="hover:text-primary-500">Кабинет</Link><span>/</span>
        <Link href="/account/orders" className="hover:text-primary-500">Заказы</Link><span>/</span>
        <span className="text-gray-700">#{order.id}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Заказ #{order.id}</h1>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColor[order.status] || "bg-gray-100 text-gray-600"}`}>
          {order.statusDescription || order.status}
        </span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400 mb-0.5">Дата</div>
            <div className="font-medium">
              {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Доставка</div>
            <div className="font-medium">{order.deliveryType}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Получатель</div>
            <div className="font-medium">{order.contactName}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Телефон</div>
            <div className="font-medium">{order.contactPhone}</div>
          </div>
        </div>
        {order.deliveryAddress && (
          <div className="text-sm">
            <div className="text-gray-400 mb-0.5">Адрес</div>
            <div className="font-medium">{order.deliveryAddress}</div>
          </div>
        )}
        {order.comment && (
          <div className="text-sm">
            <div className="text-gray-400 mb-0.5">Комментарий</div>
            <div className="font-medium">{order.comment}</div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="font-semibold mb-3">Товары</div>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-3">
              <div className="shrink-0">
                {item.productImageUrl ? (
                  <Image src={item.productImageUrl} alt={item.productName} width={60} height={60} className="rounded-lg object-cover" />
                ) : (
                  <div className="w-[60px] h-[60px] bg-gray-100 rounded-lg flex items-center justify-center text-xl">🌸</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm line-clamp-1">{item.productName}</div>
                <div className="text-xs text-gray-400">
                  {item.quantity} x {formatPrice(item.price)}
                </div>
              </div>
              <div className="font-semibold text-sm text-primary-500">{formatPrice(item.subtotal)}</div>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-bold">
          <span>Итого</span>
          <span className="text-primary-500">{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {/* Pay button */}
      {canPay && (
        <button
          onClick={handlePay}
          disabled={paying}
          className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50"
        >
          {paying ? "Перенаправляем..." : `Оплатить ${formatPrice(order.totalAmount)}`}
        </button>
      )}
    </div>
  );
}
