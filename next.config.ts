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
  },
};

export default nextConfig;
