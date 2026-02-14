import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    let applications;
    try {
      applications = await sql`
        SELECT id, name, email, phone, audience, promotion_method, message, created_at
        FROM partner_applications
        WHERE status IS NULL OR status = 'pending'
        ORDER BY created_at DESC
      `;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = err && typeof err === "object" && "code" in err ? (err as { code?: string }).code : undefined;
      const isMissingColumn =
        code === "42703" || /column "status" does not exist|column .status. does not exist/i.test(msg);
      if (isMissingColumn) {
        applications = await sql`
          SELECT id, name, email, phone, audience, promotion_method, message, created_at
          FROM partner_applications
          ORDER BY created_at DESC
        `;
      } else {
        throw err;
      }
    }

    const toIso = (d: unknown): string | null => {
      if (d == null) return null;
      const date = d instanceof Date ? d : new Date(d as string);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    };

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: "phone" in a ? a.phone : null,
        audience: a.audience,
        promotionMethod: a.promotion_method,
        message: a.message,
        createdAt: toIso(a.created_at),
      })),
    });
  } catch (error) {
    console.error("Error fetching partner applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
