/**
 * @file: app/search/page.tsx
 * @description: Product search page
 * @created: 2026-04-15
 */

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { productsApi } from "@/lib/api/client";
import type { ProductDTO } from "@/lib/types";

function SearchContent() {
  const params = useSearchParams();
  const query = params.get("q") || "";

  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setProducts([]); return; }
    setLoading(true);
    productsApi
      .search(query)
      .then((data) => setProducts(data?.content || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
        <Link href="/" className="hover:text-primary-500">Главная</Link><span>/</span>
        <span className="text-gray-700">Поиск</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">
        {query ? `Результаты: «${query}»` : "Поиск"}
      </h1>

      {!query.trim() && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>Введите запрос для поиска</p>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && query && products.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">😕</div>
          <p className="mb-4">По запросу «{query}» ничего не найдено</p>
          <Link href="/catalog" className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600">
            Перейти в каталог
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>}>
      <SearchContent />
    </Suspense>
  );
}
