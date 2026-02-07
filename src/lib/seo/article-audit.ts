/**
 * Blog article audit against Google Search Central (developers.google.com/search/docs)
 * with Rank Math 100/100 alignment (rankmath.com/kb/score-100-in-tests).
 *
 * PRIORITY: Google Search Central first. Rank Math checks are Level 3 (competitive)
 * and only applied when they align with Google's people-first approach.
 *
 * Core principle: "If Google Search didn't exist, would you still publish this article
 * because it genuinely helps your specific audience?" If no — no amount of technical
 * SEO will save it.
 *
 * Audit priority: Level 1 (blockers) → Level 2 (ranking killers) → Level 3 (competitive).
 * Articles below 75% score should NOT be published — weak content damages the entire site.
 */

import { SEO } from "@/lib/constants";

/** Minimum audit score to publish. Below this = actively hurts site-wide rankings. */
export const MIN_PUBLISH_SCORE = 75;

export type AuditSeverity = "pass" | "warn" | "fail";

export type AuditLevel = 1 | 2 | 3;
// 1 = Publication blocker (any fail = cannot publish)
// 2 = Ranking killer (fix before expecting traffic)
// 3 = Competitive advantage (differentiators)

export type AuditSource = "google" | "rankmath";

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
  /** Author byline — required for E-E-A-T; verifiable identity is non-negotiable per Google */
  author?: string;
  /** URL to author bio page — recommended; credentials should be visible there */
  authorBioUrl?: string;
  /** When true (e.g. publishing to WordPress), byline and bio are added by the CMS — audit passes these checks */
  authorHandledByCms?: boolean;
};

export type ArticleAuditResult = {
  items: AuditItem[];
  score: number;
  summary: { pass: number; warn: number; fail: number };
  /** True when score >= MIN_PUBLISH_SCORE and no Level 1 failures */
  publishable: boolean;
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

/** AI typography: em-dash, curly/smart quotes. Banned for AI detection (target under 30%). */
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
        label: "AI typography (banned)",
        message: `Replace: ${examples}. Use straight quotes (" ') and commas/colons instead of em-dash.`,
        value: total,
        guideline: "Target under 30% AI detection. Em-dash and curly quotes trigger detectors.",
      },
    ];
  }
  return [
    {
      id: "ai-typography",
      severity: "pass",
      level: 2,
      label: "AI typography (banned)",
      message: "No em-dash or curly quotes detected.",
    },
  ];
}

// AI-sounding phrases. Keep in sync with scripts/run-audit.mjs and generator BANNED list in src/lib/claude/client.ts.
const AI_PHRASES = [
  "delve", "delve into", "landscape", "realm", "crucial", "comprehensive", "it's important to note",
  "it's important to note that", "in conclusion", "in today's world", "in today's digital landscape",
  "game-changer", "leverage", "utilize", "plethora", "myriad", "robust", "seamless", "holistic",
  "dive deep", "navigate", "unlock", "harness", "revolutionary", "cutting-edge",
  "in this article we'll", "let's explore", "when it comes to", "certainly,", "indeed,",
  "furthermore,", "moreover,", "it's worth noting", "in terms of", "ultimately,", "essentially,", "basically,",
  " em-dash ", // em-dash character "—" is only in AI_TYPOGRAPHY to avoid double-counting with auditAiTypography
  "a solid ", "this guide covers", "practical steps", "helps you reach", "aligns your",
  "builds trust over time", "round out", "when it fits", "where it sounds natural",
  "ensure your", "ensure that", "consider a ", "supports the decision", "worth optimizing for",
  "unlike traditional", "combined with", "over time, this builds", "match content to intent",
  "focus on ", "start with ",
];

/** Suggested replacements for high-impact phrases (Scaled Content Abuse). Used to make the audit alert actionable. */
const AI_PHRASE_SUGGESTIONS: Record<string, string> = {
  crucial: "key, needed, or be specific",
  comprehensive: "full, complete, or describe what's covered",
  "game-changer": "concrete claim or cut",
  utilize: "use",
  "ensure your": "make sure",
  "ensure that": "make sure",
  leverage: "use or take advantage of",
  delve: "look at or explore",
  "delve into": "look at or explore",
  myriad: "many or list examples",
  plethora: "many or list examples",
  holistic: "full or whole",
  "in conclusion": "cut or end with a concrete takeaway",
  "it's important to note": "here's what matters or keep in mind",
  "it's important to note that": "here's what matters or keep in mind",
  "in today's digital landscape": "cut or use specific context",
  "in today's world": "cut or use specific context",
  revolutionary: "concrete claim or cut",
  "cutting-edge": "concrete claim or cut",
  "combined with": "plus or along with",
  "unlike traditional": "say the contrast in plain language",
};

