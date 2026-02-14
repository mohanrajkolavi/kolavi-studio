import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createPartnerSessionToken, setPartnerAuthCookie } from "@/lib/partner-auth";

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and partner code are required" },
        { status: 400 }
      );
    }

    if (code.length < 6) {
      return NextResponse.json(
        { error: "Invalid partner code" },
        { status: 400 }
      );
    }

    let result: Awaited<ReturnType<typeof sql>>;
    try {
      result = await sql`
        SELECT id, code, name, email, status
        FROM partners
        WHERE LOWER(email) = ${email}
          AND UPPER(code) = ${code}
          AND deleted_at IS NULL
        LIMIT 1
      `;
    } catch (err) {
      console.error("Partner login: primary query failed", err);
      result = await sql`
        SELECT id, code, name, email, status
        FROM partners
        WHERE LOWER(email) = ${email}
          AND UPPER(code) = ${code}
          AND deleted_at IS NULL
        LIMIT 1
      `;
    }

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
    console.error("Partner login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
