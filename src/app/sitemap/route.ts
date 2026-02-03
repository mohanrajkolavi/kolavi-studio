import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { buildSitemapIndexXml } from "@/lib/sitemap-index";

/**
 * Sitemap index (Google-style): root lists child sitemaps.
 * Served at /sitemap (rewritten from /sitemap.xml).
 * @see https://blog.google/sitemap.xml
 */
export async function GET() {
  const now = new Date();
  const childSitemaps = [
    { loc: `${SITE_URL}/sitemap/static`, lastmod: now },
    { loc: `${SITE_URL}/sitemap/posts`, lastmod: now },
    { loc: `${SITE_URL}/sitemap/categories`, lastmod: now },
    { loc: `${SITE_URL}/sitemap/tags`, lastmod: now },
  ];
  const xml = buildSitemapIndexXml(childSitemaps);
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
