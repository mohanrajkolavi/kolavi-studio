/**
 * Blog article SEO audit — Google Search Central + Rank Math alignment.
 *
 * Reference documentation:
 * - Google Search Central: developers.google.com/search/docs/fundamentals/creating-helpful-content
 * - Google Spam Policies: developers.google.com/search/docs/essentials/spam-policies
 * - Rank Math 100/100: rankmath.com/kb/score-100-in-tests
 * - Sentiment in title: rankmath.com/kb/score-100-in-tests/#sentiment-in-a-title
 * - Power words: rankmath.com/blog/power-words/
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
  /** Author name for JSON-LD schema Person type. */
  authorName?: string;
  /** Author page URL for JSON-LD schema. */
  authorUrl?: string;
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

export function stripHtml(html: string): string {
  // Normalize newlines first so downstream consumers can reliably split on \n
  let text = html.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Insert line breaks around common block-level elements so paragraph boundaries are preserved
  text = text
    .replace(/<(\/?(?:p|div|section|article|blockquote|ul|ol|li|h[1-6]))[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Strip remaining tags
  text = text.replace(/<[^>]*>/g, "");

  // Decode a small set of common HTML entities
  const entityMap: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
  };
  text = text.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, (m) => entityMap[m] ?? m);

  // Collapse horizontal whitespace but keep newlines for paragraph detection
  text = text.replace(/[ \t\f\v]+/g, " ");

  // Normalize multiple blank lines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
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

/** Extract H2 headings from article HTML in order (for outline drift check; no need for Claude to generate outline). */
export function extractH2sFromHtml(html: string): string[] {
  const re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1]).trim();
    if (text) out.push(text);
  }
  return out;
}

function getParagraphs(html: string): string[] {
  const fragment = html.replace(/<p[^>]*>/gi, "\n<p>").replace(/<\/p>/gi, "</p>\n");
  const raw = fragment.split(/\n/).filter((s) => s.trim().length > 0);
  return raw.map((s) => stripHtml(s)).filter((s) => s.length > 0);
}

// --- Rank Math: Title Readability (sentiment + power words) ---
// References: rankmath.com/kb/score-100-in-tests/#sentiment-in-a-title, rankmath.com/blog/power-words/
// Checked as whole-word (\\b) to avoid false positives.

const SENTIMENT_WORDS = new Set([
  "amazing", "best", "essential", "powerful", "proven", "simple", "free", "new", "ultimate", "complete",
  "effective", "easy", "quick", "secret", "discover", "guarantee", "success", "strong", "great", "perfect",
  "incredible", "powerful", "brilliant", "ultimate", "guaranteed", "instant", "effortless", "breakthrough",
  "avoid", "warning", "mistake", "fail", "risk", "critical", "urgent", "danger", "hidden", "truth",
  "shocking", "terrible", "worst", "never", "don't", "stop", "deadly", "exposed", "secret", "revealed",
]);

const POWER_WORDS = new Set([
  "how to", "step-by-step", "guide", "tips", "tricks", "proven", "secret", "discover", "essential",
  "powerful", "simple", "free", "new", "ultimate", "complete", "effective", "easy", "quick", "guarantee",
  "success", "best", "great", "perfect", "amazing", "incredible", "instant", "effortless", "breakthrough",
  "exclusive", "insider", "guaranteed", "official", "authority", "expert", "master", "win", "proven",
  "discover", "revealed", "secret", "hidden", "powerful", "ultimate", "complete", "fast", "quick",
  "easy", "simple", "free", "new", "improved", "ultimate", "full", "total", "maximum", "minimum",
]);

