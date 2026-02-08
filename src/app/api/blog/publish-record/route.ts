import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST: Record that an article was published (for future feedback loop / ranking tracking).
 * Body: { keyword: string, publishedUrl?: string, publishDate?: string }
 * Stores in Supabase table blog_publish_tracking if configured (columns: keyword, published_url, publish_date, created_at).
 * If Supabase or table is missing, returns 200 and logs only.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const keyword = typeof body.keyword === "string" ? body.keyword.trim() : "";
    const publishedUrl = typeof body.publishedUrl === "string" ? body.publishedUrl.trim() : undefined;
    const publishDate = typeof body.publishDate === "string" ? body.publishDate.trim() : undefined;

    if (!keyword) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        const { error } = await supabase.from("blog_publish_tracking").insert({
          keyword,
          published_url: publishedUrl ?? null,
          publish_date: publishDate ?? new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        });
        if (error) {
          console.warn("[blog/publish-record] Supabase insert failed (table may not exist):", error.message);
        }
      } catch {
        // best-effort: don't fail the request
      }
    } else {
      if (process.env.NODE_ENV !== "test") {
        console.log("[blog/publish-record] Recorded (no DB):", { keyword, publishedUrl, publishDate });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[blog/publish-record]", e);
    return NextResponse.json({ error: "Failed to record publish" }, { status: 500 });
  }
}
