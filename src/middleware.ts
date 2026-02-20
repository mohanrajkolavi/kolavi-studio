import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import {
  PARTNER_COOKIE_NAME,
  PARTNER_COOKIE_MAX_AGE,
  PARTNER_CODE_REGEX,
  hasPartnerRefCookie,
} from "@/lib/partner/cookie-server";

/**
 * Nonce-based CSP. In production, allow 'unsafe-inline' for style-src so
 * framework/dependency inline styles (e.g. next-themes) don't trigger CSP
 * violations when pages are served from cache and nonce isn't applied.
 * Script hash allows common inline script (e.g. GA) when nonce is missing on cached HTML.
 */
function getCspWithNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const scriptSrc = [
    "'self'",
    "'nonce-" + nonce + "'",
    "'strict-dynamic'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://embed.typeform.com",
    "https://tally.so",
    // Allow GA inline script when nonce is missing on cached/ISR pages (Next.js issue #55638)
    "'sha256-n46vPwSWuMC0W703pBofImv82226xo4LXymvAE9caPk='",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(" ");
  // Production: nonce-only for styles (inline styles must carry nonce). Dev: unsafe-inline for convenience.
  const styleSrc = [
    "'self'",
    ...(isDev ? ["'unsafe-inline'"] : ["'nonce-" + nonce + "'"]),
    "https://fonts.googleapis.com",
  ].join(" ");
  return [
    "default-src 'self'",
    "script-src " + scriptSrc,
    "style-src " + styleSrc,
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://form.typeform.com https://embed.typeform.com https://www.typeform.com https://tally.so https://*.supabase.co wss://*.supabase.co",
    "frame-src https://embed.typeform.com https://form.typeform.com https://www.typeform.com https://tally.so https://docs.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

const SECURITY_HEADERS_STATIC: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const cspHeader = getCspWithNonce(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);
  // Never trust client-supplied x-authenticated; strip it then set from server-side check only
  requestHeaders.delete("x-authenticated");
  if (await isAuthenticated(request)) {
    requestHeaders.set("x-authenticated", "1");
  } else {
    requestHeaders.set("x-authenticated", "0");
  }

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response = await updateSupabaseSession(request, response);

  // Partner referral: set partner_ref cookie when ?ref=CODE (first-touch, server-side)
  const ref = request.nextUrl.searchParams.get("ref");
  if (
    ref &&
    PARTNER_CODE_REGEX.test(ref.trim()) &&
    !hasPartnerRefCookie(request.headers.get("cookie"))
  ) {
    const code = ref.trim().slice(0, 50);
    const secure = request.nextUrl.protocol === "https:";
    response.cookies.set(PARTNER_COOKIE_NAME, code, {
      path: "/",
      maxAge: PARTNER_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure,
      httpOnly: false, // client reads it for form submission
    });
  }

  response.headers.set("Content-Security-Policy", cspHeader);
  for (const [key, value] of Object.entries(SECURITY_HEADERS_STATIC)) {
    response.headers.set(key, value);
  }

  // Cache HTML for blog (ISR) to satisfy "Use efficient cache lifetimes" in PageSpeed
  const pathname = request.nextUrl.pathname;
  if (request.method === "GET" && pathname.startsWith("/blog/") && pathname !== "/blog/rss") {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
  }

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all pathnames except _next/static, _next/image, favicon, and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|og-image.jpg).*)",
  ],
};
