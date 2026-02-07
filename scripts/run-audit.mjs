/**
 * One-off run: audit pasted article (Google Search Central + Rank Math).
 * Usage: node scripts/run-audit.mjs
 * Reads article.json from project root: { title?, metaDescription?, content, slug?, focusKeyword?, author?, authorBioUrl? }
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

// Keep in sync with src/lib/seo/article-audit.ts AI_PHRASES (and generator prompts in src/lib/claude/client.ts).
const AI_PHRASES = [
  "delve", "delve into", "landscape", "realm", "crucial", "comprehensive", "it's important to note",
  "it's important to note that", "in conclusion", "in today's world", "in today's digital landscape",
  "game-changer", "leverage", "utilize", "plethora", "myriad", "robust", "seamless", "holistic",
  "dive deep", "navigate", "unlock", "harness", "revolutionary", "cutting-edge",
  "in this article we'll", "let's explore", "when it comes to", "certainly,", "indeed,",
  "furthermore,", "moreover,", "it's worth noting", "in terms of",   "ultimately,", "essentially,", "basically,", "—", " em-dash ",
  "a solid ", "this guide covers", "practical steps", "helps you reach", "aligns your",
  "builds trust over time", "round out", "when it fits", "where it sounds natural",
  "ensure your", "ensure that", "consider a ", "supports the decision", "worth optimizing for",
  "unlike traditional", "combined with", "over time, this builds", "match content to intent",
  "focus on ", "start with ",
];

const AI_PHRASE_SUGGESTIONS = {
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

const AI_TYPOGRAPHY = [
  { char: "\u2014", label: "em-dash (—)" },
  { char: "\u2013", label: "en-dash (–)" },
  { char: "\u201C", label: "curly left double quote (\")" },
  { char: "\u201D", label: "curly right double quote (\")" },
  { char: "\u2018", label: "curly left single quote (')" },
  { char: "\u2019", label: "curly apostrophe/quote (')" },
];

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function countAiPhrases(text) {
  const lower = text.toLowerCase();
  const found = [];
  for (const phrase of AI_PHRASES) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const count = (lower.match(regex) || []).length;
    if (count > 0) found.push({ phrase, count });
  }
  return found;
}

const articlePath = join(root, "article.json");
const raw = readFileSync(articlePath, "utf8");
const article = JSON.parse(raw);

const plainContent = stripHtml(article.content);
const wc = wordCount(plainContent);
const aiFound = countAiPhrases(plainContent);

const results = [];

// Author (L1)
if (!article.author?.trim()) {
  results.push({ icon: "⚠", label: "Author byline", msg: "Add author before publishing. E-E-A-T requires verifiable identity.", level: 1 });
} else {
  results.push({ icon: "✓", label: "Author byline", msg: `Author "${article.author}" present.`, level: 1 });
}
if (article.author?.trim() && !article.authorBioUrl?.trim()) {
  results.push({ icon: "⚠", label: "Author bio", msg: "Link byline to author bio page with credentials.", level: 1 });
}

// Title (L1)
if (!article.title?.trim()) {
  results.push({ icon: "✗", label: "Title", msg: "Title is required.", level: 1 });
} else {
  const len = article.title.length;
  if (len > SEO.TITLE_MAX_CHARS) results.push({ icon: "✗", label: "Title length", msg: `${len} chars; may truncate.`, level: 1 });
  else if (len > 55) results.push({ icon: "⚠", label: "Title length", msg: `${len} chars.`, level: 1 });
  else results.push({ icon: "✓", label: "Title length", msg: `${len} chars.`, level: 1 });
  if (article.focusKeyword?.trim() && !article.title.toLowerCase().includes(article.focusKeyword.toLowerCase())) {
    results.push({ icon: "⚠", label: "Title keyword", msg: `Target keyword "${article.focusKeyword}" not in title.`, level: 1 });
  }
}

// Meta (L1)
if (!article.metaDescription?.trim()) {
  results.push({ icon: "✗", label: "Meta description", msg: "Missing. Use as a compelling pitch.", level: 1 });
} else {
  const len = article.metaDescription.length;
  if (len > SEO.META_DESCRIPTION_MAX_CHARS) results.push({ icon: "✗", label: "Meta description", msg: `${len} chars; truncates.`, level: 1 });
  else if (len < 70) results.push({ icon: "⚠", label: "Meta description", msg: `${len} chars; use more of 160.`, level: 1 });
  else results.push({ icon: "✓", label: "Meta description", msg: `${len} chars.`, level: 1 });
}

// Content thinness (L1)
if (wc < 300) results.push({ icon: "✗", label: "Content depth", msg: `${wc} words; very thin.`, level: 1 });
else results.push({ icon: "✓", label: "Content depth", msg: `${wc} words.`, level: 1 });

// AI phrases (L1) – include suggested replacements when available
if (aiFound.length > 0) {
  const total = aiFound.reduce((s, f) => s + f.count, 0);
  const maxShow = 10;
  const shown = aiFound.slice(0, maxShow);
  const parts = shown.map((f) => {
    const key = f.phrase.trim().toLowerCase();
    const suggestion = AI_PHRASE_SUGGESTIONS[key];
    const countStr = `"${f.phrase.trim()}" (${f.count})`;
    return suggestion ? `${countStr} → ${suggestion}` : countStr;
  });
  const tail = aiFound.length > maxShow ? `; +${aiFound.length - maxShow} more` : "";
  results.push({ icon: total > 3 ? "✗" : "⚠", label: "AI-sounding language", msg: `Consider replacing: ${parts.join("; ")}${tail}.`, level: 1 });
} else {
  results.push({ icon: "✓", label: "AI-sounding language", msg: "No flagged phrases.", level: 1 });
}

// AI typography (L1/L2) - target under 30% AI detection
const typoFound = [];
for (const { char, label } of AI_TYPOGRAPHY) {
  const count = (plainContent.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (count > 0) typoFound.push({ label, count });
}
if (typoFound.length > 0) {
  const total = typoFound.reduce((s, f) => s + f.count, 0);
  const examples = typoFound.map((f) => `${f.label} (${f.count})`).join("; ");
  results.push({ icon: total >= 2 ? "✗" : "⚠", label: "AI typography (banned)", msg: `Replace: ${examples}. Use straight quotes and commas/colons.`, level: total >= 2 ? 1 : 2 });
} else {
  results.push({ icon: "✓", label: "AI typography (banned)", msg: "No em-dash or curly quotes.", level: 2 });
}

// Keyword stuffing (L1)
if (article.focusKeyword?.trim() && wc >= 100) {
  const phraseRegex = new RegExp(article.focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  const phraseCount = (plainContent.match(phraseRegex) || []).length;
  const kwWords = article.focusKeyword.split(/\s+/).filter(Boolean).length;
  const ratio = (phraseCount * kwWords) / wc;
  if (ratio > 0.05) results.push({ icon: "✗", label: "Keyword stuffing", msg: `"${article.focusKeyword}" repeated ${phraseCount}x.`, level: 1 });
  else if (ratio > 0.025) results.push({ icon: "⚠", label: "Keyword repetition", msg: `${phraseCount} times; ensure natural use.`, level: 1 });
  else results.push({ icon: "✓", label: "Keyword use", msg: `Natural (${phraseCount}x).`, level: 1 });
}

// Paragraph length (L2)
const paragraphs = getParagraphs(article.content);
const longParas = paragraphs.filter((p) => wordCount(p) > SEO.PARAGRAPH_MAX_WORDS);
if (longParas.length > 0) {
  const maxW = Math.max(...longParas.map((p) => wordCount(p)));
  results.push({ icon: "⚠", label: "Paragraph length", msg: `${longParas.length} paragraph(s) exceed ${SEO.PARAGRAPH_MAX_WORDS} words (max ${maxW}).`, level: 2 });
} else if (paragraphs.length > 0) {
  results.push({ icon: "✓", label: "Paragraph length", msg: `Paragraphs within ${SEO.PARAGRAPH_MAX_WORDS} words.`, level: 2 });
}

// Headings (L1)
if (!/<h[2-6]/.test(article.content)) {
  results.push({ icon: "⚠", label: "Headings", msg: "No H2–H6. Add structure.", level: 1 });
}
if (/<h1[\s>]/.test(article.content)) {
  results.push({ icon: "⚠", label: "H1 in body", msg: "Remove H1 from body; title is H1.", level: 1 });
}

// Images and links skipped; added in WordPress

// Rank Math (L3); when focusKeyword provided
if (article.focusKeyword?.trim()) {
  const kw = article.focusKeyword.toLowerCase();
  if (article.metaDescription && !article.metaDescription.toLowerCase().includes(kw)) {
    results.push({ icon: "⚠", label: "Rank Math: Keyword in meta", msg: "Primary keyword not in meta.", level: 3 });
  } else if (article.metaDescription) results.push({ icon: "✓", label: "Rank Math: Keyword in meta", msg: "OK.", level: 3 });
  const first10 = Math.max(300, Math.floor(wc * 0.1));
  const first10Text = plainContent.split(/\s+/).slice(0, first10).join(" ").toLowerCase();
  if (!first10Text.includes(kw)) results.push({ icon: "⚠", label: "Rank Math: Keyword in intro", msg: "Not in first 10%.", level: 3 });
  else results.push({ icon: "✓", label: "Rank Math: Keyword in intro", msg: "OK.", level: 3 });
  if (article.slug) {
    const kwWords = kw.split(" ").filter(Boolean);
    const slugNorm = article.slug.toLowerCase().replace(/-/g, " ");
    const hasKeyword = kwWords.some((w) => slugNorm.includes(w));
    if (!hasKeyword) {
      results.push({ icon: "⚠", label: "Rank Math: Keyword in URL", msg: "Primary keyword not in slug.", level: 3 });
    } else {
      results.push({ icon: "✓", label: "Rank Math: Keyword in URL", msg: "OK.", level: 3 });
    }
  }
}
if (wc >= 2500) results.push({ icon: "✓", label: "Rank Math: Content length", msg: `${wc} words (100%).`, level: 3 });
else if (wc >= 1500) results.push({ icon: "⚠", label: "Rank Math: Content length", msg: `${wc} words (2500+ for 100%).`, level: 3 });
if (article.title && !/\d/.test(article.title)) results.push({ icon: "⚠", label: "Rank Math: Number in title", msg: "Numbers often improve CTR.", level: 3 });
else if (article.title) results.push({ icon: "✓", label: "Rank Math: Number in title", msg: "OK.", level: 3 });

const pass = results.filter((r) => r.icon === "✓").length;
const total = results.length;
const score = total > 0 ? Math.round((pass / total) * 100) : 0;
const level1Fails = results.filter((r) => r.level === 1 && r.icon !== "✓").length;
const publishable = score >= MIN_PUBLISH_SCORE && level1Fails === 0;

const lines = [
  "--- Article audit (Google Search Central + Rank Math) ---",
  `Score: ${score}% (${pass} pass, ${total - pass} issues)`,
  publishable ? "Publishable: Yes" : `Publishable: No (min ${MIN_PUBLISH_SCORE}% required)`,
  "",
  ...results.map((r) => `[${r.icon}] ${r.label}: ${r.msg}`),
  "",
  "---",
];

console.log(lines.join("\n"));
