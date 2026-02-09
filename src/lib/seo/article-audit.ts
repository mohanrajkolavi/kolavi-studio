/**
 * Blog article SEO audit — Google Search Central + Rank Math alignment.
 *
 * Reference documentation:
 * - Google Search Central: developers.google.com/search/docs/fundamentals/creating-helpful-content
 * - Google Spam Policies: developers.google.com/search/docs/essentials/spam-policies
 * - Rank Math 100/100: rankmath.com/kb/score-100-in-tests
 *
 * AUDIT ARCHITECTURE (no duplication):
 * - SEO Audit (this file): Google Search Central + Rank Math technical SEO + editorial quality.
 * - Quality checks: Pipeline faqEnforcement, factCheck — post-generation.
 * - E-E-A-T & content quality: Python content_audit — experience, structure, readability.
 *
 * PRIORITY STACK:
 *   Level 1 (blockers) → Level 2 (ranking factors) → Level 3 (competitive advantage).
 *   Google Search Central first. Rank Math checks are Level 3.
 *   Articles below 75% score should NOT be published.
 *
 * Note: Author byline/bio handled by CMS at publish time. Images/links added in CMS.
 */

import { SEO, SITE_URL } from "@/lib/constants";
import type {
  SchemaMarkup,
  CurrentData,
} from "@/lib/pipeline/types";

/** Minimum audit score to publish. Below this = actively hurts site-wide rankings. */
export const MIN_PUBLISH_SCORE = 75;

export type AuditSeverity = "pass" | "warn" | "fail";

export type AuditLevel = 1 | 2 | 3;
// 1 = Publication blocker (any fail = cannot publish)
// 2 = Ranking killer (fix before expecting traffic)
// 3 = Competitive advantage (differentiators)

export type AuditSource = "google" | "rankmath" | "editorial";

export type AuditItem = {
  id: string;
  severity: AuditSeverity;
  label: string;
  message: string;
  level?: AuditLevel;
  source?: AuditSource;
  value?: string | number;
  threshold?: string | number;
  guideline?: string;
};

export type ArticleAuditInput = {
  title: string;
  metaDescription?: string;
  content: string;
  slug?: string;
  /** Primary focus keyword — used for title presence and stuffing detection (not density targeting) */
  focusKeyword?: string;
  /** Optional: brief extra-value themes for differentiation coverage check (non-blocking) */
  extraValueThemes?: string[];
};

export type ArticleAuditResult = {
  items: AuditItem[];
  score: number;
  summary: { pass: number; warn: number; fail: number };
  /** True when score >= MIN_PUBLISH_SCORE and no Level 1 failures */
  publishable: boolean;
  /** Auto-generated JSON-LD when title/meta/slug/keyword provided */
  schemaMarkup?: SchemaMarkup;
};

// --- Helpers ---

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function extractHeadings(html: string): { level: number; text: string }[] {
  const re = /<h([2-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  const out: { level: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    out.push({ level: parseInt(m[1], 10), text: stripHtml(m[2]) });
  }
  return out;
}

function getParagraphs(html: string): string[] {
  const fragment = html.replace(/<p[^>]*>/gi, "\n<p>").replace(/<\/p>/gi, "</p>\n");
  const raw = fragment.split(/\n/).filter((s) => s.trim().length > 0);
  return raw.map((s) => stripHtml(s)).filter((s) => s.length > 0);
}

// --- Editorial quality checks ---
// These are editorial standards for content quality and readability.
// Google does not penalize specific typography or vocabulary, but these
// standards improve readability and professional presentation — both of
// which contribute to user satisfaction (a Google ranking signal).

/** Typography check: em-dash, curly/smart quotes. Editorial standard for clean, web-ready content. */
// Em-dash (—) is only here; not in AI_PHRASES, to avoid double-counting with auditAiPhrases.
const AI_TYPOGRAPHY: { char: string; label: string }[] = [
  { char: "\u2014", label: "em-dash (—)" },
  { char: "\u2013", label: "en-dash (–)" },
  { char: "\u201C", label: "curly left double quote (\")" },
  { char: "\u201D", label: "curly right double quote (\")" },
  { char: "\u2018", label: "curly left single quote (')" },
  { char: "\u2019", label: "curly apostrophe/quote (')" },
];

function auditAiTypography(plainText: string): AuditItem[] {
  const found: { label: string; count: number }[] = [];
  for (const { char, label } of AI_TYPOGRAPHY) {
    const count = (plainText.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > 0) found.push({ label, count });
  }
  if (found.length > 0) {
    const total = found.reduce((s, f) => s + f.count, 0);
    const examples = found.map((f) => `${f.label} (${f.count})`).join("; ");
    return [
      {
        id: "ai-typography",
        severity: total >= 2 ? "fail" : "warn",
        level: total >= 2 ? 1 : 2,
        source: "editorial",
        label: "Typography (editorial)",
        message: `Replace: ${examples}. Use straight quotes (" ') and commas/colons instead of em-dash.`,
        value: total,
        guideline: "Editorial standard: use straight quotes and standard punctuation for clean, web-ready content.",
      },
    ];
  }
  return [
    {
      id: "ai-typography",
      severity: "pass",
      level: 2,
      source: "editorial",
      label: "Typography (editorial)",
      message: "No em-dash or curly quotes detected.",
    },
  ];
}

/**
 * Generic/overused phrases — imported from shared constants.
 * See src/lib/constants/banned-phrases.ts for the single source of truth.
 * These are flagged as editorial quality warnings, not ranking penalties.
 */
import {
  AI_PHRASES_HIGH,
  AI_PHRASES_COMMON,
  AI_PHRASE_SUGGESTIONS,
} from "@/lib/constants/banned-phrases";

function countPhrasesInList(text: string, phrases: readonly string[]): { phrase: string; count: number }[] {
  const lower = text.toLowerCase();
  const found: { phrase: string; count: number }[] = [];
  for (const phrase of phrases) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (lower.match(regex) || []).length;
    if (count > 0) found.push({ phrase: phrase.trim(), count });
  }
  return found;
}

/** Ranges [start, end) overlap iff start < otherEnd && otherStart < end */
function rangesOverlap(
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number
): boolean {
  return start < otherEnd && otherStart < end;
}

/**
 * Count phrase matches with longest-first, non-overlapping strategy so that
 * overlapping entries (e.g. "delve" and "delve into") are not double-counted.
 * Longer phrases are matched first; any span already covered is skipped for shorter phrases.
 */
function countPhrasesInListNonOverlapping(
  text: string,
  phrases: readonly string[]
): { phrase: string; count: number }[] {
  const lower = text.toLowerCase();
  const usedRanges: { start: number; end: number }[] = [];
  const counts = new Map<string, number>();

  const sorted = [...phrases].sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    const key = phrase.trim();
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    let count = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lower)) !== null) {
      const start = match.index;
      const end = start + key.length;
      const overlaps = usedRanges.some((r) =>
        rangesOverlap(start, end, r.start, r.end)
      );
      if (!overlaps) {
        count++;
        usedRanges.push({ start, end });
      }
    }
    if (count > 0) counts.set(key, (counts.get(key) ?? 0) + count);
  }

  return Array.from(counts.entries(), ([phrase, count]) => ({ phrase, count }));
}

/**
 * Generic phrase detection with two-tier system:
 * - Strong markers: overused phrases that weaken writing quality
 * - Common phrases: only flagged when they cluster heavily
 * These are editorial quality checks — they don't affect SEO score.
 */
