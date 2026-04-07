import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql, optionalText } from "@/lib/db";

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

    // Warn if payout exceeds pending commission (soft validation)
    let warning: string | undefined;
    try {
      const partnerResult = await sql`
        SELECT commission_one_time_pct, commission_recurring_pct FROM partners WHERE id = ${partnerId} LIMIT 1
      `;
      const p = partnerResult[0];
      if (p) {
        const oneTimePct = (p.commission_one_time_pct != null ? Number(p.commission_one_time_pct) : 10) / 100;
        const recurringPct = (p.commission_recurring_pct != null ? Number(p.commission_recurring_pct) : 5) / 100;
        const leadsResult = await sql`
          SELECT one_time_amount, recurring_amount, paid_at FROM leads WHERE partner_id = ${partnerId}
        `;
        const totalEarned = leadsResult.reduce((sum, l) => {
          if (!l.paid_at) return sum;
          const ot = l.one_time_amount != null ? Number(l.one_time_amount) : 0;
          const rc = l.recurring_amount != null ? Number(l.recurring_amount) : 0;
          return sum + ot * oneTimePct + rc * recurringPct;
        }, 0);
        const paidOutResult = await sql`
          SELECT COALESCE(SUM(amount), 0) as total FROM partner_payouts
          WHERE partner_id = ${partnerId} AND status = 'paid'
        `;
        const totalPaidOut = Number(paidOutResult[0]?.total ?? 0);
        const pendingCommission = Math.round(Math.max(0, totalEarned - totalPaidOut) * 100) / 100;
        if (amountNum > pendingCommission) {
          warning = `Payout amount ($${amountNum}) exceeds pending commission ($${pendingCommission})`;
        }
      }
    } catch {
      // Non-critical - proceed without warning
    }

    const notesVal = notes && typeof notes === "string" ? notes.trim() || null : null;

    const result = await sql`
      INSERT INTO partner_payouts (partner_id, amount, status, notes)
      VALUES (${partnerId}, ${amountNum}, 'pending', ${optionalText(notesVal)})
      RETURNING id, amount, status, paid_at, notes, created_at
    `;

    const row = result[0];
    if (!row) {
      return NextResponse.json({ error: "Failed to create payout" }, { status: 500 });
    }

    // Audit log for payout creation
    try {
      await sql`
        INSERT INTO admin_action_logs (action, target_type, target_id, details)
        VALUES ('create_payout', 'partner', ${partnerId}, ${JSON.stringify({ payoutId: row.id, amount: amountNum })})
      `;
    } catch {
      // admin_action_logs table may not exist - non-critical
    }

    return NextResponse.json({
      id: row.id,
      amount: Number(row.amount),
      status: row.status,
      paidAt: row.paid_at ? toIso(row.paid_at) : null,
      notes: row.notes,
      createdAt: toIso(row.created_at),
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    );
  }
}
