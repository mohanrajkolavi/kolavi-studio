import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { assertSafePublicUrl, isSafePublicUrl, SsrfBlockedError } from "@/lib/security/url-guard";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/logging/error";

export const maxDuration = 60;

const RATE_LIMIT_WINDOW_SEC = 86400; // 24 hours
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_BUCKET = "sitemap-generator";
const hasDb = !!process.env.DATABASE_URL;

/* ------------------------------------------------------------------ */
/*  Crawler Types & Config                                             */
/* ------------------------------------------------------------------ */

interface CrawlConfig {
  startUrl: string;
  maxPages: number;
  maxDepth: number;
  disallowedPaths: string[];
  includePaths: string[];
  excludePaths: string[];
  globalSignal: AbortSignal;
}

interface CrawledPage {
  loc: string;
  depth: number;
  lastmod?: string;
}

const SKIP_EXTENSIONS = new Set([
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
  ".css", ".js", ".mjs", ".map", ".json",
  ".zip", ".tar", ".gz", ".rar",
  ".mp4", ".mp3", ".avi", ".mov", ".webm",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".xml", ".rss", ".atom",
]);

const MAX_CONCURRENT = 5;

/* ------------------------------------------------------------------ */
/*  Robots.txt                                                         */
/* ------------------------------------------------------------------ */

async function fetchRobotsTxt(origin: string, signal: AbortSignal): Promise<string[]> {
  try {
    const robotsUrl = `${origin}/robots.txt`;
    if (!(await isSafePublicUrl(robotsUrl))) return [];
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.any([signal, AbortSignal.timeout(5_000)]),
      headers: { "User-Agent": "KolaviSitemapBot/1.0" },
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) return [];
    if (!res.ok) return [];
    const text = await res.text();
    const disallowed: string[] = [];
    let inWildcard = false;
    for (const line of text.split("\n")) {
      const trimmed = line.trim().toLowerCase();
      if (trimmed.startsWith("user-agent:")) {
        const agent = trimmed.slice("user-agent:".length).trim();
        inWildcard = agent === "*" || agent === "kolavisitemapbot";
      } else if (inWildcard && trimmed.startsWith("disallow:")) {
        const path = line.trim().slice("disallow:".length).trim();
        if (path) disallowed.push(path);
      }
    }
    return disallowed;
  } catch {
    return [];
  }
}

function isAllowed(pathname: string, disallowed: string[]): boolean {
  for (const rule of disallowed) {
    if (rule.endsWith("*")) {
      if (pathname.startsWith(rule.slice(0, -1))) return false;
    } else if (pathname === rule || pathname.startsWith(rule)) {
      return false;
    }
  }
  return true;
}

/* ------------------------------------------------------------------ */
/*  URL Normalization                                                  */
/* ------------------------------------------------------------------ */

function normalizeUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    u.hash = "";
    // Remove default ports
    if ((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) {
      u.port = "";
    }
    // Lowercase hostname
    let normalized = u.toString();
    // Remove trailing slash except for root
    if (normalized.endsWith("/") && u.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return urlStr;
  }
}

function hasSkippableExtension(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  const dotIdx = lower.lastIndexOf(".");
  if (dotIdx === -1) return false;
  return SKIP_EXTENSIONS.has(lower.slice(dotIdx));
}

/* ------------------------------------------------------------------ */
/*  BFS Crawler                                                        */
/* ------------------------------------------------------------------ */

function matchesPathFilter(urlStr: string, patterns: string[]): boolean {
  if (patterns.length === 0) return false;
  try {
    const pathname = new URL(urlStr).pathname;
    return patterns.some((p) => pathname.includes(p));
  } catch {
    return false;
  }
}

