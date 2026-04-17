/**
 * @file: app/catalog/[categoryId]/[productId]/page.tsx
 * @description: Product detail page with gallery, price, add-to-cart
 * @created: 2026-04-15
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productsApi } from "@/lib/api/client";
import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { trackViewItem, trackAddToCart } from "@/lib/analytics";
import ProductGallery from "@/components/product/ProductGallery";
import { useToast } from "@/components/ui/Toast";
import { JsonLd, productSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { ProductDTO } from "@/lib/types";

export default function ProductPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [oneClickLoading, setOneClickLoading] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const fetchCartStore = useCartStore((s) => s.fetchCart);
  const toast = useToast();

  useEffect(() => {
    if (!productId) return;
    productsApi
      .getById(Number(productId))
      .then((p) => {
        setProduct(p);
        if (p) trackViewItem({ productId: p.id, name: p.name, price: p.discountedPrice || p.price, category: p.categoryName });
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  const allImages = useMemo(
    () => (product ? [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean) : []),
    [product]
  );

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

  return (
    <div className="container mx-auto px-4 py-6">
      <JsonLd data={[
        productSchema({
          name: product.name,
          description: product.description || `Букет ${product.name}`,
          image: product.imageUrl,
          price: product.price,
          discountedPrice: product.discountedPrice,
          url: `https://magiacvetov12.ru/catalog/${product.categoryId}/${product.id}`,
          inStock: product.isAvailable,
        }),
        breadcrumbSchema([
          { name: "Главная", url: "https://magiacvetov12.ru" },
          { name: "Каталог", url: "https://magiacvetov12.ru/catalog" },
          { name: product.name, url: `https://magiacvetov12.ru/catalog/${product.categoryId}/${product.id}` },
        ]),
      ]} />

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
              className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
              В корзину
            </button>
            <button
              onClick={async () => {
                setOneClickLoading(true);
                try {
                  await addItem(product.id);
                  await fetchCartStore();
                  router.push("/checkout");
                } catch {
                  toast.show("Ошибка при добавлении", "error");
                } finally {
                  setOneClickLoading(false);
                }
              }}
              disabled={oneClickLoading}
              className="px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              {oneClickLoading ? "Добавляем..." : "Купить в 1 клик"}
            </button>
            <a
              href="https://max.ru/id121602873440_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 text-white rounded-full font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              style={{ background: "linear-gradient(90deg, #0068f2, #6201c8)" }}
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill="white"><path d="M8.80273 1.08491C9.45417 0.991827 11.0494 0.951991 11.6748 1.08491C13.4713 1.45734 14.9721 2.2559 16.2686 3.51265C17.69 4.8892 18.395 6.21947 18.8096 8.16792C19.0069 9.12553 19.0812 10.5201 18.8838 11.4775C18.5021 13.2794 17.8312 14.8915 16.6074 16.1416C15.91 16.8463 15.3409 17.3266 14.5908 17.7587C13.0156 18.5698 11.9323 18.9516 10.3877 18.996L10.0732 19C8.61564 19 7.88228 18.7012 6.6582 17.9697L6.19043 17.6455L5.48047 18.3027C4.91445 18.8277 3.94949 18.9999 3.57617 19C2.94159 18.9999 2.62671 18.919 2.34375 18.4736C2.26908 16.8187 2.19808 16.7867 1.93359 15.6142L1.68945 14.5419C1.39464 13.2317 1.00243 11.3677 1 10.3867C1.00001 8.31889 1.11213 8.65611 1.48535 7.0771C2.64359 3.69234 5.49258 1.54395 8.80273 1.08491ZM10.8281 5.56831C10.5192 5.50314 9.71933 5.47681 9.39746 5.52241C7.76256 5.74753 6.43347 6.87956 5.86133 8.53902C5.60129 9.2889 5.50002 9.96749 5.5 10.9814C5.50308 12.2589 5.73232 13.545 6.06348 14.1738L6.13086 14.291C6.27059 14.5093 6.36799 14.5456 6.58887 14.4511C6.77413 14.3696 7.14818 14.1022 7.42773 13.8447L7.60645 13.6845L7.89941 13.8574C8.50387 14.2159 9.15088 14.4116 9.82031 14.4443C10.6815 14.4833 11.4817 14.2847 12.2617 13.8349C12.6322 13.623 12.8928 13.4139 13.2373 13.0683C13.8418 12.4554 14.2382 11.7086 14.4268 10.8251C14.5242 10.3557 14.5242 9.6189 14.4268 9.14937L14.3398 8.79976C14.1122 8.00523 13.7119 7.34925 13.0977 6.75874C12.4573 6.14255 11.7155 5.75092 10.8281 5.56831Z" /></svg>
              Написать в Max
            </a>
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
