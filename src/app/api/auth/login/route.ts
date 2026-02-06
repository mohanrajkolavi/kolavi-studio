import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSecret, createSessionToken } from "@/lib/auth";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from "@/lib/auth/login-rate-limit";

const ADMIN_COOKIE_NAME = "admin-auth";

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

/** Validate redirect is a safe internal path (no open redirect) */
function validateRedirect(redirect: string | null, baseUrl: string): string {
  if (!redirect || typeof redirect !== "string" || redirect.trim().length === 0) {
    return "/dashboard";
  }
  const trimmed = redirect.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return "/dashboard";
  }
  try {
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.origin !== new URL(baseUrl).origin) {
      return "/dashboard";
    }
    const path = resolved.pathname;
    if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
    return path || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

async function getFormData(
  request: NextRequest
): Promise<{ password: string | null; redirect: string | null }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      password: body?.password ?? null,
      redirect: body?.redirect ?? null,
    };
  }

  const formData = await request.formData();
  const password = formData.get("password");
  const redirect = formData.get("redirect");
  return {
    password: typeof password === "string" ? password : null,
    redirect: typeof redirect === "string" ? redirect : null,
  };
}

function redirectWithError(request: NextRequest, error: string): NextResponse {
  const url = new URL("/dashboard/login", request.url);
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

function jsonError(error: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const { password, redirect: redirectParam } = await getFormData(request);
    const contentType = request.headers.get("content-type") || "";
    const wantsJson = contentType.includes("application/json");

    const rateLimit = await checkLoginRateLimit(request);
    if (!rateLimit.ok) {
      const unlockCode = process.env.RATE_LIMIT_UNLOCK_CODE?.trim();
      const passwordTrimmed = password && typeof password === "string" ? password.trim() : "";
      const unlockMatch =
        unlockCode &&
        passwordTrimmed &&
        timingSafeCompare(passwordTrimmed, unlockCode);
      if (unlockMatch) {
        await clearLoginRateLimit(request);
        if (wantsJson) {
          return NextResponse.json({ ok: true, unlocked: true, redirect: "/dashboard/login?unlocked=1" });
        }
        const url = new URL("/dashboard/login", request.url);
        url.searchParams.set("unlocked", "1");
        return NextResponse.redirect(url);
      }
      if (wantsJson) return jsonError(rateLimit.message, 429);
      return redirectWithError(request, rateLimit.message);
    }

    if (!password || typeof password !== "string" || password.trim().length === 0) {
      if (wantsJson) return jsonError("Password is required", 400);
      return redirectWithError(request, "Password+is+required");
    }

    const adminSecret = getAdminSecret().trim();
    if (!timingSafeCompare(password.trim(), adminSecret)) {
      await recordFailedLogin(request);
      if (wantsJson) return jsonError("Invalid credentials", 401);
      return redirectWithError(request, "Invalid+credentials");
    }

    await clearLoginRateLimit(request);

    const redirectFromParam = redirectParam || request.nextUrl.searchParams.get("redirect") || null;
    const redirectTo = validateRedirect(redirectFromParam, request.url);

    const sessionToken = await createSessionToken();
    const response = wantsJson
      ? NextResponse.json({ ok: true, redirect: redirectTo })
      : new NextResponse(
          `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${redirectTo}"></head><body>Signing in…</body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const wantsJson = (request.headers.get("content-type") || "").includes("application/json");
    if (wantsJson) return jsonError("Login failed", 500);
    return redirectWithError(request, "Login+failed");
  }
}
