/**
 * @file: page.tsx
 * @description: Homepage with hero, categories, products, reviews, FAQ
 * @dependencies: components/home/*
 * @created: 2026-04-15
 */

import HeroBanner from "@/components/home/HeroBanner";
import CategoryGrid from "@/components/home/CategoryGrid";
import ProductSection from "@/components/home/ProductSection";
import DeliveryInfo from "@/components/home/DeliveryInfo";
import ReviewsSection from "@/components/home/ReviewsSection";
import FAQSection from "@/components/home/FAQSection";
import { productsApi, categoriesApi } from "@/lib/api/client";
import type { CategoryDTO, ProductDTO } from "@/lib/types";

export default async function HomePage() {
  // Fetch data server-side
  let categories: CategoryDTO[] = [];
  let hitProducts: ProductDTO[] = [];
  let specialOffers: ProductDTO[] = [];

  try {
    const [catData, prodData] = await Promise.all([
      categoriesApi.getAll(),
      productsApi.getAll(0, 8),
    ]);
    categories = catData || [];
    hitProducts = prodData?.content || [];
  } catch {
    // API may be unavailable during build
  }

  try {
    specialOffers = await productsApi.getSpecialOffers();
  } catch {
    // Special offers may be empty
  }

  return (
    <>
      <HeroBanner />
      <DeliveryInfo />
      <CategoryGrid categories={categories} />
      <ProductSection
        title="Хиты продаж"
        products={hitProducts}
        viewAllHref="/catalog"
      />
      {specialOffers.length > 0 && (
        <ProductSection
          title="Специальные предложения"
          products={specialOffers.slice(0, 8)}
          viewAllHref="/catalog?filter=special"
        />
      )}
      <ReviewsSection />
      <FAQSection />

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-center py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Подарите радость близким</h2>
          <p className="opacity-90 mb-6">Закажите букет прямо сейчас — доставим за 2 часа</p>
          <a href="/catalog" className="inline-block px-8 py-3 bg-white text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors">
            Заказать букет
          </a>
        </div>
      </section>
    </>
  );
}