function auditAiPhrases(plainText: string): AuditItem[] {
  const items: AuditItem[] = [];
  const highFound = countPhrasesInListNonOverlapping(plainText, AI_PHRASES_HIGH);
  const commonFound = countPhrasesInList(plainText, AI_PHRASES_COMMON);

  const highTotal = highFound.reduce((s, f) => s + f.count, 0);
  const commonTotal = commonFound.reduce((s, f) => s + f.count, 0);
  const combinedTotal = highTotal + commonTotal;

  // --- High-confidence AI phrases ---
  if (highFound.length > 0) {
    const maxShow = 8;
    const shown = highFound.slice(0, maxShow);
    const parts = shown.map((f) => {
      const suggestion = AI_PHRASE_SUGGESTIONS[f.phrase.toLowerCase()];
      const countStr = `"${f.phrase}" (${f.count})`;
      return suggestion ? `${countStr} → ${suggestion}` : countStr;
    });
    const tail = highFound.length > maxShow ? `; +${highFound.length - maxShow} more` : "";
    items.push({
      id: "ai-phrases-high",
      severity: "warn",
      level: 2,
      source: "editorial",
      label: "Writing quality: generic phrases",
      message: `Consider replacing: ${parts.join("; ")}${tail}.`,
      value: highTotal,
      guideline: "Editorial suggestion: these overused phrases weaken writing quality. Rewrite in plain, specific language where natural.",
    });
  } else {
    items.push({
      id: "ai-phrases-high",
      severity: "pass",
      level: 2,
      source: "editorial",
      label: "Writing quality: generic phrases",
      message: "No overused generic phrases detected.",
    });
  }

  // --- Common phrases (only flagged in bulk) ---
  if (commonTotal > 5) {
    const maxShow = 6;
    const shown = commonFound.slice(0, maxShow);
    const parts = shown.map((f) => {
      const suggestion = AI_PHRASE_SUGGESTIONS[f.phrase.toLowerCase()];
      const countStr = `"${f.phrase}" (${f.count})`;
      return suggestion ? `${countStr} → ${suggestion}` : countStr;
    });
    const tail = commonFound.length > maxShow ? `; +${commonFound.length - maxShow} more` : "";
    items.push({
      id: "ai-phrases-common",
      severity: "warn",
      level: 2,
      source: "editorial",
      label: "Writing quality: overused phrasing",
      message: `${commonTotal} overused phrases found. Consider varying: ${parts.join("; ")}${tail}.`,
      value: commonTotal,
      guideline: "Editorial standard: individually fine, but clustering many generic phrases weakens writing quality.",
    });
  } else {
    items.push({
      id: "ai-phrases-common",
      severity: "pass",
      level: 2,
      source: "editorial",
      label: "Writing quality: common phrasing",
      message: commonTotal > 0
        ? `${commonTotal} common phrase(s) detected, within acceptable range.`
        : "No overused common phrases detected.",
    });
  }

  // --- Combined note: if both tiers are heavy, flag as informational warning ---
  if (combinedTotal > 5 && highTotal > 0 && commonTotal > 3) {
    items.push({
      id: "ai-phrases-combined",
      severity: "warn",
      level: 2,
      source: "editorial",
      label: "Writing quality: phrase density",
      message: `${combinedTotal} generic phrases total (${highTotal} strong + ${commonTotal} common). Consider varying where natural.`,
      value: combinedTotal,
      guideline: "Editorial suggestion: high combined count of generic phrases. Use more specific, concrete language where it reads naturally.",
    });
  }

  return items;
}

// --- Level 1: Publication Blockers ---

function auditTitle(input: ArticleAuditInput): AuditItem[] {
  const items: AuditItem[] = [];
  const title = input.title?.trim() ?? "";
  const len = title.length;

  if (len === 0) {
    items.push({
      id: "title-required",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Title",
      message: "Title is empty.",
      guideline: "Google: unique, clear title; words people actually search for; descriptive and concise.",
    });
    return items;
  }

  if (len > SEO.TITLE_MAX_CHARS) {
    items.push({
      id: "title-length",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Title length",
      message: `Title may truncate in search results (${len} chars).`,
      value: len,
      threshold: SEO.TITLE_MAX_CHARS,
      guideline: "Google: ~50–60 chars for mobile; put important words at the beginning.",
    });
  } else if (len > 55) {
    items.push({
      id: "title-length",
      severity: "warn",
      level: 2,
      source: "google",
      label: "Title length",
      message: `Title is ${len} chars; may truncate on some devices.`,
      value: len,
      threshold: SEO.TITLE_MAX_CHARS,
    });
  } else {
    items.push({
      id: "title-length",
      severity: "pass",
      level: 2,
      source: "google",
      label: "Title length",
      message: `Title is ${len} chars.`,
      value: len,
      threshold: SEO.TITLE_MAX_CHARS,
    });
  }

  // Title should contain target keyword when provided (ranking signal)
  if (input.focusKeyword?.trim()) {
    const kw = input.focusKeyword.toLowerCase();
    const titleLower = title.toLowerCase();
    if (!titleLower.includes(kw)) {
      items.push({
        id: "title-keyword",
        severity: "warn",
        level: 2,
        source: "google",
        label: "Title keyword",
        message: `Target keyword "${input.focusKeyword}" not in title. Use words people search for.`,
        guideline: "Google: put search terms in prominent positions (beginning of title).",
      });
    } else {
      items.push({
        id: "title-keyword",
        severity: "pass",
        level: 2,
        source: "google",
        label: "Title keyword",
        message: `Title contains target keyword.`,
      });
    }
  }
  return items;
}

function auditMetaDescription(meta: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (meta === undefined || meta.trim() === "") {
    items.push({
      id: "meta-description",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Meta description",
      message: "Meta description is missing.",
      guideline: "Google: short, unique summary that convinces users this page is what they need (a pitch).",
    });
    return items;
  }
  const len = meta.length;
  if (len > SEO.META_DESCRIPTION_MAX_CHARS) {
    items.push({
      id: "meta-description",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Meta description length",
      message: `Meta description may truncate (${len} chars).`,
      value: len,
      threshold: SEO.META_DESCRIPTION_MAX_CHARS,
      guideline: "Google: typically up to ~160 characters.",
    });
  } else if (len < 70) {
    items.push({
      id: "meta-description",
      severity: "warn",
      level: 2,
      source: "google",
      label: "Meta description length",
      message: `Meta description is short (${len} chars). Use more of the 160-char space.`,
      value: len,
      threshold: SEO.META_DESCRIPTION_MAX_CHARS,
    });
  } else {
    items.push({
      id: "meta-description",
      severity: "pass",
      level: 2,
      source: "google",
      label: "Meta description length",
      message: `Meta description is ${len} chars.`,
      value: len,
      threshold: SEO.META_DESCRIPTION_MAX_CHARS,
    });
  }
  return items;
}

function auditContentThinness(plainText: string): AuditItem[] {
  const items: AuditItem[] = [];
  const wc = wordCount(plainText);
  // Study: Google has NO preferred word count. But very short = thin = Helpful Content risk.
  if (wc < 300) {
    items.push({
      id: "content-thin",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Content depth",
      message: `Content is very short (${wc} words). Thin content hurts site-wide rankings.`,
      value: wc,
      guideline: "Helpful Content: satisfy intent completely. One bad article drags down the whole site. Value over length; aim to provide more value than competitors.",
    });
  } else {
    items.push({
      id: "content-thin",
      severity: "pass",
      level: 1,
      source: "google",
      label: "Content depth",
      message: `Content is ${wc} words.`,
      value: wc,
    });
  }
  return items;
}

