import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const pageRaw = parseInt(searchParams.get("page") ?? "1", 10);
    const limitRaw = parseInt(searchParams.get("limit") ?? "50", 10);
    const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
    const limit = Number.isNaN(limitRaw) || limitRaw < 1 ? 50 : Math.min(limitRaw, 100);
    const offset = (page - 1) * limit;

    // Build WHERE clause from conditions
    const parts: ReturnType<typeof sql>[] = [];
    if (status) parts.push(sql`status = ${status}`);
    if (source) parts.push(sql`source = ${source}`);
    if (search) {
      const searchPattern = `%${search}%`;
      parts.push(sql`(name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`);
    }
    const whereClause =
      parts.length === 0
        ? sql``
        : parts.length === 1
          ? sql`WHERE ${parts[0]}`
          : parts.length === 2
            ? sql`WHERE ${parts[0]} AND ${parts[1]}`
            : sql`WHERE ${parts[0]} AND ${parts[1]} AND ${parts[2]}`;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM leads
      ${whereClause}
    `;
    const total = Number(countResult[0]?.total || 0);

    // Get leads
    const leads = await sql`
      SELECT 
        id,
        name,
        email,
        phone,
        business_type,
        message,
        source,
        status,
        notes,
        created_at,
        updated_at
      FROM leads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const toIso = (d: unknown) =>
      d != null ? (d instanceof Date ? d.toISOString() : new Date(d as string).toISOString()) : null;

    return NextResponse.json({
      leads: leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        businessType: lead.business_type,
        message: lead.message,
        source: lead.source,
        status: lead.status,
        notes: lead.notes,
        createdAt: toIso(lead.created_at),
        updatedAt: toIso(lead.updated_at),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
