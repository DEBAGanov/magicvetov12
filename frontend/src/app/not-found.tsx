/**
 * @file: app/not-found.tsx
 * @description: Custom 404 page
 * @created: 2026-04-15
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-6">🌸</div>
      <h1 className="text-3xl font-bold mb-3">Страница не найдена</h1>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        Возможно, эта страница была удалена или вы перешли по неверной ссылке
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
        >
          На главную
        </Link>
        <Link
          href="/catalog"
          className="px-6 py-3 border border-gray-200 rounded-full font-semibold hover:border-primary-300 transition-colors"
        >
          Каталог цветов
        </Link>
      </div>
    </div>
  );
}
