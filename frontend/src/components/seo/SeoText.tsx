/**
 * @file: components/seo/SeoText.tsx
 * @description: SEO text block for landing pages
 */

export default function SeoText({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-gray-50/50">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto prose prose-sm prose-gray">
          {children}
        </div>
      </div>
    </section>
  );
}
