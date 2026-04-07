import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const DISALLOWED_PATHS = [
  "/api/",
  "/admin/",
  "/dashboard/",
  "/partner/login",
  "/partner/forgot-password",
  "/partner/set-password",
  "/partner/dashboard",
];

/**
 * robots.txt with AI crawler management.
 *
 * Strategy: Allow retrieval/search bots (they cite and link back) while
 * blocking training-only crawlers (they use content without attribution).
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots/intro
 * @see https://momenticmarketing.com/blog/ai-search-crawlers-bots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      // AI retrieval/search bots - explicitly allow (they cite your content)
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "DuckAssistBot",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      // AI training-only crawlers - block (use content for model training without attribution)
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "meta-externalagent",
        disallow: ["/"],
      },
      {
        userAgent: "Bytespider",
        disallow: ["/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
