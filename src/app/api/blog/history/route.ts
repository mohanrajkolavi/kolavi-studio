import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin, type BlogHistoryRow } from "@/lib/supabase/server";

const TABLE = "blog_generation_history";
const MAX_HISTORY = 10;
/** Fetch more rows so we can dedupe by keyword and still return up to MAX_HISTORY. */
const FETCH_LIMIT = 80;

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
    // Use focus_keyword directly - it's the primary keyword entered by the user
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

/** GET: last 10 entries, one per keyword (latest edited for that keyword). */
/** GET with ?id=...: fetch a single entry by ID. */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Blog history not configured (Supabase env missing)" },
      { status: 503 }
    );
  }

  // Check if requesting a single entry by ID
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      const notFound =
        data === null ||
        error.code === "PGRST116" ||
        (error as { status?: number }).status === 404;
      if (notFound) {
        return NextResponse.json({ error: "Entry not found" }, { status: 404 });
      }
      console.error("[blog/history] GET by ID error:", error);
      return NextResponse.json(
        { error: "Failed to load entry" },
        { status: 500 }
      );
    }
    return NextResponse.json(data as BlogHistoryRow);
  }

  // Otherwise, return list of recent entries
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(FETCH_LIMIT);
  if (error) {
    console.error("[blog/history] GET error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
  const rows = (data ?? []) as BlogHistoryRow[];
  const deduped = dedupeByKeyword(rows);
  return NextResponse.json(deduped.slice(0, MAX_HISTORY));
}

/** POST: insert one entry and trim to last 10. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Blog history not configured (Supabase env missing)" },
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
  const row = {
    title: title.trim(),
    meta_description: metaDescription.trim(),
    outline,
    content,
    suggested_slug: suggestedSlug != null ? String(suggestedSlug).trim() : null,
    suggested_categories: Array.isArray(suggestedCategories) ? suggestedCategories : null,
    suggested_tags: Array.isArray(suggestedTags) ? suggestedTags : null,
    focus_keyword:
      focusKeyword != null && typeof focusKeyword === "string" && focusKeyword.trim()
        ? focusKeyword.trim()
        : null,
    generation_time_ms:
      typeof generationTimeMs === "number" && Number.isFinite(generationTimeMs) && generationTimeMs >= 0
        ? Math.round(generationTimeMs)
        : null,
  };
  const { error: insertError } = await supabase.from(TABLE).insert(row);
  if (insertError) {
    console.error("[blog/history] POST insert error:", insertError);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
  const { data: all } = await supabase
    .from(TABLE)
    .select("id")
    .order("created_at", { ascending: false });
  const ids = (all ?? []) as { id: string }[];
  if (ids.length > MAX_HISTORY) {
    const toDelete = ids.slice(MAX_HISTORY).map((r) => r.id);
    await supabase.from(TABLE).delete().in("id", toDelete);
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

/** DELETE: delete a single entry by ID. */
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Blog history not configured (Supabase env missing)" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    console.error("[blog/history] DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
