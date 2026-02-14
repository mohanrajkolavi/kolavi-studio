import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

function toIso(d: unknown): string | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: partnerId } = await params;
    const partnerCheck = await sql`SELECT id FROM partners WHERE id = ${partnerId} LIMIT 1`;
    if (partnerCheck.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }
    const { amount, notes } = body;
    const amountNum = typeof amount === "string" ? parseFloat(amount) : Number(amount);

    if (amount == null || Number.isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    const notesVal = notes && typeof notes === "string" ? notes.trim() || null : null;

    const result = await sql`
      INSERT INTO partner_payouts (partner_id, amount, status, notes)
      VALUES (${partnerId}, ${amountNum}, 'pending', ${notesVal})
      RETURNING id, amount, status, paid_at, notes, created_at
    `;

    const row = result[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
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
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    );
  }
}
