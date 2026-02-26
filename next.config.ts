import path from "path";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-accordion",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
    // Keep false: inlineCss: true broke production (unstyled layout, broken mobile). Do not re-enable.
    inlineCss: false,
  },
  async redirects() {
    return [{ source: "/medical-spas", destination: "/", permanent: true }];
  },
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

export default withBundleAnalyzer(nextConfig);
