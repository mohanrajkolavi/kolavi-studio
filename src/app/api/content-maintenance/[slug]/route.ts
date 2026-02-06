import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

async function ensureContentMaintenanceTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS content_maintenance (
      post_slug VARCHAR(255) PRIMARY KEY,
      status VARCHAR(50) DEFAULT 'unreviewed',
      note TEXT,
      last_reviewed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_content_maintenance_status ON content_maintenance(status)`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slug } = await params;

    try {
      await ensureContentMaintenanceTable();
    } catch (e) {
      console.error("Content maintenance DB unavailable:", e);
      return NextResponse.json({
        slug,
        status: "unreviewed",
        note: null,
        lastReviewedAt: null,
        persisted: false,
      });
    }

    const result = await sql`
      SELECT post_slug, status, note, last_reviewed_at, updated_at
      FROM content_maintenance
      WHERE post_slug = ${slug}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        slug,
        status: "unreviewed",
        note: null,
        lastReviewedAt: null,
        persisted: true,
      });
    }

    const record = result[0];
    return NextResponse.json({
      slug: record.post_slug,
      status: record.status,
      note: record.note,
      lastReviewedAt: record.last_reviewed_at?.toISOString() || null,
      updatedAt: record.updated_at.toISOString(),
      persisted: true,
    });
  } catch (error) {
    console.error("Error fetching content maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to fetch content maintenance record" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { slug } = await params;
    const body = await request.json();
    const { status, note, markAsReviewed } = body;

    const statusVal = status ?? null;
    const noteVal = note ?? null;
    const lastReviewedAt = markAsReviewed ? new Date() : null;
    const statusProvided = status !== undefined;
    const noteProvided = note !== undefined;

    try {
      await ensureContentMaintenanceTable();
    } catch (e) {
      console.error("Content maintenance DB unavailable:", e);
      return NextResponse.json({
        slug,
        status: statusProvided ? (statusVal ?? "unreviewed") : "unreviewed",
        note: noteProvided ? noteVal : null,
        lastReviewedAt: markAsReviewed ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
        persisted: false,
      });
    }

    await sql`
      INSERT INTO content_maintenance (post_slug, status, note, last_reviewed_at, updated_at)
      VALUES (
        ${slug},
        COALESCE(${statusVal}, 'unreviewed'),
        ${noteVal},
        ${lastReviewedAt},
        NOW()
      )
      ON CONFLICT (post_slug) DO UPDATE SET
        status = CASE WHEN ${statusProvided} THEN COALESCE(EXCLUDED.status, content_maintenance.status, 'unreviewed') ELSE content_maintenance.status END,
        note = CASE WHEN ${noteProvided} THEN EXCLUDED.note ELSE content_maintenance.note END,
        last_reviewed_at = CASE WHEN ${!!markAsReviewed} THEN EXCLUDED.last_reviewed_at ELSE content_maintenance.last_reviewed_at END,
        updated_at = NOW()
    `;

    // Fetch updated record
    const result = await sql`
      SELECT post_slug, status, note, last_reviewed_at, updated_at
      FROM content_maintenance
      WHERE post_slug = ${slug}
      LIMIT 1
    `;

    const record = result[0];
    return NextResponse.json({
      slug: record.post_slug,
      status: record.status,
      note: record.note,
      lastReviewedAt: record.last_reviewed_at?.toISOString() || null,
      updatedAt: record.updated_at.toISOString(),
      persisted: true,
    });
  } catch (error) {
    console.error("Error updating content maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to update content maintenance record" },
      { status: 500 }
    );
  }
}
