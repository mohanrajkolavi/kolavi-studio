/**
 * Canonical site URL for SEO (canonical, OG, sitemap, RSS).
 * In production we require it to be set to avoid indexing localhost.
 */
function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (process.env.NODE_ENV === "production" && (!url || url.startsWith("http://localhost"))) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set to your production URL in production (e.g. https://kolavistudio.com). " +
        "Do not use localhost in production or SEO will index the wrong URLs."
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

// Vertical landing pages - industries we specialize in
export const VERTICAL_LINKS = [
  { name: "Medical Spas", href: "/medical-spas", available: true },
  { name: "Dental Practices", href: "/dental", available: false },
  { name: "Law Firms", href: "/law-firms", available: false },
];