/** Keyword stuffing: unnatural repetition. Study: density not in docs; stuffing is #1 spam violation. */
function auditKeywordStuffing(plainText: string, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!focusKeyword?.trim()) return items;

  const words = plainText.split(/\s+/).filter(Boolean);
  const total = words.length;
  if (total < 100) return items;

  const kw = focusKeyword.toLowerCase();
  const kwWords = kw.split(/\s+/).filter(Boolean);

  // Count exact phrase repetition
  const phraseRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const phraseMatches = plainText.match(phraseRegex) || [];
  const phraseCount = phraseMatches.length;

  // Heuristic: >2.5% of content as exact keyword phrase = stuffing risk
  const phraseRatio = (phraseCount * kwWords.length) / total;
  const stuffingRatio = 0.025;

  if (phraseRatio > stuffingRatio * 2) {
    items.push({
      id: "keyword-stuffing",
      severity: "fail",
      level: 1,
      source: "google",
      label: "Keyword stuffing",
      message: `"${focusKeyword}" repeated ${phraseCount} times (unnatural). Most-referenced spam violation.`,
      value: phraseCount,
      guideline: "Google: keyword stuffing violates spam policies. Use naturally; synonyms and related terms are fine.",
    });
  } else if (phraseRatio > stuffingRatio) {
    items.push({
      id: "keyword-stuffing",
      severity: "warn",
      level: 2,
      source: "google",
      label: "Keyword repetition",
      message: `"${focusKeyword}" appears ${phraseCount} times. Ensure natural, organic use.`,
      value: phraseCount,
    });
  } else {
    items.push({
      id: "keyword-stuffing",
      severity: "pass",
      level: 2,
      source: "google",
      label: "Keyword use",
      message: `Focus keyword used naturally (${phraseCount} times).`,
      value: phraseCount,
    });
  }
  return items;
}

function auditHeadingStructure(html: string): AuditItem[] {
  const items: AuditItem[] = [];
  const headings = extractHeadings(html);
  if (headings.length === 0) {
    items.push({
      id: "headings",
      severity: "warn",
      level: 1,
      source: "google",
      label: "Headings",
      message: "No H2–H6 headings. Structure helps users and Google understand content.",
      guideline: "Google: well organized; use clear headings in natural language (not keyword-stuffed).",
    });
    return items;
  }
  let prevLevel = 1;
  let skipLevel = false;
  for (const h of headings) {
    if (h.level > prevLevel + 1) {
      skipLevel = true;
      break;
    }
    prevLevel = h.level;
  }
  if (skipLevel) {
    items.push({
      id: "headings-hierarchy",
      severity: "warn",
      level: 2,
      source: "google",
      label: "Heading hierarchy",
      message: "Headings skip levels. Use sequential H2 → H3 → H4.",
      guideline: "Google: logical structure; accessibility.",
    });
  } else {
    items.push({
      id: "headings-hierarchy",
      severity: "pass",
      level: 2,
      source: "google",
      label: "Heading hierarchy",
      message: `Found ${headings.length} heading(s) with valid structure.`,
      value: headings.length,
    });
  }
  const hasH1 = /<h1[\s>]/i.test(html);
  if (hasH1) {
    items.push({
      id: "h1-in-body",
      severity: "warn",
      level: 2,
      source: "google",
      label: "H1 in body",
      message: "Page should have one H1 (usually the title). Remove H1 from body.",
      guideline: "Single H1 per page; use H2–H6 for sections.",
    });
  }
  return items;
}

// --- Level 2: Ranking Killers ---
// Images and links are skipped — added in WordPress after content generation.

function auditParagraphLength(html: string): AuditItem[] {
  const items: AuditItem[] = [];
  const paragraphs = getParagraphs(html);
  const long = paragraphs.filter((p) => wordCount(p) > SEO.PARAGRAPH_MAX_WORDS);
  if (long.length > 0) {
    const maxWords = Math.max(...long.map((p) => wordCount(p)));
    items.push({
      id: "paragraph-length",
      severity: "warn",
      level: 2,
      source: "google",
      label: "Long paragraphs",
      message: `${long.length} paragraph(s) exceed ${SEO.PARAGRAPH_MAX_WORDS} words (max ${maxWords}). Split for readability.`,
      value: long.length,
      threshold: SEO.PARAGRAPH_MAX_WORDS,
      guideline: "Google: easy-to-read, well organized.",
    });
  } else if (paragraphs.length > 0) {
    items.push({
      id: "paragraph-length",
      severity: "pass",
      level: 2,
      source: "google",
      label: "Paragraph length",
      message: `Paragraphs within ${SEO.PARAGRAPH_MAX_WORDS} words.`,
      threshold: SEO.PARAGRAPH_MAX_WORDS,
    });
  }
  return items;
}

function auditSlug(slug: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!slug) return items;
  const len = slug.length;
  if (len > SEO.URL_SLUG_MAX_CHARS) {
    items.push({
      id: "slug-length",
      severity: "warn",
      level: 2,
      source: "google",
      label: "URL slug length",
      message: `Slug is long (${len} chars). Shorter slugs are easier to read.`,
      value: len,
      threshold: SEO.URL_SLUG_MAX_CHARS,
    });
  } else {
    items.push({
      id: "slug-length",
      severity: "pass",
      level: 2,
      source: "google",
      label: "URL slug length",
      message: `Slug is ${len} chars.`,
      value: len,
      threshold: SEO.URL_SLUG_MAX_CHARS,
    });
  }
  return items;
}

// --- Level 3: Rank Math 100/100 (competitive) — apply when aligned with Google ---

function auditRankMathMetaKeyword(meta: string | undefined, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!focusKeyword?.trim() || !meta?.trim()) return items;
  const kw = focusKeyword.toLowerCase();
  const metaLower = meta.toLowerCase();
  if (!metaLower.includes(kw)) {
    items.push({
      id: "rm-meta-keyword",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in meta",
      message: `Primary keyword "${focusKeyword}" not in meta description.`,
      guideline: "Rank Math: include focus keyword in first 120–160 chars for 100/100.",
    });
  } else {
    items.push({
      id: "rm-meta-keyword",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in meta",
      message: "Primary keyword in meta description.",
    });
  }
  return items;
}

function auditRankMathFirst10Percent(plainText: string, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!focusKeyword?.trim()) return items;
  const wc = wordCount(plainText);
  if (wc < 100) return items;
  // Use actual 10% of content, with a floor of 50 words (not 300 — that was checking 30% for 1000-word articles)
  const first10WordCount = Math.max(50, Math.floor(wc * 0.1));
  const first10 = plainText.split(/\s+/).slice(0, first10WordCount).join(" ").toLowerCase();
  const kw = focusKeyword.toLowerCase();
  if (!first10.includes(kw)) {
    items.push({
      id: "rm-first10",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in intro",
      message: `Primary keyword not in first ~10% of content (${first10WordCount} words).`,
      guideline: "Rank Math: focus keyword in first 10% reinforces topic for search engines.",
    });
  } else {
    items.push({
      id: "rm-first10",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in intro",
      message: "Primary keyword appears in first 10% of content.",
    });
  }
  return items;
}

