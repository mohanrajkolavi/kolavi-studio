/**
 * GET /api/gsc/sync?path=/blog/foo[&force=1]
 *
 * Fetches Google Search Console performance for a single page and caches it
 * in `page_insights`. Returns the cached row. Honors a 6-hour TTL unless
 * `force=1` is passed. Returns 401 if not authenticated, 501 when the GSC
 * service account env var is missing.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getPagePerformance,
  isGscConfigured,
} from "@/lib/google-search-console";
import {
  getPageInsight,
  upsertGscData,
  isStale,
} from "@/lib/db/page-insights";

const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_TTL_MS = process.env.GSC_CACHE_TTL_SEC
  ? Number(process.env.GSC_CACHE_TTL_SEC) * 1000
  : DEFAULT_TTL_MS;

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
      // Fall through with raw string
    }
  }
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

export async function GET(request: NextRequest) {
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

  const rawPath = request.nextUrl.searchParams.get("path");
  if (!rawPath) {
    return NextResponse.json({ error: "Missing required ?path param" }, { status: 400 });
  }
  const path = normalizePath(rawPath);
  const force = request.nextUrl.searchParams.get("force") === "1";

  try {
    const existing = await getPageInsight(path);
    const fresh = existing && !force && !isStale(existing.last_synced_at, CACHE_TTL_MS);
    if (fresh) {
      return NextResponse.json({ row: existing, fromCache: true });
    }

    const { type, postSlug } = classifyPath(path);
    const performance = await getPagePerformance(path);
    await upsertGscData(path, type, postSlug, performance);

    const updated = await getPageInsight(path);
    return NextResponse.json({ row: updated, fromCache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/gsc/sync error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
