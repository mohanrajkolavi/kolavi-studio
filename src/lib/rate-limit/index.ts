/**
 * Shared IP-keyed rate limiter.
 *
 * In production (`NODE_ENV=production`) we refuse to boot without `DATABASE_URL`, so
 * all rate limiting is DB-backed and survives serverless cold starts across instances.
 *
 * In dev and test we allow an in-memory fallback so a missing DATABASE_URL does not
 * break local iteration.
 */

import { createHash } from "crypto";
import type { NextRequest } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";
const HAS_DB = !!process.env.DATABASE_URL?.trim();
// Skip the fail-fast during `next build`; the runtime server boot re-runs module init.
const IS_BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

if (IS_PROD && !HAS_DB && !IS_BUILD_PHASE) {
  throw new Error(
    "[rate-limit] DATABASE_URL is required in production. In-memory rate limiting is not safe across serverless instances."
  );
}

if (!HAS_DB && !IS_PROD) {
  console.warn(
    "[rate-limit] DATABASE_URL not set - using in-memory rate limiting. Not safe for production."
  );
}

type MemEntry = { count: number; resetAt: number };
const memoryBuckets: Map<string, Map<string, MemEntry>> = new Map();

function getMemoryBucket(bucket: string): Map<string, MemEntry> {
  let store = memoryBuckets.get(bucket);
  if (!store) {
    store = new Map();
    memoryBuckets.set(bucket, store);
  }
  return store;
}

export function hashIp(bucket: string, ip: string): string {
  return createHash("sha256").update(`${bucket}:${ip}`).digest("hex");
}

export function getClientIp(request: NextRequest): string | null {
  const v = request.headers.get("x-vercel-ip")?.trim();
  if (v) return v;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() ?? null;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining count in this window (>= 0). */
  remaining: number;
}

/**
 * Check and increment a rate limit bucket.
 *
 * @param bucket  Logical name; used to namespace the IP hash and memory store (e.g. "bio-generator").
 * @param ip      Client IP (use `getClientIp(request)`).
 * @param limit   Max requests allowed in the window.
 * @param windowSec Window size in seconds.
 */
export async function checkRateLimit(
  bucket: string,
  ip: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const key = hashIp(bucket, ip);

  if (HAS_DB) {
    try {
      const { sql } = await import("@/lib/db");
      const now = new Date();
      const resetAt = new Date(now.getTime() + windowSec * 1000);
      const updated = await sql`
        INSERT INTO contact_rate_limit (ip_hash, request_count, reset_at)
        VALUES (${key}, 1, ${resetAt})
        ON CONFLICT (ip_hash) DO UPDATE SET
          request_count = CASE
            WHEN contact_rate_limit.reset_at <= ${now} THEN 1
            ELSE contact_rate_limit.request_count + 1
          END,
          reset_at = CASE
            WHEN contact_rate_limit.reset_at <= ${now} THEN ${resetAt}
            ELSE contact_rate_limit.reset_at
          END
        RETURNING request_count
      `;
      const count = Number(updated[0]?.request_count);
      if (!Number.isFinite(count) || count < 0) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch (err) {
      // Prod throws at module load if no DB; here we're either in dev or the DB momentarily failed.
      if (IS_PROD) {
        console.error("[rate-limit] DB error in production; failing closed:", err);
        return { allowed: false, remaining: 0 };
      }
      // Dev: fall through to memory.
    }
  }

  const store = getMemoryBucket(bucket);
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count++;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
