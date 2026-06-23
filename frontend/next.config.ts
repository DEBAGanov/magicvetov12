/**
 * @file: next.config.ts
 * @description: Next.js 15 configuration for MagicCvetov frontend
 * @dependencies: none
 * @created: 2026-04-15
 */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  trailingSlash: false,
  images: {
    // Server-side optimization: resize 1000×1000 originals down to the
    // grid container size and serve modern formats with a srcset.
    formats: ["image/avif", "image/webp"],
    // Catalog cards render at ~165px (mobile 2-col) / ~320px DPR2 — keep small steps.
    imageSizes: [128, 165, 256, 320, 384],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200],
    minimumCacheTTL: 2678400, // 31 days — cache optimized variants on disk
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.twcstorage.ru",
      },
      {
        protocol: "https",
        hostname: "45.10.41.59",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "",
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
      {
        source: "/(.*)\\.(jpg|jpeg|png|gif|ico|svg|webp|woff2|woff|ttf|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)\\.(js|css)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=31536000",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
