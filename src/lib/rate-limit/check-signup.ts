import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

/** Configurable rate limit for check-signup endpoint (prevents enumeration). */
export const CHECK_SIGNUP_RATE_LIMIT = {
  maxRequests: 5,
  windowSec: 60,
} as const;

function hashIp(ip: string): string {
  return createHash("sha256").update(`check-signup-rl:${ip}`).digest("hex");
}

/** Prefer platform/client IP from trusted proxy (e.g. Vercel). */
function getClientIp(request: NextRequest): string | null {
  const vercelIp = request.headers.get("x-vercel-ip");
  if (vercelIp?.trim()) return vercelIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const socketAddr = (request as unknown as { socket?: { remoteAddress?: string } }).socket?.remoteAddress;
  if (socketAddr) return socketAddr;
  return null;
}

export interface CheckSignupRateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * Check and consume one rate-limit slot for check-signup.
 * Uses DB so limits are shared across serverless instances.
 * Returns { allowed, retryAfterSec } - retryAfterSec set when rate limited.
 */
export async function checkCheckSignupRateLimit(
  request: NextRequest,
  config: { maxRequests: number; windowSec: number } = CHECK_SIGNUP_RATE_LIMIT
): Promise<CheckSignupRateLimitResult> {
  const ip = getClientIp(request);
  if (!ip || ip === "unknown") {
    return { allowed: true };
  }

  const ipHash = hashIp(ip);
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSec * 1000);

  const updated = await sql`
    INSERT INTO check_signup_rate_limit (ip_hash, request_count, reset_at)
    VALUES (${ipHash}, 1, ${resetAt})
    ON CONFLICT (ip_hash) DO UPDATE SET
      request_count = CASE
        WHEN check_signup_rate_limit.reset_at <= ${now}
        THEN 1
        ELSE check_signup_rate_limit.request_count + 1
      END,
      reset_at = CASE
        WHEN check_signup_rate_limit.reset_at <= ${now}
        THEN ${resetAt}
        ELSE check_signup_rate_limit.reset_at
      END
    RETURNING request_count, reset_at
  `;

  const row = updated[0];
  if (!row) return { allowed: true };

  const count = Number(row.request_count ?? 0);
  const allowed = count <= config.maxRequests;

  if (!allowed) {
    const resetAtDate = row.reset_at instanceof Date ? row.reset_at : new Date(row.reset_at as string);
    const retryAfterSec = Math.ceil((resetAtDate.getTime() - Date.now()) / 1000);
    return { allowed: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  return { allowed: true };
}