function titleContainsWordFromSet(title: string, wordSet: Set<string>): boolean {
  const lower = title.toLowerCase();
  for (const w of wordSet) {
    const re = new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (re.test(lower)) return true;
  }
  return false;
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
        severity: "fail",
        level: 1,
        source: "editorial",
        label: "Typography (editorial)",
        message: `Replace: ${examples}. Use straight quotes (" ') and commas/colons instead of em-dash. Even one instance fails.`,
        value: total,
        guideline: "No em-dash, en-dash, or curly quotes. Straight quotes and standard punctuation only.",
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

/** Excessive symbols often used by AI: multiple !!, ellipses (...), decorative runs. Level 1 fail. */
function auditExcessiveSymbols(plainText: string): AuditItem[] {
  const issues: string[] = [];
  const doubleExcl = (plainText.match(/!!+/g) || []).length;
  if (doubleExcl > 0) {
    issues.push(`Multiple exclamation marks (!! or !!!): ${doubleExcl} occurrence(s)`);
  }
  const ellipsis = (plainText.match(/\.{3,}/g) || []).length;
  if (ellipsis > 2) {
    issues.push(`Excessive ellipses (...): ${ellipsis} (max 2 allowed)`);
  }
  if (issues.length > 0) {
    return [
      {
        id: "excessive-symbols",
        severity: "fail",
        level: 1,
        source: "editorial",
        label: "Excessive symbols",
        message: issues.join(". "),
        value: issues.length,
        guideline: "Use single punctuation. No !! or !!!; avoid repeated ellipses (...).",
      },
    ];
  }
  return [
    {
      id: "excessive-symbols",
      severity: "pass",
      level: 2,
      source: "editorial",
      label: "Excessive symbols",
      message: "No excessive punctuation detected.",
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

/** Verify title number claims match actual content (e.g., "7 Tips" should have ~7 H3s or list items). */
function auditTitleNumberAccuracy(title: string, html: string): AuditItem[] {
  const numMatch = title.match(/\b(\d{1,2})\s+(tips?|ways?|steps?|strategies|methods|reasons?|mistakes?|factors?|examples?|tools?|tricks?|secrets?|benefits?|techniques?|ideas?|hacks?|practices?|principles?|lessons?|rules?|signs?)\b/i);
  if (!numMatch) return [];

  const claimedCount = parseInt(numMatch[1], 10);
  if (claimedCount < 3 || claimedCount > 50) return [];

  // Count H3 headings as the primary signal (each tip/step usually gets an H3)
  const h3Matches = html.match(/<h3[^>]*>/gi) || [];
  const h3Count = h3Matches.length;

  // Also count top-level <li> items in ordered/unordered lists as a secondary signal
  const liMatches = html.match(/<li[^>]*>/gi) || [];
  const liCount = liMatches.length;

  const bestCount = Math.max(h3Count, Math.round(liCount / 2));

  if (bestCount > 0 && bestCount < claimedCount * 0.6) {
    return [{
      id: "title-number-accuracy",
      severity: "warn",
      level: 2,
      source: "editorial",
      label: "Title number accuracy",
      message: `Title claims "${claimedCount} ${numMatch[2]}" but content has ~${h3Count} H3 subsections and ~${liCount} list items. Verify the title number matches actual content.`,
      value: claimedCount,
      threshold: bestCount,
      guideline: "Anti-clickbait: title numbers must accurately represent content. No exaggeration.",
    }];
  }

  return [{
    id: "title-number-accuracy",
    severity: "pass",
    level: 3,
    source: "editorial",
    label: "Title number accuracy",
    message: `Title claims "${claimedCount} ${numMatch[2]}" — content structure supports this.`,
  }];
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

  // Rank Math: Sentiment in title (evoke strong emotion — positive or negative)
  if (titleContainsWordFromSet(title, SENTIMENT_WORDS)) {
    items.push({
      id: "title-sentiment",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Sentiment in title",
      message: "Title contains a sentiment word (evokes emotion).",
      guideline: "Rank Math: titles that evoke strong emotions get more clicks. https://rankmath.com/kb/score-100-in-tests/#sentiment-in-a-title",
    });
  } else {
    items.push({
      id: "title-sentiment",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Sentiment in title",
      message: "Your title doesn't contain a positive or negative sentiment word.",
      guideline: "Rank Math: add a word that evokes emotion (e.g. amazing, proven, secret, avoid, warning). https://rankmath.com/kb/score-100-in-tests/#sentiment-in-a-title",
    });
  }

  // Rank Math: Power word in title (compels clicks)
  if (titleContainsWordFromSet(title, POWER_WORDS)) {
    items.push({
      id: "title-power-word",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Power word in title",
      message: "Title contains a power word.",
      guideline: "Rank Math: power words increase CTR. https://rankmath.com/blog/power-words/",
    });
  } else {
    items.push({
      id: "title-power-word",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Power word in title",
      message: "Your title doesn't contain a power word. Add at least one.",
      guideline: "Rank Math: use words like proven, secret, discover, essential, how to, guide, ultimate. https://rankmath.com/blog/power-words/",
    });
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

  // Spam policy check: >2.5% exact keyword phrase density = stuffing risk (can block publication).
  // Note: a separate "helpful-not-stuffed" check in auditHelpfulContent uses the same exact-phrase
  // approach but with a higher threshold (3%) focused on natural readability, not spam policy.
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
    const nextH3 = i + 1 < qMatches.length ? qMatches[i + 1] : undefined;
    const end = nextH3 ? nextH3.index! : block.length;
    const rawAnswer = block.slice(afterH3, end);
    const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(rawAnswer);
    const text = stripHtml(pMatch ? pMatch[1] : rawAnswer).trim();
    answers.push(text);
  }
  return { questions, answers };
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
    if (i < qMatches.length && qMatches[i]) {
      const segmentStart = afterFaq + qMatches[i].index! + qMatches[i][0].length;
      const segmentEnd = (i + 1 < qMatches.length && qMatches[i + 1]) ? afterFaq + qMatches[i + 1].index! : articleHtml.length;
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
  // Calendar years (1990-2030 range) — common knowledge, not stat claims
  if (/\b(19[5-9]\d|20[0-3]\d)\b/.test(num)) return true;
  // Version numbers (v1.0, 2.0, 3.x, etc.)
  if (/\bv?\d+\.\d+(?:\.\d+)?/.test(num)) return true;
  // Small counts in instructional context (e.g., "5 items", "3 columns", "2 paragraphs")
  const numVal = parseFloat(num.replace(/[^0-9.]/g, ""));
  if (numVal >= 1 && numVal <= 20 && /\d+\s*(?:items?|steps?|sections?|columns?|rows?|paragraphs?|sentences?|characters?|levels?|types?|ways?|tips?|rules?|methods?|tools?|options?|examples?|minutes?|hours?|points?|questions?|answers?)/.test(lower)) return true;
  // Character/word count limits (e.g., "300 characters", "2000 words")
  if (/\d+\s*(?:characters?|words?|bytes?|pixels?|kb|mb|gb)/.test(lower)) return true;
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
 * Detect procedural content (ordered lists with 3+ steps under H2s) and generate HowTo JSON-LD.
 * Returns null if no procedural content is found.
 */
function detectProceduralContent(articleHtml: string, title: string): object | null {
  // Find <ol> elements that follow an H2 heading and have 3+ <li> items
  const h2OlPattern = /<h2[^>]*>([\s\S]*?)<\/h2>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/gi;
  let match: RegExpExecArray | null;
  const steps: { "@type": string; text: string; position: number }[] = [];
  let howToName = title;

  while ((match = h2OlPattern.exec(articleHtml)) !== null) {
    const headingText = stripHtml(match[1]).trim();
    const olContent = match[2];
    const liMatches = [...olContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];

    if (liMatches.length >= 3) {
      // Use the first matching H2 as the HowTo name
      if (steps.length === 0 && headingText) {
        howToName = headingText;
      }
      for (const li of liMatches) {
        steps.push({
          "@type": "HowToStep",
          text: stripHtml(li[1]).trim(),
          position: steps.length + 1,
        });
      }
      break; // Use the first procedural block found
    }
  }

  if (steps.length < 3) return null;

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howToName,
    step: steps,
  };
}

/**
 * Generate JSON-LD schema markup from article HTML. Parses FAQ (H2 FAQ + H3 Q / P A) and
 * step-by-step patterns. Author/publisher/image added by CMS.
 */
export function generateSchemaMarkup(
  articleHtml: string,
  title: string,
  metaDescription: string,
  slug: string,
  keyword: string,
  authorName?: string,
  authorUrl?: string,
): SchemaMarkup {
  const now = new Date().toISOString().slice(0, 10);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title || "Article",
    description: metaDescription || "",
    keywords: keyword || "",
    datePublished: now,
    dateModified: now,
  };

  // Add author as Person when provided, otherwise omit (CMS handles it)
  if (authorName) {
    article.author = {
      "@type": "Person",
      name: authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
    };
  }

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
      const nextH3 = i + 1 < qMatches.length ? qMatches[i + 1] : undefined;
      const end = nextH3 ? nextH3.index! : block.length;
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

  // Speakable schema: mark intro paragraph and FAQ answers for voice assistants
  const speakable = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title || "Article",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["article > p:first-of-type", ".faq-answer", "h2 + p"],
    },
  };

  // HowTo schema: detect procedural content (ordered lists with 3+ steps under an H2)
  const howTo = detectProceduralContent(articleHtml, title);

  return { article, faq, breadcrumb, faqSchemaNote, speakable, howTo };
}

/**
 * Generate an llms.txt snippet for AI crawlers — structured plaintext summary of the article.
 * Follows the llms.txt convention: title, summary, key topics, and FAQ Q&As in a machine-parseable format.
 */
export function generateLlmsTxt(
  articleHtml: string,
  title: string,
  metaDescription: string,
  keyword: string
): string {
  const headings = extractHeadings(articleHtml);
  const h2s = headings.filter((h) => h.level === 2).map((h) => h.text);

  // First paragraph as summary
  const paragraphs = getParagraphs(articleHtml);
  const summary = paragraphs.length > 0 ? paragraphs[0].slice(0, 300) : metaDescription;

  // FAQ Q&As
  const { questions, answers } = extractFaqBlock(articleHtml);
  const faqLines = questions
    .map((q, i) => `Q: ${q}\nA: ${answers[i] ?? ""}`)
    .slice(0, 8);

  const lines: string[] = [
    `# ${title}`,
    "",
    `> ${metaDescription}`,
    "",
    `## Summary`,
    summary,
    "",
    `## Primary Topic`,
    keyword,
    "",
    `## Sections`,
    ...h2s.map((h) => `- ${h}`),
  ];

  if (faqLines.length > 0) {
    lines.push("", "## FAQ", ...faqLines);
  }

  return lines.join("\n");
}

/**
 * Generate JSON-LD entity/about schema mapping for the article.
 * Maps entities mentioned in the article (from headings and keyword) so AI crawlers
 * know exactly what the article is about without guessing from HTML.
 */
export function generateEntitySchema(
  articleHtml: string,
  title: string,
  metaDescription: string,
  slug: string,
  keyword: string
): object {
  const headings = extractHeadings(articleHtml);
  const h2Texts = headings.filter((h) => h.level === 2).map((h) => h.text);

  // Extract entity-like phrases from headings (capitalized proper nouns, named tools, etc.)
  const entitySet = new Set<string>();
  entitySet.add(keyword);

  for (const h of h2Texts) {
    // Skip FAQ headings
    if (/faq|frequently asked/i.test(h)) continue;
    // Extract multi-word capitalized phrases (potential named entities)
    const entityMatches = h.match(/[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g);
    if (entityMatches) {
      for (const e of entityMatches) {
        if (e.length > 2 && !["The", "And", "For", "How", "What", "Why", "When", "Which", "Best", "Top"].includes(e)) {
          entitySet.add(e);
        }
      }
    }
  }

  const aboutEntities = [...entitySet].slice(0, 10).map((name) => ({
    "@type": "Thing",
    name,
  }));

  const now = new Date().toISOString().slice(0, 10);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title || "Article",
    description: metaDescription || "",
    keywords: keyword || "",
    datePublished: now,
    dateModified: now,
    url: SITE_URL + "/blog/" + (slug || ""),
    about: aboutEntities,
    mentions: aboutEntities,
  };
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

// =============================================================================
// Citation Density Audit
// =============================================================================

import { validateCitations } from "@/lib/seo/citation-validator";

function auditCitationDensity(html: string, sourceUrls: string[] = []): AuditItem[] {
  const result = validateCitations(html, sourceUrls);
  const items: AuditItem[] = [];

  // Citation count check
  items.push({
    id: "citation-density",
    severity: result.citationCount >= 8 ? "pass" : result.citationCount >= 4 ? "warn" : "fail",
    label: "Inline citations",
    message: result.citationCount >= 8
      ? `${result.citationCount} inline citations found (${result.citationDensity.toFixed(1)} per 1000 words)`
      : `Only ${result.citationCount} inline citations. Target 8-15 per 2000 words for trust and AI citation boost.`,
    level: 2,
    source: "google",
    value: result.citationCount,
    threshold: "8-15 per 2000 words",
    guideline: "Inline citations boost AI engine citation by 31% and are a key E-E-A-T trust signal per Google Quality Rater Guidelines.",
  });

  // References section check
  items.push({
    id: "references-section",
    severity: result.hasReferencesSection ? "pass" : result.citationCount > 0 ? "fail" : "warn",
    label: "References section",
    message: result.hasReferencesSection
      ? `References section found with ${result.referencesCount} entries`
      : result.citationCount > 0
        ? "Article has inline citations but no References section — add a numbered list at the end"
        : "No citations or references found. Add inline citations with a References section for trust.",
    level: 2,
    source: "google",
    guideline: "A numbered References section at the end of the article matches inline citations and builds reader trust.",
  });

  // Orphan citations (hallucinated URLs)
  if (result.orphanCitations.length > 0) {
    items.push({
      id: "citation-url-validity",
      severity: "warn",
      label: "Citation URL validity",
      message: `${result.orphanCitations.length} citation(s) have URLs not found in source data`,
      level: 1,
      source: "google",
      value: result.orphanCitations.length,
      guideline: "All citation URLs should trace back to research sources to avoid hallucinated references.",
    });
  }

  return items;
}

// =============================================================================
// Anti-Textbook Writing Audit
// =============================================================================

import { TEXTBOOK_OPENERS } from "@/lib/constants/banned-phrases";

function auditWritingQuality(html: string): AuditItem[] {
  const items: AuditItem[] = [];
  const plainText = stripHtml(html);
  const paragraphs = plainText.split(/\n\s*\n/).filter((p) => p.trim().length > 20);

  // 1. Weak/textbook paragraph openers
  let weakOpenerCount = 0;
  const weakOpenerExamples: string[] = [];
  for (const para of paragraphs) {
    const firstSentence = para.trim().split(/[.!?]/)[0]?.toLowerCase().trim() ?? "";
    for (const opener of TEXTBOOK_OPENERS) {
      if (firstSentence.startsWith(opener.toLowerCase())) {
        weakOpenerCount++;
        if (weakOpenerExamples.length < 3) {
          weakOpenerExamples.push(firstSentence.slice(0, 60) + "...");
        }
        break;
      }
    }
  }

  items.push({
    id: "textbook-openers",
    severity: weakOpenerCount === 0 ? "pass" : weakOpenerCount <= 2 ? "warn" : "fail",
    label: "Textbook openers",
    message: weakOpenerCount === 0
      ? "No textbook-style paragraph openers detected"
      : `${weakOpenerCount} paragraph(s) start with weak/textbook openers${weakOpenerExamples.length ? ": " + weakOpenerExamples.map(e => `"${e}"`).join(", ") : ""}`,
    level: 2,
    source: "editorial",
    value: weakOpenerCount,
    threshold: 0,
    guideline: "Every paragraph should open with a specific claim, data point, or insight — not a vague setup like 'There are several...' or 'It is important to...'",
  });

  // 2. Passive voice ratio
  const sentences = splitSentences(plainText);
  const passivePatterns = [
    /\b(?:is|are|was|were|been|being|be)\s+\w+ed\b/i,
    /\b(?:is|are|was|were|been|being|be)\s+\w+en\b/i,
    /\b(?:has|have|had)\s+been\s+\w+ed\b/i,
  ];
  let passiveCount = 0;
  for (const sentence of sentences) {
    if (passivePatterns.some((p) => p.test(sentence))) {
      passiveCount++;
    }
  }
  const passiveRatio = sentences.length > 0 ? passiveCount / sentences.length : 0;

  items.push({
    id: "passive-voice",
    severity: passiveRatio <= 0.15 ? "pass" : passiveRatio <= 0.25 ? "warn" : "fail",
    label: "Active voice",
    message: passiveRatio <= 0.15
      ? `Active voice dominant (${Math.round(passiveRatio * 100)}% passive)`
      : `${Math.round(passiveRatio * 100)}% passive voice detected. Target under 15% for engaging, clear writing.`,
    level: 2,
    source: "editorial",
    value: `${Math.round(passiveRatio * 100)}%`,
    threshold: "≤15%",
    guideline: "Active voice is clearer, more engaging, and builds trust. Passive voice obscures agency and feels textbook-like.",
  });

  // 3. Paragraph length variance (anti-monotony)
  const paraWordCounts = paragraphs.map((p) => p.split(/\s+/).filter(Boolean).length);
  if (paraWordCounts.length >= 4) {
    const mean = paraWordCounts.reduce((a, b) => a + b, 0) / paraWordCounts.length;
    const variance = paraWordCounts.reduce((sum, wc) => sum + (wc - mean) ** 2, 0) / paraWordCounts.length;
    const stdDev = Math.sqrt(variance);

    items.push({
      id: "paragraph-variety",
      severity: stdDev >= 15 ? "pass" : stdDev >= 8 ? "warn" : "fail",
      label: "Paragraph variety",
      message: stdDev >= 15
        ? `Good paragraph length variety (std dev: ${Math.round(stdDev)} words)`
        : `Paragraph lengths are too uniform (std dev: ${Math.round(stdDev)} words). Mix short punchy paragraphs with longer ones.`,
      level: 3,
      source: "editorial",
      value: Math.round(stdDev),
      threshold: "≥15",
      guideline: "Varying paragraph length creates rhythm that holds attention and signals human authorship. Uniform lengths feel robotic.",
    });
  }

  // 4. Engagement hook presence (bucket brigades, curiosity hooks, contrast hooks, question hooks)
  const engagementPhrases = [
    // Curiosity hooks
    "here's the thing", "but here's what", "here's where", "the real question",
    "here's the catch", "here's why", "what most people miss", "here's what happened",
    // Transition hooks
    "so what does this mean", "but it gets", "the bottom line", "think about it",
    "want to know", "let me explain", "stay with me", "bear with me",
    // Contrast hooks
    "sounds great in theory", "not so fast", "but wait", "plot twist",
    "the counterintuitive part", "what nobody tells you", "the reality is",
    // Urgency / emphasis
    "now here's the catch", "picture this", "imagine this", "consider this",
    "the short version", "real talk", "honest take", "spoiler",
  ];
  let hookCount = 0;
  const lowerText = plainText.toLowerCase();
  for (const phrase of engagementPhrases) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = lowerText.match(regex);
    if (matches) hookCount += matches.length;
  }

  // Count rhetorical questions (sentences ending with ?) as half-weight engagement signals
  const questionSentences = plainText.split(/(?<=[?])\s+/).filter((s) => s.trim().endsWith("?")).length;
  hookCount += Math.round(questionSentences * 0.5);

  // Count one-sentence paragraphs as half-weight engagement signals (rhythm breakers)
  const shortParas = paragraphs.filter((p) => {
    const sentCount = p.split(/[.!?]+/).filter((s) => s.trim().length > 5).length;
    return sentCount <= 1 && p.split(/\s+/).length <= 20;
  });
  hookCount += Math.round(shortParas.length * 0.3);

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const hooksPer1000 = wordCount > 0 ? (hookCount / wordCount) * 1000 : 0;

  items.push({
    id: "bucket-brigades",
    severity: hooksPer1000 >= 3 ? "pass" : hooksPer1000 >= 1.5 ? "warn" : "fail",
    label: "Engagement hooks",
    message: hooksPer1000 >= 2
      ? `${hookCount} engagement hooks found (${hooksPer1000.toFixed(1)} per 1000 words)`
      : `Only ${hookCount} engagement hooks. Target 3-5 per 1000 words to maintain reader attention.`,
    level: 3,
    source: "editorial",
    value: hookCount,
    threshold: "3-5 per 1000 words",
    guideline: "Bucket brigades, curiosity hooks, and rhythm-breaking short paragraphs reduce bounce rate by 15-30% (NNGroup research).",
  });

  return items;
}

// =============================================================================
// Sentence Length Variety — Anti-AI Detection Signal
// =============================================================================

/**
 * Measure sentence length standard deviation. Human writing naturally varies
 * sentence length (SD ≥ 4.5 words). AI text tends toward uniform lengths.
 */
function auditSentenceVariety(html: string): AuditItem[] {
  const items: AuditItem[] = [];
  const plainText = stripHtml(html);
  const sentences = splitSentences(plainText).filter((s) => s.split(/\s+/).filter(Boolean).length >= 3);

  if (sentences.length < 10) return items;

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  items.push({
    id: "sentence-variety",
    severity: stdDev >= 4.5 ? "pass" : stdDev >= 3 ? "warn" : "fail",
    label: "Sentence length variety",
    message: stdDev >= 4.5
      ? `Sentence length SD: ${stdDev.toFixed(1)} words — natural human rhythm`
      : `Sentence length SD: ${stdDev.toFixed(1)} words (target ≥4.5). Vary between short punchy sentences and longer complex ones.`,
    level: 2,
    source: "editorial",
    value: Math.round(stdDev * 10) / 10,
    threshold: "SD ≥ 4.5",
    guideline: "Uniform sentence lengths are a strong AI detection signal. Human writers naturally vary between 5-word punches and 25-word explanations.",
  });

  // Also check for extremely long sentences (>40 words) which hurt readability
  const longSentences = lengths.filter((l) => l > 40).length;
  const longRatio = longSentences / lengths.length;
  if (longRatio > 0.1) {
    items.push({
      id: "sentence-length-max",
      severity: "warn",
      label: "Overly long sentences",
      message: `${longSentences} sentence(s) exceed 40 words (${Math.round(longRatio * 100)}%). Break these up for clarity.`,
      level: 3,
      source: "editorial",
      value: longSentences,
      threshold: "≤10% over 40 words",
      guideline: "Long sentences reduce cognitive fluency — readers literally perceive shorter, clearer content as more truthful.",
    });
  }

  return items;
}

// =============================================================================
// Inverted Pyramid Audit — Value Front-Loading at Every Level
// =============================================================================

/**
 * Verify that content front-loads answers at article, section, and paragraph levels:
 * - Article: first 100 words contain a definitive statement (not just intro fluff)
 * - Sections: first paragraph after each H2 starts with a direct claim/answer
 * - Paragraphs: first sentence carries information (not throat-clearing)
 */
function auditInvertedPyramid(html: string, focusKeyword?: string): AuditItem[] {
  const items: AuditItem[] = [];
  const plainText = stripHtml(html);

  // 1. Article-level: first 100 words should contain a definitive statement
  const first100 = plainText.split(/\s+/).slice(0, 100).join(" ");
  const definitivePatterns = [
    /\b(?:is|are|means?|refers?\s+to|defined?\s+as|involves?)\b/i,
    /\b(?:here(?:'s| is)|the (?:answer|solution|key|secret|reason))\b/i,
    /\b(?:you (?:need|should|can|must)|the best|the most|step \d)\b/i,
    /\b\d+(?:\.\d+)?%/,  // contains a stat
    /\$\d/,               // contains a dollar figure
  ];
  const hasDefinitiveOpening = definitivePatterns.some((p) => p.test(first100));

  items.push({
    id: "inverted-pyramid-opening",
    severity: hasDefinitiveOpening ? "pass" : "warn",
    label: "Answer-first opening",
    message: hasDefinitiveOpening
      ? "Article opens with a definitive statement in the first 100 words"
      : "First 100 words lack a definitive answer or claim. Front-load the value — readers and Google reward answer-first content.",
    level: 2,
    source: "editorial",
    value: hasDefinitiveOpening ? 1 : 0,
    threshold: "definitive statement in first 100 words",
    guideline: "Inverted pyramid + scannability = 124% usability improvement (NNGroup). Answer first, explain second.",
  });

  // 2. Section-level: check first paragraph after each H2
  const sections = html.split(/<h2[^>]*>/i).slice(1); // skip content before first H2
  let weakSectionOpeners = 0;
  const weakSectionExamples: string[] = [];

  for (const section of sections) {
    // Get first paragraph text
    const firstParaMatch = section.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!firstParaMatch) continue;
    const firstPara = stripHtml(firstParaMatch[1]).trim();
    const firstSentence = firstPara.split(/[.!?]/)[0]?.trim() ?? "";

    // Check if first sentence is a weak setup rather than a direct answer
    const weakSetups = [
      /^(?:in this section|this section|here,? we|let(?:'s| us) (?:explore|discuss|look|dive|examine|start))/i,
      /^(?:before we|to understand|in order to|when it comes to)/i,
      /^(?:as (?:we|you) (?:know|mentioned|discussed|saw))/i,
    ];
    const isWeak = weakSetups.some((p) => p.test(firstSentence));
    if (isWeak) {
      weakSectionOpeners++;
      if (weakSectionExamples.length < 2) {
        weakSectionExamples.push(firstSentence.slice(0, 60) + "...");
      }
    }
  }

  if (sections.length > 0) {
    items.push({
      id: "inverted-pyramid-sections",
      severity: weakSectionOpeners === 0 ? "pass" : weakSectionOpeners <= 1 ? "warn" : "fail",
      label: "Section answer-first",
      message: weakSectionOpeners === 0
        ? "All sections open with direct answers/claims — no setup fluff"
        : `${weakSectionOpeners} section(s) open with setup instead of a direct answer${weakSectionExamples.length ? ": " + weakSectionExamples.map(e => `"${e}"`).join(", ") : ""}`,
      level: 2,
      source: "editorial",
      value: weakSectionOpeners,
      threshold: 0,
      guideline: "Each H2 section should open with the answer capsule — the direct claim or insight — not with 'In this section, we'll explore...'",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// SERP Intelligence — Featured snippet audit, Title CTR scoring, ToC generation
// ---------------------------------------------------------------------------

/** Check if article has a concise definition suitable for featured snippet extraction. */
function auditFeaturedSnippet(html: string, focusKeyword?: string): AuditItem[] {
  const items: AuditItem[] = [];
  const plainText = stripHtml(html);

  // Check first 300 words for a definition-style answer
  const first300Words = plainText.split(/\s+/).slice(0, 300).join(" ");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // Look for a concise answer paragraph (40-60 words)
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi) ?? [];
  const earlyParagraphs = paragraphs.slice(0, 5);
  let hasSnippetCandidate = false;

  for (const p of earlyParagraphs) {
    const pText = p.replace(/<[^>]+>/g, "").trim();
    const pWords = pText.split(/\s+/).filter(Boolean).length;
    if (pWords >= 30 && pWords <= 70) {
      // Check if it contains the focus keyword and reads like a definition
      if (!focusKeyword || pText.toLowerCase().includes(focusKeyword.toLowerCase().split(/\s+/)[0])) {
        hasSnippetCandidate = true;
        break;
      }
    }
  }

  items.push({
    id: "serp-featured-snippet",
    severity: hasSnippetCandidate ? "pass" : "warn",
    label: "Featured snippet candidate",
    message: hasSnippetCandidate
      ? "Concise definition paragraph found in first 5 paragraphs — eligible for Google Featured Snippet"
      : "No concise 30-70 word definition paragraph found in the introduction. Add one to target Google's Featured Snippet box.",
    level: 2,
    source: "google",
    value: hasSnippetCandidate ? 1 : 0,
    threshold: "30-70 word definition in first 300 words",
    guideline: "Google Featured Snippets typically extract 40-60 word definitions from the first section.",
  });

  // Check for a structured list (5-8 items) suitable for list snippet
  const listItems = html.match(/<li[^>]*>/gi) ?? [];
  const hasStructuredList = listItems.length >= 5 && listItems.length <= 15;
  items.push({
    id: "serp-list-snippet",
    severity: hasStructuredList ? "pass" : wordCount < 800 ? "pass" : "warn",
    label: "List snippet potential",
    message: hasStructuredList
      ? `${listItems.length} list items found — structured for Google list snippets`
      : "No structured list with 5+ items found. Consider adding a numbered/bulleted list for list snippet eligibility.",
    level: 3,
    source: "google",
    value: listItems.length,
    threshold: "5-15 items",
    guideline: "Google list snippets extract ordered/unordered lists with 5-8 items from well-structured content.",
  });

  return items;
}

/** Score title for click-through rate potential. */
function auditTitleCTR(title: string): AuditItem[] {
  const items: AuditItem[] = [];
  if (!title) return items;

  let ctrScore = 50; // Base score
  const reasons: string[] = [];

  // 1. Has a number (+10)
  if (/\d+/.test(title)) {
    ctrScore += 10;
    reasons.push("number present");
  }

  // 2. Power words (+10)
  const powerWords = ["guide", "tips", "how to", "best", "ultimate", "proven", "essential", "step-by-step", "complete", "top", "ways", "strategies", "mistakes", "secrets"];
  const titleLower = title.toLowerCase();
  const hasPowerWord = powerWords.some((w) => titleLower.includes(w));
  if (hasPowerWord) {
    ctrScore += 10;
    reasons.push("power word");
  }

  // 3. Emotion/sentiment word (+10)
  const emotionWords = ["amazing", "surprising", "warning", "avoid", "never", "always", "actually", "finally", "honest", "real", "truth"];
  const hasEmotion = emotionWords.some((w) => titleLower.includes(w));
  if (hasEmotion) {
    ctrScore += 10;
    reasons.push("emotion word");
  }

  // 4. Optimal length 50-60 chars (+10)
  if (title.length >= 45 && title.length <= 65) {
    ctrScore += 10;
    reasons.push("optimal length");
  }

  // 5. Keyword in first half (+10)
  // (Already checked in Rank Math audit, but contributes to CTR score)
  const firstHalf = title.slice(0, Math.ceil(title.length / 2));
  if (firstHalf.length >= 10) {
    ctrScore += 5;
    reasons.push("front-loaded");
  }

  // 6. Year present (+5)
  if (/20\d{2}/.test(title)) {
    ctrScore += 5;
    reasons.push("year present");
  }

  // Cap at 100
  ctrScore = Math.min(100, ctrScore);

  items.push({
    id: "serp-title-ctr",
    severity: ctrScore >= 70 ? "pass" : ctrScore >= 50 ? "warn" : "fail",
    label: `Title CTR score: ${ctrScore}/100`,
    message: ctrScore >= 70
      ? `Strong CTR potential (${reasons.join(", ")})`
      : `CTR score ${ctrScore}/100. Improve by adding: ${!hasPowerWord ? "power word, " : ""}${!/\d+/.test(title) ? "number, " : ""}${!hasEmotion ? "emotion word, " : ""}${title.length < 45 || title.length > 65 ? "optimize length (50-60 chars), " : ""}`.replace(/, $/, "."),
    level: 3,
    source: "google",
    value: ctrScore,
    threshold: "≥70",
    guideline: "Titles with numbers, power words, and emotion words see 20-37% higher CTR (Backlinko).",
  });

  return items;
}

/** Generate a table of contents from H2/H3 headings for articles > 2000 words. */
export function generateTableOfContents(html: string): { html: string; headings: { level: number; text: string; id: string }[] } | null {
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (wordCount < 2000) return null;

  const headings: { level: number; text: string; id: string }[] = [];
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 60);
    headings.push({
      level: parseInt(match[1], 10),
      text,
      id,
    });
  }

  if (headings.length < 3) return null;

  const tocItems = headings
    .map((h) => {
      const indent = h.level === 3 ? '  ' : '';
      return `${indent}<li><a href="#${h.id}">${h.text}</a></li>`;
    })
    .join("\n");

  const tocHtml = `<nav class="table-of-contents" aria-label="Table of Contents">\n<h2>Table of Contents</h2>\n<ol>\n${tocItems}\n</ol>\n</nav>`;

  return { html: tocHtml, headings };
}

// ---------------------------------------------------------------------------
// Helpful Content Audit — Google's self-assessment questions distilled into
// automated checks. Based on developers.google.com/search/docs/fundamentals/creating-helpful-content
// ---------------------------------------------------------------------------

function auditHelpfulContent(
  html: string,
  input: ArticleAuditInput,
  sourceUrls: string[] = [],
): AuditItem[] {
  const items: AuditItem[] = [];
  const plainText = stripHtml(html);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // 1. First-hand experience signals (failure narratives, time/cost references, sensory detail)
  const experiencePatterns = [
    /\b(?:I|we)\s+(?:found|discovered|noticed|learned|realized|saw|experienced|tested|tried|built|ran|measured)/gi,
    /\b(?:in my experience|from my experience|what I've seen|when I tested|after testing|we measured)/gi,
    /\b\d+\s*(?:months?|weeks?|years?|hours?|days?)\s+(?:ago|later|of|spent)/gi,
    /\$\d[\d,.]*(?:\s*(?:per|\/|a)\s*(?:month|year|hour|day))?/gi,
    /\b(?:mistake|lesson|failure|struggled|broke|crashed|regret|surprised|unexpected)/gi,
  ];
  let experienceSignals = 0;
  for (const p of experiencePatterns) {
    const matches = plainText.match(p);
    if (matches) experienceSignals += matches.length;
  }
  items.push({
    id: "helpful-experience",
    severity: experienceSignals >= 5 ? "pass" : experienceSignals >= 2 ? "warn" : "fail",
    label: "First-hand experience signals",
    message: experienceSignals >= 5
      ? `${experienceSignals} experience signals found (failure narratives, time/cost refs, personal observations)`
      : `Only ${experienceSignals} experience signal(s). Add practitioner anecdotes, specific time/cost data, or lessons learned.`,
    level: 1,
    source: "google",
    value: experienceSignals,
    threshold: "≥5",
    guideline: "Google E-E-A-T: first-hand experience is the strongest trust signal for Helpful Content.",
  });

  // 2. Comprehensive coverage — check heading count + word count as proxy for topic depth
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
  const headingCoverage = h2Count + h3Count;
  items.push({
    id: "helpful-coverage",
    severity: headingCoverage >= 8 && wordCount >= 1500 ? "pass" : headingCoverage >= 5 ? "warn" : "fail",
    label: "Comprehensive coverage",
    message: headingCoverage >= 8 && wordCount >= 1500
      ? `${headingCoverage} sections covering the topic thoroughly (${wordCount} words)`
      : `${headingCoverage} sections, ${wordCount} words. Ensure the topic is covered comprehensively so readers don't need to search again.`,
    level: 1,
    source: "google",
    value: headingCoverage,
    threshold: "≥8 sections",
    guideline: "Google: content should be substantially valuable so readers feel satisfied after reading.",
  });

  // 3. Non-clickbait title — flag exaggeration words without data backing
  const title = (input.title ?? "").toLowerCase();
  const clickbaitWords = ["shocking", "unbelievable", "mind-blowing", "you won't believe", "secret", "hack"];
  const clickbaitFound = clickbaitWords.filter((w) => title.includes(w));
  items.push({
    id: "helpful-non-clickbait",
    severity: clickbaitFound.length === 0 ? "pass" : "warn",
    label: "Non-clickbait title",
    message: clickbaitFound.length === 0
      ? "Title doesn't use exaggeration or clickbait language"
      : `Title contains clickbait language: ${clickbaitFound.join(", ")}. Google flags exaggerated titles that don't deliver.`,
    level: 2,
    source: "google",
    value: clickbaitFound.length,
    threshold: "0",
    guideline: "Google: avoid exaggerating or being shocking in title when content doesn't deliver.",
  });

  // 4. Factual accuracy — all quantitative claims should have citations
  const citationRegex = /<sup>\s*<a\s+[^>]*href=["'][^"']+["'][^>]*>\s*\[\d+\]\s*<\/a>\s*<\/sup>/gi;
  const citationCount = (html.match(citationRegex) || []).length;
  const quantClaimPatterns = [
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/g,
    /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?/g,
    /\b\d+(?:\.\d+)?x\b/g,
  ];
  let quantClaims = 0;
  for (const p of quantClaimPatterns) {
    const m = plainText.match(p);
    if (m) quantClaims += m.length;
  }
  const citationRatio = quantClaims > 0 ? citationCount / quantClaims : 1;
  items.push({
    id: "helpful-factual",
    severity: citationRatio >= 0.6 ? "pass" : citationRatio >= 0.3 ? "warn" : "fail",
    label: "Factual accuracy (citation coverage)",
    message: citationRatio >= 0.6
      ? `${citationCount} citations for ~${quantClaims} quantitative claims (${Math.round(citationRatio * 100)}% coverage)`
      : `Only ${citationCount} citations for ~${quantClaims} quantitative claims. Cite your data sources for trust.`,
    level: 1,
    source: "google",
    value: Math.round(citationRatio * 100),
    threshold: "≥60%",
    guideline: "Google E-E-A-T: clear sourcing and citation practices are a trust signal.",
  });

  // 5. Reader leaves satisfied — check for FAQ section (PAA questions addressed)
  const hasFaq = /<h2[^>]*>.*?(?:faq|frequently asked|common questions)/i.test(html);
  items.push({
    id: "helpful-faq",
    severity: hasFaq ? "pass" : "warn",
    label: "FAQ section for reader satisfaction",
    message: hasFaq
      ? "FAQ section present — addresses People Also Ask queries"
      : "No FAQ section detected. Adding FAQs helps readers find specific answers and targets Google's PAA box.",
    level: 2,
    source: "google",
    value: hasFaq ? 1 : 0,
    threshold: "present",
    guideline: "Google: content should leave readers feeling they've learned enough without needing to search again.",
  });

  // 6. Substantial unique value — check for unique frameworks, proprietary terminology, or original analysis markers
  //    Each pattern group is capped at 3 matches to prevent one repeated pattern from inflating the count.
  const uniqueValuePatternGroups: { patterns: RegExp[]; cap: number }[] = [
    // Frameworks & methodologies
    { patterns: [/\b(?:framework|model|methodology|approach|system|formula|strategy|playbook)\b/gi], cap: 3 },
    // Original data / research
    { patterns: [/\b(?:our data shows|our analysis|our research|our testing|we found that|our results|we measured|we tracked|we analyzed)\b/gi], cap: 3 },
    // Actionable guides
    { patterns: [/\b(?:step[- ]by[- ]step|how[- ]to|walkthrough|tutorial|checklist|action plan|roadmap)\b/gi], cap: 3 },
    // Comparisons & benchmarks
    { patterns: [/\b(?:compared to|versus|outperforms?|benchmark|scored \d+ out of|head[- ]to[- ]head|side[- ]by[- ]side)\b/gi], cap: 3 },
    // Cost / ROI / timeline specifics
    { patterns: [/\b(?:costs? approximately|takes? about|ROI of|saves? roughly|budget[- ]|pricing|pay[- ]back|break[- ]even)\b/gi], cap: 3 },
    // Tool evaluations & hands-on testing
    { patterns: [/\b(?:we tested|after testing|in our testing|hands[- ]on with|we evaluated|we ran|we configured|we deployed)\b/gi], cap: 3 },
    // Firsthand experience signals
    { patterns: [/\b(?:I've seen|we found|in my experience|what actually happens|in practice|the reality is|from experience)\b/gi], cap: 3 },
    // Scoring & rating
    { patterns: [/\b(?:we rate|scored|on a scale|graded|ranking|rated \d)\b/gi], cap: 2 },
  ];
  let uniqueMarkers = 0;
  for (const group of uniqueValuePatternGroups) {
    let groupCount = 0;
    for (const p of group.patterns) {
      const m = plainText.match(p);
      if (m) groupCount += m.length;
    }
    uniqueMarkers += Math.min(groupCount, group.cap);
  }
  items.push({
    id: "helpful-unique-value",
    severity: uniqueMarkers >= 4 ? "pass" : uniqueMarkers >= 2 ? "warn" : "fail",
    label: "Unique value / original analysis",
    message: uniqueMarkers >= 4
      ? `${uniqueMarkers} original analysis markers found (frameworks, proprietary data, step-by-step guides)`
      : `Only ${uniqueMarkers} unique value markers. Add original frameworks, proprietary data, or actionable guides.`,
    level: 2,
    source: "google",
    value: uniqueMarkers,
    threshold: "≥4",
    guideline: "Google: does the content provide substantial additional value compared to other pages in search results?",
  });

  // 7. Not keyword-stuffed — helpful content quality signal (readability focus, warn at 3%).
  //    Separate from the spam-policy "keyword-stuffing" check which fails/warns at 5%/2.5%.
  //    Uses exact phrase matching to avoid inflating density by counting partial word matches.
  const keyword = input.focusKeyword?.toLowerCase() ?? "";
  const words = plainText.toLowerCase().split(/\s+/).filter(Boolean);
  let kwDensity = 0;
  if (keyword) {
    const kwPhraseRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const kwPhraseMatches = plainText.toLowerCase().match(kwPhraseRegex) || [];
    const kwPhraseCount = kwPhraseMatches.length;
    const kwWordsInPhrase = keyword.split(/\s+/).length;
    kwDensity = words.length > 0 ? ((kwPhraseCount * kwWordsInPhrase) / words.length) * 100 : 0;
  }
  items.push({
    id: "helpful-not-stuffed",
    severity: kwDensity <= 3 ? "pass" : kwDensity <= 4 ? "warn" : "fail",
    label: "Not keyword-stuffed",
    message: kwDensity <= 3
      ? `Keyword density ${kwDensity.toFixed(1)}% — natural and reader-friendly`
      : `Keyword density ${kwDensity.toFixed(1)}% is too high. Reduce to ≤3% for natural reading.`,
    level: 2,
    source: "google",
    value: Math.round(kwDensity * 10) / 10,
    threshold: "≤3%",
    guideline: "Google: content created primarily for search engines rather than people will be demoted.",
  });

  // 8. Clear sourcing — citation count (already detailed in citationDensity audit, this is the helpful content check)
  items.push({
    id: "helpful-sourcing",
    severity: citationCount >= 8 ? "pass" : citationCount >= 4 ? "warn" : "fail",
    label: "Clear sourcing practices",
    message: citationCount >= 8
      ? `${citationCount} inline citations — strong sourcing`
      : citationCount >= 4
        ? `${citationCount} inline citations — acceptable, but aim for 8+ per 2000 words`
        : `Only ${citationCount} inline citations. Readers and search engines expect clear sourcing for trust.`,
    level: 2,
    source: "google",
    value: citationCount,
    threshold: "≥8 per 2000 words",
    guideline: "Google Quality Raters evaluate 'clear sourcing and citation practices' as a trust signal.",
  });

  // 9. Author attribution present (Level 3 — author byline is typically set at CMS publish time, not during content generation)
  items.push({
    id: "helpful-author",
    severity: input.authorName ? "pass" : "warn",
    label: "Author attribution",
    message: input.authorName
      ? `Author "${input.authorName}" attributed — enables E-E-A-T Person schema`
      : "No author name set. Author byline is typically added at CMS publish time. Adding author attribution strengthens E-E-A-T trust signals.",
    level: 3,
    source: "google",
    value: input.authorName ? 1 : 0,
    threshold: "present",
    guideline: "Google E-E-A-T: content should have clear author attribution with relevant expertise. Set in CMS when publishing.",
  });

  // 10. Direct answer in first 100 words (inverted pyramid)
  const first100Words = plainText.split(/\s+/).filter(Boolean).slice(0, 100).join(" ");
  const keywordLower = keyword.toLowerCase();
  const first100Lower = first100Words.toLowerCase();
  // Check full keyword phrase first, then fall back to checking all individual words
  const hasDirectAnswer = keyword
    ? first100Lower.includes(keywordLower) ||
      keywordLower.split(/\s+/).filter(Boolean).every((w) => first100Lower.includes(w))
    : true;
  items.push({
    id: "helpful-direct-answer",
    severity: hasDirectAnswer ? "pass" : "warn",
    label: "Direct answer in introduction",
    message: hasDirectAnswer
      ? "Primary keyword/topic addressed in the first 100 words"
      : "Primary keyword not found in first 100 words. Front-load the answer for featured snippets and reader satisfaction.",
    level: 2,
    source: "google",
    value: hasDirectAnswer ? 1 : 0,
    threshold: "present in first 100 words",
    guideline: "Google: content should demonstrate that it was written to help people, not to manipulate rankings.",
  });

  // 11. Readability + formatting — check for mixed content types (paragraphs, lists, headings)
  const hasParagraphs = /<p[^>]*>/i.test(html);
  const hasLists = /<(?:ul|ol)[^>]*>/i.test(html);
  const hasSubheadings = /<h3[^>]*>/i.test(html);
  const formatScore = [hasParagraphs, hasLists, hasSubheadings].filter(Boolean).length;
  items.push({
    id: "helpful-formatting",
    severity: formatScore >= 3 ? "pass" : formatScore >= 2 ? "warn" : "fail",
    label: "Content formatting quality",
    message: formatScore >= 3
      ? "Good mix of paragraphs, lists, and subheadings — scannable and readable"
      : "Content lacks formatting variety. Mix paragraphs, lists, and subheadings for scannability.",
    level: 3,
    source: "google",
    value: formatScore,
    threshold: "3 content types",
    guideline: "Google: content should be well-organized and easy to read — 79% of web users scan (NNGroup).",
  });

  // 12. Bookmark test — is the article long enough and substantial enough that a reader might bookmark it?
  const bookmarkWorthy = wordCount >= 1200 && headingCoverage >= 6 && experienceSignals >= 3;
  items.push({
    id: "helpful-bookmark-test",
    severity: bookmarkWorthy ? "pass" : "warn",
    label: "Bookmark-worthy (would you save this?)",
    message: bookmarkWorthy
      ? "Content passes the bookmark test — substantial, well-structured, and experience-backed"
      : "Content may not pass the bookmark test. Would a reader save this for future reference? Increase depth, experience signals, or structure.",
    level: 3,
    source: "google",
    value: bookmarkWorthy ? 1 : 0,
    threshold: "≥1200 words, ≥6 sections, ≥3 experience signals",
    guideline: "Google self-assessment: would you bookmark this or recommend it to a friend?",
  });

  return items;
}

/**
 * Run full article audit per Google Search Central priority stack.
 * Schema markup is auto-generated when title/meta/slug/keyword are available.
 *
 * Author byline and bio are NOT audited — they are added by the CMS at publish time.
 */
export function auditArticle(
  input: ArticleAuditInput,
  sourceUrls: string[] = [],
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
    // Level 1/2 — Editorial quality (typography + excessive symbols = L1 fail; generic phrases)
    ...auditAiTypography(plainContent),
    ...auditExcessiveSymbols(plainContent),
    ...auditAiPhrases(plainContent),
    // Level 3 — Rank Math 100/100 (competitive; Google priority)
    ...auditRankMathMetaKeyword(input.metaDescription, input.focusKeyword),
    ...auditRankMathFirst10Percent(plainContent, input.focusKeyword),
    ...auditRankMathSlugKeyword(input.slug, input.focusKeyword),
    ...auditRankMathSubheadingKeyword(input.content, input.focusKeyword),
    ...auditRankMathTitleKeywordPosition(input.title, input.focusKeyword),
    ...auditRankMathNumberInTitle(input.title),
    // Level 2/3 — Title number accuracy (anti-clickbait)
    ...auditTitleNumberAccuracy(input.title ?? "", input.content),
    // Level 3 — Differentiation (optional; from brief extra-value themes)
    ...(input.extraValueThemes?.length ? auditExtraValueCoverage(plainContent, input.extraValueThemes) : []),
    // Level 2 — Citation density and References section
    ...auditCitationDensity(input.content, sourceUrls),
    // Level 2/3 — Writing quality (anti-textbook, passive voice, variety, engagement hooks)
    ...auditWritingQuality(input.content),
    // Level 2 — Sentence length variety (anti-AI detection signal)
    ...auditSentenceVariety(input.content),
    // Level 2 — Inverted pyramid (answer-first at article, section, and paragraph levels)
    ...auditInvertedPyramid(input.content, input.focusKeyword),
    // Level 1-3 — Helpful Content (Google's self-assessment questions, 12 automated checks)
    ...auditHelpfulContent(input.content, input, sourceUrls),
    // Level 2/3 — SERP Intelligence (featured snippet, list snippet, title CTR)
    ...auditFeaturedSnippet(input.content, input.focusKeyword),
    ...auditTitleCTR(input.title ?? ""),
  ];

  const sorted = [...all].sort(byLevelThenSeverity);

  // Informational items excluded from score:
  // - AI phrase checks (editorial source, except ai-typography and excessive-symbols which are hard bans)
  const scoreable = all.filter(
    (i) => i.source !== "editorial" || i.id === "ai-typography" || i.id === "excessive-symbols"
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
        input.focusKeyword ?? "",
        input.authorName,
        input.authorUrl,
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
 * Audit rules for use in LLM prompts (generate meta). Ensures generated meta
 * satisfies Google Search Central + Rank Math checks.
 *
 * References:
 * - Google: developers.google.com/search/docs/appearance/title-link
 * - Rank Math: rankmath.com/kb/score-100-in-tests, rankmath.com/blog/power-words
 */
export function getAuditRulesForPrompt(): string {
  return `TITLE (Google + Rank Math):
• Max 60 chars (Google truncates ~50–60; put important words first)
• Primary keyword in FIRST 50% of title (Rank Math + Google)
• Include a number when natural (e.g. "7 Tips", "5 Ways") — Rank Math: numbers improve CTR
• One sentiment word: positive (amazing, proven, best, ultimate) OR negative (avoid, warning, mistake) — Rank Math: evokes emotion
• One power word: guide, tips, how to, discover, ultimate, proven, essential, step-by-step — Rank Math: compels clicks
• Descriptive, unique — avoid vague labels; match search intent
• NO: em-dash (—), curly quotes (" "), keyword stuffing, all-caps

META DESCRIPTION (Google + Rank Math):
• 70–160 chars (Google typically displays ~155–160)
• Primary keyword in first 120–160 chars (Rank Math 100/100)
• Pitch-style: concise summary that convinces users to click; match page content
• Soft CTA when natural: "Discover…", "Learn…", "Get…", "Find out…"
• Unique per page; avoid boilerplate or duplicate descriptions
• NO: misleading claims; generic filler; excessive punctuation

SLUG (Google + Rank Math):
• Max 75 chars; keep short for readability
• Lowercase, hyphens only; alphanumeric + hyphens
• Primary keyword present (core term or key phrase)
• Omit stop words: a, the, of, and, in, to, for, with`;
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

// =============================================================================
// Readability Scoring — Flesch-Kincaid & Gunning Fog
// =============================================================================

/** Count syllables in a word (approximate). */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  // Silent e
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

/** Split text into sentences (approximate). */
function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
}

/** Compute readability scores from plain text. */
export function auditReadability(plainText: string): {
  fleschKincaid: number;
  gunningFog: number;
  grade: string;
} {
  const words = plainText.split(/\s+/).filter(Boolean);
  const sentences = splitSentences(plainText);
  const totalWords = words.length;
  const totalSentences = sentences.length || 1;

  if (totalWords === 0) {
    return {
      fleschKincaid: 0,
      gunningFog: 0,
      grade: "Easy (Grade 6-8) — excellent for web",
    };
  }

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const complexWords = words.filter((w) => countSyllables(w) >= 3).length;

  // Flesch-Kincaid Grade Level
  const fk = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
  const fleschKincaid = Math.round(Math.max(0, fk) * 10) / 10;

  // Gunning Fog Index
  const fog = 0.4 * ((totalWords / totalSentences) + 100 * (complexWords / totalWords));
  const gunningFog = Math.round(Math.max(0, fog) * 10) / 10;

  // Grade assessment
  const avg = (fleschKincaid + gunningFog) / 2;
  let grade: string;
  if (avg <= 8) grade = "Easy (Grade 6-8) — excellent for web";
  else if (avg <= 10) grade = "Standard (Grade 8-10) — good for web";
  else if (avg <= 12) grade = "Moderate (Grade 10-12) — acceptable";
  else if (avg <= 14) grade = "Difficult (Grade 12-14) — academic";
  else grade = "Very Difficult (Grade 15+) — too complex for web";

  return { fleschKincaid, gunningFog, grade };
}

// =============================================================================
// Competitive Comparison Score
// =============================================================================

/** Compare generated article against competitors and score competitiveness. */
export function compareWithCompetitors(
  articleHtml: string,
  competitors: { url: string; content: string; wordCount: number }[],
  extractedTopics?: string[]
): { score: number; breakdown: { wordCount: number; topicCoverage: number; dataDensity: number; headingDepth: number } } {
  const articleText = stripHtml(articleHtml);
  const articleWords = articleText.split(/\s+/).filter(Boolean);
  const articleWC = articleWords.length;

  const successfulComps = competitors.filter(c => c.content.length > 0);
  if (successfulComps.length === 0) {
    return { score: 75, breakdown: { wordCount: 75, topicCoverage: 75, dataDensity: 75, headingDepth: 75 } };
  }

  const avgCompWC = successfulComps.reduce((sum, c) => sum + c.wordCount, 0) / successfulComps.length;

  // Word count score (0-100): 100 if >115% of average, scales down
  let wordCountScore: number;
  if (avgCompWC === 0) wordCountScore = 75;
  else {
    const ratio = articleWC / avgCompWC;
    if (ratio >= 1.15) wordCountScore = 100;
    else if (ratio >= 1.0) wordCountScore = 85;
    else if (ratio >= 0.85) wordCountScore = 70;
    else if (ratio >= 0.7) wordCountScore = 50;
    else wordCountScore = 30;
  }

  // Topic coverage score (0-100)
  let topicCoverageScore = 75; // default
  if (extractedTopics && extractedTopics.length > 0) {
    const articleLower = articleText.toLowerCase();
    const covered = extractedTopics.filter(t => articleLower.includes(t.toLowerCase())).length;
    topicCoverageScore = Math.round((covered / extractedTopics.length) * 100);
  }

  // Data density score (numbers per 1000 words)
  const articleNumbers = (articleText.match(/\d+[.,]?\d*/g) || []).length;
  const articleDensity = articleWC > 0 ? (articleNumbers / articleWC) * 1000 : 0;
  const compDensities = successfulComps.map(c => {
    const nums = (c.content.match(/\d+[.,]?\d*/g) || []).length;
    return c.wordCount > 0 ? (nums / c.wordCount) * 1000 : 0;
  });
  const avgCompDensity = compDensities.reduce((a, b) => a + b, 0) / compDensities.length;
  let dataDensityScore: number;
  if (avgCompDensity === 0) dataDensityScore = articleDensity > 0 ? 100 : 75;
  else {
    const ratio = articleDensity / avgCompDensity;
    if (ratio >= 1.2) dataDensityScore = 100;
    else if (ratio >= 0.8) dataDensityScore = 80;
    else if (ratio >= 0.5) dataDensityScore = 60;
    else dataDensityScore = 40;
  }

  // Heading depth score
  const articleHeadings = (articleHtml.match(/<h[23][^>]*>/gi) || []).length;
  const compHeadingsCounts = successfulComps.map((c) => {
    const htmlHeadings = (c.content.match(/<h[23][^>]*>/gi) || []).length;
    const markdownHeadings = (c.content.match(/^#{2,3}\s/gm) || []).length;
    return htmlHeadings + markdownHeadings;
  });
  const totalCompHeadings = compHeadingsCounts.reduce((a, b) => a + b, 0);
  const avgCompHeadings =
    compHeadingsCounts.length > 0 ? totalCompHeadings / compHeadingsCounts.length : 0;
  let headingDepthScore: number;
  if (avgCompHeadings === 0) headingDepthScore = articleHeadings > 0 ? 100 : 75;
  else {
    const ratio = articleHeadings / avgCompHeadings;
    if (ratio >= 1.0) headingDepthScore = 100;
    else if (ratio >= 0.8) headingDepthScore = 80;
    else if (ratio >= 0.6) headingDepthScore = 60;
    else headingDepthScore = 40;
  }

  const score = Math.round((wordCountScore + topicCoverageScore + dataDensityScore + headingDepthScore) / 4);

  return {
    score,
    breakdown: {
      wordCount: wordCountScore,
      topicCoverage: topicCoverageScore,
      dataDensity: dataDensityScore,
      headingDepth: headingDepthScore,
    },
  };
}

// =============================================================================
// EEAT & Credibility Scoring (v4 Knowledge Engine Upgrade)
// =============================================================================

export interface EEATScoreFeedback {
  totalScore: number;
  experienceScore: number;
  insightScore: number;
  credibilityScore: number;
  entityScore: number;
  readabilityScore: number;
  feedback: string[];
}

/**
 * Heuristically evaluates the E-E-A-T score of an article based on the v4 Knowledge Engine parameters.
 * Scoring Rubric (100 pts total):
 *  - Experience (25%): 1st person practitioner language, "failure narratives", field context.
 *  - Insight Originality (25%): Presence of newly generated algorithmic insight keywords.
 *  - Source Credibility (20%): Proper attribution phrases connecting to `currentData`.
 *  - Entity Signals (15%): Proper nouns, brands, and sources acting as nodes.
 *  - Readability (15%): Variance in sentence length, usage of lists, scanability.
 */
export function evaluateEEATScore(
  articleHtml: string,
  insights?: any[],
  currentDataFacts?: { source: string; fact: string }[]
): EEATScoreFeedback {
  const text = stripHtml(articleHtml).toLowerCase();
  const feedback: string[] = [];

  // 1. Experience (25 pts)
  const experienceMarkers = ["i've", "we've", "in my experience", "in our experience", "our data", "our testing", "personally", "i noticed", "we noticed", "hard way", "mistake i", "mistake we"];
  const expMatchCount = experienceMarkers.reduce((count, marker) => count + (text.split(marker).length - 1), 0);
  const experienceScore = Math.min(25, expMatchCount * 8);
  if (experienceScore < 15) feedback.push("Low Experience signals. Add more practitioner 1st-person narratives or real-world failure states.");

  // 2. Insight Originality (25 pts)
  let insightScore = 0;
  if (insights && insights.length > 0) {
    let matchedInsights = 0;
    insights.forEach(insight => {
      // Look for significant keywords from the insight headline
      const keywords = (insight.headline || "").toLowerCase().split(/\s+/).filter((w: string) => w.length > 5);
      const match = keywords.some((kw: string) => text.includes(kw));
      if (match) matchedInsights++;
    });
    insightScore = Math.min(25, Math.round((matchedInsights / insights.length) * 25));
    if (insightScore < 15) feedback.push("Low Insight Originality. The algorithmic contrarian/myth-busting insights are not strongly represented.");
  } else {
    // Graceful fallback if no insights provided
    insightScore = 20;
  }

  // 3. Source Credibility (20 pts)
  const credibilityMarkers = ["according to", "reported by", "data shows", "analysis by", "found that", "estimates", "study", "research"];
  const credMatchCount = credibilityMarkers.reduce((count, marker) => count + (text.split(marker).length - 1), 0);
  let credibilityScore = Math.min(20, credMatchCount * 5);

  // Bonus: Cross-reference with actual currentData sources
  if (currentDataFacts && currentDataFacts.length > 0) {
    const sourceMentions = currentDataFacts.filter(f => f.source && text.includes(f.source.toLowerCase())).length;
    credibilityScore = Math.min(20, credibilityScore + (sourceMentions * 5));
    if (sourceMentions === 0) feedback.push("Missing Source Credibility. You provided statistics but didn't name the underlying entities or reports.");
  } else if (credibilityScore < 10) {
    feedback.push("Low Source Credibility. Expand attribution (e.g., 'according to X').");
  }

  // 4. Entity Signals (15 pts)
  // Heuristic: Count capitalized words/acronyms (not sentence-initial common words) to estimate Named Entities
  const plainText = stripHtml(articleHtml);
  const allCapsAcronyms = plainText.match(/\b[A-Z]{2,}\b/g) || [];
  const capitalizedWords = plainText.match(/(?<=\s)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  const commonWords = new Set(["the", "a", "an", "this", "that", "these", "those", "it", "its", "but", "and", "or", "so", "if", "when", "while", "after", "before"]);
  const filteredEntities = [...capitalizedWords, ...allCapsAcronyms].filter(e => !commonWords.has(e.toLowerCase()));
  const uniqueEntities = new Set(filteredEntities.map(e => e.toLowerCase()));
  const entityScore = Math.min(15, uniqueEntities.size >= 15 ? 15 : uniqueEntities.size);
  if (entityScore < 10) feedback.push("Low Entity Signals. Ensure proper nouns, tools, and brands are explicitly named rather than using pronouns.");

  // 5. Readability (15 pts)
  let readabilityScore = 15;
  const listsCount = (articleHtml.match(/<ul|<ol/gi) || []).length;
  if (listsCount === 0) {
    readabilityScore -= 8;
    feedback.push("Poor Readability. Zero lists detected. Data should be scannable.");
  }
  const longParagraphs = getParagraphs(articleHtml).filter(p => wordCount(p) > 100);
  if (longParagraphs.length > 3) {
    readabilityScore -= 5;
    feedback.push("Poor Readability. Too many dense paragraphs. Break them up into 1-3-1 structures.");
  }

  const totalScore = experienceScore + insightScore + credibilityScore + entityScore + Math.max(0, readabilityScore);

  return {
    totalScore,
    experienceScore,
    insightScore,
    credibilityScore,
    entityScore,
    readabilityScore,
    feedback
  };
}
