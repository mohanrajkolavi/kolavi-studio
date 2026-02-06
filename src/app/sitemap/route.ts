import { NextResponse } from "next/server";
import { SITE_URL, getSitemapBuildDate } from "@/lib/constants";
import { buildSitemapIndexXml } from "@/lib/sitemap-index";

/**
 * Sitemap index (Google-style): root lists child sitemaps.
 * Served at /sitemap (rewritten from /sitemap.xml).
 * lastmod uses build/deploy time when BUILD_TIMESTAMP or VERCEL_BUILD_COMMIT_TIMESTAMP is set.
 * @see https://blog.google/sitemap.xml
 */
export async function GET() {
  const lastmod = getSitemapBuildDate() ?? new Date();
  const childSitemaps = [
    { loc: `${SITE_URL}/sitemap/static`, lastmod },
    { loc: `${SITE_URL}/sitemap/posts`, lastmod },
    { loc: `${SITE_URL}/sitemap/categories`, lastmod },
    { loc: `${SITE_URL}/sitemap/tags`, lastmod },
  ];
  const xml = buildSitemapIndexXml(childSitemaps);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
