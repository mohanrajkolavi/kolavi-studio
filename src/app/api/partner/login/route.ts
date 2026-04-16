import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createPartnerSessionToken, setPartnerAuthCookie } from "@/lib/partner-auth";
import { checkRateLimit } from "@/lib/rate-limit/generic";
import { PARTNER_CODE_REGEX } from "@/lib/partner/cookie-server";
import { isValidEmail } from "@/lib/validators/email";
import { logError } from "@/lib/logging/error";

const LOGIN_RATE_LIMIT = { maxRequests: 5, windowSec: 60 };

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per 60 seconds per IP
    try {
      const rl = await checkRateLimit(request, "partner_login_rate_limit", LOGIN_RATE_LIMIT);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          {
            status: 429,
            headers: rl.retryAfterSec ? { "Retry-After": String(rl.retryAfterSec) } : undefined,
          }
        );
      }
    } catch {
      // Rate limit table may not exist yet - allow request through
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and partner code are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email or partner code" },
        { status: 401 }
      );
    }

    if (!PARTNER_CODE_REGEX.test(code)) {
      return NextResponse.json(
        { error: "Invalid partner code" },
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, code, name, email, status
      FROM partners
      WHERE LOWER(email) = ${email}
        AND UPPER(code) = ${code}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or partner code" },
        { status: 401 }
      );
    }

    const partner = result[0] as PartnerRow | undefined;
    if (!partner) {
      return NextResponse.json(
        { error: "Invalid email or partner code" },
        { status: 401 }
      );
    }
    if (partner.status !== "active") {
      return NextResponse.json(
        { error: "Your partner account is not active. Contact us for assistance." },
        { status: 403 }
      );
    }

    const token = await createPartnerSessionToken(partner.id);
    await setPartnerAuthCookie(token);

    return NextResponse.json({
      ok: true,
      partner: {
        id: partner.id,
        code: partner.code,
        name: partner.name,
        email: partner.email,
      },
    });
  } catch (error) {
    logError("partner-login", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
