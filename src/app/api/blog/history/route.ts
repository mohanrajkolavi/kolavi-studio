import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin, type BlogHistoryRow } from "@/lib/supabase/server";

const TABLE = "blog_generation_history";
const MAX_HISTORY = 5;

type GeneratedContentBody = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
};

/** GET: last 5 entries (full payload for instant restore). */
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
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);
  if (error) {
    console.error("[blog/history] GET error:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
  return NextResponse.json((data ?? []) as BlogHistoryRow[]);
}

/** POST: insert one entry and trim to last 5. */
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
