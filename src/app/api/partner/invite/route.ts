import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sql } from "@/lib/db";
import { SITE_URL } from "@/lib/constants";

/** POST { partnerId } - Admin sends invite email to partner (Supabase inviteUserByEmail). */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  let body: { partnerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const partnerId = body.partnerId;
  if (!partnerId || typeof partnerId !== "string") {
    return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
  }

  try {
    const [partner] = await sql`
      SELECT id, email, status, supabase_user_id
      FROM partners
      WHERE id = ${partnerId}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    if (partner.status !== "active") {
      return NextResponse.json(
        { error: "Partner must be active to send invite" },
        { status: 400 }
      );
    }
    if (partner.supabase_user_id != null) {
      return NextResponse.json(
        { error: "Partner already has an account linked" },
        { status: 400 }
      );
    }

    const rawEmail = partner.email;
    if (rawEmail == null || typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
      return NextResponse.json(
        { error: "Partner email is missing or invalid (data integrity error)" },
        { status: 422 }
      );
    }
    const email = rawEmail.trim().toLowerCase();
    const redirectTo = `${SITE_URL}/partner/set-password`;

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Partner invite error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send invite" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Invitation email sent. Partner will receive a link to set their password.",
    });
  } catch (err) {
    console.error("Partner invite error:", err);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
