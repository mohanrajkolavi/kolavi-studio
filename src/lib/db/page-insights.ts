/**
 * Database helper for the page_insights table (GSC + AI suggestions cache).
 * Uses the lazy tableEnsured pattern from content-maintenance/route.ts:17-36
 * so first request creates the table without manual migration.
 */

import { sql } from "@/lib/db";
import type { GscPagePerformance } from "@/lib/google-search-console";
import type { GscSuggestion } from "@/lib/seo/gsc-suggestions";

export type PageInsightRow = {
  page_path: string;
  page_type: "blog" | "static";
  post_slug: string | null;
  gsc_data: GscPagePerformance | null;
  ai_suggestions: { items: GscSuggestion[]; model: string; tokens: { input: number; output: number } } | null;
  last_synced_at: Date | null;
  suggestion_generated_at: Date | null;
  updated_at: Date;
};

let tableEnsured = false;

export async function ensurePageInsightsTable(): Promise<void> {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS page_insights (
      page_path TEXT PRIMARY KEY,
      page_type VARCHAR(20) NOT NULL,
      post_slug VARCHAR(255),
      gsc_data JSONB,
      ai_suggestions JSONB,
      last_synced_at TIMESTAMPTZ,
      suggestion_generated_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_insights_type ON page_insights(page_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_insights_slug ON page_insights(post_slug)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_page_insights_synced ON page_insights(last_synced_at DESC NULLS LAST)`;
  tableEnsured = true;
}

export async function getPageInsight(path: string): Promise<PageInsightRow | null> {
  await ensurePageInsightsTable();
  const rows = (await sql`
    SELECT page_path, page_type, post_slug, gsc_data, ai_suggestions,
           last_synced_at, suggestion_generated_at, updated_at
    FROM page_insights
    WHERE page_path = ${path}
    LIMIT 1
  `) as unknown as PageInsightRow[];
  return rows[0] ?? null;
}

export async function upsertGscData(
  path: string,
  type: "blog" | "static",
  postSlug: string | null,
  gscData: GscPagePerformance
): Promise<void> {
  await ensurePageInsightsTable();
  const json = JSON.stringify(gscData);
  await sql`
    INSERT INTO page_insights (page_path, page_type, post_slug, gsc_data, last_synced_at, updated_at)
    VALUES (${path}, ${type}, ${postSlug}, ${json}::jsonb, NOW(), NOW())
    ON CONFLICT (page_path) DO UPDATE SET
      page_type = EXCLUDED.page_type,
      post_slug = EXCLUDED.post_slug,
      gsc_data = EXCLUDED.gsc_data,
      last_synced_at = NOW(),
      updated_at = NOW()
  `;
}

export async function upsertSuggestions(
  path: string,
  suggestions: { items: GscSuggestion[]; model: string; tokens: { input: number; output: number } }
): Promise<void> {
  await ensurePageInsightsTable();
  const json = JSON.stringify(suggestions);
  await sql`
    UPDATE page_insights
    SET ai_suggestions = ${json}::jsonb,
        suggestion_generated_at = NOW(),
        updated_at = NOW()
    WHERE page_path = ${path}
  `;
}

export async function listSyncedInsights(limit: number = 200): Promise<PageInsightRow[]> {
  await ensurePageInsightsTable();
  return (await sql`
    SELECT page_path, page_type, post_slug, gsc_data, ai_suggestions,
           last_synced_at, suggestion_generated_at, updated_at
    FROM page_insights
    ORDER BY last_synced_at DESC NULLS LAST
    LIMIT ${limit}
  `) as unknown as PageInsightRow[];
}

export function isStale(syncedAt: Date | string | null, ttlMs: number): boolean {
  if (!syncedAt) return true;
  const ts = typeof syncedAt === "string" ? new Date(syncedAt).getTime() : syncedAt.getTime();
  return Date.now() - ts > ttlMs;
}
