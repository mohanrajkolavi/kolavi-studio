import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * On-demand revalidation for the blog.
 * Call this after creating, updating, or deleting a post in the CMS so the
 * frontend reflects changes immediately instead of waiting for cache (60s).
 *
 * Usage:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 */
function timingSafeEqual(a: string, b: string): boolean {
  const digestA = crypto.createHash("sha256").update(a, "utf8").digest();
  const digestB = crypto.createHash("sha256").update(b, "utf8").digest();
  try {
    return crypto.timingSafeEqual(digestA, digestB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret?.trim()) {
    return NextResponse.json(
      { error: "Revalidation is not configured (REVALIDATE_SECRET missing)." },
      { status: 501 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const provided = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!provided || !timingSafeEqual(provided, secret.trim())) {
    return NextResponse.json({ error: "Invalid or missing secret." }, { status: 401 });
  }

  try {
    revalidateTag("blog");
    revalidatePath("/blog", "layout");
    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      message: "Blog cache invalidated; next request will fetch fresh data.",
    });
  } catch (err) {
    console.error("Revalidation failed:", err);
    return NextResponse.json(
      { error: "Revalidation failed.", details: String(err) },
      { status: 500 }
    );
  }
}
