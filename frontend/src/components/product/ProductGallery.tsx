/**
 * @file: components/product/ProductGallery.tsx
 * @description: Product image gallery with thumbnails, arrows, touch swipe
 * @created: 2026-04-16
 */

"use client";

import { useState, useRef, useCallback } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (i: number) => {
      setActiveIndex(((i % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  const onPointerDown = (e: React.PointerEvent) => {
    touchStartX.current = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      goTo(diff > 0 ? activeIndex - 1 : activeIndex + 1);
    }
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square flex items-center justify-center text-8xl bg-gray-50 rounded-xl">🌸</div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden">
        <img src={images[0]} alt={productName} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        ref={containerRef}
        className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={i === activeIndex ? productName : ""}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
          />
        ))}

        {/* Left arrow */}
        <button
          onClick={() => goTo(activeIndex - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          aria-label="Предыдущее фото"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-700"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => goTo(activeIndex + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
          aria-label="Следующее фото"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-gray-700"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
        </button>

        {/* Counter */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/40 text-white text-xs rounded-full z-10">
          {activeIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
              i === activeIndex ? "border-primary-500" : "border-transparent hover:border-gray-300"
            }`}
          >
            <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}
