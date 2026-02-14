import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

function toIso(d: unknown): string | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d as string);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;

    const result = await sql`
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
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const lead = result[0];
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, paidAt, oneTimeAmount, recurringAmount } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes === null || notes === "" ? null : notes;
    if (paidAt !== undefined) {
      const normalized = paidAt === null || paidAt === "" ? null : paidAt;
      if (normalized !== null) {
        const parsed = new Date(normalized as string);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json(
            { error: "Invalid paidAt date format" },
            { status: 400 }
          );
        }
        updateData.paid_at = parsed.toISOString();
      } else {
        updateData.paid_at = null;
      }
    }
    if (oneTimeAmount !== undefined) {
      const val = oneTimeAmount === null || oneTimeAmount === "" ? null : Number(oneTimeAmount);
      updateData.one_time_amount = val != null && !Number.isNaN(val) ? val : null;
    }
    if (recurringAmount !== undefined) {
      const val = recurringAmount === null || recurringAmount === "" ? null : Number(recurringAmount);
      updateData.recurring_amount = val != null && !Number.isNaN(val) ? val : null;
    }

    const columns = Object.keys(updateData);
    if (columns.length <= 1) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    await sql`
      UPDATE leads SET ${sql(updateData, ...columns)}
      WHERE id = ${id}
    `;

    // Fetch updated lead
    const result = await sql`
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
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    const lead = result[0];
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(_request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;

    const result = await sql`
      DELETE FROM leads
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
