import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Refreshes Supabase auth session and returns response with updated cookies. */
export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  if (!url || !key) return response;

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    await supabase.auth.getClaims();
  } catch (err) {
    // Do not 500 the request if Supabase is unreachable or misconfigured
    if (process.env.NODE_ENV === "development") {
      console.warn("[supabase/middleware] updateSupabaseSession failed:", err instanceof Error ? err.message : String(err));
    }
  }
  return response;
}
