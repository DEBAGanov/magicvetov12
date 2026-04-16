/**
 * @file: app/checkout/page.tsx
 * @description: Multi-step checkout: delivery, address, contacts, payment
 * @created: 2026-04-15
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cartApi, ordersApi, deliveryApi } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import type { CartDTO, AddressSuggestion, PaymentMethod } from "@/lib/types";

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const [cart, setCart] = useState<CartDTO | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const [deliveryType, setDeliveryType] = useState("COURIER");
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  useEffect(() => {
    cartApi.get().then(setCart).catch(() => {});
  }, []);

  // Address autocomplete
  useEffect(() => {
    if (address.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      deliveryApi.getAddressSuggestions(address).then(setSuggestions).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [address]);

  const totalAmount = cart?.totalAmount || 0;

  const submitOrder = async () => {
    if (!contactName || !contactPhone) return;
    if (deliveryType === "COURIER" && !address) return;

    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        deliveryType: deliveryType === "COURIER" ? "Доставка курьером" : "Самовывоз",
        deliveryAddress: deliveryType === "COURIER" ? address : "Самовывоз",
        deliveryLocationId: deliveryType === "PICKUP" ? 1 : undefined,
        contactName,
        contactPhone: contactPhone.replace(/\D/g, ""),
        paymentMethod,
        comment: comment || undefined,
      });

      setOrderId(order.id);

      if ((paymentMethod === "SBP" || paymentMethod === "BANK_CARD") && order.id) {
        try {
          const payment = await ordersApi.getPaymentUrl(order.id);
          const url = payment?.paymentUrl || payment?.confirmationUrl;
          if (url) { window.location.href = url; return; }
        } catch { /* continue to success screen */ }
      }
    } catch (e: unknown) {
      toast.show(e instanceof Error ? e.message : "Ошибка при оформлении заказа", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (orderId && paymentMethod === "CASH") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2">Заказ оформлен!</h2>
        <p className="text-gray-500 mb-1">Номер заказа: <strong>#{orderId}</strong></p>
        <p className="text-gray-400 mb-6">Мы свяжемся с вами для подтверждения</p>
        <Link href="/" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          На главную
        </Link>
      </div>
    );
  }

  if (!cart?.items?.length) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-400 mb-4">Корзина пуста</p>
        <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold">Перейти в каталог</Link>
      </div>
    );
  }

  const steps = ["Доставка", "Адрес", "Контакты", "Оплата"];

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-500">Главная</Link><span>/</span>
        <Link href="/cart" className="hover:text-primary-500">Корзина</Link><span>/</span>
        <span className="text-gray-700">Оформление</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-primary-500" : "bg-gray-200"}`} title={s} />
        ))}
      </div>

      {/* Step 0: Delivery type */}
      {step === 0 && (
        <div>
          <h3 className="font-bold mb-4">Способ получения</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setDeliveryType("COURIER")} className={`p-4 rounded-xl border-2 text-center transition-colors ${deliveryType === "COURIER" ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
              <div className="font-semibold">🚗 Доставка</div>
              <div className="text-xs text-gray-500 mt-1">Курьер привезёт к двери</div>
            </button>
            <button onClick={() => setDeliveryType("PICKUP")} className={`p-4 rounded-xl border-2 text-center transition-colors ${deliveryType === "PICKUP" ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
              <div className="font-semibold">🏪 Самовывоз</div>
              <div className="text-xs text-gray-500 mt-1">Заберите сами</div>
            </button>
          </div>
          <button onClick={() => setStep(1)} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">Далее</button>
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div>
          <h3 className="font-bold mb-4">Адрес доставки</h3>
          {deliveryType === "COURIER" ? (
            <div className="relative mb-6">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Улица, дом, квартира"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 max-h-48 overflow-y-auto z-10">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => { setAddress(s.value); setSuggestions([]); }} className="block w-full text-left px-4 py-2 text-sm hover:bg-primary-50">
                      {s.value}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-6">Вы заберете заказ самостоятельно</p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50">Назад</button>
            <button onClick={() => setStep(2)} className="flex-1 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">Далее</button>
          </div>
        </div>
      )}

      {/* Step 2: Contacts */}
      {step === 2 && (
        <div>
          <h3 className="font-bold mb-4">Контактные данные</h3>
          <div className="space-y-3 mb-6">
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ваше имя" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none" />
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+7 (___) ___-__-__" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none" />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий (необязательно)" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50">Назад</button>
            <button onClick={() => contactName && contactPhone ? setStep(3) : undefined} className="flex-1 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50" disabled={!contactName || !contactPhone}>Далее</button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <div>
          <h3 className="font-bold mb-4">Способ оплаты</h3>
          <div className="space-y-2 mb-4">
            {[
              { value: "CASH" as PaymentMethod, label: "💵 Наличные", desc: "При получении" },
              { value: "BANK_CARD" as PaymentMethod, label: "💳 Картой онлайн", desc: "СБП или карта" },
              { value: "SBP" as PaymentMethod, label: "🏦 СБП", desc: "Система быстрых платежей" },
            ].map((opt) => (
              <button key={opt.value} onClick={() => setPaymentMethod(opt.value)} className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${paymentMethod === opt.value ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
                <div className="text-left">
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between font-bold text-lg">
              <span>Итого</span>
              <span className="text-primary-500">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50">Назад</button>
            <button onClick={submitOrder} disabled={submitting} className="flex-1 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50">
              {submitting ? "Оформляем..." : `Оплатить ${formatPrice(totalAmount)}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
