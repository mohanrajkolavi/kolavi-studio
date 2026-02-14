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
    const conditions: ReturnType<typeof sql>[] = [];
    if (status) conditions.push(sql`status = ${status}`);
    if (source) conditions.push(sql`source = ${source}`);
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(sql`(name ILIKE ${searchPattern} OR email ILIKE ${searchPattern})`);
    }
    const whereClause =
      conditions.length === 0
        ? sql``
        : sql`WHERE ${conditions.reduce((prev, curr) => sql`${prev} AND ${curr}`)}`;

    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM leads
      ${whereClause}
    `;
    const total = Number(countResult[0]?.total || 0);

    // Get leads (include partner fields for commission tracking)
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
        partner_id,
        referral_code,
        paid_at,
        one_time_amount,
        recurring_amount,
        created_at,
        updated_at
      FROM leads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const toIso = (d: unknown): string | null => {
      if (d == null) return null;
      const date = d instanceof Date ? d : new Date(d as string);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

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
        partnerId: lead.partner_id,
        referralCode: lead.referral_code,
        paidAt: lead.paid_at ? toIso(lead.paid_at) : null,
        oneTimeAmount: lead.one_time_amount != null ? Number(lead.one_time_amount) : null,
        recurringAmount: lead.recurring_amount != null ? Number(lead.recurring_amount) : null,
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
