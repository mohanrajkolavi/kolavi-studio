/**
 * Partner referral cookie utilities.
 * Cookie: partner_ref = {code}, 30-day first-touch attribution.
 */

export const PARTNER_COOKIE_NAME = "partner_ref";
const PARTNER_STORAGE_KEY = "partner_ref";
export const PARTNER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** Valid partner code format: alphanumeric, 6-50 chars (matches partners.code and contact API) */
export const PARTNER_CODE_REGEX = /^[A-Za-z0-9]{6,50}$/;

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

/** Set ref in sessionStorage (fallback when cookies blocked). First-touch. */
export function setPartnerRefStorage(code: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const existing = sessionStorage.getItem(PARTNER_STORAGE_KEY);
    if (existing) return;
    const sanitized = code.trim().slice(0, 50);
    if (!PARTNER_CODE_REGEX.test(sanitized)) return;
    sessionStorage.setItem(PARTNER_STORAGE_KEY, sanitized);
  } catch {
    // sessionStorage can throw in private mode
  }
}

/** Get ref from sessionStorage */
function getPartnerRefFromStorage(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const val = sessionStorage.getItem(PARTNER_STORAGE_KEY);
    return val && PARTNER_CODE_REGEX.test(val) ? val : null;
  } catch {
    return null;
  }
}

/**
 * Get referral code for form submission. Cookie → URL → sessionStorage.
 * sessionStorage helps when cookies blocked; URL helps direct /contact?ref=CODE; cookie is primary.
 */
export function getReferralCodeForSubmit(): string | null {
  if (typeof document === "undefined") return null;
  const fromCookie = getPartnerRefFromCookie();
  if (fromCookie) return fromCookie;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && PARTNER_CODE_REGEX.test(ref.trim())) return ref.trim();
  } catch {
    // URL parsing can fail in some edge cases
  }
  const fromStorage = getPartnerRefFromStorage();
  if (fromStorage) return fromStorage;
  return null;
}
