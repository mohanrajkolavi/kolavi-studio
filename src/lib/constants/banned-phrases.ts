/**
 * Overused/generic phrases — single source of truth for editorial quality checks.
 *
 * These are words/phrases that weaken writing quality when overused.
 * They tend to be generic, vague, or formulaic — the opposite of the specific,
 * concrete, practitioner-level writing that Google Search Central values.
 *
 * Used by:
 *   1. SEO Audit (`article-audit.ts`) — flags them as editorial quality warnings
 *   2. Claude writer prompt (`claude/client.ts`) — encourages the model to use specific language
 *   3. E-E-A-T Python audit (`content_audit/`) — scored under "lazy phrasing"
 *
 * Split into two tiers:
 *   HIGH — Strong generic markers that weaken content quality. Weighted in audit.
 *   COMMON — Can appear in normal writing but cluster badly when overused.
 */

/** Strong generic markers — overused phrases that weaken writing quality. */
export const AI_PHRASES_HIGH: readonly string[] = [
  "delve",
  "delve into",
  "landscape",
  "realm",
  "plethora",
  "myriad",
  "holistic",
  "game-changer",
  "revolutionary",
  "cutting-edge",
  "seamless",
  "robust",
  "in today's world",
  "in today's digital landscape",
  "it's important to note",
  "it's important to note that",
  "it's worth noting",
  "in conclusion",
  "dive deep",
  "harness",
  "unlock",
  "in this article we'll",
  "let's explore",
  "unlike traditional",
  "over time, this builds",
  "a testament to",
  "plays a crucial role",
  "facilitate",
  "foster",
  "empower",
  "elevate",
  "streamline",
  "pivotal",
  "paramount",
  "endeavor",
] as const;

/** Common phrases that weaken quality when clustered. Individually fine; flagged in quantity. */
export const AI_PHRASES_COMMON: readonly string[] = [
  "crucial",
  "comprehensive",
  "leverage",
  "utilize",
  "navigate",
  "when it comes to",
  "certainly,",
  "indeed,",
  "furthermore,",
  "moreover,",
  "in terms of",
  "ultimately,",
  "essentially,",
  "basically,",
  "a solid ",
  "this guide covers",
  "practical steps",
  "helps you reach",
  "aligns your",
  "builds trust over time",
  "round out",
  "when it fits",
  "where it sounds natural",
  "ensure your",
  "ensure that",
  "consider a ",
  "supports the decision",
  "worth optimizing for",
  "combined with",
  "match content to intent",
  "focus on ",
  "start with ",
] as const;

/** Suggested replacements for generic phrases. Makes editorial alerts actionable. */
export const AI_PHRASE_SUGGESTIONS: Readonly<Record<string, string>> = {
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
  facilitate: "help or enable",
  foster: "build or encourage",
  empower: "enable or help",
  elevate: "raise or improve",
  streamline: "simplify or speed up",
  pivotal: "key or critical",
  paramount: "most important or top priority",
  endeavor: "effort or project",
  "a testament to": "shows or proves",
  "plays a crucial role": "matters or is key",
};

/**
 * Generate a comma-separated list for LLM prompts.
 * Combines high and selected common generic phrases to encourage specific language.
 */
export function getBannedPhrasesForPrompt(): string {
  // Include all high-confidence phrases and key common ones for the writer prompt
  const combined = [
    ...AI_PHRASES_HIGH,
    // Common phrases most likely to appear in AI output
    "leverage", "utilize", "comprehensive", "crucial",
    "when it comes to", "furthermore,", "moreover,",
  ];
  // Deduplicate
  return [...new Set(combined)].map((p) => `"${p}"`).join(", ");
}
