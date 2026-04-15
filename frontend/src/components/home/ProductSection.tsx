/**
 * @file: components/home/ProductSection.tsx
 * @description: Horizontal product carousel with title
 * @created: 2026-04-15
 */

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { ProductDTO } from "@/lib/types";

export default function ProductSection({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: ProductDTO[];
  viewAllHref?: string;
}) {
  if (!products.length) return null;

  return (
    <section className="bg-gray-50/50">
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold">{title}</h2>
          {viewAllHref && (
            <Link href={viewAllHref} className="text-sm font-medium text-primary-500 hover:underline">
              Смотреть все &rarr;
            </Link>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {products.map((p) => (
            <div key={p.id} className="min-w-[200px] max-w-[220px] shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
