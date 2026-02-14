import { NextResponse } from "next/server";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { sql } from "@/lib/db";

/** POST - Link current Supabase user to partner row (after signup). */
export async function POST() {
  try {
    const supabase = await createAuthClient();
    const { data } = await supabase.auth.getUser();
    if (!data?.user?.id || !data.user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const email = data.user.email.trim().toLowerCase();
    const supabaseUserId = data.user.id;

    const result = await sql`
      UPDATE partners
      SET supabase_user_id = ${supabaseUserId}, updated_at = NOW()
      WHERE LOWER(email) = ${email}
        AND status = 'active'
        AND (supabase_user_id IS NULL OR supabase_user_id = ${supabaseUserId})
        AND deleted_at IS NULL
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "No approved partner found with this email, or account already linked" },
        { status: 400 }
      );
    }

    const partnerId = result[0].id as string;
    return NextResponse.json({ ok: true, partnerId });
  } catch (error) {
    console.error("Link account error:", error);
    return NextResponse.json({ error: "Failed to link account" }, { status: 500 });
  }
}
