import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let countsResult: Awaited<ReturnType<typeof sql>>;
    try {
      countsResult = await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS active_count,
          COUNT(*) FILTER (WHERE status = 'paused') AS paused_count,
          COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
          COUNT(*) AS total_count
        FROM partners
        WHERE deleted_at IS NULL
      `;
    } catch (colError) {
      const msg = colError instanceof Error ? colError.message : String(colError);
      if (msg.includes("deleted_at") || msg.includes("column") || msg.includes("does not exist")) {
        countsResult = await sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'active') AS active_count,
            COUNT(*) FILTER (WHERE status = 'paused') AS paused_count,
            COUNT(*) FILTER (WHERE status = 'suspended') AS suspended_count,
            COUNT(*) AS total_count
          FROM partners
        `;
      } else {
        throw colError;
      }
    }
    type CountsRow = { total_count?: number; active_count?: number; paused_count?: number; suspended_count?: number };
    const counts: CountsRow | undefined = countsResult[0] as CountsRow | undefined;

    let totalProcessed = 0;
    let pendingAmount = 0;
    try {
      let payoutsResult: Awaited<ReturnType<typeof sql>>;
      try {
        payoutsResult = await sql`
          SELECT COALESCE(SUM(pp.amount), 0) AS total_processed
          FROM partner_payouts pp
          JOIN partners p ON pp.partner_id = p.id AND p.deleted_at IS NULL
          WHERE pp.status = 'paid'
        `;
      } catch (colError) {
        const msg = colError instanceof Error ? colError.message : String(colError);
        if (msg.includes("deleted_at") || msg.includes("column") || msg.includes("does not exist")) {
          payoutsResult = await sql`
            SELECT COALESCE(SUM(amount), 0) AS total_processed
            FROM partner_payouts
            WHERE status = 'paid'
          `;
        } else {
          throw colError;
        }
      }
      const payoutsRow = payoutsResult[0] as { total_processed?: number } | undefined;
      totalProcessed = Number(payoutsRow?.total_processed ?? 0);

      // Pending = commission from confirmed-paid leads minus total paid out (automatic)
      let pendingResult: Awaited<ReturnType<typeof sql>>;
      try {
        pendingResult = await sql`
          SELECT
            COALESCE(SUM(
              (COALESCE(l.one_time_amount, 0) * p.commission_one_time_pct / 100) +
              (COALESCE(l.recurring_amount, 0) * p.commission_recurring_pct / 100)
            ), 0) AS total_commission
          FROM leads l
          JOIN partners p ON l.partner_id = p.id AND p.deleted_at IS NULL
          WHERE l.paid_at IS NOT NULL
        `;
      } catch (colError) {
        const msg = colError instanceof Error ? colError.message : String(colError);
        if (msg.includes("deleted_at") || msg.includes("column") || msg.includes("does not exist")) {
          pendingResult = await sql`
            SELECT
              COALESCE(SUM(
                (COALESCE(l.one_time_amount, 0) * p.commission_one_time_pct / 100) +
                (COALESCE(l.recurring_amount, 0) * p.commission_recurring_pct / 100)
              ), 0) AS total_commission
            FROM leads l
            JOIN partners p ON l.partner_id = p.id
            WHERE l.paid_at IS NOT NULL
          `;
        } else {
          throw colError;
        }
      }
      const totalCommission = Number((pendingResult[0] as { total_commission?: number })?.total_commission ?? 0);
      pendingAmount = Math.max(0, totalCommission - totalProcessed);
    } catch (err) {
      console.error("Error fetching partner_payouts/commission stats:", err);
      const c = counts;
      return NextResponse.json({
        partners: Number(c?.total_count ?? 0),
        active: Number(c?.active_count ?? 0),
        paused: Number(c?.paused_count ?? 0),
        suspended: Number(c?.suspended_count ?? 0),
        totalAmountProcessed: null,
        pendingAmount: null,
        dataIncomplete: true,
        error: "Some stats could not be computed",
      });
    }

    return NextResponse.json({
      partners: Number(counts?.total_count ?? 0),
      active: Number(counts?.active_count ?? 0),
      paused: Number(counts?.paused_count ?? 0),
      suspended: Number(counts?.suspended_count ?? 0),
      totalAmountProcessed: totalProcessed,
      pendingAmount,
    });
  } catch (error) {
    console.error("Error fetching partner stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
