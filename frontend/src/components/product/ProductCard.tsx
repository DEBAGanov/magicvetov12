/**
 * @file: components/product/ProductCard.tsx
 * @description: Product card with image, price, add-to-cart, buy-one-click
 * @created: 2026-04-15
 */

"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart-store";
import type { ProductDTO } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductDTO }) {
  const addItem = useCartStore((s) => s.addItem);

  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const displayPrice = product.discountedPrice || product.price;

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
      <Link href={`/catalog/${product.categoryId}/${product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌸</div>
        )}
        {/* Badges */}
        {product.isSpecialOffer && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">Акция</span>
        )}
        {product.isPreorder && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-secondary-500 text-white text-xs font-bold rounded-full">Под заказ</span>
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
              await addItem(product.id);
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