function auditRankMathSlugKeyword(slug: string | undefined, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!slug || !focusKeyword?.trim()) return items;
  const slugNorm = slug.toLowerCase().replace(/-/g, " ");
  const kwWords = focusKeyword.toLowerCase().split(/\s+/).filter(Boolean);
  const hasKeyword = kwWords.some((w) => slugNorm.includes(w));
  if (!hasKeyword) {
    items.push({
      id: "rm-slug-keyword",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in URL",
      message: `Primary keyword not in URL slug.`,
      guideline: "Rank Math: presence of focus keyword in URL is a ranking signal.",
    });
  } else {
    items.push({
      id: "rm-slug-keyword",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in URL",
      message: "Primary keyword in slug.",
    });
  }
  return items;
}

function auditRankMathSubheadingKeyword(html: string, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!focusKeyword?.trim()) return items;
  const headings = extractHeadings(html);
  if (headings.length === 0) return items;
  const kw = focusKeyword.toLowerCase();
  const hasKeyword = headings.some((h) => h.text.toLowerCase().includes(kw));
  if (!hasKeyword) {
    items.push({
      id: "rm-subheading-keyword",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in subheadings",
      message: `Primary keyword not in any H2–H6 heading.`,
      guideline: "Rank Math: include focus keyword in H2/H3 for sitelinks and relevancy. Apply naturally.",
    });
  } else {
    items.push({
      id: "rm-subheading-keyword",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword in subheadings",
      message: "Primary keyword in subheadings.",
    });
  }
  return items;
}

/**
 * Content length — informational only, excluded from score.
 * Google cares about satisfying intent, not word count. Rank Math prefers 2500+ for 100%
 * but we don't penalize shorter articles that fully cover their topic.
 */
function auditRankMathContentLength(plainText: string): AuditItem[] {
  const items: AuditItem[] = [];
  const wc = wordCount(plainText);
  if (wc >= SEO.CONTENT_MIN_WORDS_PILLAR) {
    items.push({
      id: "rm-content-length",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Content length",
      message: `${wc} words (2500+ = Rank Math 100%).`,
      value: wc,
      threshold: SEO.CONTENT_MIN_WORDS_PILLAR,
    });
  } else {
    // Informational only — any length is fine if intent is satisfied.
    // Shown as "pass" so it doesn't flag as an issue; excluded from score regardless.
    items.push({
      id: "rm-content-length",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Content length",
      message: `${wc} words. Rank Math: 2500+ for 100%. Google: content length varies by topic — satisfy intent fully.`,
      value: wc,
      threshold: SEO.CONTENT_MIN_WORDS_PILLAR,
      guideline: "Informational: Google does not penalize shorter content. Only add length if it serves the reader. Value over length; aim to provide more value than competitors.",
    });
  }
  return items;
}

function auditRankMathTitleKeywordPosition(title: string, focusKeyword: string | undefined): AuditItem[] {
  const items: AuditItem[] = [];
  if (!focusKeyword?.trim() || !title.trim()) return items;
  const kw = focusKeyword.toLowerCase();
  const titleLower = title.toLowerCase();
  if (!titleLower.includes(kw)) return items; // Already flagged by title-keyword
  const kwIndex = titleLower.indexOf(kw);
  const first50Percent = Math.floor(title.length * 0.5);
  if (kwIndex > first50Percent) {
    items.push({
      id: "rm-title-position",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword position in title",
      message: "Primary keyword not in first 50% of title.",
      guideline: "Rank Math: keyword in first 50% improves CTR and ranking.",
    });
  } else {
    items.push({
      id: "rm-title-position",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Keyword position in title",
      message: "Primary keyword in first 50% of title.",
    });
  }
  return items;
}

function auditRankMathNumberInTitle(title: string): AuditItem[] {
  const items: AuditItem[] = [];
  if (!title.trim()) return items;
  const hasNumber = /\d/.test(title);
  if (!hasNumber) {
    items.push({
      id: "rm-number-in-title",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Number in title",
      message: "No number in title. Numbers often improve CTR (e.g. '7 Tips').",
      guideline: "Rank Math: numbers in titles tend to get more clicks.",
    });
  } else {
    items.push({
      id: "rm-number-in-title",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Number in title",
      message: "Title contains a number.",
    });
  }
  return items;
}

// --- Run full audit ---

function byLevelThenSeverity(a: AuditItem, b: AuditItem): number {
  const levelA = a.level ?? 2;
  const levelB = b.level ?? 2;
  if (levelA !== levelB) return levelA - levelB;
  // Google before Rank Math before editorial when same level
  const sourceOrder: Record<AuditSource, number> = { google: 0, rankmath: 1, editorial: 2 };
  const sa = a.source ?? "google";
  const sb = b.source ?? "google";
  if (sa !== sb) return sourceOrder[sa] - sourceOrder[sb];
  const severityOrder = { fail: 0, warn: 1, pass: 2 };
  return severityOrder[a.severity] - severityOrder[b.severity];
}

// --- Content integrity and fact-check (v4) ---

function extractH2H3Text(html: string): string[] {
  const headings = extractHeadings(html);
  return headings.filter((h) => h.level === 2 || h.level === 3).map((h) => h.text.trim());
}

function extractNumbersFromText(text: string): string[] {
  const numbers: string[] = [];
  // Dollar amounts: $1.2B, $143.8 billion, $50 million
  const dollarRe = /\$[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M|bn|mn)?/gi;
  let m: RegExpExecArray | null;
  while ((m = dollarRe.exec(text)) !== null) numbers.push(m[0].replace(/\s+/g, " "));
  // Percentages: 57%, 47.2 percent
  const pctRe = /[\d,]+(?:\.\d+)?\s*%/g;
  while ((m = pctRe.exec(text)) !== null) numbers.push(m[0]);
  // X billion/million (units)
  const unitRe = /\d+(?:\.\d+)?\s*(?:billion|million)\s+(?:active\s+)?(?:devices|users|etc\.?)/gi;
  while ((m = unitRe.exec(text)) !== null) numbers.push(m[0]);
  const plainNumRe = /\d+(?:\.\d+)?(?:\s*(?:billion|million|%|percent))?/g;
  while ((m = plainNumRe.exec(text)) !== null) {
    const n = m[0];
    if (n.length <= 30 && !numbers.includes(n)) numbers.push(n);
  }
  return [...new Set(numbers)];
}

/** Exclude "per capita", "per unit", "per year", etc. — not source attributions. */
function isNonAttributionPhrase(phrase: string): boolean {
  const lower = phrase.toLowerCase();
  return /^per\s+(capita|unit|year|integration|platform|segment|month|day)(\s|$|[.,;])/.test(lower) || /^\s*per\s+(capita|unit|year|integration|platform|segment|month|day)\s*$/.test(lower);
}

function extractAttributionPhrases(text: string): string[] {
  const out: string[] = [];
  const perRe = /per\s+([^.,;]+?)(?=[.,;]|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = perRe.exec(text)) !== null) {
    const phrase = ("per " + m[1]).trim();
    if (!isNonAttributionPhrase(phrase)) out.push(phrase);
  }
  const accordRe = /according\s+to\s+([^.,;]+?)(?=[.,;]|$)/gi;
  while ((m = accordRe.exec(text)) !== null) out.push(("according to " + m[1]).trim());
  const reportedRe = /([A-Za-z0-9\s&]+)\s+reported\s+/g;
  while ((m = reportedRe.exec(text)) !== null) out.push((m[1].trim() + " reported").trim());
  return [...new Set(out)];
}

