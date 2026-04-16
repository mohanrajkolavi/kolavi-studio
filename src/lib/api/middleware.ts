/**
 * Shared API middleware helpers: CORS headers, payload size limits.
 *
 * CORS policy:
 *  - CORS_ORIGIN env var is a comma-separated allowlist of origins.
 *  - If the request Origin matches, we echo it back (not "*").
 *  - If not configured or not matched, CORS response headers are omitted, which
 *    blocks cross-origin browser requests (same-origin callers still work).
 *  - Wildcard "*" is refused in production - log a warning instead.
 */

const CORS_ALLOWED_METHODS = "GET, POST, OPTIONS";
const CORS_ALLOWED_HEADERS = "Content-Type, Authorization";
const CORS_MAX_AGE = "86400";

function parseAllowedOrigins(): string[] {
  const raw = (process.env.CORS_ORIGIN ?? "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ALLOWED_ORIGINS = parseAllowedOrigins();
const ALLOW_WILDCARD =
  ALLOWED_ORIGINS.length === 1 && ALLOWED_ORIGINS[0] === "*";

if (ALLOW_WILDCARD && process.env.NODE_ENV === "production") {
  console.warn(
    "[middleware] CORS_ORIGIN=* in production - cross-origin requests are fully open. Set an explicit allowlist."
  );
}

if (ALLOWED_ORIGINS.length === 0 && process.env.NODE_ENV === "production") {
  // Not fatal - many routes are same-origin only. But operators should know.
  console.warn(
    "[middleware] CORS_ORIGIN is unset in production - cross-origin requests will be blocked."
  );
}

function matchAllowedOrigin(requestOrigin: string | null): string | null {
  if (!requestOrigin) return null;
  if (ALLOW_WILDCARD) return requestOrigin;
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : null;
}

/** Build the CORS response header set for this request, or {} if the origin is not allowed. */
export function corsHeadersForRequest(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = matchAllowedOrigin(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": CORS_ALLOWED_METHODS,
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
    "Access-Control-Max-Age": CORS_MAX_AGE,
    Vary: "Origin",
  };
}

/** Return a 200 OK for CORS preflight requests, honoring the allowlist. */
export function handleCorsPreflightIfNeeded(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 200, headers: corsHeadersForRequest(request) });
}

/** Maximum request body size (bytes). Default 1MB. Override via MAX_PAYLOAD_BYTES env var. */
const MAX_PAYLOAD_BYTES = parseInt(process.env.MAX_PAYLOAD_BYTES ?? "1048576", 10);

/**
 * Parse JSON body with size limit enforcement.
 * Returns { data } on success or { error, status } on failure.
 */
export async function parseJsonBodyWithLimit(
  request: Request,
  maxBytes = MAX_PAYLOAD_BYTES
): Promise<{ data: unknown } | { error: string; status: number }> {
  // Check Content-Length header first (fast reject)
  const contentLength = request.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return { error: `Request body too large (max ${Math.round(maxBytes / 1024)}KB)`, status: 413 };
  }

  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return { error: `Request body too large (max ${Math.round(maxBytes / 1024)}KB)`, status: 413 };
    }
    const data = JSON.parse(text);
    return { data };
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }
}

/** Merge CORS headers onto an existing headers object. Pass the request so origin can be matched. */
export function withCors(
  request: Request,
  headers: Record<string, string> = {}
): Record<string, string> {
  return { ...headers, ...corsHeadersForRequest(request) };
}
