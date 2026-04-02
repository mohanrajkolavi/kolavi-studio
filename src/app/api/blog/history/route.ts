import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql, optionalText, optionalInt } from "@/lib/db";

const MAX_HISTORY = 10;

let tableEnsured = false;
async function ensureBlogHistoryTable() {
  if (tableEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS blog_generation_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      focus_keyword TEXT,
      title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      outline JSONB NOT NULL DEFAULT '[]',
      content TEXT NOT NULL,
      suggested_slug TEXT,
      suggested_categories JSONB,
      suggested_tags JSONB,
      generation_time_ms INTEGER,
      schema_markup JSONB,
      audit_result JSONB,
      eeat_feedback JSONB,
      fact_check JSONB,
      source_urls TEXT[],
      token_usage JSONB,
      brief_summary JSONB,
      readability_scores JSONB
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_blog_generation_history_created_at ON blog_generation_history(created_at DESC)`;
  // Add missing columns for tables created before these columns were added
  await sql`
    DO $migrate$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'blog_generation_history' AND column_name = 'focus_keyword'
      ) THEN
        ALTER TABLE blog_generation_history ADD COLUMN focus_keyword TEXT;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'blog_generation_history' AND column_name = 'generation_time_ms'
      ) THEN
        ALTER TABLE blog_generation_history ADD COLUMN generation_time_ms INTEGER;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'blog_generation_history' AND column_name = 'schema_markup'
      ) THEN
        ALTER TABLE blog_generation_history ADD COLUMN schema_markup JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN audit_result JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN eeat_feedback JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN fact_check JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN source_urls TEXT[];
        ALTER TABLE blog_generation_history ADD COLUMN token_usage JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN brief_summary JSONB;
        ALTER TABLE blog_generation_history ADD COLUMN readability_scores JSONB;
      END IF;
    END $migrate$
  `;
  tableEnsured = true;
}
/** Fetch more rows so we can dedupe by keyword and still return up to MAX_HISTORY. */
const FETCH_LIMIT = 80;

export type BlogHistoryRow = {
  id: string;
  created_at: string;
  focus_keyword: string | null;
  title: string;
  meta_description: string;
  outline: string[];
  content: string;
  suggested_slug: string | null;
  suggested_categories: string[] | null;
  suggested_tags: string[] | null;
  generation_time_ms?: number | null;
  // Pipeline metadata
  schema_markup?: Record<string, unknown> | null;
  audit_result?: Record<string, unknown> | null;
  eeat_feedback?: Record<string, unknown> | null;
  fact_check?: Record<string, unknown> | null;
  source_urls?: string[] | null;
  token_usage?: Record<string, unknown>[] | null;
  brief_summary?: Record<string, unknown> | null;
  readability_scores?: Record<string, unknown> | null;
};

type GeneratedContentBody = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
  focusKeyword?: string;
  /** Total generation time in milliseconds. */
  generationTimeMs?: number;
  // Pipeline metadata
  schemaMarkup?: Record<string, unknown>;
  auditResult?: Record<string, unknown>;
  eeatFeedback?: Record<string, unknown>;
  factCheck?: Record<string, unknown>;
  sourceUrls?: string[];
  tokenUsage?: Record<string, unknown>[];
  briefSummary?: Record<string, unknown>;
  readabilityScores?: Record<string, unknown>;
};

function normalizeKeyword(kw: string | null | undefined): string {
  if (kw == null || typeof kw !== "string") return "";
  return kw.trim().toLowerCase();
}

/** Dedupe by focus_keyword: for the same keyword keep only the latest (by created_at). */
function dedupeByKeyword(rows: BlogHistoryRow[]): BlogHistoryRow[] {
  const byKey = new Map<string, BlogHistoryRow>();
  for (const row of rows) {
    const keyword = normalizeKeyword(row.focus_keyword);
    const key = keyword || `__no_keyword_${row.id}`;
    const existing = byKey.get(key);
    if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
      byKey.set(key, row);
    }
  }
  return Array.from(byKey.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function parseOutline(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : String(x)));
  return [];
}

function parseStringArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.map((x) => (typeof x === "string" ? x : String(x)));
}

/** GET: last 10 entries, one per keyword (latest edited for that keyword). */
/** GET with ?id=...: fetch a single entry by ID. */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.trim()) {
    return NextResponse.json(
      { error: "Blog history not configured (DATABASE_URL missing)" },
      { status: 503 }
    );
  }
  try {
    await ensureBlogHistoryTable();
  } catch (e) {
    console.error("[blog/history] ensure table error:", e);
    return NextResponse.json(
      { error: "Blog history not available (database setup failed)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const rows = await sql`
      SELECT id, created_at, focus_keyword, title, meta_description, outline, content,
             suggested_slug, suggested_categories, suggested_tags, generation_time_ms,
             schema_markup, audit_result, eeat_feedback, fact_check, source_urls,
             token_usage, brief_summary, readability_scores
      FROM blog_generation_history
      WHERE id = ${id}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...row,
      outline: parseOutline(row.outline),
      suggested_categories: parseStringArray(row.suggested_categories),
      suggested_tags: parseStringArray(row.suggested_tags),
    });
  }

  const rows = await sql`
    SELECT id, created_at, focus_keyword, title, meta_description, outline, content,
           suggested_slug, suggested_categories, suggested_tags, generation_time_ms,
           schema_markup, audit_result, eeat_feedback, fact_check, source_urls,
           token_usage, brief_summary, readability_scores
    FROM blog_generation_history
    ORDER BY created_at DESC
    LIMIT ${FETCH_LIMIT}
  `;
  const parsed = rows.map((r) => ({
    ...r,
    outline: parseOutline(r.outline),
    suggested_categories: parseStringArray(r.suggested_categories),
    suggested_tags: parseStringArray(r.suggested_tags),
  }));
  const deduped = dedupeByKeyword(parsed as BlogHistoryRow[]);
  return NextResponse.json(deduped.slice(0, MAX_HISTORY));
}

