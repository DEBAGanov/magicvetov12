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
import { trackAddToCart } from "@/lib/analytics";
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

          <div className="flex items-center gap-1.5">
            <a
              href="https://max.ru/id121602873440_bot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
              style={{ background: "linear-gradient(90deg, #0068f2, #6201c8)" }}
              title="Написать в Max"
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="white"><path d="M8.80273 1.08491C9.45417 0.991827 11.0494 0.951991 11.6748 1.08491C13.4713 1.45734 14.9721 2.2559 16.2686 3.51265C17.69 4.8892 18.395 6.21947 18.8096 8.16792C19.0069 9.12553 19.0812 10.5201 18.8838 11.4775C18.5021 13.2794 17.8312 14.8915 16.6074 16.1416C15.91 16.8463 15.3409 17.3266 14.5908 17.7587C13.0156 18.5698 11.9323 18.9516 10.3877 18.996L10.0732 19C8.61564 19 7.88228 18.7012 6.6582 17.9697L6.19043 17.6455L5.48047 18.3027C4.91445 18.8277 3.94949 18.9999 3.57617 19C2.94159 18.9999 2.62671 18.919 2.34375 18.4736C2.26908 16.8187 2.19808 16.7867 1.93359 15.6142L1.68945 14.5419C1.39464 13.2317 1.00243 11.3677 1 10.3867C1.00001 8.31889 1.11213 8.65611 1.48535 7.0771C2.64359 3.69234 5.49258 1.54395 8.80273 1.08491ZM10.8281 5.56831C10.5192 5.50314 9.71933 5.47681 9.39746 5.52241C7.76256 5.74753 6.43347 6.87956 5.86133 8.53902C5.60129 9.2889 5.50002 9.96749 5.5 10.9814C5.50308 12.2589 5.73232 13.545 6.06348 14.1738L6.13086 14.291C6.27059 14.5093 6.36799 14.5456 6.58887 14.4511C6.77413 14.3696 7.14818 14.1022 7.42773 13.8447L7.60645 13.6845L7.89941 13.8574C8.50387 14.2159 9.15088 14.4116 9.82031 14.4443C10.6815 14.4833 11.4817 14.2847 12.2617 13.8349C12.6322 13.623 12.8928 13.4139 13.2373 13.0683C13.8418 12.4554 14.2382 11.7086 14.4268 10.8251C14.5242 10.3557 14.5242 9.6189 14.4268 9.14937L14.3398 8.79976C14.1122 8.00523 13.7119 7.34925 13.0977 6.75874C12.4573 6.14255 11.7155 5.75092 10.8281 5.56831Z" /></svg>
            </a>
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await addItem(product.id);
                  trackAddToCart({
                    productId: product.id,
                    name: product.name,
                    price: displayPrice,
                    quantity: 1,
                    category: product.categoryName,
                  });
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
    </div>
  );
}
