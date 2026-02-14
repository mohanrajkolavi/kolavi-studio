import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  supabase_user_id?: string | null;
  commission_one_time_pct?: number | null;
  commission_recurring_pct?: number | null;
  notes: string | null;
  created_at: unknown;
  updated_at: unknown;
  deleted_at?: unknown;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const deleted = searchParams.get("deleted") === "true";

    const conditions: ReturnType<typeof sql>[] = [];
    if (status) conditions.push(sql`status = ${status}`);

    let partners: Awaited<ReturnType<typeof sql>>;
    try {
      if (deleted) {
        conditions.push(sql`deleted_at IS NOT NULL`);
      } else {
        conditions.push(sql`deleted_at IS NULL`);
      }
      const whereClause =
        conditions.length === 0 ? sql`` : sql`WHERE ${conditions.reduce((prev, curr) => sql`${prev} AND ${curr}`)}`;
      partners = await sql`
        SELECT id, code, name, email, status, supabase_user_id, commission_one_time_pct, commission_recurring_pct, notes, created_at, updated_at, deleted_at
        FROM partners
        ${whereClause}
        ORDER BY ${deleted ? sql`deleted_at DESC` : sql`created_at DESC`}
      `;
    } catch (colError) {
      const msg = colError instanceof Error ? colError.message : String(colError);
      if (msg.includes("deleted_at") || msg.includes("column") || msg.includes("does not exist")) {
        if (deleted) {
          partners = [] as unknown as Awaited<ReturnType<typeof sql>>;
        } else {
          conditions.pop();
          const whereClause =
            conditions.length === 0 ? sql`` : sql`WHERE ${conditions.reduce((prev, curr) => sql`${prev} AND ${curr}`)}`;
          partners = await sql`
            SELECT id, code, name, email, status, commission_one_time_pct, commission_recurring_pct, notes, created_at, updated_at
            FROM partners
            ${whereClause}
            ORDER BY created_at DESC
          `;
        }
      } else {
        throw colError;
      }
    }

    const toIso = (d: unknown): string | null => {
      if (d == null) return null;
      const date = d instanceof Date ? d : new Date(d as string);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    return NextResponse.json({
      partners: partners.filter((p): p is PartnerRow => p != null).map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        email: p.email,
        status: p.status,
        supabaseUserId: "supabase_user_id" in p ? p.supabase_user_id : null,
        commissionOneTimePct: p.commission_one_time_pct != null ? Number(p.commission_one_time_pct) : 15,
        commissionRecurringPct: p.commission_recurring_pct != null ? Number(p.commission_recurring_pct) : 10,
        notes: p.notes,
        createdAt: toIso(p.created_at),
        updatedAt: toIso(p.updated_at),
        deletedAt: "deleted_at" in p ? toIso(p.deleted_at) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }
    const { code, name, email, phone, status } = body;

    if (!code || typeof code !== "string" || code.trim().length < 6) {
      return NextResponse.json(
        { error: "Code is required (6-50 alphanumeric characters)" },
        { status: 400 }
      );
    }
    const codeVal = code.trim().toUpperCase().slice(0, 50);
    if (!/^[A-Za-z0-9]{6,50}$/.test(codeVal)) {
      return NextResponse.json(
        { error: "Code must be 6-50 alphanumeric characters" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const validStatuses = ["pending", "active", "paused", "suspended"] as const;
    let finalStatus: (typeof validStatuses)[number];
    if (status === undefined || status === null || status === "") {
      finalStatus = "active";
    } else if (typeof status === "string" && validStatuses.includes(status as (typeof validStatuses)[number])) {
      finalStatus = status as (typeof validStatuses)[number];
    } else {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const phoneVal =
      phone && typeof phone === "string" && phone.trim().length > 0 ? phone.trim().slice(0, 50) : null;

    const [created] = await sql`
      INSERT INTO partners (code, name, email, phone, status)
      VALUES (${codeVal}, ${name.trim()}, ${email.trim().toLowerCase()}, ${phoneVal}, ${finalStatus})
      RETURNING id
    `;

    if (!created?.id) {
      return NextResponse.json(
        { success: false, error: "No id returned from insert" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
      return NextResponse.json({ error: "A partner with this code already exists" }, { status: 409 });
    }
    if (msg.includes("relation") && msg.includes("does not exist")) {
      console.error("Partners table not found:", msg, error instanceof Error ? error.stack : "");
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV !== "production"
              ? "Partners table not found. Run the database migrations: 001_partner_program.sql, 002, 003, 005, 006_partner_phone.sql"
              : "Database error. Please contact support.",
        },
        { status: 500 }
      );
    }
    if (msg.includes("column") && msg.includes("does not exist")) {
      console.error("Database schema outdated:", msg, error instanceof Error ? error.stack : "");
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV !== "production"
              ? "Database schema outdated. Run migration 006_partner_phone.sql: psql $DATABASE_URL -f src/lib/db/migrations/006_partner_phone.sql"
              : "Database error. Please contact support.",
        },
        { status: 500 }
      );
    }
    const isConnectionFailure =
      msg.includes("DATABASE_URL") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("connection refused") ||
      msg.includes("failed to connect") ||
      /\bconnect\s+ECONNREFUSED\b/i.test(msg);
    if (isConnectionFailure) {
      console.error("Database connection failed:", msg, error instanceof Error ? error.stack : "");
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV !== "production"
              ? "Database connection failed. Check DATABASE_URL in .env.local and ensure the database is reachable."
              : "Service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }
    console.error("Error creating partner:", error);
    return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
  }
}
