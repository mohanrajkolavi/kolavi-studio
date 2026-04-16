/**
 * Shared email validator used by public-facing API routes.
 *
 * Uses a practical RFC-5321 shape: ASCII local part, ASCII domain labels,
 * TLD 2-24 chars. Rejects empty / oversize / mismatched input. For bounds,
 * RFC 5321 caps total length at 254 octets — we default to that.
 */

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,24}$/;

export const EMAIL_MAX_LENGTH = 254;

export function isValidEmail(raw: unknown, maxLen: number = EMAIL_MAX_LENGTH): raw is string {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > maxLen) return false;
  return EMAIL_REGEX.test(trimmed);
}