function extractFaqBlock(html: string): { questions: string[]; answers: string[] } {
  const faqH2 = /<h2[^>]*>([^<]*(?:FAQ|Frequently Asked)[^<]*)<\/h2>/i.exec(html);
  if (!faqH2) return { questions: [], answers: [] };
  const afterFaq = html.indexOf(faqH2[0]) + faqH2[0].length;
  const block = html.slice(afterFaq);
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const qMatches = [...block.matchAll(h3Regex)];
  const questions: string[] = [];
  const answers: string[] = [];
  for (let i = 0; i < qMatches.length; i++) {
    questions.push(stripHtml(qMatches[i][1]).trim());
    const afterH3 = qMatches[i].index! + qMatches[i][0].length;
    const nextH3 = qMatches.slice(i + 1)[0];
    const end = nextH3
      ? qMatches[i].index! + block.slice(afterH3 - qMatches[i].index!).indexOf(nextH3[0])
      : block.length;
    const rawAnswer = block.slice(afterH3, end);
    const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(rawAnswer);
    const text = stripHtml(pMatch ? pMatch[1] : rawAnswer).trim();
    answers.push(text);
  }
  return { questions, answers };
}

/**
 * Post-humanization content integrity check. Compares pre vs post HTML for heading,
 * statistic, attribution, section count, word count, FAQ, and entity preservation.
 */
export function verifyContentIntegrity(
  preHumanizeHtml: string,
  postHumanizeHtml: string
): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  const preText = stripHtml(preHumanizeHtml);
  const postText = stripHtml(postHumanizeHtml);

  // 1. Heading integrity
  const preHeadings = extractH2H3Text(preHumanizeHtml);
  const postHeadings = extractH2H3Text(postHumanizeHtml);
  if (preHeadings.length !== postHeadings.length) {
    issues.push(
      `HEADING COUNT: Original has ${preHeadings.length} H2/H3 sections, humanized has ${postHeadings.length}`
    );
  }
  for (let i = 0; i < Math.min(preHeadings.length, postHeadings.length); i++) {
    if (preHeadings[i] !== postHeadings[i]) {
      issues.push(`HEADING ALTERED: "${preHeadings[i]}" changed to "${postHeadings[i]}"`);
    }
  }
  if (postHeadings.length < preHeadings.length) {
    for (let i = postHeadings.length; i < preHeadings.length; i++) {
      issues.push(`HEADING MISSING: "${preHeadings[i]}" not found in humanized version`);
    }
  }

  // 2. Statistic preservation
  const preNums = extractNumbersFromText(preText);
  const postNums = extractNumbersFromText(postText);
  for (const n of preNums) {
    if (!postNums.some((p) => p === n || p.includes(n) || n.includes(p))) {
      issues.push(`STAT MISSING: "${n}" found in original but not in humanized version`);
    }
  }

  // 3. Source attribution preservation
  const preAttrib = extractAttributionPhrases(preText);
  const postAttrib = extractAttributionPhrases(postText);
  for (const a of preAttrib) {
    const found = postAttrib.some((p) => p.toLowerCase().includes(a.toLowerCase().slice(0, 15)));
    if (!found) {
      issues.push(`ATTRIBUTION DROPPED: "${a}" not found in humanized version`);
    }
  }

  // 4. Section count
  const preH2 = (preHumanizeHtml.match(/<h2[^>]*>/gi) ?? []).length;
  const postH2 = (postHumanizeHtml.match(/<h2[^>]*>/gi) ?? []).length;
  const preH3 = (preHumanizeHtml.match(/<h3[^>]*>/gi) ?? []).length;
  const postH3 = (postHumanizeHtml.match(/<h3[^>]*>/gi) ?? []).length;
  if (preH2 !== postH2) issues.push(`SECTION LOST: Original has ${preH2} H2 sections, humanized has ${postH2}`);
  if (preH3 !== postH3) issues.push(`SECTION LOST: Original has ${preH3} H3 sections, humanized has ${postH3}`);

  // 5. Word count drift
  const preWords = wordCount(preText);
  const postWords = wordCount(postText);
  const drift = preWords > 0 ? (postWords - preWords) / preWords : 0;
  if (Math.abs(drift) > 0.05) {
    const pct = (drift * 100).toFixed(1);
    issues.push(
      `WORD COUNT DRIFT: Original ${preWords} words, humanized ${postWords} words (${Number(pct) >= 0 ? "+" : ""}${pct}%) — exceeds ±5% tolerance`
    );
  }

  // 6. FAQ preservation
  const preFaq = extractFaqBlock(preHumanizeHtml);
  const postFaq = extractFaqBlock(postHumanizeHtml);
  if (preFaq.questions.length !== postFaq.questions.length) {
    issues.push(
      `FAQ QUESTION COUNT: Original has ${preFaq.questions.length}, humanized has ${postFaq.questions.length}`
    );
  }
  for (let i = 0; i < Math.min(preFaq.questions.length, postFaq.questions.length); i++) {
    if (preFaq.questions[i].trim() !== postFaq.questions[i].trim()) {
      issues.push(`FAQ QUESTION CHANGED: "${preFaq.questions[i]}" became "${postFaq.questions[i]}"`);
    }
  }
  for (let i = 0; i < postFaq.answers.length; i++) {
    if (postFaq.answers[i].length > 300) {
      issues.push(`FAQ ANSWER EXPANDED: Answer to question ${i + 1} is ${postFaq.answers[i].length} characters (limit: 300)`);
    }
  }

  // 7. Entity preservation (simple: key numbers and attributions already checked; optional entity-name extraction)
  // 8. Direct answer opening — soft check: first 60 words contain at least one key number or attribution from pre
  const postFirst60 = postText.split(/\s+/).slice(0, 60).join(" ");
  const preFirst60 = preText.split(/\s+/).slice(0, 60).join(" ");
  const preNumsInOpening = preNums.filter((n) => preFirst60.includes(n));
  if (preNumsInOpening.length > 0 && !preNumsInOpening.some((n) => postFirst60.includes(n))) {
    issues.push("GEO OPENING WEAKENED: Key number(s) from original opening not found in first 60 words of humanized version");
  }

  return { passed: issues.length === 0, issues };
}

/**
 * Surgically restore damaged content from pre-humanized HTML. Does not retry humanization.
 */
