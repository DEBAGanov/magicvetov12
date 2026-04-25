/**
 * @file: components/seo/JsonLd.tsx
 * @description: Universal JSON-LD structured data renderer
 */

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Florist / LocalBusiness schema */
export function floristSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Florist",
    name: "Магия Цветов",
    description: "Доставка свежих цветов по Волжску и Зеленодольску. Букеты на любой вкус с доставкой в день заказа.",
    url: "https://magiacvetov12.ru",
    telephone: "+7-964-861-23-70",
    email: "info@magiacvetov12.ru",
    priceRange: "₽₽",
    currenciesAccepted: "RUB",
    paymentAccepted: "Наличные, Банковская карта, СБП",
    image: "https://magiacvetov12.ru/images/store.jpg",
    address: [
      {
        "@type": "PostalAddress",
        streetAddress: "ул. Володарского, 5",
        addressLocality: "Волжск",
        addressRegion: "Республика Марий Эл",
        postalCode: "425000",
        addressCountry: "RU",
      },
    ],
    geo: {
      "@type": "GeoCoordinates",
      latitude: "56.0444",
      longitude: "48.3558",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "07:30",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
    ],
    areaServed: [
      {
        "@type": "City",
        name: "Волжск",
        containedInPlace: { "@type": "AdministrativeArea", name: "Республика Марий Эл" },
      },
      {
        "@type": "City",
        name: "Зеленодольск",
        containedInPlace: { "@type": "AdministrativeArea", name: "Республика Татарстан" },
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "6",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

/** WebSite schema with SearchAction */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Магия Цветов",
    url: "https://magiacvetov12.ru",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://magiacvetov12.ru/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

/** Organization schema */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Магия Цветов",
    url: "https://magiacvetov12.ru",
    logo: "https://magiacvetov12.ru/images/logo.png",
    telephone: "+7-964-861-23-70",
    email: "info@magiacvetov12.ru",
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Володарского, 5",
      addressLocality: "Волжск",
      addressRegion: "Республика Марий Эл",
      postalCode: "425000",
      addressCountry: "RU",
    },
  };
}

/** Product schema */
export function productSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  discountedPrice?: number | null;
  url: string;
  inStock?: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      url: product.url,
      priceCurrency: "RUB",
      price: product.discountedPrice || product.price,
      availability: product.inStock !== false
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

/** FAQPage schema */
export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
