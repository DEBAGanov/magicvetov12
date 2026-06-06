/**
 * @file: app/catalog/[categoryId]/[productId]/page.tsx
 * @description: Product detail page (server component). Product content + JSON-LD
 *               (Product, BreadcrumbList) are server-rendered into the initial HTML
 *               so Yandex/Google index them without executing JS. Interactivity
 *               (gallery, add-to-cart, analytics) lives in client islands.
 * @created: 2026-04-15
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import ProductGallery from "@/components/product/ProductGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import { JsonLd, productSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { ProductDTO } from "@/lib/types";

const SITE_URL = "https://magiacvetov12.ru";

async function getProduct(id: string): Promise<ProductDTO | null> {
  const apiBase = process.env.INTERNAL_API_URL
    ? `${process.env.INTERNAL_API_URL}/api/v1`
    : `${SITE_URL}/api/v1`;
  try {
    const res = await fetch(`${apiBase}/products/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as ProductDTO;
  } catch {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ categoryId: string; productId: string }>;
}) {
  const { productId } = await params;
  const product = await getProduct(productId);
  if (!product) notFound();

  const allImages = [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);
  const displayPrice = product.discountedPrice || product.price;
  const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
  const productUrl = `${SITE_URL}/catalog/${product.categoryId}/${product.id}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <JsonLd data={[
        productSchema({
          name: product.name,
          description: product.description || `Букет ${product.name}`,
          image: product.imageUrl,
          price: product.price,
          discountedPrice: product.discountedPrice,
          url: productUrl,
          inStock: product.isAvailable,
        }),
        breadcrumbSchema([
          { name: "Главная", url: SITE_URL },
          { name: "Каталог", url: `${SITE_URL}/catalog` },
          { name: product.name, url: productUrl },
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
          <ProductGallery images={allImages} productName={product.name} />
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

          <ProductPurchase product={product} />

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