export function restoreContentIntegrity(
  preHumanizeHtml: string,
  postHumanizeHtml: string,
  issues: string[]
): { restoredHtml: string; restorations: string[] } {
  const restorations: string[] = [];
  let restored = postHumanizeHtml;

  // Restore missing/altered headings
  const preHeadings = extractH2H3Text(preHumanizeHtml);
  const postHeadings = extractH2H3Text(postHumanizeHtml);
  if (preHeadings.length !== postHeadings.length || preHeadings.some((h, i) => postHeadings[i] !== h)) {
    const preH2Matches = [...preHumanizeHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    const postH2Matches = [...restored.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
    for (let i = 0; i < Math.min(preH2Matches.length, postH2Matches.length); i++) {
      const preText = stripHtml(preH2Matches[i][1]).trim();
      const postText = stripHtml(postH2Matches[i][1]).trim();
      if (preText !== postText) {
        restored = restored.replace(postH2Matches[i][0], preH2Matches[i][0]);
        restorations.push(`Restored H2 heading: "${preText}"`);
      }
    }
    const preH3Matches = [...preHumanizeHtml.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
    const postH3Matches = [...restored.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)];
    for (let i = 0; i < Math.min(preH3Matches.length, postH3Matches.length); i++) {
      const preText = stripHtml(preH3Matches[i][1]).trim();
      const postText = stripHtml(postH3Matches[i][1]).trim();
      if (preText !== postText) {
        restored = restored.replace(postH3Matches[i][0], preH3Matches[i][0]);
        restorations.push(`Restored H3 heading: "${preText}"`);
      }
    }
  }

  // Restore FAQ block if any answer was expanded or changed
  const preFaq = extractFaqBlock(preHumanizeHtml);
  const postFaq = extractFaqBlock(restored);
  const faqNeedsRestore = issues.some((x) => x.includes("FAQ")) &&
    (postFaq.answers.some((a, j) => a.length > 300 || (preFaq.answers[j] && preFaq.answers[j] !== a)));
  if (faqNeedsRestore) {
    const preFaqH2 = preHumanizeHtml.match(/<h2[^>]*>([^<]*(?:FAQ|Frequently Asked)[^<]*)<\/h2>/i);
    const postFaqH2 = restored.match(/<h2[^>]*>([^<]*(?:FAQ|Frequently Asked)[^<]*)<\/h2>/i);
    if (preFaqH2 && postFaqH2) {
      const preStart = preHumanizeHtml.indexOf(preFaqH2[0]);
      const afterPreFaq = preHumanizeHtml.slice(preStart + 1);
      const preNextH2Match = afterPreFaq.match(/<h2[^>]*>/i);
      const preEnd = preNextH2Match ? preStart + 1 + afterPreFaq.indexOf(preNextH2Match[0]) : preHumanizeHtml.length;
      const preBlock = preHumanizeHtml.slice(preStart, preEnd);
      const postStart = restored.indexOf(postFaqH2[0]);
      const afterPostFaq = restored.slice(postStart + 1);
      const postNextH2Match = afterPostFaq.match(/<h2[^>]*>/i);
      const postEnd = postNextH2Match ? postStart + 1 + afterPostFaq.indexOf(postNextH2Match[0]) : restored.length;
      restored = restored.slice(0, postStart) + preBlock + restored.slice(postEnd);
      restorations.push("Restored full FAQ block from pre-humanized version");
    }
  }

  return { restoredHtml: restored, restorations };
}

/**
 * Enforce hard 300-character limit on FAQ answers. Truncate if over.
 */
export function enforceFaqCharacterLimit(
  articleHtml: string,
  maxChars: number = 300
): { passed: boolean; violations: { question: string; answer: string; charCount: number }[]; fixedHtml: string } {
  const { questions, answers } = extractFaqBlock(articleHtml);
  const violations: { question: string; answer: string; charCount: number }[] = [];
  let fixedHtml = articleHtml;
  const faqH2 = /<h2[^>]*>([^<]*(?:FAQ|Frequently Asked)[^<]*)<\/h2>/i.exec(articleHtml);
  if (!faqH2) return { passed: true, violations: [], fixedHtml: articleHtml };
  const afterFaq = articleHtml.indexOf(faqH2[0]) + faqH2[0].length;
  const block = articleHtml.slice(afterFaq);
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const qMatches = [...block.matchAll(h3Regex)];

  for (let i = answers.length - 1; i >= 0; i--) {
    const ans = answers[i];
    if (ans.length <= maxChars) continue;
    violations.push({ question: questions[i] ?? "", answer: ans, charCount: ans.length });
    const sentences = ans.match(/[^.!?]+[.!?]+/g) ?? [ans];
    let truncated = sentences.slice(0, 2).join(" ").trim();
    if (truncated.length > maxChars) truncated = (sentences[0] ?? ans).trim();
    if (truncated.length > maxChars) {
      const lastSpace = truncated.slice(0, maxChars - 1).lastIndexOf(" ");
      truncated = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated.slice(0, maxChars - 1)).trim() + ".";
    }
    if (qMatches[i]) {
      const segmentStart = afterFaq + qMatches[i].index! + qMatches[i][0].length;
      const segmentEnd = qMatches[i + 1] ? afterFaq + qMatches[i + 1].index! : articleHtml.length;
      const segment = fixedHtml.slice(segmentStart, segmentEnd);
      const pMatch = segment.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (pMatch) {
        const oldP = pMatch[0];
        const newP = oldP.replace(pMatch[1], truncated);
        const globalIndex = fixedHtml.indexOf(oldP, segmentStart);
        if (globalIndex !== -1) {
          fixedHtml = fixedHtml.slice(0, globalIndex) + newP + fixedHtml.slice(globalIndex + oldP.length);
        }
      }
    }
  }

  return { passed: violations.length === 0, violations, fixedHtml };
}

/** Check if number is in rhetorical context (skip, don't flag as hallucination). */
function isRhetoricalNumber(snippet: string, num: string): boolean {
  const lower = snippet.toLowerCase();
  // Original patterns
  if (/\d+\s*%\s*of\s+the\s+(quality|cost|price|value)/.test(lower)) return true;
  if (/\d+\s*%\s*(cheaper|faster|better|more|less)/.test(lower)) return true;
  if (/nearly\s+\d|almost\s+\d|roughly\s+\d|about\s+\d/.test(lower)) return true;
  if (/\d+\s*years?\s+ago|over\s+\d+\s+years?|past\s+\d+\s+decades?/.test(lower)) return true;
  if (/first\s+\d+|top\s+\d+|number\s+\d+|#\s*\d+/.test(lower)) return true;
  if (/\d+x\s+more|\d+x\s+faster|\d+x\s+better/.test(lower)) return true;
  // Complement / remainder language (e.g. "means 80% of the market", "leaves 80%", "the remaining 80%")
  if (/means\s+\d+\s*%|leaves\s+\d+\s*%|the\s+remaining\s+\d+\s*%|the\s+other\s+\d+\s*%/.test(lower)) return true;
  if (/\d+\s*%\s+(?:of\s+the\s+market|is\s+(?:android|other|competitor))/.test(lower)) return true;
  // Ratio framing
  if (/\d+\s+out\s+of\s+\d+/.test(lower)) return true;
  // Pricing context (general product prices, not specific data claims)
  if (/\$[\d,]+\s*(?:smartphone|watch|smartwatch|device|laptop|tablet|product|accessory|subscription|phone|earbuds|headphone)/i.test(lower)) return true;
  if (/(?:up\s+to|starting\s+at|priced\s+at|around|roughly|about)\s+\$[\d,]+/.test(lower)) return true;
  // Timeframe references (not stat claims)
  if (/\d+[-\s](?:year|month|week|day|quarter|decade)/.test(lower)) return true;
  return false;
}

/** Check if a number is derivable from currentData numbers (complement, difference, ratio). */
function isDerivedFromRef(numVal: number, refNumbers: Set<string>): boolean {
  const refVals = [...refNumbers]
    .map((r) => parseFloat(r.replace(/[^0-9.]/g, "")))
    .filter((v) => !Number.isNaN(v));
  // Complement: 100 - X = numVal (for percentages)
  for (const r of refVals) {
    if (r > 0 && r < 100 && Math.abs((100 - r) - numVal) < 0.5) return true;
  }
  // Difference: |X - Y| = numVal
  for (let i = 0; i < refVals.length; i++) {
    for (let j = i + 1; j < refVals.length; j++) {
      const diff = Math.abs(refVals[i] - refVals[j]);
      if (diff > 0 && Math.abs(diff - numVal) < Math.max(numVal * 0.01, 0.5)) return true;
    }
  }
  // Sum: X + Y = numVal
  for (let i = 0; i < refVals.length; i++) {
    for (let j = i + 1; j < refVals.length; j++) {
      const sum = refVals[i] + refVals[j];
      if (sum > 0 && Math.abs(sum - numVal) < Math.max(numVal * 0.01, 0.5)) return true;
    }
  }
  return false;
}

/** Build alias set for currentData sources (earnings release, domain, firm names, etc.). */
function buildSourceAliases(currentData: CurrentData, primaryKeyword?: string): Set<string> {
  const aliases = new Set<string>();
  const add = (s: string) => s && aliases.add(s.toLowerCase().trim());
  for (const f of currentData.facts) {
    try {
      const u = new URL(f.source);
      add(u.hostname.replace(/^www\./, ""));
    } catch {
      add(f.source.slice(0, 80));
    }
    const accord = /according\s+to\s+([^.,;]+)/gi.exec(f.fact);
    if (accord) add(accord[1].trim());
    const per = /per\s+([^.,;]+)/gi.exec(f.fact);
    if (per) add(per[1].trim());
    // Extract entity names from fact text (capitalized proper nouns at sentence start)
    const entityMatch = f.fact.match(/^([A-Z][a-zA-Z&\s]{1,30}?)(?:\s+(?:reported|announced|disclosed|said|earned|generated|posted|reached|saw|achieved|holds|has|had))/);
    if (entityMatch) {
      const entity = entityMatch[1].trim().toLowerCase();
      add(entity);
      add(`${entity} reported`);
      add(`${entity} announced`);
      add(`${entity} disclosed`);
      add(`${entity} said`);
    }
  }
  // Add primary keyword as valid entity for attributions
  if (primaryKeyword?.trim()) {
    const kw = primaryKeyword.trim().toLowerCase();
    add(kw);
    add(`${kw} reported`);
    add(`${kw} announced`);
    add(`${kw} disclosed`);
    add(`${kw} said`);
  }
  const corporatePhrases = ["earnings release", "earnings call", "company filings", "investor call", "quarterly report", "annual report", "its earnings release", "its investor call", "the company's disclosures", "the company reported"];
  corporatePhrases.forEach(add);
  return aliases;
}

/**
 * Verify article facts against currentData. Flags numbers not in source data and fabricated source names.
 * @param primaryKeyword — optional; used to allow entity attributions like "Apple reported".
 */
export function verifyFactsAgainstSource(
  articleHtml: string,
  currentData: CurrentData,
  primaryKeyword?: string
): { verified: boolean; issues: string[]; hallucinations: string[]; skippedRhetorical: string[] } {
  const issues: string[] = [];
  const hallucinations: string[] = [];
  const skippedRhetorical: string[] = [];
  const text = stripHtml(articleHtml);

  const refNumbers = new Set<string>();
  for (const f of currentData.facts) {
    const nums = extractNumbersFromText(f.fact);
    nums.forEach((n) => refNumbers.add(n));
    const numPartRe = /(\d+(?:\.\d+)?)/g;
    let mm: RegExpExecArray | null;
    while ((mm = numPartRe.exec(f.fact)) !== null) refNumbers.add(mm[1]);
  }

  const sourceAliases = buildSourceAliases(currentData, primaryKeyword);

  const statLikeRe = /\$[\d,]+(?:\.\d+)?\s*(?:billion|million|B|M|bn|mn)?|[\d,]+(?:\.\d+)?\s*%|\d+(?:\.\d+)?\s*(?:billion|million)\s+/gi;
  const articleStatMatches = [...text.matchAll(statLikeRe)];
  for (const m of articleStatMatches) {
    const n = m[0];
    const snippet = text.slice(Math.max(0, m.index! - 50), m.index! + n.length + 50);
    if (isRhetoricalNumber(snippet, n)) {
      skippedRhetorical.push(`Skipped rhetorical: "${n}" in "${snippet.trim().slice(0, 60)}…`);
      continue;
    }
    const numVal = parseFloat(n.replace(/[^0-9.]/g, ""));
    if (Number.isNaN(numVal)) continue;
    const inRef = [...refNumbers].some((r) => {
      const rVal = parseFloat(r.replace(/[^0-9.]/g, ""));
      if (Number.isNaN(rVal)) return r.includes(n) || n.includes(r);
      const tolerance = Math.max(rVal * 0.005, 0.01);
      return Math.abs(numVal - rVal) <= tolerance || r.includes(String(numVal)) || n.includes(String(rVal));
    });
    if (!inRef && isDerivedFromRef(numVal, refNumbers)) {
      skippedRhetorical.push(`Skipped derived: "${n}" in "${snippet.trim().slice(0, 60)}…`);
      continue;
    }
    if (!inRef) {
      hallucinations.push(`"${snippet.trim()}" contains "${n}" which is not in currentData`);
    }
  }

  const articleAttrib = extractAttributionPhrases(text);
  for (const a of articleAttrib) {
    if (isNonAttributionPhrase(a)) continue;
    const name = a.replace(/^(per|according to)\s+/i, "").trim().split(/[.,;]/)[0].trim();
    const nameLower = name.toLowerCase();
    const allowed = [...sourceAliases].some(
      (s) => s.includes(nameLower) || nameLower.includes(s)
    );
    if (!allowed && name.length > 2) {
      hallucinations.push(`FABRICATED SOURCE: "${name}" is not in currentData sources`);
    }
  }

  /** Content Integrity: allow up to this many hallucinations before marking as not verified. */
  const MAX_ALLOWED_HALLUCINATIONS = 6;

  return {
    verified: hallucinations.length <= MAX_ALLOWED_HALLUCINATIONS,
    issues,
    hallucinations,
    skippedRhetorical,
  };
}

/** Validation summary for generated schema (v3). */
export type SchemaValidationSummary = {
  article: "valid" | "invalid";
  faq: "valid" | "invalid" | "not_detected";
  breadcrumb: "valid" | "invalid";
};

const GEO_FAQ_ANSWER_MAX_CHARS = 300;

/**
 * Generate JSON-LD schema markup from article HTML. Parses FAQ (H2 FAQ + H3 Q / P A) and
 * step-by-step patterns. Author/publisher/image added by CMS.
 */
export function generateSchemaMarkup(
  articleHtml: string,
  title: string,
  metaDescription: string,
  slug: string,
  keyword: string
): SchemaMarkup {
  const now = new Date().toISOString().slice(0, 10);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title || "Article",
    description: metaDescription || "",
    keywords: keyword || "",
    datePublished: now,
    dateModified: now,
  };

  let faq: SchemaMarkup["faq"] = null;
  const faqH2 = /<h2[^>]*>([^<]*(?:FAQ|Frequently Asked)[^<]*)<\/h2>/i.exec(articleHtml);
  if (faqH2) {
    const afterFaq = articleHtml.indexOf(faqH2[0]) + faqH2[0].length;
    const block = articleHtml.slice(afterFaq);
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    const qMatches = [...block.matchAll(h3Regex)];
    const mainEntity: Array<{ "@type": string; name: string; acceptedAnswer: { "@type": string; text: string } }> = [];
    for (let i = 0; i < qMatches.length; i++) {
      const name = stripHtml(qMatches[i][1]);
      const afterH3 = qMatches[i].index! + qMatches[i][0].length;
      const nextH3 = qMatches.slice(i + 1)[0];
      const end = nextH3 ? qMatches[i].index! + block.slice(afterH3 - qMatches[i].index!).indexOf(nextH3[0]) : block.length;
      const rawAnswer = block.slice(afterH3, end);
      const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(rawAnswer);
      const text = stripHtml(pMatch ? pMatch[1] : rawAnswer).slice(0, GEO_FAQ_ANSWER_MAX_CHARS);
      if (name && text) {
        mainEntity.push({
          "@type": "Question",
          name,
          acceptedAnswer: { "@type": "Answer", text },
        });
      }
    }
    if (mainEntity.length > 0) {
      faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity,
      };
    }
  }

  const faqSchemaNote = faq
    ? "FAQPage schema generated for AI engine optimization (Perplexity, ChatGPT, AI Overviews). Note: Google FAQ rich results only display for well-known authoritative domains per September 2024 update. This schema will NOT produce FAQ rich snippets on most blog domains but WILL help AI engines extract Q&A content."
    : "No FAQ section detected.";

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: SITE_URL + "/blog" },
      { "@type": "ListItem", position: 3, name: title || "Article", item: SITE_URL + "/blog/" + (slug || "") },
    ],
  };

  return { article, faq, breadcrumb, faqSchemaNote };
}

