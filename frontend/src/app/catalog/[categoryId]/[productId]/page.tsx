/**
 * @file: app/catalog/[categoryId]/[productId]/page.tsx
 * @description: Product detail page with gallery, price, add-to-cart
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { productsApi } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "@/components/product/ProductGallery";
import type { ProductDTO } from "@/lib/types";

export default function ProductPage() {
  const { productId } = useParams();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!productId) return;
    productsApi
      .getById(Number(productId))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
            <div className="h-6 bg-gray-100 rounded w-1/3 animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2">Товар не найден</h2>
        <p className="text-gray-400 mb-6">Возможно, он был удалён или ссылка неверна</p>
        <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  const displayPrice = product.discountedPrice || product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const allImages = useMemo(() => [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean), [product.imageUrl, product.additionalImages]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary-500">Главная</Link>
        <span>/</span>
        <Link href="/catalog" className="hover:text-primary-500">Каталог</Link>
        <span>/</span>
        <span className="text-gray-700">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Gallery */}
        <div className="group">
          <ProductGallery
            images={allImages}
            productName={product.name}
          />
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>

          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-primary-500">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
            {product.discountPercent && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">-{product.discountPercent}%</span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>
          )}

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={async () => {
                try {
                  await addItem(product.id);
                  alert("Добавлено в корзину!");
                } catch (err) {
                  alert("Ошибка при добавлении в корзину");
                  console.error("Add to cart error:", err);
                }
              }}
              className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
              В корзину
            </button>
            <Link
              href={`/checkout?productId=${product.id}`}
              className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors"
            >
              Купить в 1 клик
            </Link>
          </div>

          {/* Delivery info */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary-500"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /></svg>
              Доставка: 2 часа
            </div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary-500"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" /></svg>
              Гарантия свежести 24 часа
            </div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-primary-500"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>
              Оплата: карта, СБП, наличные
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