/** POST: insert one entry and trim to last 10. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.trim()) {
    return NextResponse.json(
      { error: "Blog history not configured (DATABASE_URL missing)" },
      { status: 503 }
    );
  }
  try {
    await ensureBlogHistoryTable();
  } catch (e) {
    console.error("[blog/history] ensure table error:", e);
    return NextResponse.json(
      { error: "Blog history not available (database setup failed)" },
      { status: 503 }
    );
  }

  let body: GeneratedContentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    title,
    metaDescription,
    outline,
    content,
    suggestedSlug,
    suggestedCategories,
    suggestedTags,
    focusKeyword,
    generationTimeMs,
    schemaMarkup,
    auditResult,
    eeatFeedback,
    factCheck,
    sourceUrls,
    tokenUsage,
    briefSummary,
    readabilityScores,
  } = body;
  if (
    typeof title !== "string" ||
    typeof metaDescription !== "string" ||
    !Array.isArray(outline) ||
    typeof content !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid: title, metaDescription, outline, content" },
      { status: 400 }
    );
  }

  const suggestedSlugVal = suggestedSlug != null ? String(suggestedSlug).trim() || null : null;
  const suggestedCategoriesVal = Array.isArray(suggestedCategories) ? suggestedCategories : null;
  const suggestedTagsVal = Array.isArray(suggestedTags) ? suggestedTags : null;
  const focusKeywordVal =
    focusKeyword != null && typeof focusKeyword === "string" && focusKeyword.trim()
      ? focusKeyword.trim()
      : null;
  const generationTimeMsVal =
    typeof generationTimeMs === "number" && Number.isFinite(generationTimeMs) && generationTimeMs >= 0
      ? Math.round(generationTimeMs)
      : null;

  // Serialize optional JSONB metadata (null-safe)
  const jsonbOrNull = (v: unknown) =>
    v != null && typeof v === "object" ? sql`(${JSON.stringify(v)}::text)::jsonb` : sql`NULL`;
  const textArrayOrNull = (v: unknown) =>
    Array.isArray(v) && v.length > 0 ? v : null;

  try {
    const inserted = await sql`
      INSERT INTO blog_generation_history (
        title, meta_description, outline, content,
        suggested_slug, suggested_categories, suggested_tags,
        focus_keyword, generation_time_ms,
        schema_markup, audit_result, eeat_feedback, fact_check,
        source_urls, token_usage, brief_summary, readability_scores
      )
      VALUES (
        ${title.trim()},
        ${metaDescription.trim()},
        (${JSON.stringify(outline)}::text)::jsonb,
        ${content},
        ${optionalText(suggestedSlugVal)},
        ${suggestedCategoriesVal != null ? sql`(${JSON.stringify(suggestedCategoriesVal)}::text)::jsonb` : sql`NULL`},
        ${suggestedTagsVal != null ? sql`(${JSON.stringify(suggestedTagsVal)}::text)::jsonb` : sql`NULL`},
        ${optionalText(focusKeywordVal)},
        ${optionalInt(generationTimeMsVal)},
        ${jsonbOrNull(schemaMarkup)},
        ${jsonbOrNull(auditResult)},
        ${jsonbOrNull(eeatFeedback)},
        ${jsonbOrNull(factCheck)},
        ${textArrayOrNull(sourceUrls)},
        ${jsonbOrNull(tokenUsage)},
        ${jsonbOrNull(briefSummary)},
        ${jsonbOrNull(readabilityScores)}
      )
      RETURNING id
    `;
    const newId = (inserted[0] as { id: string })?.id ?? null;

    // Atomic trim: delete oldest entries beyond MAX_HISTORY (no race condition)
    await sql`
      DELETE FROM blog_generation_history
      WHERE id NOT IN (
        SELECT id FROM blog_generation_history
        ORDER BY created_at DESC
        LIMIT ${MAX_HISTORY}
      )
    `;

    return NextResponse.json(newId != null ? { ok: true, id: newId } : { ok: true }, { status: 201 });
  } catch (err) {
    console.error("[blog/history] POST insert error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    const isConnection =
      /connection|ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|connect/i.test(msg) ||
      /DATABASE_URL|not set/i.test(msg);
    const hint = isConnection
      ? "Database connection failed. Check DATABASE_URL in .env.local and ensure the database is reachable."
      : "Failed to save history. Check server logs for details.";
    return NextResponse.json({ error: hint }, { status: 500 });
  }
}

/** PATCH: update an existing entry by ID (for auto-save / manual save after edits). */
export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.trim()) {
    return NextResponse.json(
      { error: "Blog history not configured (DATABASE_URL missing)" },
      { status: 503 }
    );
  }
  try {
    await ensureBlogHistoryTable();
  } catch (e) {
    console.error("[blog/history] ensure table error:", e);
    return NextResponse.json(
      { error: "Blog history not available (database setup failed)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query parameter required" }, { status: 400 });
  }

  let body: GeneratedContentBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const {
    title,
    metaDescription,
    outline,
    content,
    suggestedSlug,
    suggestedCategories,
    suggestedTags,
    focusKeyword,
    generationTimeMs,
  } = body;
  if (
    typeof title !== "string" ||
    typeof metaDescription !== "string" ||
    !Array.isArray(outline) ||
    typeof content !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid: title, metaDescription, outline, content" },
      { status: 400 }
    );
  }

  const suggestedSlugVal = suggestedSlug != null ? String(suggestedSlug).trim() || null : null;
  const suggestedCategoriesVal = Array.isArray(suggestedCategories) ? suggestedCategories : null;
  const suggestedTagsVal = Array.isArray(suggestedTags) ? suggestedTags : null;
  const focusKeywordVal =
    focusKeyword != null && typeof focusKeyword === "string" && focusKeyword.trim()
      ? focusKeyword.trim()
      : null;
  const generationTimeMsVal =
    typeof generationTimeMs === "number" && Number.isFinite(generationTimeMs) && generationTimeMs >= 0
      ? Math.round(generationTimeMs)
      : null;

  try {
    const updated = await sql`
      UPDATE blog_generation_history
      SET
        title = ${title.trim()},
        meta_description = ${metaDescription.trim()},
        outline = (${JSON.stringify(outline)}::text)::jsonb,
        content = ${content},
        suggested_slug = ${optionalText(suggestedSlugVal)},
        suggested_categories = ${suggestedCategoriesVal != null ? sql`(${JSON.stringify(suggestedCategoriesVal)}::text)::jsonb` : sql`NULL`},
        suggested_tags = ${suggestedTagsVal != null ? sql`(${JSON.stringify(suggestedTagsVal)}::text)::jsonb` : sql`NULL`},
        focus_keyword = ${optionalText(focusKeywordVal)},
        generation_time_ms = ${optionalInt(generationTimeMsVal)}
      WHERE id = ${id}
      RETURNING id
    `;
    if (!updated?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[blog/history] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

/** DELETE: delete a single entry by ID. */
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.trim()) {
    return NextResponse.json(
      { error: "Blog history not configured (DATABASE_URL missing)" },
      { status: 503 }
    );
  }
  try {
    await ensureBlogHistoryTable();
  } catch (e) {
    console.error("[blog/history] ensure table error:", e);
    return NextResponse.json(
      { error: "Blog history not available (database setup failed)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
  }

  try {
    const deleted = await sql`
      DELETE FROM blog_generation_history
      WHERE id = ${id}
      RETURNING id
    `;
    if (!deleted?.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[blog/history] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
