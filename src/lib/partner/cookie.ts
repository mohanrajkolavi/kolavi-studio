/**
 * Partner referral cookie utilities.
 * Cookie: partner_ref = {code}, 30-day first-touch attribution.
 */

export const PARTNER_COOKIE_NAME = "partner_ref";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** Valid partner code format: alphanumeric, 6-20 chars */
export const PARTNER_CODE_REGEX = /^[A-Za-z0-9]{6,20}$/;

export function getPartnerRefFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${PARTNER_COOKIE_NAME}=([^;]*)`)
  );
  const value = match?.[1]?.trim();
  return value || null;
}

/** First-touch attribution: do not overwrite existing partner cookie. */
export function setPartnerRefCookie(code: string): void {
  if (typeof document === "undefined") return;
  const existing = getPartnerRefFromCookie();
  if (existing) return;
  const sanitized = code.trim().slice(0, 50);
  if (!PARTNER_CODE_REGEX.test(sanitized)) return;
  const maxAge = PARTNER_COOKIE_MAX_AGE;
  const secure = typeof window !== "undefined" && window.location?.protocol === "https:";
  document.cookie = `${PARTNER_COOKIE_NAME}=${encodeURIComponent(sanitized)}; path=/; max-age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
