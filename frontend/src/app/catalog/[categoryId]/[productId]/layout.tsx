/**
 * @file: catalog/[categoryId]/[productId]/layout.tsx
 * @description: Layout with dynamic metadata for product detail pages
 */

import type { Metadata } from "next";

type Props = { params: Promise<{ productId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const apiBase = process.env.INTERNAL_API_URL
    ? `${process.env.INTERNAL_API_URL}/api/v1`
    : "https://magiacvetov12.ru/api/v1";

  try {
    const res = await fetch(`${apiBase}/products/${productId}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: "Товар не найден" };
    const product = await res.json();

    const price = product.discountedPrice || product.price;
    const title = `${product.name} — купить за ${price} ₽ | Магия Цветов`;
    const description = `${product.description || "Букет " + product.name}. Доставка в Волжске и Зеленодольске. Цена: ${price} ₽. Заказывайте на magiacvetov12.ru`;

    return {
      title,
      description,
      keywords: [product.name, "купить цветы", "доставка цветов", product.categoryName, "букет"].filter(Boolean),
      openGraph: {
        title,
        description: product.description || `Купить ${product.name} с доставкой`,
        images: product.imageUrl ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }] : [],
        type: "website",
        locale: "ru_RU",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: product.description || `Купить ${product.name} с доставкой`,
        images: product.imageUrl ? [product.imageUrl] : [],
      },
      alternates: {
        canonical: `https://magiacvetov12.ru/catalog/${product.categoryId}/${product.id}`,
      },
    };
  } catch {
    return { title: "Товар" };
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
