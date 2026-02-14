import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

function toIso(d: unknown): string | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: partnerId, payoutId } = await params;
    const partnerCheck = await sql`SELECT id FROM partners WHERE id = ${partnerId} LIMIT 1`;
    if (partnerCheck.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const { status } = body;

    if (status !== "paid") {
      return NextResponse.json(
        { error: "Only status 'paid' is supported" },
        { status: 400 }
      );
    }

    const result = await sql`
      UPDATE partner_payouts
      SET status = 'paid', paid_at = NOW()
      WHERE id = ${payoutId} AND partner_id = ${partnerId}
      RETURNING id, amount, status, paid_at, notes, created_at
    `;

    const row = result[0];
    if (!row) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      amount: Number(row.amount),
      status: row.status,
      paidAt: row.paid_at ? toIso(row.paid_at) : null,
      notes: row.notes,
      createdAt: toIso(row.created_at),
    });
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json(
      { error: "Failed to update payout" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; payoutId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: partnerId, payoutId } = await params;
    const partnerCheck = await sql`SELECT id FROM partners WHERE id = ${partnerId} LIMIT 1`;
    if (partnerCheck.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await sql`
      DELETE FROM partner_payouts
      WHERE id = ${payoutId} AND partner_id = ${partnerId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payout:", error);
    return NextResponse.json(
      { error: "Failed to delete payout" },
      { status: 500 }
    );
  }
}
