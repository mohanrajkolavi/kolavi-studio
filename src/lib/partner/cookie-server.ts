/**
 * Server-side partner cookie utilities (for middleware and API routes).
 * Must not import client-only code.
 */

export const PARTNER_COOKIE_NAME = "partner_ref";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** Valid partner code format: alphanumeric, 6-50 chars */
export const PARTNER_CODE_REGEX = /^[A-Za-z0-9]{6,50}$/;

/** Parse partner_ref from Cookie header string */
export function parsePartnerRefFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader?.trim()) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|; )${PARTNER_COOKIE_NAME}=([^;]*)`)
  );
  const raw = match?.[1]?.trim();
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return PARTNER_CODE_REGEX.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

/** Check if request already has partner_ref cookie (first-touch: don't overwrite) */
export function hasPartnerRefCookie(cookieHeader: string | null): boolean {
  return !!parsePartnerRefFromCookieHeader(cookieHeader);
}
