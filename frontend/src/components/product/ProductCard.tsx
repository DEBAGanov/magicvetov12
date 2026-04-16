/**
 * @file: components/product/ProductCard.tsx
 * @description: Product card with hover image slider, price, add-to-cart
 * @created: 2026-04-15
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import { useToast } from "@/components/ui/Toast";
import type { ProductDTO } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductDTO }) {
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();

  const allImages = useMemo(
    () => [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean),
    [product.imageUrl, product.additionalImages]
  );
  const hasMultiple = allImages.length > 1;

  const [imgIndex, setImgIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSlider = useCallback(() => {
    if (!hasMultiple) return;
    timerRef.current = setInterval(() => {
      setImgIndex((i) => (i + 1) % allImages.length);
    }, 800);
  }, [hasMultiple, allImages.length]);

  const stopSlider = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setImgIndex(0);
  }, []);

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const displayPrice = product.discountedPrice || product.price;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      <Link
        href={`/catalog/${product.categoryId}/${product.id}`}
        className="block relative aspect-square bg-gray-50 overflow-hidden"
        onMouseEnter={startSlider}
        onMouseLeave={stopSlider}
      >
        {allImages.length > 0 ? (
          <>
            {/* Stacked images — only the active one is visible */}
            {allImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={i === imgIndex ? product.name : ""}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: i === imgIndex ? 1 : 0 }}
                loading="lazy"
              />
            ))}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
        )}

        {/* Badges */}
        {product.isSpecialOffer && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full z-10">Акция</span>
        )}
        {product.isPreorder && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-secondary-500 text-white text-xs font-bold rounded-full z-10">Под заказ</span>
        )}

        {/* Dots indicator — only when multiple images */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {allImages.map((_, i) => (
              <span
                key={i}
                className="block w-1.5 h-1.5 rounded-full transition-colors duration-200"
                style={{
                  backgroundColor: i === imgIndex ? "white" : "rgba(255,255,255,0.5)",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="p-3 flex flex-col gap-1">
        <Link href={`/catalog/${product.categoryId}/${product.id}`} className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-primary-500 transition-colors min-h-[2.5rem]">
          {product.name}
        </Link>

        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
        )}

        <div className="flex items-end justify-between mt-auto pt-1">
          <div>
            <span className="text-lg font-bold text-gray-900">{formatPrice(displayPrice)}</span>
            {hasDiscount && (
              <span className="ml-1 text-sm text-gray-400 line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <button
            onClick={async (e) => {
              e.preventDefault();
              try {
                await addItem(product.id);
                toast.show("Добавлено в корзину!");
              } catch {
                toast.show("Ошибка при добавлении", "error");
              }
            }}
            className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors shrink-0"
            title="В корзину"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
