/**
 * Sitemap index (Google-style): root sitemap lists child sitemaps.
 * Conforms to sitemaps.org protocol (urlset + sitemapindex).
 * Entry fetchers use unstable_cache (revalidate 60s) so sitemaps don't hit WP on every request.
 * @see https://www.sitemaps.org/protocol.html
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

import { unstable_cache } from "next/cache";
import { SITE_URL, WP_GRAPHQL_URL } from "@/lib/constants";
import { request } from "@/lib/graphql/client";
import {
  getPosts,
  getAllCategorySlugs,
  getTagsFromPosts,
  fetchAllPostSlugs,
} from "@/lib/blog-data";
import {
  GET_ALL_CATEGORY_SLUGS,
  GET_ALL_TAG_SLUGS,
} from "@/lib/graphql/queries";

const CACHE_REVALIDATE = 60;

const NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
const XSI = "http://www.w3.org/2001/XMLSchema-instance";
const SITEMAP_XSD = "http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd";
const SITEINDEX_XSD = "http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd";
/** sitemaps.org: &lt;loc&gt; value must be less than 2,048 characters */
const MAX_LOC_LENGTH = 2048;

export const SITEMAP = {
  priority: {
    home: 1,
    main: 0.9,
    blogIndex: 0.85,
    post: 0.7,
    category: 0.6,
    tag: 0.5,
  },
  changeFrequency: {
    home: "weekly" as const,
    main: "weekly" as const,
    blog: "weekly" as const,
    post: "monthly" as const,
    category: "weekly" as const,
    tag: "monthly" as const,
  },
} as const;

