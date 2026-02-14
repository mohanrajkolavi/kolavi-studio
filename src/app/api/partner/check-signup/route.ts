import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkCheckSignupRateLimit } from "@/lib/rate-limit/check-signup";

/** GET ?email=... - Check if email is eligible for partner signup (approved, not yet linked). */
export async function GET(request: NextRequest) {
  const rateLimit = await checkCheckSignupRateLimit(request);
  if (!rateLimit.allowed) {
    const retryAfter = String(rateLimit.retryAfterSec ?? 60);
    return NextResponse.json(
      { eligible: false, reason: "Email not eligible for signup" },
      { status: 429, headers: { "Retry-After": retryAfter } }
    );
  }

  const email = request.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ eligible: false, reason: "Email not eligible for signup" });
  }

  try {
    const result = await sql`
      SELECT id, status, supabase_user_id
      FROM partners
      WHERE LOWER(email) = ${email}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (result.length === 0) {
      console.log("Check signup: no partner found for email");
      return NextResponse.json({ eligible: false, reason: "Email not eligible for signup" });
    }

    const p = result[0];
    if (p.status !== "active") {
      console.log("Check signup: partner not active");
      return NextResponse.json({ eligible: false, reason: "Email not eligible for signup" });
    }
    if (p.supabase_user_id != null) {
      console.log("Check signup: account already linked");
      return NextResponse.json({ eligible: false, reason: "Email not eligible for signup" });
    }

    return NextResponse.json({ eligible: true });
  } catch (error) {
    console.error("Check signup error:", error);
    return NextResponse.json({ eligible: false, reason: "Email not eligible for signup" });
  }
}
