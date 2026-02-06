import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const raw = process.env.ADMIN_SECRET ?? "";
const ADMIN_SECRET = (typeof raw === "string" ? raw.trim().replace(/^['"]|['"]$/g, "") : "") || undefined;
const ADMIN_COOKIE_NAME = "admin-auth";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// --- Edge-compatible helpers (no Node crypto) ---

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

function timingSafeCompare(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function getWebCrypto(): Crypto {
  const c =
    (typeof globalThis !== "undefined" && (globalThis as unknown as { crypto?: Crypto }).crypto) ||
    (typeof crypto !== "undefined" ? (crypto as unknown as Crypto) : null);
  if (!c?.subtle) throw new Error("Web Crypto API (crypto.subtle) not available");
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

export function getAdminSecret(): string {
  if (!ADMIN_SECRET) {
    throw new Error("ADMIN_SECRET environment variable is not set");
  }
  return ADMIN_SECRET;
}

async function signSessionToken(payload: string): Promise<string> {
  if (!ADMIN_SECRET) throw new Error("ADMIN_SECRET not set");
  const sig = await hmacSha256Base64url(ADMIN_SECRET, payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  if (!ADMIN_SECRET) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = await hmacSha256Base64url(ADMIN_SECRET, payload);
  const bufA = base64urlToUint8Array(sig);
  const bufB = base64urlToUint8Array(expectedSig);
  if (bufA.length !== bufB.length) return false;
  if (!timingSafeEqual(bufA, bufB)) return false;
  const [expStr] = payload.split(":");
  const exp = parseInt(expStr, 10);
  return !Number.isNaN(exp) && exp > Date.now();
}

export async function createSessionToken(): Promise<string> {
  const webCrypto = getWebCrypto();
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const arr = new Uint8Array(24);
  webCrypto.getRandomValues(arr);
  const sessionId = uint8ArrayToBase64url(arr);
  const payload = `${exp}:${sessionId}`;
  return signSessionToken(payload);
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  if (!ADMIN_SECRET) {
    return false;
  }

  // Check cookie (signed session token)
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value) {
    if (await verifySessionToken(cookie.value)) return true;
  }

  // Check Authorization header (Bearer with raw secret for API clients)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const isJwtShape = /^\S+\.\S+\.\S+$/.test(token);
    if (isJwtShape) {
      return verifySessionToken(token);
    }
    return timingSafeCompare(token, ADMIN_SECRET);
  }

  return false;
}

export async function setAuthCookie(secret: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
