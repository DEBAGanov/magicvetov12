/**
 * @file: app/error.tsx
 * @description: Global error boundary
 * @created: 2026-04-15
 */

"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">😔</div>
      <h2 className="text-2xl font-bold mb-3">Что-то пошло не так</h2>
      <p className="text-gray-400 mb-6">{error.message || "Произошла непредвиденная ошибка"}</p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  );
}
