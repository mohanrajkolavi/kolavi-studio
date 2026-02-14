import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

function toIso(d: unknown): string | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

interface PartnerRow {
  id: string;
  code: string;
  name: string;
  email: string;
  status: string;
  commission_one_time_pct?: number | null;
  commission_recurring_pct?: number | null;
  notes: string | null;
  created_at: unknown;
  updated_at: unknown;
  deleted_at?: unknown;
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

    let partnerResult: Awaited<ReturnType<typeof sql>>;
    try {
      partnerResult = await sql`
        SELECT id, code, name, email, status, commission_one_time_pct, commission_recurring_pct, notes, created_at, updated_at, deleted_at
        FROM partners
        WHERE id = ${id}
        LIMIT 1
      `;
    } catch (colError) {
      const msg = colError instanceof Error ? colError.message : String(colError);
      if (msg.includes("deleted_at") || msg.includes("column") || msg.includes("does not exist")) {
        partnerResult = await sql`
          SELECT id, code, name, email, status, commission_one_time_pct, commission_recurring_pct, notes, created_at, updated_at
          FROM partners
          WHERE id = ${id}
          LIMIT 1
        `;
      } else {
        throw colError;
      }
    }

    if (partnerResult.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const p = partnerResult[0] as PartnerRow | undefined;
    if (!p) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    const partner = {
      id: p.id,
      code: p.code,
      name: p.name,
      email: p.email,
      status: p.status,
      commissionOneTimePct: p.commission_one_time_pct != null ? Number(p.commission_one_time_pct) : 15,
      commissionRecurringPct: p.commission_recurring_pct != null ? Number(p.commission_recurring_pct) : 10,
      notes: p.notes,
      createdAt: toIso(p.created_at),
      updatedAt: toIso(p.updated_at),
      deletedAt: "deleted_at" in p ? toIso(p.deleted_at) : null,
    };

    // Referred leads (partner_id column added by migration)
    let referredLeads: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      paidAt: string | null;
      oneTimeAmount: number | null;
      recurringAmount: number | null;
      commission: number;
      createdAt: string;
    }> = [];
    try {
      const leadsResult = await sql`
        SELECT id, name, email, status, paid_at, one_time_amount, recurring_amount, created_at
        FROM leads
        WHERE partner_id = ${id}
        ORDER BY created_at DESC
      `;
      const oneTimePct = partner.commissionOneTimePct / 100;
      const recurringPct = partner.commissionRecurringPct / 100;
      referredLeads = leadsResult.map((l) => {
        const oneTime = l.one_time_amount != null ? Number(l.one_time_amount) : 0;
        const recurring = l.recurring_amount != null ? Number(l.recurring_amount) : 0;
        // Commission only counts when admin has confirmed payment (paid_at set)
        const commission =
          l.paid_at != null ? oneTime * oneTimePct + recurring * recurringPct : 0;
        return {
          id: l.id as string,
          name: l.name as string,
          email: l.email as string,
          status: l.status as string,
          paidAt: l.paid_at ? toIso(l.paid_at) : null,
          oneTimeAmount: l.one_time_amount != null ? Number(l.one_time_amount) : null,
          recurringAmount: l.recurring_amount != null ? Number(l.recurring_amount) : null,
          commission: Math.round(commission * 100) / 100,
          createdAt: toIso(l.created_at) as string,
        };
      });
    } catch {
      // partner_id column may not exist if migration not run
    }

    // Payouts
    let payouts: Array<{
      id: string;
      amount: number;
      status: string;
      paidAt: string | null;
      notes: string | null;
      createdAt: string;
    }> = [];
    try {
      const payoutsResult = await sql`
        SELECT id, amount, status, paid_at, notes, created_at
        FROM partner_payouts
        WHERE partner_id = ${id}
        ORDER BY created_at DESC
      `;
      payouts = payoutsResult.map((row) => ({
        id: row.id as string,
        amount: Number(row.amount),
        status: row.status as string,
        paidAt: row.paid_at ? toIso(row.paid_at) : null,
        notes: row.notes as string | null,
        createdAt: toIso(row.created_at) as string,
      }));
    } catch {
      // partner_payouts table may not exist
    }

