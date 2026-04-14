/**
 * GET /api/gsc/overview?days=28
 *
 * Returns a site-wide GSC overview: top pages, striking-distance queries,
 * and declining pages, all in parallel. Cached in-memory for 30 minutes per
 * `days` value to keep the Rankings dashboard cheap on repeat loads.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  getDecliningPages,
  getStrikingDistanceQueries,
  getTopPages,
  isGscConfigured,
  type GscDecliningPage,
  type GscRow,
} from "@/lib/google-search-console";

type OverviewPayload = {
  days: number;
  topPages: GscRow[];
  strikingDistance: GscRow[];
  declining: GscDecliningPage[];
  totals: { clicks: number; impressions: number; pages: number };
  generatedAt: string;
};

const OVERVIEW_TTL_MS = 30 * 60 * 1000;
const overviewCache = new Map<number, { payload: OverviewPayload; expiresAt: number }>();

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

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = (() => {
    const parsed = Number(daysParam);
    if (!Number.isFinite(parsed) || parsed < 1) return 28;
    return Math.min(Math.floor(parsed), 90);
  })();
  const force = request.nextUrl.searchParams.get("force") === "1";

  const cached = overviewCache.get(days);
  if (!force && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.payload, fromCache: true });
  }

  try {
    const [topPages, strikingDistance, declining] = await Promise.all([
      getTopPages(days, 100),
      getStrikingDistanceQueries(days),
      getDecliningPages(days),
    ]);

    let totalClicks = 0;
    let totalImpressions = 0;
    for (const page of topPages) {
      totalClicks += page.clicks;
      totalImpressions += page.impressions;
    }

    const payload: OverviewPayload = {
      days,
      topPages,
      strikingDistance,
      declining,
      totals: {
        clicks: totalClicks,
        impressions: totalImpressions,
        pages: topPages.length,
      },
      generatedAt: new Date().toISOString(),
    };

    overviewCache.set(days, { payload, expiresAt: Date.now() + OVERVIEW_TTL_MS });
    return NextResponse.json({ ...payload, fromCache: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/gsc/overview error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
