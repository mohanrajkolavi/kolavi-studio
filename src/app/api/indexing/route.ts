import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  requestIndexing,
  requestIndexingBatch,
  getIndexingStatus,
  isIndexingConfigured,
  type IndexingAction,
} from "@/lib/google-indexing";

/** Persist indexing result for a slug in content_maintenance table. */
async function saveIndexResult(url: string, success: boolean, error?: string) {
  // Extract slug from URL like https://kolavistudio.com/blog/my-post
  const match = url.match(/\/blog\/([^/?#]+)/);
  if (!match) return;
  const slug = match[1];
  try {
    if (success) {
      await sql`
        INSERT INTO content_maintenance (post_slug, indexed_at, index_error, updated_at)
        VALUES (${slug}, NOW(), NULL, NOW())
        ON CONFLICT (post_slug) DO UPDATE SET
          indexed_at = NOW(),
          index_error = NULL,
          updated_at = NOW()
      `;
    } else {
      await sql`
        INSERT INTO content_maintenance (post_slug, index_error, updated_at)
        VALUES (${slug}, ${error || 'Unknown error'}, NOW())
        ON CONFLICT (post_slug) DO UPDATE SET
          index_error = ${error || 'Unknown error'},
          updated_at = NOW()
      `;
    }
  } catch (e) {
    console.error("[api/indexing] Failed to persist index result:", e);
  }
}

/**
 * POST /api/indexing — Submit URL(s) for Google Instant Indexing.
 *
 * Body:
 *   { url: string, action?: "URL_UPDATED" | "URL_DELETED" }
 *   OR
 *   { urls: string[], action?: "URL_UPDATED" | "URL_DELETED" }
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isIndexingConfigured()) {
    return NextResponse.json(
      { error: "Google Indexing API is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON." },
      { status: 501 }
    );
  }

  try {
    const body = await request.json();
    const action: IndexingAction = body.action === "URL_DELETED" ? "URL_DELETED" : "URL_UPDATED";

    // Single URL
    if (typeof body.url === "string" && body.url.trim()) {
      const result = await requestIndexing(body.url.trim(), action);
      await saveIndexResult(body.url.trim(), result.success, result.error);
      return NextResponse.json(result, { status: result.success ? 200 : 502 });
    }

    // Batch URLs
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      const urls = body.urls
        .filter((u: unknown) => typeof u === "string" && (u as string).trim())
        .map((u: string) => u.trim())
        .slice(0, 100); // cap at 100 per request

      if (urls.length === 0) {
        return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 });
      }

      const results = await requestIndexingBatch(urls, action);
      // Persist all results
      await Promise.all(results.map((r) => saveIndexResult(r.url, r.success, r.error)));
      const allOk = results.every((r) => r.success);
      return NextResponse.json({ results }, { status: allOk ? 200 : 207 });
    }

    return NextResponse.json({ error: "Provide 'url' (string) or 'urls' (array)" }, { status: 400 });
  } catch (e) {
    console.error("[api/indexing] POST error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/indexing?url=<encoded-url> — Check indexing status for a URL.
 */
export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isIndexingConfigured()) {
    return NextResponse.json(
      { error: "Google Indexing API is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON." },
      { status: 501 }
    );
  }

  const url = request.nextUrl.searchParams.get("url");
  if (!url?.trim()) {
    return NextResponse.json({ error: "'url' query parameter is required" }, { status: 400 });
  }

  try {
    const result = await getIndexingStatus(url.trim());
    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (e) {
    console.error("[api/indexing] GET error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
