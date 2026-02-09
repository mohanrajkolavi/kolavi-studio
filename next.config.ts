import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/blog/rss.xml", destination: "/blog/rss" },
      { source: "/sitemap.xml", destination: "/sitemap" },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "kolavistudio.com" },
      { protocol: "https", hostname: "www.kolavistudio.com" },
      { protocol: "https", hostname: "cms.kolavistudio.com" },
      { protocol: "http", hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24h for external images (PageSpeed / LCP)
  },
};

export default nextConfig;