export type UrlEntry = {
  path: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Build sitemap index XML (root). Protocol: sitemapindex, &lt;loc&gt; required, &lt;lastmod&gt; W3C Datetime. */
export function buildSitemapIndexXml(
  childSitemaps: { loc: string; lastmod?: Date }[]
): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<sitemapindex xmlns="${NS}" xmlns:xsi="${XSI}" xsi:schemaLocation="${NS} ${SITEINDEX_XSD}">`,
    ...childSitemaps
      .filter((s) => s.loc.length < MAX_LOC_LENGTH)
      .map(
        (s) =>
          `  <sitemap><loc>${escapeXml(s.loc)}</loc>${s.lastmod ? `<lastmod>${formatDate(s.lastmod)}</lastmod>` : ""}</sitemap>`
      ),
    "</sitemapindex>",
  ];
  return lines.join("\n");
}

/** Build urlset XML for a child sitemap. Protocol: &lt;loc&gt; required &lt;2048 chars, lastmod W3C Datetime, changefreq/priority optional. */
export function buildUrlsetXml(entries: UrlEntry[], baseUrl: string): string {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<urlset xmlns="${NS}" xmlns:xsi="${XSI}" xsi:schemaLocation="${NS} ${SITEMAP_XSD}">`,
    ...entries
      .map((e) => {
        const url = baseUrl + (e.path.startsWith("/") ? e.path : `/${e.path}`);
        return { ...e, url };
      })
      .filter((e) => e.url.length < MAX_LOC_LENGTH)
      .map((e) => {
        const lastmod = `<lastmod>${formatDate(e.lastModified)}</lastmod>`;
        const changefreq = `<changefreq>${e.changeFrequency}</changefreq>`;
        const priority = `<priority>${Math.min(1, Math.max(0, e.priority)).toFixed(1)}</priority>`;
        return `  <url><loc>${escapeXml(e.url)}</loc>${lastmod}${changefreq}${priority}</url>`;
      }),
    "</urlset>",
  ];
  return lines.join("\n");
}

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: UrlEntry["changeFrequency"] }[] = [
  { path: "", priority: SITEMAP.priority.home, changeFrequency: SITEMAP.changeFrequency.home },
  { path: "/industries", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/medical-spas", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/services", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/portfolio", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/about", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/contact", priority: SITEMAP.priority.main, changeFrequency: SITEMAP.changeFrequency.main },
  { path: "/blog", priority: SITEMAP.priority.blogIndex, changeFrequency: SITEMAP.changeFrequency.blog },
];

export function getStaticEntries(): UrlEntry[] {
  const now = new Date();
  return STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    path: path || "/",
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

export async function getPostEntries(): Promise<UrlEntry[]> {
  return unstable_cache(
    async () => {
      const now = new Date();
      const entries: UrlEntry[] = [];
      if (WP_GRAPHQL_URL?.trim()) {
        try {
          const nodes = await fetchAllPostSlugs();
          nodes.forEach((post) => {
            entries.push({
              path: `/blog/${post.slug}`,
              lastModified: new Date(post.modified),
              changeFrequency: SITEMAP.changeFrequency.post,
              priority: SITEMAP.priority.post,
            });
          });
        } catch (error) {
          console.error("Sitemap posts:", error);
        }
      } else {
        try {
          const posts = await getPosts();
          posts.forEach((post) => {
            entries.push({
              path: `/blog/${post.slug}`,
              lastModified: new Date(post.modified ?? now),
              changeFrequency: SITEMAP.changeFrequency.post,
              priority: SITEMAP.priority.post,
            });
          });
        } catch (error) {
          console.error("Sitemap posts:", error);
        }
      }
      entries.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      return entries;
    },
    ["sitemap-posts"],
    { revalidate: CACHE_REVALIDATE }
  )();
}

export async function getCategoryEntries(): Promise<UrlEntry[]> {
  return unstable_cache(
    async () => {
      const now = new Date();
      const entries: UrlEntry[] = [];
      if (WP_GRAPHQL_URL?.trim()) {
        try {
          const data = await request<{ categories: { nodes: { slug: string }[] } }>(
            GET_ALL_CATEGORY_SLUGS
          );
          (data.categories?.nodes ?? []).forEach((cat) => {
            entries.push({
              path: `/blog/category/${cat.slug}`,
              lastModified: now,
              changeFrequency: SITEMAP.changeFrequency.category,
              priority: SITEMAP.priority.category,
            });
          });
        } catch (error) {
          console.error("Sitemap categories:", error);
        }
      } else {
        try {
          const categories = await getAllCategorySlugs();
          categories.forEach(({ slug }) => {
            entries.push({
              path: `/blog/category/${slug}`,
              lastModified: now,
              changeFrequency: SITEMAP.changeFrequency.category,
              priority: SITEMAP.priority.category,
            });
          });
        } catch (error) {
          console.error("Sitemap categories:", error);
        }
      }
      return entries;
    },
    ["sitemap-categories"],
    { revalidate: CACHE_REVALIDATE }
  )();
}

export async function getTagEntries(): Promise<UrlEntry[]> {
  return unstable_cache(
    async () => {
      const now = new Date();
      const entries: UrlEntry[] = [];
      if (WP_GRAPHQL_URL?.trim()) {
        try {
          const data = await request<{ tags: { nodes: { slug: string }[] } }>(GET_ALL_TAG_SLUGS);
          (data.tags?.nodes ?? []).forEach((tag) => {
            entries.push({
              path: `/blog/tag/${tag.slug}`,
              lastModified: now,
              changeFrequency: SITEMAP.changeFrequency.tag,
              priority: SITEMAP.priority.tag,
            });
          });
        } catch (error) {
          console.error("Sitemap tags:", error);
        }
      } else {
        try {
          const posts = await getPosts();
          const tags = getTagsFromPosts(posts);
          tags.forEach(({ slug }) => {
            entries.push({
              path: `/blog/tag/${slug}`,
              lastModified: now,
              changeFrequency: SITEMAP.changeFrequency.tag,
              priority: SITEMAP.priority.tag,
            });
          });
        } catch (error) {
          console.error("Sitemap tags:", error);
        }
      }
      return entries;
    },
    ["sitemap-tags"],
    { revalidate: CACHE_REVALIDATE }
  )();
}
