import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getPosts } from "@/lib/blog/data";

type MaintenanceRecordRow = {
  post_slug: string;
  status: string;
  note: string | null;
  last_reviewed_at: Date | null;
  updated_at: Date;
};

async function ensureContentMaintenanceTable() {
  // Use a minimal schema that doesn't require extensions (e.g. gen_random_uuid()).
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

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const minAgeDays = searchParams.get("minAgeDays");
    const category = searchParams.get("category");

    // Get all blog posts from WordPress
    const posts = await getPosts();

    let maintenanceRecords: MaintenanceRecordRow[] = [];
    try {
      await ensureContentMaintenanceTable();
      // Get maintenance records from database
      maintenanceRecords = (await sql`
        SELECT post_slug, status, note, last_reviewed_at, updated_at
        FROM content_maintenance
      `) as unknown as MaintenanceRecordRow[];
    } catch (e) {
      // If DB isn't configured or table can't be created, degrade gracefully.
      console.error("Content maintenance DB unavailable:", e);
      maintenanceRecords = [];
    }

    const maintenanceMap = new Map(
      maintenanceRecords.map((r) => [
        r.post_slug,
        {
          status: r.status,
          note: r.note,
          lastReviewedAt: r.last_reviewed_at,
          updatedAt: r.updated_at,
        },
      ])
    );

    // Combine posts with maintenance data
    let combined = posts.map((post) => {
      const maintenance = maintenanceMap.get(post.slug);
      const modifiedDate = post.modified
        ? new Date(post.modified)
        : new Date(post.date);
      const ageDays =
        Math.floor((Date.now() - modifiedDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        slug: post.slug,
        title: post.title,
        modified: post.modified || post.date,
        ageDays,
        categories: post.categories?.nodes?.map((c: { name: string }) => c.name) || [],
        tags: post.tags?.nodes?.map((t: { name: string }) => t.name) || [],
        status: maintenance?.status || "unreviewed",
        note: maintenance?.note || null,
        lastReviewedAt: maintenance?.lastReviewedAt?.toISOString() || null,
      };
    });

    // Apply filters
    if (status) {
      combined = combined.filter((p) => p.status === status);
    }

    if (minAgeDays) {
      const minAge = parseInt(minAgeDays, 10);
      if (!Number.isNaN(minAge)) {
        combined = combined.filter((p) => p.ageDays >= minAge);
      }
    }

    if (category) {
      combined = combined.filter((p) =>
        p.categories.some((c) => c.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Sort by age (oldest first)
    combined.sort((a, b) => b.ageDays - a.ageDays);

    return NextResponse.json({ posts: combined });
  } catch (error) {
    console.error("Error fetching content maintenance data:", error);
    return NextResponse.json(
      { error: "Failed to fetch content maintenance data" },
      { status: 500 }
    );
  }
}
