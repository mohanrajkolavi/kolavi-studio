import { NextRequest, NextResponse } from "next/server";
import { getPartnerFromRequest } from "@/lib/partner-auth";
import { sql } from "@/lib/db";

function toIso(d: unknown): string | null {
  if (d == null) return null;
  const date = d instanceof Date ? d : new Date(d as string);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: NextRequest) {
  const partnerId = await getPartnerFromRequest(request);
  if (!partnerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const partnerResult = await sql`
      SELECT id, code, name, email, status, commission_one_time_pct, commission_recurring_pct, created_at
      FROM partners
      WHERE id = ${partnerId} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (partnerResult.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const p = partnerResult[0];
    if (p.status !== "active") {
      return NextResponse.json(
        { error: "Partner account is not active" },
        { status: 403 }
      );
    }

    const partner = {
      id: p.id,
      code: p.code,
      name: p.name,
      email: p.email,
      commissionOneTimePct: p.commission_one_time_pct != null ? Number(p.commission_one_time_pct) : 15,
      commissionRecurringPct: p.commission_recurring_pct != null ? Number(p.commission_recurring_pct) : 10,
      createdAt: toIso(p.created_at),
    };

    let referredLeads: Array<{
      id: string;
      name: string;
      status: string;
      commission: number;
      createdAt: string;
    }> = [];
    try {
      const leadsResult = await sql`
        SELECT id, name, status, paid_at, one_time_amount, recurring_amount, created_at
        FROM leads
        WHERE partner_id = ${partnerId}
        ORDER BY created_at DESC
      `;
      const oneTimePct = partner.commissionOneTimePct / 100;
      const recurringPct = partner.commissionRecurringPct / 100;
      referredLeads = leadsResult.map((l) => {
        const oneTime = l.one_time_amount != null ? Number(l.one_time_amount) : 0;
        const recurring = l.recurring_amount != null ? Number(l.recurring_amount) : 0;
        const commission =
          l.paid_at != null ? oneTime * oneTimePct + recurring * recurringPct : 0;
        return {
          id: l.id as string,
          name: l.name as string,
          status: l.status as string,
          commission: Math.round(commission * 100) / 100,
          createdAt: toIso(l.created_at) as string,
        };
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isSchemaMissing = /column "partner_id" does not exist|relation "leads"|undefined column|does not exist/i.test(msg);
      if (isSchemaMissing) {
        referredLeads = [];
      } else {
        console.error("Error fetching referredLeads (partner_id):", err);
        throw err;
      }
    }

    let payouts: Array<{
      id: string;
      amount: number;
      status: string;
      paidAt: string | null;
      createdAt: string;
    }> = [];
    try {
      const payoutsResult = await sql`
        SELECT id, amount, status, paid_at, created_at
        FROM partner_payouts
        WHERE partner_id = ${partnerId}
        ORDER BY created_at DESC
      `;
      payouts = payoutsResult.map((row) => ({
        id: row.id as string,
        amount: Number(row.amount),
        status: row.status as string,
        paidAt: row.paid_at ? toIso(row.paid_at) : null,
        createdAt: toIso(row.created_at) as string,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isSchemaMissing = /relation "partner_payouts" does not exist|undefined table|does not exist/i.test(msg);
      if (isSchemaMissing) {
        payouts = [];
      } else {
        console.error("Error fetching partner_payouts:", err);
        throw err;
      }
    }

    const totalCommissionEarned = referredLeads.reduce((sum, l) => sum + l.commission, 0);
    const totalPaidOut = payouts.filter((x) => x.status === "paid").reduce((sum, x) => sum + x.amount, 0);
    const pendingCommission = Math.max(0, totalCommissionEarned - totalPaidOut);

    return NextResponse.json({
      partner,
      stats: {
        referredLeadsCount: referredLeads.length,
        totalCommissionEarned: Math.round(totalCommissionEarned * 100) / 100,
        pendingCommission: Math.round(pendingCommission * 100) / 100,
        totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      },
      referredLeads,
      payouts,
    });
  } catch (error) {
    console.error("Partner me error:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner data" },
      { status: 500 }
    );
  }
}
