import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Nonce-based CSP: one-time random value per request so inline scripts/styles are allowlisted without 'unsafe-inline'. */
function getCspWithNonce(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    "script-src 'self' 'nonce-" +
      nonce +
      "' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://embed.typeform.com https://tally.so" +
      (isDev ? " 'unsafe-eval'" : ""),
    "style-src 'self' 'nonce-" +
      nonce +
      "' https://fonts.googleapis.com" +
      (isDev ? " 'unsafe-inline'" : ""),
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://form.typeform.com https://embed.typeform.com https://www.typeform.com https://tally.so",
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

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  for (const [key, value] of Object.entries(SECURITY_HEADERS_STATIC)) {
    response.headers.set(key, value);
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