function countAiPhrases(text: string): { phrase: string; count: number }[] {
  const lower = text.toLowerCase();
  const found: { phrase: string; count: number }[] = [];
  for (const phrase of AI_PHRASES) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (lower.match(regex) || []).length;
    if (count > 0) found.push({ phrase: phrase.trim(), count });
  }
  return found;
}

// --- Level 1: Publication Blockers ---

function auditAuthorByline(input: ArticleAuditInput): AuditItem[] {
  const items: AuditItem[] = [];
  if (input.authorHandledByCms) {
    items.push({
      id: "author-byline",
      severity: "pass",
      level: 1,
      label: "Author byline",
      message: "Author will be added by WordPress (or CMS) when published.",
    });
    return items;
  }
  const authorProvided = "author" in input;
  const hasAuthor = (input.author?.trim() ?? "").length > 0;
  if (!hasAuthor) {
    // Fail only when author was explicitly provided as empty; otherwise warn (add at publish)
    const severity = authorProvided ? "fail" : "warn";
    items.push({
      id: "author-byline",
      severity,
      level: 1,
      label: "Author byline",
      message: authorProvided
        ? "Author byline is required. Google: Who created it? No byline = cannot publish."
        : "Add author byline before publishing. E-E-A-T requires verifiable author identity.",
      guideline: "E-E-A-T: verifiable author identity is non-negotiable for blog articles.",
    });
  } else {
    items.push({
      id: "author-byline",
      severity: "pass",
      level: 1,
      label: "Author byline",
      message: `Author "${input.author}" present.`,
    });
  }
  return items;
}

function auditAuthorBio(input: ArticleAuditInput): AuditItem[] {
  const items: AuditItem[] = [];
  if (input.authorHandledByCms) {
    items.push({
      id: "author-bio",
      severity: "pass",
      level: 1,
      label: "Author bio page",
      message: "Author and bio are handled by WordPress (or CMS) when published.",
    });
    return items;
  }
  if (!input.author?.trim()) return items; // Skip if no author
  const hasBioUrl = (input.authorBioUrl?.trim() ?? "").length > 0;
  if (!hasBioUrl) {
    items.push({
      id: "author-bio",
      severity: "warn",
      level: 1,
      label: "Author bio page",
      message: "Byline should link to an author bio page with credentials relevant to the topic.",
      guideline: "Google: Who created it + credentials. For YMYL (health, etc.), bio is essential.",
    });
  } else {
    items.push({
      id: "author-bio",
      severity: "pass",
      level: 1,
      label: "Author bio page",
      message: "Author bio URL provided.",
    });
  }
  return items;
}

function auditTitle(input: ArticleAuditInput): AuditItem[] {
  const items: AuditItem[] = [];
  const title = input.title?.trim() ?? "";
  const len = title.length;

  if (len === 0) {
    items.push({
      id: "title-required",
      severity: "fail",
      level: 1,
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
        label: "Title keyword",
        message: `Target keyword "${input.focusKeyword}" not in title. Use words people search for.`,
        guideline: "Google: put search terms in prominent positions (beginning of title).",
      });
    } else {
      items.push({
        id: "title-keyword",
        severity: "pass",
        level: 2,
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
      label: "Content depth",
      message: `Content is very short (${wc} words). Thin content hurts site-wide rankings.`,
      value: wc,
      guideline: "Helpful Content: satisfy intent completely. One bad article drags down the whole site.",
    });
  } else {
    items.push({
      id: "content-thin",
      severity: "pass",
      level: 1,
      label: "Content depth",
      message: `Content is ${wc} words.`,
      value: wc,
    });
  }
  return items;
}

