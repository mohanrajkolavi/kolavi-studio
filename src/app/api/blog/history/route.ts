import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql, optionalText, optionalInt } from "@/lib/db";

const MAX_HISTORY = 10;

async function ensureBlogHistoryTable() {
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
      generation_time_ms INTEGER
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_blog_generation_history_created_at ON blog_generation_history(created_at DESC)`;
  // Add missing columns for tables created before focus_keyword/generation_time_ms were added
  // Use DO block for compatibility with older Postgres where ADD COLUMN IF NOT EXISTS may not exist
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
    END $migrate$
  `;
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
             suggested_slug, suggested_categories, suggested_tags, generation_time_ms
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
           suggested_slug, suggested_categories, suggested_tags, generation_time_ms
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
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "history/route.ts:before-ensure",
      message: "POST history before ensureBlogHistoryTable",
      data: { hasDbUrl: !!dbUrl?.trim() },
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion

  try {
    await ensureBlogHistoryTable();
  } catch (e) {
    console.error("[blog/history] ensure table error:", e);
    return NextResponse.json(
      { error: "Blog history not available (database setup failed)" },
      { status: 503 }
    );
  }
  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "history/route.ts:after-ensure",
      message: "POST history after ensureBlogHistoryTable OK",
      data: {},
      timestamp: Date.now(),
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion

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

  // #region agent log
  fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "history/route.ts:pre-insert",
      message: "POST history pre-insert",
      data: {
        outlineLen: outline?.length,
        outlineTypes: outline?.map((x) => typeof x),
        contentLen: content?.length,
        suggestedCategoriesLen: suggestedCategoriesVal?.length,
        suggestedTagsLen: suggestedTagsVal?.length,
        hasDbUrl: !!dbUrl?.trim(),
      },
      timestamp: Date.now(),
      hypothesisId: "H2",
    }),
  }).catch(() => {});
  // #endregion

  try {
    const inserted = await sql`
      INSERT INTO blog_generation_history (
        title, meta_description, outline, content,
        suggested_slug, suggested_categories, suggested_tags,
        focus_keyword, generation_time_ms
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
        ${optionalInt(generationTimeMsVal)}
      )
      RETURNING id
    `;
    const newId = (inserted[0] as { id: string })?.id ?? null;

    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "history/route.ts:insert-success",
        message: "POST history INSERT succeeded",
        data: { newId },
        timestamp: Date.now(),
        hypothesisId: "H4",
      }),
    }).catch(() => {});
    // #endregion

    // #region agent log
    const all = await sql`
      SELECT id FROM blog_generation_history
      ORDER BY created_at DESC
    `;
    fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "history/route.ts:before-trim",
        message: "POST history before trim",
        data: { allLen: all.length, toDelete: all.length > MAX_HISTORY ? all.length - MAX_HISTORY : 0 },
        timestamp: Date.now(),
        hypothesisId: "H4",
      }),
    }).catch(() => {});
    // #endregion
    if (all.length > MAX_HISTORY) {
      await sql`
        DELETE FROM blog_generation_history
        WHERE id NOT IN (
          SELECT id FROM blog_generation_history
          ORDER BY created_at DESC
          LIMIT ${MAX_HISTORY}
        )
      `;
    }

    return NextResponse.json(newId != null ? { ok: true, id: newId } : { ok: true }, { status: 201 });
  } catch (err) {
    console.error("[blog/history] POST insert error:", err);
    // #region agent log
    const errMsg = err instanceof Error ? err.message : String(err);
    const errStack = err instanceof Error ? err.stack : undefined;
    fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "history/route.ts:POST-catch",
        message: "POST history insert/trim failed",
        data: { errMsg, errName: err instanceof Error ? err.name : undefined, errStack: errStack?.slice(0, 500) },
        timestamp: Date.now(),
        hypothesisId: "H1,H2,H3,H4",
      }),
    }).catch(() => {});
    // #endregion
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
    // #region agent log
    const errMsg = err instanceof Error ? err.message : String(err);
    fetch("http://127.0.0.1:7242/ingest/c40bd895-fc10-4d3b-a4cb-1ef041cfae3a", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "history/route.ts:PATCH-catch",
        message: "PATCH history failed",
        data: { errMsg, errName: err instanceof Error ? err.name : undefined },
        timestamp: Date.now(),
        hypothesisId: "H1,H2,H3,H4",
      }),
    }).catch(() => {});
    // #endregion
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
