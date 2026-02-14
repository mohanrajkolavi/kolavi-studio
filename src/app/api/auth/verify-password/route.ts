import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSecret } from "@/lib/auth";
import { isAuthenticated } from "@/lib/auth";

function timingSafeCompare(a: string, b: string): boolean {
  const trimmedA = (typeof a === "string" ? a : "").trim();
  const bufA = Buffer.from(trimmedA, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufB, bufB);
    return false;
  }
  if (bufB.length === 0) return trimmedA.length === 0;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** Verify dashboard password. Requires authenticated session. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const password = body?.password;
    if (!password || typeof password !== "string" || password.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "Password is required" }, { status: 400 });
    }
    let adminSecret: string;
    try {
      adminSecret = getAdminSecret().trim();
    } catch {
      console.error("Verify password: ADMIN_SECRET is not configured");
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }
    if (!adminSecret) {
      console.error("Verify password: ADMIN_SECRET is empty after trim");
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }
    if (!timingSafeCompare(password.trim(), adminSecret)) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Verify password error:", error);
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 });
  }
}
