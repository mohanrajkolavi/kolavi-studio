/**
 * Canonical site URL for SEO (canonical, OG, sitemap, RSS).
 * In production, set NEXT_PUBLIC_SITE_URL to your real domain so SEO and OG tags are correct.
 */
function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (process.env.NODE_ENV === "production" && (!url || url.startsWith("http://localhost"))) {
    console.error(
      "[Kolavi Studio] NEXT_PUBLIC_SITE_URL should be set to your production URL in production (e.g. https://kolavistudio.com). " +
        "Using fallback; set the env var and redeploy for correct canonical/OG URLs."
    );
  }
  return url || "http://localhost:3000";
}

export const SITE_URL = getSiteUrl();
export const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WP_GRAPHQL_URL || "";

/**
 * Build/deploy time for sitemap lastmod (optional).
 * Set BUILD_TIMESTAMP at build (e.g. ISO date), or Vercel sets VERCEL_BUILD_COMMIT_TIMESTAMP.
 * When set, static sitemap entries use this instead of "now" for better crawl efficiency.
 */
export function getSitemapBuildDate(): Date | undefined {
  const raw =
    process.env.BUILD_TIMESTAMP ?? process.env.VERCEL_BUILD_COMMIT_TIMESTAMP;
  if (!raw?.trim()) return undefined;
  const d = new Date(raw.trim());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export const SITE_NAME = "Kolavi Studio";
export const SITE_DESCRIPTION = "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.";

// Rank Math 100/100 alignment (rankmath.com/kb/score-100-in-tests) + Google Search (developers.google.com/search/docs)
export const SEO = {
  TITLE_MAX_CHARS: 60, // Google mobile truncation
  META_DESCRIPTION_MAX_CHARS: 160,
  URL_SLUG_MAX_CHARS: 75,
  PARAGRAPH_MAX_WORDS: 120,
  CONTENT_MIN_WORDS_PILLAR: 2500,
  CONTENT_MIN_WORDS_GENERAL: 1500,
  KEYWORD_DENSITY_TARGET: { min: 1, max: 1.5, warn: 2.5 },
  IMAGES_MIN_FOR_100: 4,
} as const;

export const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Who We Serve", href: "/industries" },
  { name: "Services", href: "/services" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
];

// Legal pages - privacy, terms, cookies, disclaimer
export const LEGAL_LINKS = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Cookie Policy", href: "/cookies" },
  { name: "Disclaimer", href: "/disclaimer" },
];

// Vertical landing pages - industries we specialize in
export const VERTICAL_LINKS = [
  { name: "Medical Spas", href: "/medical-spas", available: true },
  { name: "Dental Practices", href: "/dental", available: false },
  { name: "Law Firms", href: "/law-firms", available: false },
];

/**
 * Image loading (UX/SEO): number of grid items to load eagerly (above-the-fold).
 * Rest use loading="lazy". Industry practice: 2–3 for first row.
 */
export const IMAGE_EAGER_COUNT = 3;

/**
 * Blur placeholder for Next.js Image placeholder="blur" with remote URLs.
 * Small base64 JPEG; improves perceived performance while image loads.
 */
export const IMAGE_BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBEQACEQADAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQH/2Q==";
