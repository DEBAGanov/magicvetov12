/**
 * @file: app/checkout/page.tsx
 * @description: Multi-step checkout: delivery, address, contacts, payment
 * @created: 2026-04-15
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cartApi, ordersApi, deliveryApi } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import { useToast } from "@/components/ui/Toast";
import type { CartDTO, AddressSuggestion, PaymentMethod, DeliveryEstimate } from "@/lib/types";

const STORE_ADDRESS = "ул. Володарского, 5";
const STORE_PHONE = "+7 (964) 861-23-70";

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits.length) return "";
  const d = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  let formatted = "+7";
  if (d.length > 0) formatted += ` (${d.slice(0, 3)}`;
  if (d.length > 3) formatted += `) ${d.slice(3, 6)}`;
  if (d.length > 6) formatted += `-${d.slice(6, 8)}`;
  if (d.length > 8) formatted += `-${d.slice(8, 10)}`;
  return formatted;
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  return d.length === 10;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const addItem = useCartStore((s) => s.addItem);
  const fetchCartStore = useCartStore((s) => s.fetchCart);

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
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(null);
  const [estimatingDelivery, setEstimatingDelivery] = useState(false);

  // Load cart + handle "buy in 1 click" productId param
  useEffect(() => {
    const productId = searchParams.get("productId");
    if (productId) {
      addItem(Number(productId)).then(() => {
        fetchCartStore();
        cartApi.get().then(setCart).catch(() => {});
      }).catch(() => {
        cartApi.get().then(setCart).catch(() => {});
      });
    } else {
      cartApi.get().then((c) => {
        setCart(c);
        if (c?.items?.length) {
          trackBeginCheckout(
            c.items.map((i) => ({ productId: i.productId, name: i.productName, price: i.price, quantity: i.quantity })),
            c.totalAmount
          );
        }
      }).catch(() => {});
    }
  }, [searchParams, addItem, fetchCartStore]);

  // Address autocomplete
  useEffect(() => {
    if (address.length < 3) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      deliveryApi.getAddressSuggestions(address).then(setSuggestions).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [address]);

  // Delivery cost estimation when address changes
  const estimateDeliveryCost = useCallback(async (addr: string, amount: number) => {
    if (addr.length < 5) { setDeliveryEstimate(null); return; }
    setEstimatingDelivery(true);
    try {
      const estimate = await deliveryApi.estimateDelivery(addr, amount);
      setDeliveryEstimate(estimate);
    } catch {
      setDeliveryEstimate(null);
    } finally {
      setEstimatingDelivery(false);
    }
  }, []);

  useEffect(() => {
    if (deliveryType !== "COURIER" || !address) { setDeliveryEstimate(null); return; }
    const timer = setTimeout(() => {
      estimateDeliveryCost(address, cart?.totalAmount || 0);
    }, 500);
    return () => clearTimeout(timer);
  }, [address, deliveryType, cart?.totalAmount, estimateDeliveryCost]);

  const goodsAmount = cart?.totalAmount || 0;
  const deliveryCost = deliveryType === "PICKUP" ? 0 : (deliveryEstimate?.deliveryCost ?? 0);
  const totalAmount = goodsAmount + deliveryCost;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.length === 1 && raw === "8") {
      setContactPhone("+7 (");
      return;
    }
    setContactPhone(formatPhoneInput(raw));
  };

  const submitOrder = async () => {
    if (!contactName || !contactPhone) return;
    if (!isValidPhone(contactPhone)) {
      toast.show("Введите корректный номер телефона", "error");
      return;
    }
    if (deliveryType === "COURIER" && !address) return;

    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        deliveryType: deliveryType === "COURIER" ? "Доставка курьером" : "Самовывоз",
        deliveryAddress: deliveryType === "COURIER" ? address : STORE_ADDRESS,
        deliveryLocationId: deliveryType === "PICKUP" ? 1 : undefined,
        contactName,
        contactPhone: contactPhone.replace(/\D/g, ""),
        paymentMethod,
        comment: comment || undefined,
      });

      setOrderId(order.id);

      if (cart?.items?.length) {
        trackPurchase(
          order.id,
          totalAmount,
          cart.items.map((i) => ({ productId: i.productId, name: i.productName, price: i.price, quantity: i.quantity }))
        );
      }

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
  const phoneValid = isValidPhone(contactPhone);

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
            <button onClick={() => { setDeliveryType("PICKUP"); setDeliveryEstimate(null); }} className={`p-4 rounded-xl border-2 text-center transition-colors ${deliveryType === "PICKUP" ? "border-primary-500 bg-primary-50" : "border-gray-200"}`}>
              <div className="font-semibold">🏪 Самовывоз</div>
              <div className="text-xs text-gray-500 mt-1">Заберите сами</div>
            </button>
          </div>

          {deliveryType === "PICKUP" && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="font-semibold text-sm mb-2">Адрес самовывоза:</p>
              <p className="text-gray-700 text-sm">{STORE_ADDRESS}</p>
              <p className="text-gray-500 text-sm mt-1">{STORE_PHONE}</p>
              <p className="text-gray-400 text-xs mt-1">Пн-Пт 7:30–20:00, Сб-Вс 8:00–20:00</p>
            </div>
          )}

          <button onClick={() => setStep(1)} className="w-full py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">Далее</button>
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div>
          <h3 className="font-bold mb-4">{deliveryType === "COURIER" ? "Адрес доставки" : "Адрес самовывоза"}</h3>
          {deliveryType === "COURIER" ? (
            <div className="mb-6">
              <div className="relative">
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
              {estimatingDelivery && (
                <p className="text-sm text-gray-400 mt-2">Рассчитываем стоимость доставки...</p>
              )}
              {deliveryEstimate && !estimatingDelivery && (
                <div className={`mt-3 p-3 rounded-xl text-sm ${deliveryEstimate.isDeliveryFree ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"}`}>
                  <div className="flex justify-between items-center">
                    <span>Доставка ({deliveryEstimate.zoneName})</span>
                    <span className="font-semibold">{deliveryEstimate.isDeliveryFree ? "Бесплатно" : formatPrice(deliveryEstimate.deliveryCost)}</span>
                  </div>
                  {deliveryEstimate.estimatedTime && (
                    <p className="text-xs text-gray-500 mt-1">Примерное время: {deliveryEstimate.estimatedTime}</p>
                  )}
                  {!deliveryEstimate.isDeliveryFree && deliveryEstimate.freeDeliveryThreshold > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Бесплатная доставка от {formatPrice(deliveryEstimate.freeDeliveryThreshold)}</p>
                  )}
                </div>
              )}
              {deliveryEstimate && !deliveryEstimate.deliveryAvailable && (
                <div className="mt-3 p-3 rounded-xl text-sm bg-red-50 text-red-600">
                  {deliveryEstimate.message || "Доставка по данному адресу недоступна"}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-gray-700 text-sm font-semibold">{STORE_ADDRESS}</p>
              <p className="text-gray-500 text-sm mt-1">Вы заберете заказ самостоятельно</p>
              <p className="text-gray-400 text-sm mt-1">{STORE_PHONE}</p>
              <p className="text-gray-400 text-xs mt-1">Пн-Пт 7:30–20:00, Сб-Вс 8:00–20:00</p>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50">Назад</button>
            <button
              onClick={() => setStep(2)}
              disabled={deliveryType === "COURIER" && !address}
              className="flex-1 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Contacts */}
      {step === 2 && (
        <div>
          <h3 className="font-bold mb-4">Контактные данные</h3>
          <div className="space-y-3 mb-6">
            <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ваше имя" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none" />
            <div>
              <input
                type="tel"
                value={contactPhone}
                onChange={handlePhoneChange}
                placeholder="+7 (___) ___-__-__"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                  contactPhone && !phoneValid ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-primary-500"
                }`}
              />
              {contactPhone && !phoneValid && (
                <p className="text-xs text-red-500 mt-1">Введите номер полностью в формате +7 (XXX) XXX-XX-XX</p>
              )}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий (необязательно)" rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-full font-semibold hover:bg-gray-50">Назад</button>
            <button onClick={() => contactName && phoneValid ? setStep(3) : undefined} className="flex-1 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 disabled:opacity-50" disabled={!contactName || !phoneValid}>Далее</button>
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
            <div className="flex justify-between text-sm py-2">
              <span>Товары</span>
              <span>{formatPrice(goodsAmount)}</span>
            </div>
            {deliveryType === "COURIER" && (
              <div className="flex justify-between text-sm py-2">
                <span>Доставка {deliveryEstimate ? `(${deliveryEstimate.zoneName})` : ""}</span>
                <span className={deliveryCost === 0 ? "text-secondary-500" : ""}>
                  {deliveryCost === 0 ? "Бесплатно" : formatPrice(deliveryCost)}
                </span>
              </div>
            )}
            {deliveryType === "PICKUP" && (
              <div className="flex justify-between text-sm py-2">
                <span>Самовывоз</span>
                <span className="text-secondary-500">Бесплатно</span>
              </div>
            )}
            <div className="border-t mt-2 pt-3 flex justify-between font-bold text-lg">
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
