import { NextResponse } from "next/server";
import { clearPartnerAuthCookie } from "@/lib/partner-auth";

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export async function POST() {
  if (HAS_SUPABASE) {
    try {
      const { createAuthClient } = await import("@/lib/supabase/server-auth");
      const supabase = await createAuthClient();
      await supabase.auth.signOut();
    } catch {
      // Fall through to clear cookie
    }
  }
  await clearPartnerAuthCookie();
  return NextResponse.json({ ok: true });
}
