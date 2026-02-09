import { createHash } from "crypto";
import { NextRequest } from "next/server";
import sql from "@/lib/db/client";

const MAX_ATTEMPTS = 3;
/** Far future date = permanent lockout until unlock code is entered */
const PERMANENT_LOCK_UNTIL = new Date("2099-12-31T23:59:59Z");

/** Prefer platform/client IP from trusted proxy (Vercel). Reduces spoofing via x-forwarded-for. */
function getClientIp(request: NextRequest): string {
  const vercelIp = request.headers.get("x-vercel-ip");
  if (vercelIp?.trim()) return vercelIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function hashIp(ip: string): string {
  const salt = process.env.ADMIN_SECRET;
  if (!salt) {
    throw new Error("ADMIN_SECRET must be set for login rate limiting");
  }
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; lockedUntil: Date; message: string };

/**
 * Check if IP is rate limited. Call before validating password.
 * Returns { ok: false } if locked.
 * When DATABASE_URL is not set, skips rate limiting so login works with ADMIN_SECRET only.
 */
export async function checkLoginRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: true };
  }
  try {
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);

    const rows = await sql`
      SELECT attempts, locked_until FROM login_rate_limit
      WHERE ip_hash = ${ipHash}
    `;

    const row = rows[0];
    if (!row) return { ok: true };

    const lockedUntil = row.locked_until as Date | null;
    const now = new Date();

    if (lockedUntil && lockedUntil > now) {
      return {
        ok: false,
        lockedUntil,
        message:
          "Too many failed attempts. Enter your unlock code to try again.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error(
      "Login rate limit check error (login allowed):",
      error,
      "\nHint: Run schema if login_rate_limit table is missing: psql \"$DATABASE_URL\" -f src/lib/db/schema.sql"
    );
    // Fail open: when DB is unavailable, allow login so users aren't blocked.
    // Rate limiting is a security enhancement; blocking all logins when DB fails
    // (e.g. table missing, connection refused, Supabase paused) is worse UX.
    // Ensure login_rate_limit table exists: psql "$DATABASE_URL" -f src/lib/db/schema.sql
    return { ok: true };
  }
}

/**
 * Record a failed login attempt. Call after password validation fails.
 * Returns true if now locked (just hit 3 attempts).
 * Uses atomic UPSERT to avoid TOCTOU race.
 * No-op when DATABASE_URL is not set.
 */
export async function recordFailedLogin(request: NextRequest): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;
  try {
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);

    const result = await sql`
      INSERT INTO login_rate_limit (ip_hash, attempts, locked_until)
      VALUES (
        ${ipHash},
        1,
        CASE WHEN 1 >= ${MAX_ATTEMPTS} THEN ${PERMANENT_LOCK_UNTIL} ELSE NULL END
      )
      ON CONFLICT (ip_hash) DO UPDATE SET
        attempts = login_rate_limit.attempts + 1,
        locked_until = CASE
          WHEN login_rate_limit.attempts + 1 >= ${MAX_ATTEMPTS}
          THEN ${PERMANENT_LOCK_UNTIL}
          ELSE login_rate_limit.locked_until
        END
      RETURNING attempts, locked_until
    `;

    const row = result[0];
    if (!row) return false;
    const attempts = (row.attempts as number) ?? 0;
    return attempts >= MAX_ATTEMPTS;
  } catch (error) {
    console.error("Record failed login error:", error);
    return false;
  }
}

/**
 * Clear rate limit on successful login.
 * No-op when DATABASE_URL is not set.
 */
export async function clearLoginRateLimit(request: NextRequest): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) return;
  try {
    const ip = getClientIp(request);
    const ipHash = hashIp(ip);
    await sql`DELETE FROM login_rate_limit WHERE ip_hash = ${ipHash}`;
  } catch (error) {
    console.error("Clear login rate limit error:", error);
  }
}
