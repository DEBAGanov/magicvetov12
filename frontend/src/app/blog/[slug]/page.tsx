/**
 * @file: app/blog/[slug]/page.tsx
 * @description: Individual blog article page with SEO
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_ARTICLES, getArticleBySlug, getArticleSlugs } from "@/lib/seo/blog-articles";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";

export async function generateStaticParams() {
  return getArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      locale: "ru_RU",
      type: "article",
      publishedTime: article.date,
      authors: ["Магия Цветов"],
    },
    alternates: { canonical: `https://magiacvetov12.ru/blog/${article.slug}` },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const breadcrumbs = [
    { name: "Главная", url: "https://magiacvetov12.ru" },
    { name: "Блог", url: "https://magiacvetov12.ru/blog" },
    { name: article.title, url: `https://magiacvetov12.ru/blog/${article.slug}` },
  ];

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.metaDescription,
    author: { "@type": "Organization", name: "Магия Цветов" },
    publisher: {
      "@type": "Organization",
      name: "Магия Цветов",
      logo: { "@type": "ImageObject", url: "https://magiacvetov12.ru/favicon.svg" },
    },
    datePublished: article.date,
    dateModified: article.date,
    mainEntityOfPage: `https://magiacvetov12.ru/blog/${article.slug}`,
  };

  // Render markdown-like content to HTML
  const contentHtml = article.content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("## ")) return `<h2 class="text-xl font-bold mt-8 mb-3">${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("### ")) return `<h3 class="text-lg font-semibold mt-6 mb-2">${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("- **")) {
        const match = trimmed.match(/^- \*\*(.+?)\*\*\s*[-—]?\s*(.*)/);
        if (match) return `<li class="ml-4 mb-1"><strong>${match[1]}</strong>${match[2] ? " — " + match[2] : ""}</li>`;
        return `<li class="ml-4 mb-1">${trimmed.slice(2)}</li>`;
      }
      if (trimmed.startsWith("- ")) return `<li class="ml-4 mb-1">${trimmed.slice(2)}</li>`;
      if (trimmed.startsWith("| ")) return `<tr class="border-b border-gray-100"><td class="py-2 px-3">${trimmed.replace(/\|/g, "</td><td class=\"py-2 px-3\">")}</td></tr>`;
      if (trimmed.match(/^\d+\.\s\*\*/)) {
        const match = trimmed.match(/^\d+\.\s\*\*(.+?)\*\*\s*[-—]?\s*(.*)/);
        if (match) return `<li class="ml-4 mb-1"><strong>${match[1]}</strong>${match[2] ? " — " + match[2] : ""}</li>`;
      }
      if (trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. "))
        return `<li class="ml-4 mb-1 list-decimal">${trimmed.slice(3)}</li>`;
      if (trimmed === "") return "";
      return `<p class="mb-3 leading-relaxed">${trimmed}</p>`;
    })
    .join("\n");

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumbSchema(breadcrumbs)]} />

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-primary-500">Главная</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary-500">Блог</Link>
          <span>/</span>
          <span className="text-gray-700 line-clamp-1">{article.title}</span>
        </div>
      </div>

      <article className="container mx-auto px-4 py-8 max-w-3xl">
        <header className="mb-8">
          <time className="text-sm text-gray-400">
            {new Date(article.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </time>
          <h1 className="text-2xl md:text-4xl font-bold mt-2 leading-tight">{article.h1}</h1>
          <p className="text-gray-500 mt-3 text-lg">{article.excerpt}</p>
        </header>

        <div
          className="prose prose-gray max-w-none"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {/* CTA */}
        <div className="mt-10 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Понравилась статья?</h2>
          <p className="text-gray-600 mb-4">Закажите букет с доставкой по Зеленодольску и Волжску</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="inline-block px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
            >
              Смотреть каталог
            </Link>
            <Link
              href="/dostavka-cvetov/volzhsk"
              className="inline-block px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors"
            >
              Доставка в Волжск
            </Link>
            <Link
              href="/dostavka-cvetov/zelenodolsk"
              className="inline-block px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-full font-semibold hover:bg-primary-50 transition-colors"
            >
              Доставка в Зеленодольск
            </Link>
          </div>
        </div>

        {/* Related articles */}
        {BLOG_ARTICLES.length > 1 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold mb-4">Другие статьи</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {BLOG_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 4).map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all"
                >
                  <h3 className="font-semibold text-sm group-hover:text-primary-500 line-clamp-2">{related.title}</h3>
                  <p className="text-gray-400 text-xs mt-1">{new Date(related.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
