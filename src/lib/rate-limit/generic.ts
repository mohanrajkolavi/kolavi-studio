import { createHash } from "crypto";
import { NextRequest } from "next/server";
import sql from "@/lib/db/client";

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

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec?: number;
}

/**
 * Generic DB-backed rate limiter. Uses UPSERT so limits are shared across
 * serverless instances. Each `tableName` must exist with the schema:
 *   ip_hash VARCHAR(64) PRIMARY KEY, request_count INT, reset_at TIMESTAMPTZ
 */
export async function checkRateLimit(
  request: NextRequest,
  tableName: string,
  config: { maxRequests: number; windowSec: number }
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  if (!ip || ip === "unknown") {
    return { allowed: true };
  }

  const ipHash = createHash("sha256").update(`${tableName}:${ip}`).digest("hex");
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowSec * 1000);

  // Use raw SQL with the table name interpolated (safe - controlled by caller, not user input)
  const updated = await sql.unsafe(
    `INSERT INTO ${tableName} (ip_hash, request_count, reset_at)
     VALUES ($1, 1, $2)
     ON CONFLICT (ip_hash) DO UPDATE SET
       request_count = CASE
         WHEN ${tableName}.reset_at <= $3
         THEN 1
         ELSE ${tableName}.request_count + 1
       END,
       reset_at = CASE
         WHEN ${tableName}.reset_at <= $3
         THEN $2
         ELSE ${tableName}.reset_at
       END
     RETURNING request_count, reset_at`,
    [ipHash, resetAt, now]
  );

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
