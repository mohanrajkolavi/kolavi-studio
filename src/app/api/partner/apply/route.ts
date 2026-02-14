import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "Server is not configured for partner applications." },
        { status: 503 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }
    const { name, email, phone, audience, promotionMethod, message } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!phone || typeof phone !== "string" || phone.trim().length === 0) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    if (!audience || typeof audience !== "string" || audience.trim().length === 0) {
      return NextResponse.json({ error: "Audience is required" }, { status: 400 });
    }

    if (!promotionMethod || typeof promotionMethod !== "string" || promotionMethod.trim().length === 0) {
      return NextResponse.json({ error: "Promotion method is required" }, { status: 400 });
    }

    if (name.length > 255 || email.length > 255 || phone.length > 50) {
      return NextResponse.json({ error: "Name, email, or phone is too long" }, { status: 400 });
    }
    if (audience.length > 255) {
      return NextResponse.json({ error: "Audience is too long" }, { status: 400 });
    }
    if (promotionMethod.length > 255) {
      return NextResponse.json({ error: "Promotion method is too long" }, { status: 400 });
    }

    // Check if partners table exists and insert application
    // We store in a partner_applications table or similar - for now we can use a simple approach.
    // The plan had partners table - applications could be stored as partners with status='pending'
    // Or we create a partner_applications table. Let me check the schema.
    // The migration has partners table with status='pending'. So we can insert new partners as pending applications.
    // But we need a unique code - we generate one from email or random. For applications, we might want a separate table
    // so we don't pollute partners with unapproved applications. Let me create partner_applications.

    // Actually the migration doesn't have partner_applications. Let me add it to the migration and create the table.
    // For now, I'll use a simple approach: store in partner_applications if it exists, else we need to add it.
    // Let me add partner_applications to the migration and create the API to use it.

    // Simpler: use partners table with status='pending'. Generate a temporary code (we'll assign real code on approval).
    // Problem: partners.code is UNIQUE and NOT NULL. We'd need to generate something. Let me add partner_applications table.

    // I'll add the table in a separate migration step. For now, let me try inserting into partner_applications.
    // If the table doesn't exist, the API will fail. I'll create the table in the migration file.
    await sql`
      INSERT INTO partner_applications (name, email, phone, audience, promotion_method, message)
      VALUES (
        ${name.trim()},
        ${email.trim().toLowerCase()},
        ${phone.trim().slice(0, 50)},
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
      console.error(
        "Partner apply: table missing. Run migration: src/lib/db/migrations/001_partner_program.sql",
        error
      );
      return NextResponse.json(
        { error: "Partner applications are not available" },
        { status: 503 }
      );
    }

    console.error("Partner apply error:", error);
    return NextResponse.json(
      { error: "Failed to submit application. Please try again." },
      { status: 500 }
    );
  }
}