/**
 * Optional differentiation check: how many brief extra-value themes appear in content.
 * Level 3, informational only (does not block publishing).
 */
function auditExtraValueCoverage(plainContent: string, themes: string[]): AuditItem[] {
  const lower = plainContent.toLowerCase();
  let covered = 0;
  for (const theme of themes) {
    const t = theme.trim();
    if (!t) continue;
    const asPhrase = lower.includes(t.toLowerCase());
    const words = t.split(/\s+/).filter(Boolean);
    const wordOverlap = words.length > 0 && words.filter((w) => w.length > 2 && lower.includes(w.toLowerCase())).length >= Math.min(2, words.length);
    if (asPhrase || wordOverlap) covered++;
  }
  const total = themes.filter((t) => t.trim().length > 0).length;
  const ratio = total > 0 ? covered / total : 1;
  return [
    {
      id: "extra-value-coverage",
      severity: ratio >= 0.5 ? "pass" : ratio >= 0.25 ? "warn" : "fail",
      level: 3,
      source: "editorial",
      label: "Extra value coverage (from brief)",
      message: total > 0 ? `${covered}/${total} differentiation themes addressed in content.` : "No brief themes to check.",
      value: total > 0 ? covered : undefined,
      threshold: total > 0 ? total : undefined,
      guideline: "Ensure the article clearly covers the brief's extra-value themes so it adds value beyond competitors.",
    },
  ];
}

