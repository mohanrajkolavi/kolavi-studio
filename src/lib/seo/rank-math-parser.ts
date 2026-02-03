/**
 * Parses Rank Math SEO fullHead HTML (from WPGraphQL for Rank Math SEO).
 * Extracts meta description, Open Graph, and Twitter card meta.
 * Canonical, og:url, and robots are intentionally ignored; Next.js sets those.
 *
 * Fail-safe: returns empty object on any error, null/undefined, or oversized input.
 */

export interface ParsedRankMathHead {
  metaDescription?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

/** Max input length to avoid regex DoS on very large strings. */
const MAX_INPUT_LENGTH = 100_000;

/** Max length per extracted value to prevent oversized outputs. */
const MAX_VALUE_LENGTH = 2000;

/** Meta tags we extract. Expand here to add more without duplicating logic. */
const META_EXTRACTIONS: Array<{
  key: keyof ParsedRankMathHead;
  attr: "name" | "property";
  value: string;
}> = [
  { key: "metaDescription", attr: "name", value: "description" },
  { key: "ogImage", attr: "property", value: "og:image" },
  { key: "ogTitle", attr: "property", value: "og:title" },
  { key: "ogDescription", attr: "property", value: "og:description" },
  { key: "twitterTitle", attr: "name", value: "twitter:title" },
  { key: "twitterDescription", attr: "name", value: "twitter:description" },
  { key: "twitterImage", attr: "name", value: "twitter:image" },
];

function safeTrim(value: string, maxLen: number): string {
  const trimmed = value.trim();
  if (trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

function extractMetaContent(
  html: string,
  attr: "name" | "property",
  value: string
): string | undefined {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Capture opening quote and use backreference so content can contain the opposite delimiter
  const contentPattern = "([\"'])(.*?)\\1";
  const regex = new RegExp(
    `<meta\\s+${attr}=["']${escaped}["']\\s+content=${contentPattern}`,
    "i"
  );
  const match = html.match(regex);
  if (match?.[2]) return safeTrim(match[2], MAX_VALUE_LENGTH);
  const reverse = new RegExp(
    `<meta\\s+content=${contentPattern}\\s+${attr}=["']${escaped}["']`,
    "i"
  );
  const matchReverse = html.match(reverse);
  return matchReverse?.[2] ? safeTrim(matchReverse[2], MAX_VALUE_LENGTH) : undefined;
}

/**
 * Parse Rank Math fullHead string into meta description, Open Graph, and Twitter card fields.
 * Returns an empty object when fullHead is null, undefined, empty, oversized, or on any parse error.
 */
export function parseRankMathFullHead(
  fullHead: string | null | undefined
): ParsedRankMathHead {
  const result: ParsedRankMathHead = {};

  try {
    if (fullHead == null || typeof fullHead !== "string") return result;
    const html = fullHead.trim();
    if (!html || html.length > MAX_INPUT_LENGTH) return result;

    for (const { key, attr, value } of META_EXTRACTIONS) {
      const extracted = extractMetaContent(html, attr, value);
      if (extracted) result[key] = extracted;
    }

    return result;
  } catch {
    return {};
  }
}
