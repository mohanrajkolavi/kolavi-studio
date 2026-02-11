/**
 * One-off run: audit pasted article (Google Search Central + Rank Math).
 * Usage: node scripts/run-audit.mjs
 * Reads article.json from project root: { title?, metaDescription?, content, slug?, focusKeyword? }
 *
 * AI/editorial phrasing and typography are handled by the E-E-A-T panel (lazy phrasing, sentence starts) in the app.
 * Note: Author byline and bio are handled by the CMS at publish time and are not audited here.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const SEO = {
  TITLE_MAX_CHARS: 60,
  META_DESCRIPTION_MAX_CHARS: 160,
  URL_SLUG_MAX_CHARS: 75,
  PARAGRAPH_MAX_WORDS: 120,
};

function getParagraphs(html) {
  const fragment = html.replace(/<p[^>]*>/gi, "\n<p>").replace(/<\/p>/gi, "</p>\n");
  const raw = fragment.split(/\n/).filter((s) => s.trim().length > 0);
  return raw.map((s) => stripHtml(s)).filter((s) => s.length > 0);
}

const MIN_PUBLISH_SCORE = 75;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

// --- Load article ---

const articlePath = join(root, "article.json");
const raw = readFileSync(articlePath, "utf8");
const article = JSON.parse(raw);

const plainContent = stripHtml(article.content);
const wc = wordCount(plainContent);

const results = [];

// --- Level 1: Publication Blockers (Google) ---

// Title
if (!article.title?.trim()) {
  results.push({ icon: "✗", label: "Title", msg: "Title is required.", level: 1, source: "google" });
} else {
  const len = article.title.length;
  if (len > SEO.TITLE_MAX_CHARS) results.push({ icon: "✗", label: "Title length", msg: `${len} chars; may truncate.`, level: 1, source: "google" });
  else if (len > 55) results.push({ icon: "⚠", label: "Title length", msg: `${len} chars.`, level: 2, source: "google" });
  else results.push({ icon: "✓", label: "Title length", msg: `${len} chars.`, level: 2, source: "google" });
  if (article.focusKeyword?.trim() && !article.title.toLowerCase().includes(article.focusKeyword.toLowerCase())) {
    results.push({ icon: "⚠", label: "Title keyword", msg: `Target keyword "${article.focusKeyword}" not in title.`, level: 2, source: "google" });
  }
}

// Meta description
if (!article.metaDescription?.trim()) {
  results.push({ icon: "✗", label: "Meta description", msg: "Missing. Use as a compelling pitch.", level: 1, source: "google" });
} else {
  const len = article.metaDescription.length;
  if (len > SEO.META_DESCRIPTION_MAX_CHARS) results.push({ icon: "✗", label: "Meta description", msg: `${len} chars; truncates.`, level: 1, source: "google" });
  else if (len < 70) results.push({ icon: "⚠", label: "Meta description", msg: `${len} chars; use more of 160.`, level: 2, source: "google" });
  else results.push({ icon: "✓", label: "Meta description", msg: `${len} chars.`, level: 2, source: "google" });
}

// Content thinness
if (wc < 300) results.push({ icon: "✗", label: "Content depth", msg: `${wc} words; very thin.`, level: 1, source: "google" });
else results.push({ icon: "✓", label: "Content depth", msg: `${wc} words.`, level: 1, source: "google" });

// Keyword stuffing
if (article.focusKeyword?.trim() && wc >= 100) {
  const phraseRegex = new RegExp(article.focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const phraseCount = (plainContent.match(phraseRegex) || []).length;
  const kwWords = article.focusKeyword.split(/\s+/).filter(Boolean).length;
  const ratio = (phraseCount * kwWords) / wc;
  if (ratio > 0.05) results.push({ icon: "✗", label: "Keyword stuffing", msg: `"${article.focusKeyword}" repeated ${phraseCount}x.`, level: 1, source: "google" });
  else if (ratio > 0.025) results.push({ icon: "⚠", label: "Keyword repetition", msg: `${phraseCount} times; ensure natural use.`, level: 2, source: "google" });
  else results.push({ icon: "✓", label: "Keyword use", msg: `Natural (${phraseCount}x).`, level: 2, source: "google" });
}

// Headings
if (!/<h[2-6]/.test(article.content)) {
  results.push({ icon: "⚠", label: "Headings", msg: "No H2–H6. Add structure.", level: 1, source: "google" });
}
if (/<h1[\s>]/.test(article.content)) {
  results.push({ icon: "⚠", label: "H1 in body", msg: "Remove H1 from body; title is H1.", level: 2, source: "google" });
}

// --- Level 2: Ranking Killers (Google) ---
// Images and links skipped — added in WordPress.

// Paragraph length
const paragraphs = getParagraphs(article.content);
const longParas = paragraphs.filter((p) => wordCount(p) > SEO.PARAGRAPH_MAX_WORDS);
if (longParas.length > 0) {
  const maxW = Math.max(...longParas.map((p) => wordCount(p)));
  results.push({ icon: "⚠", label: "Paragraph length", msg: `${longParas.length} paragraph(s) exceed ${SEO.PARAGRAPH_MAX_WORDS} words (max ${maxW}).`, level: 2, source: "google" });
} else if (paragraphs.length > 0) {
  results.push({ icon: "✓", label: "Paragraph length", msg: `Paragraphs within ${SEO.PARAGRAPH_MAX_WORDS} words.`, level: 2, source: "google" });
}

// --- Level 3: Rank Math 100/100 (competitive) ---

if (article.focusKeyword?.trim()) {
  const kw = article.focusKeyword.toLowerCase();
  if (article.metaDescription && !article.metaDescription.toLowerCase().includes(kw)) {
    results.push({ icon: "⚠", label: "Rank Math: Keyword in meta", msg: "Primary keyword not in meta.", level: 3, source: "rankmath" });
  } else if (article.metaDescription) {
    results.push({ icon: "✓", label: "Rank Math: Keyword in meta", msg: "OK.", level: 3, source: "rankmath" });
  }
  const first10 = Math.max(300, Math.floor(wc * 0.1));
  const first10Text = plainContent.split(/\s+/).slice(0, first10).join(" ").toLowerCase();
  if (!first10Text.includes(kw)) results.push({ icon: "⚠", label: "Rank Math: Keyword in intro", msg: "Not in first 10%.", level: 3, source: "rankmath" });
  else results.push({ icon: "✓", label: "Rank Math: Keyword in intro", msg: "OK.", level: 3, source: "rankmath" });
  if (article.slug) {
    const kwWords = kw.split(" ").filter(Boolean);
    const slugNorm = article.slug.toLowerCase().replace(/-/g, " ");
    const hasKeyword = kwWords.some((w) => slugNorm.includes(w));
    if (!hasKeyword) results.push({ icon: "⚠", label: "Rank Math: Keyword in URL", msg: "Primary keyword not in slug.", level: 3, source: "rankmath" });
    else results.push({ icon: "✓", label: "Rank Math: Keyword in URL", msg: "OK.", level: 3, source: "rankmath" });
  }
}
if (article.title && !/\d/.test(article.title)) results.push({ icon: "⚠", label: "Rank Math: Number in title", msg: "Numbers often improve CTR.", level: 3, source: "rankmath" });
else if (article.title) results.push({ icon: "✓", label: "Rank Math: Number in title", msg: "OK.", level: 3, source: "rankmath" });

// --- Score & Output ---

const pass = results.filter((r) => r.icon === "✓").length;
const warn = results.filter((r) => r.icon === "⚠").length;
const fail = results.filter((r) => r.icon === "✗").length;
const total = results.length;
const score = total > 0 ? Math.round((pass / total) * 100) : 0;
const level1Fails = results.filter((r) => r.level === 1 && r.icon !== "✓").length;
const publishable = score >= MIN_PUBLISH_SCORE && level1Fails === 0;

// Sort: L1 first, then L2, then L3; within each level: google → rankmath → editorial
const sourceOrder = { google: 0, rankmath: 1, editorial: 2 };
const sevOrder = { "✗": 0, "⚠": 1, "✓": 2 };
results.sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  if ((a.source || "google") !== (b.source || "google")) return (sourceOrder[a.source || "google"] || 0) - (sourceOrder[b.source || "google"] || 0);
  return (sevOrder[a.icon] || 0) - (sevOrder[b.icon] || 0);
});

const lines = [
  "--- Article audit (Google Search Central + Rank Math + Editorial) ---",
  `Score: ${score}% (${pass} pass, ${warn} warn, ${fail} fail)`,
  publishable ? "Publishable: Yes" : `Publishable: No (min ${MIN_PUBLISH_SCORE}% required)`,
  "",
  ...results.map((r) => {
    const src = r.source === "editorial" ? " [Editorial]" : r.source === "rankmath" ? " [Rank Math]" : "";
    const lvl = `[L${r.level}]`;
    // Skip [Editorial] suffix if label already contains it
    const labelHasSource = r.label.includes("[Editorial]") || r.label.includes("[Rank Math]");
    return `[${r.icon}] ${lvl} ${r.label}${labelHasSource ? "" : src}: ${r.msg}`;
  }),
  "",
  "---",
];

console.log(lines.join("\n"));