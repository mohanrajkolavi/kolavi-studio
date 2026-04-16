import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit/generic";
import { isValidEmail, EMAIL_MAX_LENGTH } from "@/lib/validators/email";
import { logError } from "@/lib/logging/error";

const APPLY_RATE_LIMIT = { maxRequests: 3, windowSec: 60 };

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "Server is not configured for partner applications." },
        { status: 503 }
      );
    }

    // Rate limit: 3 applications per 60 seconds per IP
    try {
      const rl = await checkRateLimit(request, "partner_apply_rate_limit", APPLY_RATE_LIMIT);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: rl.retryAfterSec ? { "Retry-After": String(rl.retryAfterSec) } : undefined,
          }
        );
      }
    } catch {
      // Rate limit table may not exist yet - allow request through
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    // Accept both old field names (audience/promotionMethod) and new ones (role/source)
    const name = body.name;
    const email = body.email;
    const phone = body.phone;
    const audience = body.audience ?? body.role;
    const promotionMethod = body.promotionMethod ?? body.source;
    const message = body.message;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!audience || typeof audience !== "string" || audience.trim().length === 0) {
      return NextResponse.json({ error: "Role is required" }, { status: 400 });
    }

    if (!promotionMethod || typeof promotionMethod !== "string" || promotionMethod.trim().length === 0) {
      return NextResponse.json({ error: "Source is required" }, { status: 400 });
    }

    if (name.length > 255 || email.length > EMAIL_MAX_LENGTH) {
      return NextResponse.json({ error: "Name or email is too long" }, { status: 400 });
    }
    if (typeof phone === "string" && phone.length > 50) {
      return NextResponse.json({ error: "Phone is too long" }, { status: 400 });
    }
    if (audience.length > 255) {
      return NextResponse.json({ error: "Role is too long" }, { status: 400 });
    }
    if (promotionMethod.length > 255) {
      return NextResponse.json({ error: "Source is too long" }, { status: 400 });
    }

    // Check for duplicate application with same email
    const emailLower = email.trim().toLowerCase();
    try {
      const existing = await sql`
        SELECT id FROM partner_applications
        WHERE LOWER(email) = ${emailLower}
          AND (status IS NULL OR status = 'pending')
        LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json(
          { error: "An application with this email is already pending review." },
          { status: 409 }
        );
      }
    } catch {
      // status column or table may not exist - continue
    }

    // Also check if already a partner
    try {
      const existingPartner = await sql`
        SELECT id FROM partners
        WHERE LOWER(email) = ${emailLower}
          AND deleted_at IS NULL
        LIMIT 1
      `;
      if (existingPartner.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in instead." },
          { status: 409 }
        );
      }
    } catch {
      // partners table may not exist - continue
    }

    const phoneVal = phone && typeof phone === "string" && phone.trim().length > 0
      ? phone.trim().slice(0, 50)
      : null;

    await sql`
      INSERT INTO partner_applications (name, email, phone, audience, promotion_method, message)
      VALUES (
        ${name.trim()},
        ${emailLower},
        ${phoneVal},
        ${audience.trim()},
        ${promotionMethod.trim()},
        ${typeof message === "string" ? message.trim().slice(0, 2000) : ""}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isTableMissing =
      msg.includes("partner_applications") ||
      /does not exist|undefined table/i.test(msg);

    if (isTableMissing) {
      logError(
        "partner-apply",
        error,
        { hint: "table missing. Run migration: src/lib/db/migrations/001_partner_program.sql" }
      );
      return NextResponse.json(
        { error: "Partner applications are not available" },
        { status: 503 }
      );
    }

    logError("partner-apply", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
