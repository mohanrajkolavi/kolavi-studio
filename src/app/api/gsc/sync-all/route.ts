/**
 * POST /api/gsc/sync-all
 *
 * Body: { scope?: "all" | "blog" | "static", offset?: number, force?: boolean }
 *
 * Paginated bulk GSC sync. Processes 25 pages per invocation with 200ms gaps
 * to stay under the 60s Vercel function timeout and the GSC 50k-rows-per-day
 * quota. Returns { synced, failed, total, nextOffset }. Dashboard button
 * loops until `nextOffset === null`.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPagePerformance, isGscConfigured } from "@/lib/google-search-console";
import { upsertGscData, getPageInsight, isStale } from "@/lib/db/page-insights";
import { ALL_STATIC_PATHS } from "@/lib/site/static-pages";
import { getPosts } from "@/lib/blog/data";

const PAGE_SIZE = 25;
const PAGE_GAP_MS = 200;
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_TTL_MS = process.env.GSC_CACHE_TTL_SEC
  ? Number(process.env.GSC_CACHE_TTL_SEC) * 1000
  : DEFAULT_TTL_MS;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ScopeFilter = "all" | "blog" | "static";

type Target = { path: string; type: "blog" | "static"; postSlug: string | null };

async function buildTargets(scope: ScopeFilter): Promise<Target[]> {
  const targets: Target[] = [];

  if (scope === "all" || scope === "static") {
    for (const path of ALL_STATIC_PATHS) {
      targets.push({ path, type: "static", postSlug: null });
    }
  }

  if (scope === "all" || scope === "blog") {
    try {
      const posts = await getPosts();
      for (const post of posts) {
        targets.push({
          path: `/blog/${post.slug}`,
          type: "blog",
          postSlug: post.slug,
        });
      }
    } catch (err) {
      console.warn("sync-all could not load blog posts:", err);
    }
  }

  return targets;
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

  let body: { scope?: ScopeFilter; offset?: number; force?: boolean };
  try {
    body = (await request.json().catch(() => ({}))) as {
      scope?: ScopeFilter;
      offset?: number;
      force?: boolean;
    };
  } catch {
    body = {};
  }

  const scope: ScopeFilter = body.scope ?? "all";
  const force = body.force === true;
  const offset = Math.max(0, Number(body.offset ?? 0) || 0);

  try {
    const targets = await buildTargets(scope);
    const slice = targets.slice(offset, offset + PAGE_SIZE);

    let synced = 0;
    let failed = 0;
    let skipped = 0;
    const errors: Array<{ path: string; error: string }> = [];

    for (let i = 0; i < slice.length; i++) {
      const target = slice[i];
      try {
        if (!force) {
          const existing = await getPageInsight(target.path);
          if (existing && !isStale(existing.last_synced_at, CACHE_TTL_MS)) {
            skipped += 1;
            continue;
          }
        }
        const performance = await getPagePerformance(target.path);
        await upsertGscData(target.path, target.type, target.postSlug, performance);
        synced += 1;
      } catch (err) {
        failed += 1;
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ path: target.path, error: message });
      }
      if (i < slice.length - 1) {
        await sleep(PAGE_GAP_MS);
      }
    }

    const nextOffset = offset + PAGE_SIZE < targets.length ? offset + PAGE_SIZE : null;

    return NextResponse.json({
      synced,
      failed,
      skipped,
      total: targets.length,
      processed: offset + slice.length,
      nextOffset,
      errors: errors.slice(0, 10),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/gsc/sync-all error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
