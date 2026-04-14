/**
 * Google Search Console - Search Analytics API client.
 *
 * Reuses the OAuth2 access-token flow from google-indexing.ts (do NOT add
 * a second token cache). Same service account, same env vars:
 *   - GOOGLE_SERVICE_ACCOUNT_JSON  (single-line JSON key)
 *   - GOOGLE_SEARCH_CONSOLE_SITE_URL  (e.g. "sc-domain:kolavistudio.com")
 *
 * The service account email must be added under the GSC property's
 * "Users and permissions" with at least Restricted access.
 */

import { getAccessToken } from "./google-indexing";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GscDimension =
  | "page"
  | "query"
  | "device"
  | "country"
  | "date"
  | "searchAppearance";

export type GscRow = {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscFilterOperator = "equals" | "contains" | "notContains" | "notEquals";

export type GscFilter = {
  dimension: GscDimension;
  operator: GscFilterOperator;
  expression: string;
};

export type GscFilterGroup = {
  filters: GscFilter[];
  groupType?: "and";
};

export type GscQueryOpts = {
  startDate: string;
  endDate: string;
  dimensions: GscDimension[];
  rowLimit?: number;
  startRow?: number;
  dimensionFilterGroups?: GscFilterGroup[];
  type?: "web" | "image" | "video" | "news" | "discover" | "googleNews";
  dataState?: "all" | "final";
  aggregationType?: "auto" | "byPage" | "byProperty";
};

export type GscTotals = {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export type GscPagePerformance = {
  url: string;
  totals: GscTotals;
  topQueries: GscRow[];
  byDevice: GscRow[];
  periodDays: number;
  fetchedAt: string;
};

export type GscDecliningPage = GscRow & {
  prior: { clicks: number; position: number; impressions: number };
  deltaClicks: number;
  deltaPosition: number;
  deltaImpressions: number;
};

const SC_API_BASE = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function getSiteUrl(): string {
  return process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "sc-domain:kolavistudio.com";
}

export function isGscConfigured(): boolean {
  return !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
}

function formatDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return formatDate(d);
}

function today(): string {
  return formatDate(new Date());
}

function totalsFromRows(rows: GscRow[]): GscTotals {
  if (rows.length === 0) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
  }
  let clicks = 0;
  let impressions = 0;
  let positionSum = 0;
  let positionCount = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
    if (row.impressions > 0) {
      positionSum += row.position * row.impressions;
      positionCount += row.impressions;
    }
  }
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: positionCount > 0 ? positionSum / positionCount : 0,
  };
}

// ---------------------------------------------------------------------------
// Core API call
// ---------------------------------------------------------------------------

