/**
 * POST /api/gsc/suggestions
 *
 * Body: { pagePath: string, force?: boolean }
 *
 * Loads cached GSC data for the page (forces a sync if missing or stale),
 * pulls the page's content (blog: WPGraphQL via getPostBySlug; static: HTTP
 * fetch + main extraction), runs auditArticle for context, and asks Claude
 * for ranked improvement suggestions. Persists suggestions to page_insights
 * and returns them. Returns the cached suggestions when already present
 * unless `force=true`.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getPagePerformance,
  getStrikingDistanceQueries,
  isGscConfigured,
  type GscRow,
} from "@/lib/google-search-console";
import {
  getPageInsight,
  upsertGscData,
  upsertSuggestions,
  isStale,
} from "@/lib/db/page-insights";
import { generateGscSuggestions } from "@/lib/seo/gsc-suggestions";
import { getPostBySlug } from "@/lib/blog/data";
import { auditArticle, stripHtml, type ArticleAuditResult } from "@/lib/seo/article-audit";

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_TTL_MS = process.env.GSC_CACHE_TTL_SEC
  ? Number(process.env.GSC_CACHE_TTL_SEC) * 1000
  : DEFAULT_TTL_MS;
const SUGGESTION_TTL_MS = 24 * 60 * 60 * 1000;

function classifyPath(path: string): { type: "blog" | "static"; postSlug: string | null } {
  if (path.startsWith("/blog/")) {
    const slug = path.replace(/^\/blog\//, "").replace(/\/$/, "");
    return { type: "blog", postSlug: slug || null };
  }
  return { type: "static", postSlug: null };
}

function normalizePath(input: string): string {
  if (!input) return "/";
  let path = input.trim();
  if (/^https?:\/\//i.test(path)) {
    try {
      path = new URL(path).pathname;
    } catch {
      // Fall through
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

function decodeHtmlTitle(html: string): string {
  return html
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function fetchStaticPageContent(
  path: string
): Promise<{ title: string; metaDescription: string | undefined; contentText: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kolavistudio.com";
  const fullUrl = `${siteUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(fullUrl, {
    headers: { "User-Agent": "KolaviStudio-Dashboard/1.0 GSC-Insights" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${fullUrl}: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlTitle(titleMatch[1]) : path;

  const metaMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  const metaDescription = metaMatch ? decodeHtmlTitle(metaMatch[1]) : undefined;

  const mainMatch = html.match(/<main[\s\S]*?>([\s\S]*?)<\/main>/i);
  const inner = mainMatch ? mainMatch[1] : html;
  const contentText = stripHtml(inner)
    .replace(/\s+/g, " ")
    .trim();

  return { title, metaDescription, contentText };
}

async function loadPageContent(
  path: string,
  type: "blog" | "static",
  postSlug: string | null
): Promise<{ title: string; metaDescription: string | undefined; contentText: string }> {
  if (type === "blog" && postSlug) {
    const post = await getPostBySlug(postSlug);
    if (post) {
      return {
        title: decodeHtmlTitle(post.title ?? postSlug),
        metaDescription: post.excerpt ? decodeHtmlTitle(stripHtml(post.excerpt)) : undefined,
        contentText: stripHtml(post.content ?? "").replace(/\s+/g, " ").trim(),
      };
    }
  }
  return fetchStaticPageContent(path);
}

function buildAuditInput(
  title: string,
  metaDescription: string | undefined,
  contentText: string,
  postSlug: string | null
): ArticleAuditResult | undefined {
  try {
    return auditArticle({
      title,
      metaDescription: metaDescription ?? "",
      content: contentText,
      slug: postSlug ?? "",
    });
  } catch (err) {
    console.warn("auditArticle failed inside /api/gsc/suggestions:", err);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isGscConfigured()) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_SERVICE_ACCOUNT_JSON env var is not set. Configure the service account and add it to the Search Console property.",
      },
      { status: 501 }
    );
  }

  let body: { pagePath?: string; force?: boolean };
  try {
    body = (await request.json()) as { pagePath?: string; force?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.pagePath) {
    return NextResponse.json({ error: "Missing pagePath" }, { status: 400 });
  }
  const path = normalizePath(body.pagePath);
  const force = body.force === true;
  const { type, postSlug } = classifyPath(path);

  try {
    let row = await getPageInsight(path);
    const gscStale = !row || isStale(row.last_synced_at, CACHE_TTL_MS);
    if (gscStale) {
      const performance = await getPagePerformance(path);
      await upsertGscData(path, type, postSlug, performance);
      row = await getPageInsight(path);
    }
    if (!row?.gsc_data) {
      return NextResponse.json({ error: "Failed to load GSC data" }, { status: 500 });
    }

    const suggestionsFresh =
      row.ai_suggestions &&
      !force &&
      !isStale(row.suggestion_generated_at, SUGGESTION_TTL_MS);
    if (suggestionsFresh) {
      return NextResponse.json({
        suggestions: row.ai_suggestions,
        gsc: row.gsc_data,
        fromCache: true,
      });
    }

    const { title, metaDescription, contentText } = await loadPageContent(path, type, postSlug);
    const audit = buildAuditInput(title, metaDescription, contentText, postSlug);

    let strikingDistance: GscRow[] = [];
    try {
      const allStriking = await getStrikingDistanceQueries(28);
      strikingDistance = allStriking.filter((r) => {
        const pageKey = r.keys[1];
        if (!pageKey) return false;
        try {
          const u = new URL(pageKey);
          return normalizePath(u.pathname) === path;
        } catch {
          return pageKey.includes(path);
        }
      });
    } catch (err) {
      console.warn("striking-distance fetch failed:", err);
    }

    const suggestions = await generateGscSuggestions({
      pagePath: path,
      pageTitle: title,
      metaDescription,
      contentText,
      gsc: {
        topQueries: row.gsc_data.topQueries,
        strikingDistance,
        totals: row.gsc_data.totals,
      },
      audit,
    });

    await upsertSuggestions(path, suggestions);

    return NextResponse.json({
      suggestions,
      gsc: row.gsc_data,
      fromCache: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/gsc/suggestions error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
