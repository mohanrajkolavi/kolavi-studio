import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { sql } from "@/lib/db";

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
      createdAt: lead.created_at != null ? (lead.created_at instanceof Date ? lead.created_at.toISOString() : new Date(lead.created_at).toISOString()) : null,
      updatedAt: lead.updated_at != null ? (lead.updated_at instanceof Date ? lead.updated_at.toISOString() : new Date(lead.updated_at).toISOString()) : null,
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
    const { status, notes } = body;

    if (status === undefined && notes === undefined) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Use explicit sql fragments for nulls to avoid "could not determine data type of parameter"
    const notesFragment = notes !== null && notes !== undefined ? sql`${notes}` : sql`NULL`;

    // Build update query dynamically
    if (status !== undefined && notes !== undefined) {
      await sql`
        UPDATE leads
        SET status = ${status}, notes = ${notesFragment}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } else if (status !== undefined) {
      await sql`
        UPDATE leads
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
      `;
    } else if (notes !== undefined) {
      await sql`
        UPDATE leads
        SET notes = ${notesFragment}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

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
      createdAt: lead.created_at != null ? (lead.created_at instanceof Date ? lead.created_at.toISOString() : new Date(lead.created_at).toISOString()) : null,
      updatedAt: lead.updated_at != null ? (lead.updated_at instanceof Date ? lead.updated_at.toISOString() : new Date(lead.updated_at).toISOString()) : null,
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
