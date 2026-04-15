/**
 * @file: components/home/CategoryGrid.tsx
 * @description: Category cards grid from API data
 * @created: 2026-04-15
 */

import Link from "next/link";
import Image from "next/image";
import type { CategoryDTO } from "@/lib/types";

export default function CategoryGrid({ categories }: { categories: CategoryDTO[] }) {
  if (!categories.length) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold">Каталог цветов</h2>
        <p className="text-gray-500 mt-1">Выберите категорию или посмотрите весь каталог</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalog?category=${cat.id}`}
            className="group flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-lg transition-all hover:-translate-y-1"
          >
            {cat.imageUrl ? (
              <div className="w-20 h-20 relative mb-2">
                <Image src={cat.imageUrl} alt={cat.name} fill className="object-contain" sizes="80px" />
              </div>
            ) : (
              <span className="text-4xl mb-2">🌸</span>
            )}
            <span className="text-sm font-semibold text-gray-800 group-hover:text-primary-500 transition-colors">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