    const totalCommissionEarned = referredLeads.reduce((sum, l) => sum + l.commission, 0);
    const totalPaidOut = payouts.filter((x) => x.status === "paid").reduce((sum, x) => sum + x.amount, 0);
    const pendingCommission = totalCommissionEarned - totalPaidOut;

    return NextResponse.json({
      partner,
      stats: {
        referredLeadsCount: referredLeads.length,
        totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
        pendingCommission: Math.round(Math.max(0, pendingCommission) * 100) / 100,
        totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      },
      referredLeads,
      payouts,
    });
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
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
    const exists = await sql`SELECT id, deleted_at FROM partners WHERE id = ${id} LIMIT 1`;
    if (exists.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }
    const row = exists[0];
    if ("deleted_at" in row && row.deleted_at != null) {
      return NextResponse.json({ error: "Cannot update deleted partner" }, { status: 400 });
    }
    const body = await request.json();
    const { status, notes } = body;

    if (status === undefined && notes === undefined) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const valid = ["pending", "active", "paused", "suspended"];
    const statusVal = status !== undefined && valid.includes(status) ? status : undefined;
    const notesVal = notes !== undefined ? (notes === null || notes === "" ? null : notes) : undefined;
    if (statusVal !== undefined && notesVal !== undefined) {
      await sql`UPDATE partners SET status = ${statusVal}, notes = ${notesVal}, updated_at = NOW() WHERE id = ${id}`;
    } else if (statusVal !== undefined) {
      await sql`UPDATE partners SET status = ${statusVal}, updated_at = NOW() WHERE id = ${id}`;
    } else if (notesVal !== undefined) {
      await sql`UPDATE partners SET notes = ${notesVal}, updated_at = NOW() WHERE id = ${id}`;
    }

    const result = await sql`
      SELECT id, code, name, email, status, notes, created_at, updated_at
      FROM partners WHERE id = ${id} LIMIT 1
    `;
    if (result.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const p = result[0];
    return NextResponse.json({
      id: p.id,
      code: p.code,
      name: p.name,
      email: p.email,
      status: p.status,
      notes: p.notes,
      createdAt: toIso(p.created_at),
      updatedAt: toIso(p.updated_at),
    });
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const permanent = request.nextUrl.searchParams.get("permanent") === "true";

    let partnerRow: Awaited<ReturnType<typeof sql>>;
    try {
      partnerRow = await sql`SELECT id, deleted_at FROM partners WHERE id = ${id} LIMIT 1`;
    } catch {
      partnerRow = await sql`SELECT id FROM partners WHERE id = ${id} LIMIT 1`;
    }
    if (partnerRow.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const firstRow = partnerRow[0] as { deleted_at?: unknown } | undefined;
    const isAlreadyDeleted =
      firstRow != null && "deleted_at" in firstRow && firstRow.deleted_at != null;

    if (permanent && isAlreadyDeleted) {
      await sql`UPDATE leads SET partner_id = NULL, referral_code = NULL WHERE partner_id = ${id}`;
      await sql`DELETE FROM partner_payouts WHERE partner_id = ${id}`;
      await sql`DELETE FROM partner_click_logs WHERE partner_id = ${id}`;
      await sql`DELETE FROM partners WHERE id = ${id}`;
      return NextResponse.json({ ok: true });
    }

    if (permanent && !isAlreadyDeleted) {
      return NextResponse.json(
        { error: "Partner must be soft-deleted first before permanent delete" },
        { status: 400 }
      );
    }

    let exists: Awaited<ReturnType<typeof sql>>;
    try {
      exists = await sql`SELECT id FROM partners WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`;
    } catch {
      exists = await sql`SELECT id FROM partners WHERE id = ${id} LIMIT 1`;
    }
    if (exists.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    await sql`UPDATE partners SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      { error: "Failed to delete partner" },
      { status: 500 }
    );
  }
}
