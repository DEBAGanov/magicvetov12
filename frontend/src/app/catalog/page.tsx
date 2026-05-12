/**
 * @file: app/catalog/page.tsx
 * @description: Catalog page with category filter, sorting, pagination
 * @created: 2026-04-15
 */

"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { productsApi, categoriesApi } from "@/lib/api/client";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

function getPageRange(current: number, total: number): number[] {
  const pages: number[] = [];
  if (total <= 5) {
    for (let i = 0; i < total; i++) pages.push(i);
    return pages;
  }
  pages.push(0);
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 2, current + 1);
  if (start > 1) pages.push(-1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 2) pages.push(-1);
  pages.push(total - 1);
  return pages;
}

const PAGE_SIZE = 12;

function CatalogContent() {
  const params = useSearchParams();
  const categoryId = params.get("category") ? Number(params.get("category")) : null;

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loadedPages, setLoadedPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasMore = loadedPages < totalPages - 1;

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {});
  }, []);

  // Reset and load first page when category changes
  useEffect(() => {
    setLoading(true);
    setPage(0);
    setLoadedPages(0);
    const fetcher = categoryId
      ? () => productsApi.getByCategory(categoryId, 0, PAGE_SIZE)
      : () => productsApi.getAll(0, PAGE_SIZE);

    fetcher()
      .then((data) => {
        setProducts(data?.content || []);
        setTotalPages(data?.totalPages || 0);
        setLoadedPages(1);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId]);

  // Load more products (append) for infinite scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = loadedPages;

    const fetcher = categoryId
      ? () => productsApi.getByCategory(categoryId!, nextPage, PAGE_SIZE)
      : () => productsApi.getAll(nextPage, PAGE_SIZE);

    fetcher()
      .then((data) => {
        setProducts((prev) => [...prev, ...(data?.content || [])]);
        setTotalPages(data?.totalPages || 0);
        setLoadedPages((p) => p + 1);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, loadedPages, categoryId]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, loadMore]);

  // Pagination click: load up to selected page (replace mode)
  const handlePageClick = useCallback((targetPage: number) => {
    setLoading(true);
    const fetcher = categoryId
      ? () => productsApi.getByCategory(categoryId, targetPage, PAGE_SIZE)
      : () => productsApi.getAll(targetPage, PAGE_SIZE);

    fetcher()
      .then((data) => {
        setProducts(data?.content || []);
        setTotalPages(data?.totalPages || 0);
        setPage(targetPage);
        setLoadedPages(targetPage + 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [categoryId]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-primary-500">Главная</Link>
        <span>/</span>
        <span className="text-gray-700">Каталог</span>
      </div>

      <h1 className="text-2xl font-bold mb-6">Каталог цветов</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar filters */}
        <aside className="md:w-56 shrink-0">
          <div className="font-semibold text-sm mb-3">Категории</div>
          <div className="flex md:flex-col gap-1 overflow-x-auto no-scrollbar">
            <Link
              href="/catalog"
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${!categoryId ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              Все цветы
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.id}`}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm transition-colors ${categoryId === cat.id ? "bg-primary-50 text-primary-600 font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">🌸</div>
              <p>В этой категории пока нет товаров</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Infinite scroll sentinel + loading indicator */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                      Загрузка...
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-4">
                  <button
                    onClick={() => handlePageClick(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="min-w-[36px] h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ‹
                  </button>
                  {getPageRange(page, totalPages).map((p, i) =>
                    p === -1 ? (
                      <span key={`dot-${i}`} className="min-w-[36px] h-9 flex items-center justify-center text-gray-400">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageClick(p)}
                        className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${page === p ? "bg-primary-500 text-white" : "border border-gray-200 text-gray-600 hover:border-primary-300"}`}
                      >
                        {p + 1}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handlePageClick(Math.min(totalPages - 1, page + 1))}
                    disabled={page === totalPages - 1}
                    className="min-w-[36px] h-9 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-gray-400">Загрузка...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