export async function querySearchAnalytics(opts: GscQueryOpts): Promise<GscRow[]> {
  if (!isGscConfigured()) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not set");
  }
  const token = await getAccessToken(WEBMASTERS_SCOPE);
  const siteUrl = getSiteUrl();
  const endpoint = `${SC_API_BASE}/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const body = {
    startDate: opts.startDate,
    endDate: opts.endDate,
    dimensions: opts.dimensions,
    rowLimit: opts.rowLimit ?? 1000,
    startRow: opts.startRow ?? 0,
    dataState: opts.dataState ?? "all",
    type: opts.type ?? "web",
    ...(opts.dimensionFilterGroups && { dimensionFilterGroups: opts.dimensionFilterGroups }),
    ...(opts.aggregationType && { aggregationType: opts.aggregationType }),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GSC searchAnalytics ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

// ---------------------------------------------------------------------------
// High-level helpers
// ---------------------------------------------------------------------------

/**
 * Fetch performance for a single page URL (or path). Returns totals plus
 * top queries and device breakdown over the period. Pass either a full URL
 * or a path - the function resolves it against the site URL prefix when
 * the configured site is a URL-prefix property.
 */
export async function getPagePerformance(
  pathOrUrl: string,
  days: number = 28
): Promise<GscPagePerformance> {
  const fullUrl = resolvePageUrl(pathOrUrl);
  const startDate = daysAgo(days);
  const endDate = today();

  const pageFilter: GscFilterGroup = {
    filters: [{ dimension: "page", operator: "equals", expression: fullUrl }],
  };

  const [byQueryRows, byDeviceRows] = await Promise.all([
    querySearchAnalytics({
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 100,
      dimensionFilterGroups: [pageFilter],
    }),
    querySearchAnalytics({
      startDate,
      endDate,
      dimensions: ["device"],
      rowLimit: 10,
      dimensionFilterGroups: [pageFilter],
    }),
  ]);

  const topQueries = [...byQueryRows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 50);

  return {
    url: fullUrl,
    totals: totalsFromRows(byQueryRows),
    topQueries,
    byDevice: byDeviceRows,
    periodDays: days,
    fetchedAt: new Date().toISOString(),
  };
}

/** Top pages site-wide, sorted by clicks descending. */
export async function getTopPages(days: number = 28, limit: number = 100): Promise<GscRow[]> {
  return querySearchAnalytics({
    startDate: daysAgo(days),
    endDate: today(),
    dimensions: ["page"],
    rowLimit: limit,
    aggregationType: "byPage",
  });
}

/**
 * "Striking distance" queries - rows at positions 5 to 15 with at least 50
 * impressions, sorted by impressions desc. These are the fastest ranking
 * wins per the SEO research.
 */
export async function getStrikingDistanceQueries(days: number = 28): Promise<GscRow[]> {
  const rows = await querySearchAnalytics({
    startDate: daysAgo(days),
    endDate: today(),
    dimensions: ["query", "page"],
    rowLimit: 5000,
  });

  return rows
    .filter((r) => r.position >= 5 && r.position <= 15 && r.impressions >= 50)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 100);
}

/**
 * Pages whose clicks dropped significantly vs the prior period of equal
 * length. Returns rows enriched with prior-period metrics and deltas.
 */
export async function getDecliningPages(days: number = 28): Promise<GscDecliningPage[]> {
  const currentEnd = today();
  const currentStart = daysAgo(days);
  const priorEnd = daysAgo(days + 1);
  const priorStart = daysAgo(days * 2);

  const [currentRows, priorRows] = await Promise.all([
    querySearchAnalytics({
      startDate: currentStart,
      endDate: currentEnd,
      dimensions: ["page"],
      rowLimit: 500,
      aggregationType: "byPage",
    }),
    querySearchAnalytics({
      startDate: priorStart,
      endDate: priorEnd,
      dimensions: ["page"],
      rowLimit: 500,
      aggregationType: "byPage",
    }),
  ]);

  const priorByPage = new Map<string, GscRow>();
  for (const row of priorRows) {
    priorByPage.set(row.keys[0], row);
  }

  const declining: GscDecliningPage[] = [];
  for (const row of currentRows) {
    const prior = priorByPage.get(row.keys[0]);
    if (!prior) continue;
    const deltaClicks = row.clicks - prior.clicks;
    if (deltaClicks >= 0) continue;
    declining.push({
      ...row,
      prior: { clicks: prior.clicks, position: prior.position, impressions: prior.impressions },
      deltaClicks,
      deltaPosition: row.position - prior.position,
      deltaImpressions: row.impressions - prior.impressions,
    });
  }

  return declining.sort((a, b) => a.deltaClicks - b.deltaClicks).slice(0, 50);
}

/**
 * Resolve a path (e.g. "/blog/foo") to the full URL expected by GSC.
 * For sc-domain properties, the GSC API still expects fully-qualified URLs
 * in filters - we use the public site URL constant.
 */
export function resolvePageUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kolavistudio.com";
  const cleanedSite = publicSiteUrl.replace(/\/$/, "");
  const cleanedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanedSite}${cleanedPath}`;
}
