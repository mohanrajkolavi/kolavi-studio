/**
 * Shared API middleware helpers: CORS headers, payload size limits.
 */

/** Standard CORS headers for API routes. */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

/** Return a 200 OK for CORS preflight requests. */
export function handleCorsPreflightIfNeeded(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }
  return null;
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

/** Add CORS headers to an existing Response headers object. */
export function withCors(headers: Record<string, string>): Record<string, string> {
  return { ...headers, ...CORS_HEADERS };
}