function auditAiPhrases(plainText: string): AuditItem[] {
  const items: AuditItem[] = [];
  const found = countAiPhrases(plainText);
  if (found.length > 0) {
    const total = found.reduce((s, f) => s + f.count, 0);
    const maxShow = 10;
    const shown = found.slice(0, maxShow);
    const parts = shown.map((f) => {
      const suggestion = AI_PHRASE_SUGGESTIONS[f.phrase.toLowerCase()];
      const countStr = `"${f.phrase}" (${f.count})`;
      return suggestion ? `${countStr} → ${suggestion}` : countStr;
    });
    const tail = found.length > maxShow ? `; +${found.length - maxShow} more` : "";
    items.push({
      id: "ai-phrases",
      severity: total > 3 ? "fail" : "warn",
      level: total > 3 ? 1 : 2,
      label: "AI-sounding language",
      message: `Consider replacing: ${parts.join("; ")}${tail}.`,
      value: total,
      guideline: "Scaled Content Abuse: generic AI language without expert input = risk. Write like a human expert.",
    });
  } else {
    items.push({
      id: "ai-phrases",
      severity: "pass",
      level: 2,
      label: "AI-sounding language",
      message: "No flagged AI phrases detected.",
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
      label: "Keyword repetition",
      message: `"${focusKeyword}" appears ${phraseCount} times. Ensure natural, organic use.`,
      value: phraseCount,
    });
  } else {
    items.push({
      id: "keyword-stuffing",
      severity: "pass",
      level: 2,
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
      label: "Heading hierarchy",
      message: "Headings skip levels. Use sequential H2 → H3 → H4.",
      guideline: "Google: logical structure; accessibility.",
    });
  } else {
    items.push({
      id: "headings-hierarchy",
      severity: "pass",
      level: 2,
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
  const first10WordCount = Math.max(300, Math.floor(wc * 0.1));
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
  } else if (wc >= SEO.CONTENT_MIN_WORDS_GENERAL) {
    // 1500+ words: pass (lower weight). Google: quality over quantity; don't pad for 2500.
    items.push({
      id: "rm-content-length",
      severity: "pass",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Content length",
      message: `${wc} words. 2500+ = Rank Math 100%. Google: quality over quantity—no need to pad.`,
      value: wc,
      threshold: SEO.CONTENT_MIN_WORDS_PILLAR,
      guideline: "Rank Math prefers 2500+ for 100%. Only add length if it serves the reader.",
    });
  } else if (wc >= 600) {
    items.push({
      id: "rm-content-length",
      severity: "warn",
      level: 3,
      source: "rankmath",
      label: "Rank Math: Content length",
      message: `${wc} words. Rank Math: 2500+ for 100%. Google: satisfy intent fully.`,
      value: wc,
      threshold: SEO.CONTENT_MIN_WORDS_PILLAR,
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
  // Google before Rank Math when same level
  const sourceOrder: Record<AuditSource, number> = { google: 0, rankmath: 1 };
  const sa = a.source ?? "google";
  const sb = b.source ?? "google";
  if (sa !== sb) return sourceOrder[sa] - sourceOrder[sb];
  const severityOrder = { fail: 0, warn: 1, pass: 2 };
  return severityOrder[a.severity] - severityOrder[b.severity];
}

/**
 * Run full article audit per Google Search Central priority stack.
 */
export function auditArticle(input: ArticleAuditInput): ArticleAuditResult {
  const plainContent = stripHtml(input.content);

  const all: AuditItem[] = [
    // Level 1 — Publication Blockers (Google)
    ...auditAuthorByline(input),
    ...auditAuthorBio(input),
    ...auditTitle(input),
    ...auditMetaDescription(input.metaDescription),
    ...auditContentThinness(plainContent),
    ...auditAiPhrases(plainContent),
    ...auditAiTypography(plainContent),
    ...auditKeywordStuffing(plainContent, input.focusKeyword),
    ...auditHeadingStructure(input.content),
    // Level 2 — Ranking Killers (Google) — images/links skipped (added in WordPress)
    ...auditParagraphLength(input.content),
    ...auditSlug(input.slug),
    // Level 3 — Rank Math 100/100 (competitive; Google priority)
    ...auditRankMathMetaKeyword(input.metaDescription, input.focusKeyword),
    ...auditRankMathFirst10Percent(plainContent, input.focusKeyword),
    ...auditRankMathSlugKeyword(input.slug, input.focusKeyword),
    ...auditRankMathSubheadingKeyword(input.content, input.focusKeyword),
    ...auditRankMathContentLength(plainContent),
    ...auditRankMathTitleKeywordPosition(input.title, input.focusKeyword),
    ...auditRankMathNumberInTitle(input.title),
  ];

  const sorted = [...all].sort(byLevelThenSeverity);

  const pass = all.filter((i) => i.severity === "pass").length;
  const warn = all.filter((i) => i.severity === "warn").length;
  const fail = all.filter((i) => i.severity === "fail").length;
  const total = all.length;
  const score = total > 0 ? Math.round((pass / total) * 100) : 0;

  const level1Fails = all.filter((i) => i.level === 1 && i.severity === "fail").length;
  const publishable = score >= MIN_PUBLISH_SCORE && level1Fails === 0;

  return {
    items: sorted,
    score,
    summary: { pass, warn, fail },
    publishable,
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
    const src = item.source === "rankmath" ? " [Rank Math]" : "";
    lines.push(`[${icon}] ${lvl}${item.label}${src}: ${item.message}`);
    if (item.value !== undefined) lines.push(`    value: ${item.value}${item.threshold !== undefined ? ` (threshold: ${item.threshold})` : ""}`);
    if (item.guideline) lines.push(`    guideline: ${item.guideline}`);
  }
  lines.push("---");
  return lines.join("\n");
}