/**
 * Run full article audit per Google Search Central priority stack.
 * Schema markup is auto-generated when title/meta/slug/keyword are available.
 *
 * Author byline and bio are NOT audited — they are added by the CMS at publish time.
 */
export function auditArticle(
  input: ArticleAuditInput,
): ArticleAuditResult {
  const plainContent = stripHtml(input.content);

  const all: AuditItem[] = [
    // Level 1 — Publication Blockers (Google)
    ...auditTitle(input),
    ...auditMetaDescription(input.metaDescription),
    ...auditContentThinness(plainContent),
    ...auditKeywordStuffing(plainContent, input.focusKeyword),
    ...auditHeadingStructure(input.content),
    // Level 2 — Ranking Killers (Google) — images/links skipped (added in WordPress)
    ...auditParagraphLength(input.content),
    ...auditSlug(input.slug),
    // Level 2 — Editorial quality (typography + generic phrases)
    ...auditAiTypography(plainContent),
    ...auditAiPhrases(plainContent),
    // Level 3 — Rank Math 100/100 (competitive; Google priority)
    ...auditRankMathMetaKeyword(input.metaDescription, input.focusKeyword),
    ...auditRankMathFirst10Percent(plainContent, input.focusKeyword),
    ...auditRankMathSlugKeyword(input.slug, input.focusKeyword),
    ...auditRankMathSubheadingKeyword(input.content, input.focusKeyword),
    ...auditRankMathContentLength(plainContent),
    ...auditRankMathTitleKeywordPosition(input.title, input.focusKeyword),
    ...auditRankMathNumberInTitle(input.title),
    // Level 3 — Differentiation (optional; from brief extra-value themes)
    ...(input.extraValueThemes?.length ? auditExtraValueCoverage(plainContent, input.extraValueThemes) : []),
  ];

  const sorted = [...all].sort(byLevelThenSeverity);

  // Informational items excluded from score:
  // - AI phrase checks (editorial source, except ai-typography which is a hard ban)
  // - Content length (rm-content-length) — Google doesn't penalize shorter content
  const scoreable = all.filter(
    (i) => (i.source !== "editorial" || i.id === "ai-typography") && i.id !== "rm-content-length"
  );
  const pass = scoreable.filter((i) => i.severity === "pass").length;
  const warn = scoreable.filter((i) => i.severity === "warn").length;
  const fail = scoreable.filter((i) => i.severity === "fail").length;
  const total = scoreable.length;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;

  const level1Fails = scoreable.filter((i) => i.level === 1 && i.severity === "fail").length;
  const publishable = score >= MIN_PUBLISH_SCORE && level1Fails === 0;

  const schemaMarkup =
    input.title && input.metaDescription !== undefined && input.slug !== undefined
      ? generateSchemaMarkup(
          input.content,
          input.title,
          input.metaDescription ?? "",
          input.slug ?? "",
          input.focusKeyword ?? ""
        )
      : undefined;

  return {
    items: sorted,
    score,
    summary: { pass, warn, fail },
    publishable,
    schemaMarkup,
  };
}

/**
 * Format audit result as plain text for console or logs.
 */
export function formatAuditReport(result: ArticleAuditResult): string {
  const lines: string[] = [
    "--- Article audit (Google Search Central + Rank Math) ---",
    `Score: ${result.score}% (${result.summary.pass} pass, ${result.summary.warn} warn, ${result.summary.fail} fail)`,
    result.publishable ? "Publishable: Yes" : `Publishable: No (min ${MIN_PUBLISH_SCORE}% required)`,
    "",
  ];
  for (const item of result.items) {
    const icon = item.severity === "pass" ? "✓" : item.severity === "warn" ? "⚠" : "✗";
    const lvl = item.level ? `[L${item.level}] ` : "";
    const src = item.source === "rankmath" ? " [Rank Math]" : item.source === "editorial" ? " [Editorial]" : "";
    lines.push(`[${icon}] ${lvl}${item.label}${src}: ${item.message}`);
    if (item.value !== undefined) lines.push(`    value: ${item.value}${item.threshold !== undefined ? ` (threshold: ${item.threshold})` : ""}`);
    if (item.guideline) lines.push(`    guideline: ${item.guideline}`);
  }
  lines.push("---");
  return lines.join("\n");
}