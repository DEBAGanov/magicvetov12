/**
 * @file: page.tsx
 * @description: Homepage — hero, categories, products, reviews, FAQ
 * @dependencies: components/home/*
 * @created: 2026-04-15
 */

export default function HomePage() {
  return (
    <main>
      {/* Placeholder — components will be added in Stage 4 */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="text-primary-500">Магия Цветов</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Сайт на Next.js — этап инициализации завершён. Компоненты добавляются на следующих этапах.
        </p>
      </div>
    </main>
  );
}