async function crawlSite(config: CrawlConfig): Promise<CrawledPage[]> {
  const { startUrl, maxPages, maxDepth, disallowedPaths, includePaths, excludePaths, globalSignal } = config;
  const origin = new URL(startUrl).origin;
  const visited = new Set<string>();
  const results: CrawledPage[] = [];
  const queue: { url: string; depth: number }[] = [{ url: normalizeUrl(startUrl), depth: 0 }];

  while (queue.length > 0 && results.length < maxPages) {
    if (globalSignal.aborted) break;

    // Take a batch from the queue
    const batch = queue.splice(0, MAX_CONCURRENT);
    const fetchPromises = batch.map(async ({ url, depth }) => {
      const normalized = normalizeUrl(url);
      if (visited.has(normalized)) return;
      if (depth > maxDepth) return;

      const parsedUrl = new URL(normalized);
      if (parsedUrl.origin !== origin) return;
      if (hasSkippableExtension(parsedUrl.pathname)) return;
      if (!isAllowed(parsedUrl.pathname, disallowedPaths)) return;
      if (excludePaths.length > 0 && matchesPathFilter(normalized, excludePaths)) return;
      if (includePaths.length > 0 && !matchesPathFilter(normalized, includePaths)) return;

      visited.add(normalized);

      try {
        // Re-validate every URL before fetching - the start URL passed the check but discovered
        // links or later DNS responses could still resolve to private IPs.
        if (!(await isSafePublicUrl(normalized))) return;

        const res = await fetch(normalized, {
          signal: AbortSignal.any([globalSignal, AbortSignal.timeout(10_000)]),
          headers: { "User-Agent": "KolaviSitemapBot/1.0" },
          redirect: "manual",
        });

        // Follow at most one redirect, after re-validating the destination.
        if (res.status >= 300 && res.status < 400) {
          const location = res.headers.get("location");
          if (!location) return;
          let redirectTarget: string;
          try {
            redirectTarget = new URL(location, normalized).toString();
          } catch {
            return;
          }
          const redirectParsed = new URL(redirectTarget);
          if (redirectParsed.origin !== origin) return;
          if (!(await isSafePublicUrl(redirectTarget))) return;
          // Fall through by re-queuing; don't fetch twice in this slot.
          if (!visited.has(normalizeUrl(redirectTarget))) {
            queue.push({ url: redirectTarget, depth });
          }
          return;
        }

        if (!res.ok) return;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) return;

        const lastModified = res.headers.get("last-modified");
        const html = await res.text();

        // Only add if we haven't hit the limit
        if (results.length >= maxPages) return;

        results.push({
          loc: normalized,
          depth,
          lastmod: lastModified
            ? new Date(lastModified).toISOString().split("T")[0]
            : undefined,
        });

        // Extract links
        const $ = cheerio.load(html);
        $("a[href]").each((_, el) => {
          if (results.length + queue.length >= maxPages * 3) return; // Don't over-queue

          const href = $(el).attr("href");
          if (!href) return;
          if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

          try {
            const resolved = new URL(href, normalized);
            if (resolved.origin !== origin) return;
            resolved.hash = "";
            const resolvedNorm = normalizeUrl(resolved.toString());
            if (!visited.has(resolvedNorm)) {
              queue.push({ url: resolvedNorm, depth: depth + 1 });
            }
          } catch {
            // Invalid URL, skip
          }
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        // Network error, timeout, etc. - skip silently
      }
    });

    await Promise.allSettled(fetchPromises);
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  XML Generation                                                     */
/* ------------------------------------------------------------------ */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function depthToPriority(depth: number): string {
  if (depth === 0) return "1.0";
  if (depth === 1) return "0.8";
  if (depth === 2) return "0.6";
  if (depth === 3) return "0.4";
  return "0.2";
}

interface SitemapUrlEntry {
  loc: string;
  depth: number;
  lastmod?: string;
  priority?: string;
  changefreq?: string;
}

interface XmlGenOptions {
  changeFreq?: string;
  priorityMode: string;
  customPriority?: number;
  lastmodMode: string;
}

function generateSitemapXml(
  pages: CrawledPage[],
  options: XmlGenOptions
): { xml: string; urls: SitemapUrlEntry[] } {
  const { changeFreq, priorityMode, customPriority, lastmodMode } = options;
  const today = new Date().toISOString().split("T")[0];

  const urls: SitemapUrlEntry[] = pages.map((page) => {
    let lastmod: string | undefined;
    if (lastmodMode === "today") lastmod = today;
    else if (lastmodMode === "crawl") lastmod = page.lastmod;
    // "none" = no lastmod

    let priority: string | undefined;
    if (priorityMode === "auto") priority = depthToPriority(page.depth);
    else if (priorityMode === "custom") priority = (customPriority ?? 0.5).toFixed(1);
    // "none" = no priority

    return {
      loc: page.loc,
      depth: page.depth,
      lastmod,
      priority,
      changefreq: changeFreq,
    };
  });

  const urlEntries = urls
    .map((u) => {
      let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>`;
      if (u.lastmod) entry += `\n    <lastmod>${u.lastmod}</lastmod>`;
      if (u.changefreq) entry += `\n    <changefreq>${u.changefreq}</changefreq>`;
      if (u.priority) entry += `\n    <priority>${u.priority}</priority>`;
      entry += "\n  </url>";
      return entry;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  return { xml, urls };
}

/* ------------------------------------------------------------------ */
/*  POST Handler                                                       */
/* ------------------------------------------------------------------ */

const VALID_MAX_PAGES = new Set([10, 25, 50, 100, 250, 500]);
const VALID_CHANGE_FREQ = new Set(["daily", "weekly", "monthly", "yearly"]);

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip) {
      return NextResponse.json({ error: "Unable to verify request origin." }, { status: 400 });
    }

    const { allowed } = await checkRateLimit(RATE_LIMIT_BUCKET, ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SEC);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily limit reached (3 sitemaps per day). Please try again tomorrow." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      url: rawUrl,
      maxPages: rawMaxPages,
      crawlDepth: rawDepth,
      changeFreq: rawFreq,
      lastmodMode: rawLastmod,
      priorityMode,
      customPriority,
      includePaths: rawInclude,
      excludePaths: rawExclude,
    } = body;

    // Validate URL
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl.trim());
    } catch {
      return NextResponse.json({ error: "Invalid URL. Please enter a valid website URL (e.g., https://example.com)." }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "URL must start with http:// or https://." }, { status: 400 });
    }

    try {
      await assertSafePublicUrl(parsedUrl.toString());
    } catch (err) {
      if (err instanceof SsrfBlockedError) {
        return NextResponse.json(
          { error: "URL is not allowed. Use a public http(s) website address." },
          { status: 400 }
        );
      }
      throw err;
    }

    const startUrl = parsedUrl.toString();

    // Validate options
    const maxPages = VALID_MAX_PAGES.has(Number(rawMaxPages)) ? Number(rawMaxPages) : 100;
    const crawlDepth = Math.min(Math.max(Number(rawDepth) || 2, 1), 5);
    const changeFreq = VALID_CHANGE_FREQ.has(rawFreq) ? rawFreq : undefined;
    const lastmodMode = ["none", "today", "crawl"].includes(rawLastmod) ? rawLastmod : "today";
    const priority = priorityMode === "custom" ? Math.min(Math.max(Number(customPriority) || 0.5, 0.1), 1.0) : undefined;

    // Parse include/exclude paths
    const includePaths = typeof rawInclude === "string"
      ? rawInclude.split("\n").map((p: string) => p.trim()).filter(Boolean).slice(0, 20)
      : [];
    const excludePaths = typeof rawExclude === "string"
      ? rawExclude.split("\n").map((p: string) => p.trim()).filter(Boolean).slice(0, 20)
      : [];

    const startTime = Date.now();

    // Fetch robots.txt
    const globalAbort = new AbortController();
    const timeout = setTimeout(() => globalAbort.abort(), 55_000);
    let robotsTxtFound = false;

    try {
      const disallowedPaths = await fetchRobotsTxt(parsedUrl.origin, globalAbort.signal);
      robotsTxtFound = disallowedPaths.length > 0;

      // Crawl
      const pages = await crawlSite({
        startUrl,
        maxPages,
        maxDepth: crawlDepth,
        disallowedPaths,
        includePaths,
        excludePaths,
        globalSignal: globalAbort.signal,
      });

      const crawlTimeMs = Date.now() - startTime;

      if (pages.length === 0) {
        return NextResponse.json(
          { error: "No pages found. The site may be blocking our crawler, require JavaScript to render, or the URL may be incorrect." },
          { status: 422 }
        );
      }

      // Sort by depth then alphabetically
      pages.sort((a, b) => a.depth - b.depth || a.loc.localeCompare(b.loc));

      // Generate XML
      const { xml, urls } = generateSitemapXml(pages, {
        changeFreq,
        priorityMode: priorityMode || "auto",
        customPriority: priority,
        lastmodMode,
      });

      // Store lead (fire-and-forget)
      if (hasDb) {
        import("@/lib/db").then(({ sql }) =>
          sql`
            INSERT INTO leads (id, name, message, source, status, created_at)
            VALUES (
              gen_random_uuid(),
              ${parsedUrl.hostname},
              ${`Sitemap: ${pages.length} URLs | depth ${crawlDepth} | ${changeFreq || "no-freq"}`},
              'sitemap_generator',
              'new',
              NOW()
            )
          `.catch(() => {})
        ).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        xml,
        urls,
        stats: {
          totalUrls: pages.length,
          crawlDepth,
          crawlTimeMs,
          robotsTxtFound,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    logError("sitemap-generator", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
