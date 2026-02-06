import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

const RATE_LIMIT_WINDOW_SEC = 60;
const RATE_LIMIT_MAX = 5;

function hashIp(ip: string): string {
  return createHash("sha256").update(`contact-rl:${ip}`).digest("hex");
}

/** Check and consume one rate-limit slot. Uses DB so limits are shared across serverless instances. */
async function checkAndIncrementRateLimit(ipHash: string): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW_SEC * 1000);

  const updated = await sql`
    INSERT INTO contact_rate_limit (ip_hash, request_count, reset_at)
    VALUES (${ipHash}, 1, ${resetAt})
    ON CONFLICT (ip_hash) DO UPDATE SET
      request_count = CASE
        WHEN contact_rate_limit.reset_at <= ${now}
        THEN 1
        ELSE contact_rate_limit.request_count + 1
      END,
      reset_at = CASE
        WHEN contact_rate_limit.reset_at <= ${now}
        THEN ${resetAt}
        ELSE contact_rate_limit.reset_at
      END
    RETURNING request_count, reset_at
  `;

  const row = updated[0];
  if (!row) return false;
  return Number(row.request_count ?? 0) <= RATE_LIMIT_MAX;
}

/** Prefer platform/client IP from trusted proxy (e.g. Vercel). Reduces spoofing via x-forwarded-for. */
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

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip || ip === "unknown") {
      return NextResponse.json(
        { error: "Unable to identify request source. Please try again." },
        { status: 400 }
      );
    }

    const ipHash = hashIp(ip);
    const allowed = await checkAndIncrementRateLimit(ipHash);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, phone, businessType, message, honeypot } = body;

    // Honeypot spam protection - silently fail for bots
    if (honeypot) {
      return NextResponse.json({ success: true });
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (name.length > 255) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        { error: "Email is too long" },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO leads (name, email, phone, business_type, message, source, status)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${phone?.trim() || null}, ${businessType || null}, ${message.trim()}, 'contact_form', 'new')
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit form. Please try again later." },
      { status: 500 }
    );
  }
}
