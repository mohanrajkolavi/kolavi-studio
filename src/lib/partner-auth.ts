import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";

const raw = process.env.ADMIN_SECRET ?? "";
const SECRET = (typeof raw === "string" ? raw.trim().replace(/^['"]|['"]$/g, "") : "") || undefined;
const PARTNER_COOKIE_NAME = "partner-auth";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const HAS_SUPABASE = !!(SUPABASE_URL && SUPABASE_KEY);

// --- Legacy cookie-based auth (fallback when Supabase not configured) ---

function uint8ArrayToBase64url(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToUint8Array(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getWebCrypto(): Crypto {
  const c =
    (typeof globalThis !== "undefined" && (globalThis as unknown as { crypto?: Crypto }).crypto) ||
    (typeof crypto !== "undefined" ? (crypto as unknown as Crypto) : null);
  if (!c?.subtle) throw new Error("Web Crypto API not available");
  return c;
}

async function hmacSha256Base64url(key: string, data: string): Promise<string> {
  const webCrypto = getWebCrypto();
  const keyData = new TextEncoder().encode(key);
  const cryptoKey = await webCrypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const dataBytes = new TextEncoder().encode(data);
  const sig = await webCrypto.subtle.sign("HMAC", cryptoKey, dataBytes);
  return uint8ArrayToBase64url(new Uint8Array(sig));
}

async function signToken(payload: string): Promise<string> {
  if (!SECRET) throw new Error("ADMIN_SECRET not set");
  const sig = await hmacSha256Base64url(SECRET, payload);
  return `${payload}.${sig}`;
}

export async function verifyPartnerToken(token: string): Promise<{ partnerId: string } | null> {
  if (!SECRET) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = await hmacSha256Base64url(SECRET, payload);
  const bufA = base64urlToUint8Array(sig);
  const bufB = base64urlToUint8Array(expectedSig);
  if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) return null;
  const parts = payload.split(":");
  if (parts.length < 2) return null;
  const exp = parseInt(parts[0], 10);
  const partnerId = parts[1];
  if (Number.isNaN(exp) || exp <= Date.now() || !partnerId) return null;
  return { partnerId };
}

export async function createPartnerSessionToken(partnerId: string): Promise<string> {
  const webCrypto = getWebCrypto();
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const arr = new Uint8Array(16);
  webCrypto.getRandomValues(arr);
  const nonce = uint8ArrayToBase64url(arr);
  const payload = `${exp}:${partnerId}:${nonce}`;
  return signToken(payload);
}

export async function getPartnerFromRequest(request: NextRequest): Promise<string | null> {
  if (HAS_SUPABASE) {
    try {
      const { createAuthClient } = await import("@/lib/supabase/server-auth");
      const supabase = await createAuthClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.id) return null;
      const result = await sql`
        SELECT id FROM partners
        WHERE supabase_user_id = ${data.user.id}
          AND status = 'active'
          AND deleted_at IS NULL
        LIMIT 1
      `;
      const row = result[0] as { id: string } | undefined;
      return row ? row.id : null;
    } catch {
      // Fall through to legacy
    }
  }

  const cookie = request.cookies.get(PARTNER_COOKIE_NAME);
  if (!cookie?.value) return null;
  const result = await verifyPartnerToken(cookie.value);
  return result?.partnerId ?? null;
}

export async function getPartnerIdFromCookies(): Promise<string | null> {
  if (HAS_SUPABASE) {
    try {
      const { createAuthClient } = await import("@/lib/supabase/server-auth");
      const supabase = await createAuthClient();
      const { data } = await supabase.auth.getUser();
      if (!data?.user?.id) return null;
      let result: Awaited<ReturnType<typeof sql>>;
      try {
        result = await sql`
          SELECT id FROM partners
          WHERE supabase_user_id = ${data.user.id}
            AND status = 'active'
            AND deleted_at IS NULL
          LIMIT 1
        `;
      } catch {
        result = await sql`
          SELECT id FROM partners
          WHERE supabase_user_id = ${data.user.id}
            AND status = 'active'
            AND deleted_at IS NULL
          LIMIT 1
        `;
      }
      const row = result[0] as { id: string } | undefined;
      return row ? row.id : null;
    } catch {
      // Fall through to legacy
    }
  }

  const cookieStore = await cookies();
  const cookie = cookieStore.get(PARTNER_COOKIE_NAME);
  if (!cookie?.value) return null;
  const result = await verifyPartnerToken(cookie.value);
  return result?.partnerId ?? null;
}

export async function setPartnerAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PARTNER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearPartnerAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PARTNER_COOKIE_NAME);
}
