/**
 * Sanitize user-provided text before injecting into LLM prompts.
 * Strips patterns that could manipulate model behavior (prompt injection defense).
 */

/** Patterns that look like system/role instructions injected into user content. */
const INJECTION_PATTERNS = [
  // Imperative forms at line start (common injection pattern)
  /^(?:ignore|disregard|forget|override|bypass|skip|stop|reset|change|modify|update|delete|remove)\s+(?:all|the|your|previous|above|prior|system|instructions?|rules?|constraints?|guidelines?|prompt)/gim,
  // Role-play injection
  /^(?:you are now|act as|pretend to be|simulate|behave as|switch to|enter|assume the role)/gim,
  // System prompt markers
  /^\[(?:system|admin|developer|instructions?)\]/gim,
  // XML-style injection tags
  /<\/?(?:system|instructions?|prompt|override|admin|role)[^>]*>/gi,
  // Markdown header instructions
  /^#{1,3}\s*(?:system|instructions?|override|new rules?|ignore above)/gim,
];

/**
 * Sanitize user-provided text (fieldNotes, toneExamples) before prompt injection.
 * Strips known injection patterns while preserving legitimate content.
 * Returns sanitized string; truncates to maxLength to prevent context flooding.
 */
export function sanitizeUserInput(text: string | undefined, maxLength = 3000): string {
  if (!text || typeof text !== "string") return "";
  let sanitized = text.trim();
  if (!sanitized) return "";

  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[filtered]");
  }

  // Truncate to prevent context flooding
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength) + "\n[... truncated for length ...]";
  }

  return sanitized;
}
