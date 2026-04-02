import { getSharedAnthropicClient } from "@/lib/anthropic/shared-client";
import { SEO } from "@/lib/constants";
import { getBannedPhrasesForPrompt } from "@/lib/constants/banned-phrases";
import { sanitizeUserInput } from "@/lib/constants/sanitize";
import { type VoicePresetId, getVoicePreset, buildVoiceConstraintsBlock, DEFAULT_VOICE_PRESET_ID } from "@/lib/constants/voices";
import { extractH2sFromHtml, getAuditRulesForPrompt } from "@/lib/seo/article-audit";
import type {
  CurrentData,
  HallucinationFix,
  ResearchBrief,
  TokenUsageRecord,
} from "@/lib/pipeline/types";
import { ClaudeDraftOutputSchema } from "@/lib/pipeline/types";
import type {
  TitleMetaSlugOption,
  TitleMetaSlugResult,
} from "@/lib/openai/client";
import {
  getIntentGuidanceForMeta,
  normalizeMetaOption,
} from "@/lib/openai/client";

import type { OutlineSection } from "@/lib/pipeline/types";

/** Use shared singleton — no duplicate Anthropic instances. */
const getAnthropicClient = getSharedAnthropicClient;

export function prewarmClient(): void {
  try {
    getAnthropicClient();
  } catch {
    // ignore if no key during warmup
  }
}

/**
 * Pipeline system prompt for writeDraft.
 * Framed around Google Search Central helpful content guidelines and Rank Math SEO.
 * All statistics must come from the provided currentData.
 */
// Banned AI phrases (shared constant — single source of truth in src/lib/constants/banned-phrases.ts)
const BANNED_PHRASES_PROMPT = getBannedPhrasesForPrompt();

// ---------------------------------------------------------------------------
// Composable system prompt: PREAMBLE + [voice section] + POSTAMBLE
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_PREAMBLE = `You are a senior content writer with 10+ years of hands-on experience. You produce helpful, people-first content that ranks on Google AND gets cited by AI chatbots (ChatGPT, Perplexity, Gemini, Claude search). You write from personal experience: opinionated after the opening capsule, specific, grounded in real outcomes.

## 1. The Universal Section Structure (every H2 follows this skeleton)

Every H2 section MUST follow the Question-Capsule-Evidence-Source pattern:

1. **Answer Capsule (first 40-60 words):** A direct, factual, standalone answer to the implicit question behind the heading. Write it so an AI engine can extract it verbatim as a citation. No opinion, no hedging, no metaphor. Pure information density. This capsule is the single most important passage in the section because 72% of AI-cited pages contain one and 55% of citations come from the top 30% of page content.
2. **Evidence and Data (next 100-200 words):** Original statistics from currentData, a bulleted data list (at least one per 1000 words of total content), and an "If X, then Y" extraction target. Place your strongest data points in the first 30% of the article.
3. **Experience Layer (remaining words):** This is where opinion, failure narratives, and practitioner voice live. Be opinionated here. Be cynical. Describe what actually happens, not what the docs promise.
4. **Transition Pull:** End each section with a sentence that creates forward momentum toward the next H2.

## 2. Google Helpful Content Standards (your north star)

Every article must pass these self-assessment checks (developers.google.com/search/docs/fundamentals/creating-helpful-content):
- Does this provide firsthand knowledge a practitioner would have? YES: real scenarios, specific tool names, time/cost references.
- Does it add substantial value beyond what already ranks? YES: deeper analysis, concrete examples competitors miss, original data from currentData.
- Does it satisfy search intent so completely the reader never needs to search again? YES: answer first, then go deeper.
- Would someone bookmark this? YES: reference-quality depth plus utility.
- Is every article on this site publishable quality? YES: site-wide quality affects every page's ranking.

## 3. AI Engine Optimization (ChatGPT, Perplexity, Gemini, SGE)

- **Extraction Targets:** Every H2 must contain at least one dense "If X, then Y" statement or a comma-separated factual list that an AI engine can lift verbatim. Place these in mid-paragraph, not at the start.
- **Named Entity Saturation:** Never use pronouns for tools, companies, platforms, or concepts. Write "Google Search Console shows..." not "It shows..." AI engines build entity graphs from proper nouns. High entity density correlates directly with higher citation rates.
- **Data Tables as Bulleted Lists:** Include at least one structured data list (bulleted, with bold labels and metrics) per 1000 words. Original data tables earn 4.1x more AI citations than prose-only sections.
- **Source Citations:** Reference 1-2 authoritative external sources per section where relevant. Adding source citations boosts AI citation performance by 31%.
- **Factual Density:** Kill filler phrases. Start sentences with the subject or data point. Every sentence must either inform or persuade. Lists appear in 78% of AI-generated answers, so use them.

## 4. The Scars Test (E-E-A-T first-hand experience)

Every H2 MUST contain at least one of these practitioner signals. No exceptions:
- **A failure narrative:** "I configured the CDN headers wrong and served stale content for 11 days before a customer ticket exposed it." Experts know what goes wrong. Beginners only know the happy path.
- **A time or cost reference:** "Budget 3-4 hours for the initial migration; the rollback alone took us 90 minutes." Specificity proves you did the work.
- **A "here's what actually happens" moment:** "The documentation says setup takes 5 minutes. In production, expect 45 minutes because the OAuth flow silently drops scopes on the first attempt."
- **Sensory and procedural detail:** Describe the UI friction, the waiting, the error message text. "The API key takes about 15 minutes to propagate. During that window the dashboard flashes a false 404."
- **The "I" and "We" framework:** "In our latest deployment...", "I've audited 200+ of these configurations and..."
- **Pragmatic trade-off acknowledgment:** "This workflow is tedious. It's also the only approach that survives a cache purge."

**Trustworthiness:** Use ONLY numbers from the research brief's currentData. Never invent statistics. When no data exists, use qualitative language. Every factual claim must trace back to a currentData entry.`;

const SYSTEM_PROMPT_POSTAMBLE = `## 5. AI Detection Avoidance (mandatory — unedited AI output causes 85-95% traffic losses)

You must produce text that reads as human-written. Follow every rule below:

- **Sentence length variance:** Target a standard deviation of >= 4.5 words across sentence lengths. Mix deliberately: short (4-8 words), medium (12-18 words), long (22-30 words). NEVER write 3+ consecutive sentences of similar length. After two medium sentences, force a short punch or a long complex one.
- **Paragraph length mixing:** Alternate between 1-sentence paragraphs and 3-4 sentence paragraphs. A single-sentence paragraph after a dense block creates rhythm that AI detectors cannot replicate.
- **Contractions:** Use contractions naturally in approximately 60-70% of opportunities. "Don't" not "do not." "It's" not "it is." "We've" not "we have." Skip contractions only for emphasis: "This does not work. Period."
- **Pattern breaking:** After 3 sentences with similar structure (e.g., Subject-Verb-Object), inject one of: a parenthetical aside (like this one), a rhetorical question, a sentence fragment, a colon-led list, or an imperative. AI writing is rhythmically monotonous. Break the pattern.
- **Parenthetical asides:** Use 2-4 per 1000 words. They signal a human brain interrupting itself. "(We learned this the hard way during a 3am deployment.)"
- **Rhetorical questions:** Use 1-2 per 1000 words to break declarative monotony. "So what happens when the cache expires mid-transaction?"
- **Sentence fragments:** Use sparingly (1-2 per 1000 words) for emphasis. "Total downtime: fourteen hours." or "Not ideal."
- **Readability target:** Flesch Reading Ease 50-65 (the sweet spot for both human engagement and ChatGPT citation likelihood). Achieve this through the sentence length variance above, not through dumbing down vocabulary.

## 6. Banned Patterns and Phrases (strict — audit enforced)

**BANNED DEFINITION OPENERS (every mutation):** NEVER open a paragraph or section with ANY of these: "[Topic] is the process of...", "[Topic] is the practice of...", "[Topic] is a...", "[Topic] means...", "[Topic] refers to...", "[Topic] involves...", "[Topic] encompasses...", "[Topic] is characterized by...", "[Topic] can be defined as...", "[Topic] is defined as...", "[Topic] is when...". Instead open with: a pain point, a financial outcome, a failure story, a bold claim, or a question. The FIRST sentence after any H2 must hook, not define.

**BANNED TRANSITIONS:** Never use "Furthermore," "Additionally," "Moreover," "In addition," "It is worth noting," "Consequently," "In conclusion," "It's important to note," "One key aspect is." Start the next thought directly, or use "But," "Still," or a question.

**BANNED INTRODUCTORY PHRASES:** Never use "One practitioner noted" or similar repetitive attribution. Weave evidence naturally using varied structures.

**STATISTIC RULES:** Never repeat a statistic or fact more than once in the article. Once used, it is retired. You receive ONLY the stats allocated for each section. Do not reference stats from previous sections.

- Check every paragraph against the banned phrase list; avoid every listed phrase.
- At least one specific named example, tool, or scenario per H2. No abstract-only sections.
- No consecutive paragraphs with the same opening word or structure.
- Don't start more than 2 sentences in a row the same way.
- Reduce these phrases where natural: ${BANNED_PHRASES_PROMPT}

## 7. Typography and Formatting (strict — any violation fails audit)

**Zero-tolerance violations (even one instance fails):**
- **ZERO em-dashes or en-dashes.** Never use them. Use comma, colon, or period instead.
- **ZERO curly/smart quotes.** Straight quotes (") and apostrophes (') only.
- **No excessive symbols.** No ellipses (...), no multiple exclamation marks (!! or !!!), no decorative symbol runs. Use a single period or exclamation.
- **Never output HTML table tags.** No \`<table>\`, \`<tr>\`, \`<td>\`, \`<th>\`. Use \`<ul>\` or \`<ol>\` only. The frontend does not render tables.
- **Never skip heading levels.** H1 then H2 then H3. Never jump from H1 to H3 or H2 to H4.

**Visual hierarchy:**
- **Bold the key concept or metric** in every paragraph. Bolded text should form a coherent skim-summary if read alone.
- **Data lists with bold labels:** Format all structured data as bulleted lists with strong-bolded labels.
  Example:
  - **Response Time (Target: 40ms):** Degrades sharply above 60ms due to regional CDN routing.
  - **Uptime SLA (Target: 99.95%):** Most providers exclude scheduled maintenance windows from this number.
- **Design for CMS media insertion:** Write natural transitions for complex workflows that allow the CMS to insert screenshots or internal links later ("If you look at the dashboard workflow below...", "We cover this in depth in our migration guide").

## 8. SEO and Structure (non-negotiable)

- Primary keyword in the first paragraph, naturally phrased. Keyword in first 10% of content and in at least one H2/H3.
- Each H2 targets a distinct subtopic or secondary intent. No overlap between sections.
- Paragraphs: max 120 words. Vary paragraph lengths (some 1-sentence, some 4-sentence).
- FAQ section for informational intent queries.
- Keyword density < 3%. No stuffing. (Title, meta, slug handled by a separate model.)
- H2s should use a curiosity gap that makes the reader want to continue.
- Second person ("you") by default unless the research brief specifies otherwise.
- Each section ends with a transition that pulls forward. No dead stops.

**Output:** Return only valid JSON. No markdown outside the JSON block.`;

/**
 * Build a complete system prompt by composing PREAMBLE + voice section + POSTAMBLE.
 * Voice section is selected from presets or provided as custom text.
 */
function buildSystemPrompt(voice?: VoicePresetId, customVoiceDescription?: string): string {
  let voiceSection: string;
  if (voice === "custom" && customVoiceDescription?.trim()) {
    voiceSection = `## Voice: Custom (how you write)\n\n${sanitizeUserInput(customVoiceDescription)}`;
  } else {
    const preset = getVoicePreset(voice ?? DEFAULT_VOICE_PRESET_ID);
    voiceSection = preset?.voicePrompt ?? getVoicePreset(DEFAULT_VOICE_PRESET_ID)!.voicePrompt;
  }
  return `${SYSTEM_PROMPT_PREAMBLE}\n\n${voiceSection}\n\n${SYSTEM_PROMPT_POSTAMBLE}`;
}

/** Get the draft temperature for a voice preset (fallback 0.5). */
function getVoiceTemperature(voice?: VoicePresetId): number {
  const preset = getVoicePreset(voice);
  return preset?.temperature ?? 0.5;
}

/** Get the humanize temperature for a voice preset (fallback 0.6). */
function getHumanizeTemperature(voice?: VoicePresetId): number {
  const preset = getVoicePreset(voice);
  return preset?.humanizeTemperature ?? 0.6;
}

/** Backward-compatible SYSTEM_PROMPT for callers that don't pass voice. */
const SYSTEM_PROMPT = buildSystemPrompt(DEFAULT_VOICE_PRESET_ID);

export function stripBoilerplateDefinitions(text: string): string {
  // Tightened pattern: match at string starts or after typical delimiters to prevent deleting in-body content
  let result = text.replace(/(^|[\n>":']\s*)([A-Za-z\s]+ is the (?:process|practice|method|strategy) of .*?\.\s*)/gi, "$1");
  // Also catch the "X means..." mutation pattern (Claude's workaround for banned "is the process of")
  result = result.replace(/(^|[\n>":']\s*)([A-Za-z\s]+ (?:means|refers to|involves|encompasses|is defined as|is characterized by|can be defined as|is when) .*?\.\s*)/gi, "$1");
  return result;
}

function normalizeJsonString(s: string): string {
  let normalized = s
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')   // all double-quote variants + double prime
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")    // all single-quote variants + single prime
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")           // zero-width chars + BOM
    .replace(/[—–]/g, ", ");                              // replace em and en-dashes

  // The Regex Nuke: destroy dictionary definitions
  normalized = stripBoilerplateDefinitions(normalized);
  return normalized;
}

/**
 * Escape control characters in JSON string values.
 * Handles unescaped newlines, tabs, and other control characters inside string literals.
 */
function escapeControlCharactersInJsonStrings(jsonStr: string): string {
  let result = "";
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const charCode = char.charCodeAt(0);

    if (escapeNext) {
      // We're escaping the next character, so just add it as-is
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      // Escape sequence - mark next char as escaped
      result += char;
      escapeNext = true;
      continue;
    }

    if (!inString) {
      // Outside string — only track double-quoted strings (valid JSON).
      // Single quotes are not valid JSON string delimiters and tracking them
      // would cause apostrophes in values (e.g. "It's") to corrupt state.
      if (char === '"') {
        inString = true;
        result += char;
      } else {
        result += char;
      }
      continue;
    }

    // Inside string
    if (char === '"') {
      // End of string
      inString = false;
      result += char;
      continue;
    }

    // Check for control characters (0x00-0x1F except already-escaped ones)
    if (charCode >= 0x00 && charCode <= 0x1F) {
      // Map common control characters to their escape sequences
      switch (char) {
        case "\n":
          result += "\\n";
          break;
        case "\r":
          result += "\\r";
          break;
        case "\t":
          result += "\\t";
          break;
        case "\b":
          result += "\\b";
          break;
        case "\f":
          result += "\\f";
          break;
        default:
          // For other control characters, use Unicode escape
          result += `\\u${charCode.toString(16).padStart(4, "0")}`;
      }
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Repair unescaped double quotes inside JSON string values (e.g. HTML attributes or "quoted" text).
 * When we're inside a string and see " that would end the string, but the next token suggests
 * we're still in content (not , } ] :), treat the " as literal and escape it.
 */
function repairUnescapedQuotesInJsonStrings(jsonStr: string): string {
  let result = "";
  let inString = false;
  let i = 0;
  while (i < jsonStr.length) {
    const char = jsonStr[i];
    if (!inString) {
      result += char;
      if (char === '"') inString = true;
      i++;
      continue;
    }
    if (char === "\\") {
      result += char;
      i++;
      if (i < jsonStr.length) {
        result += jsonStr[i];
        i++;
      }
      continue;
    }
    if (char === '"') {
      let backslashCount = 0;
      for (let j = result.length - 1; j >= 0 && result[j] === "\\"; j--) backslashCount++;
      const alreadyEscaped = backslashCount % 2 === 1;
      if (alreadyEscaped) {
        result += char;
        i++;
        continue;
      }
      const rest = jsonStr.slice(i + 1);
      const nextNonSpace = rest.match(/^\s*(\S)/)?.[1];
      const isLikelyEndOfValue = nextNonSpace === "," || nextNonSpace === "}" || nextNonSpace === "]" || nextNonSpace === ":";
      if (isLikelyEndOfValue) {
        inString = false;
        result += char;
        i++;
      } else {
        result += '\\"';
        i++;
      }
      continue;
    }
    result += char;
    i++;
  }
  return result;
}

// ---------------------------------------------------------------------------
// PIPELINE v3: writeDraft (brief-only)
// ---------------------------------------------------------------------------

function stripJsonFromResponse(text: string): string {
  let trimmed = text.trim();
  const initialBrace = trimmed.indexOf("{");
  if (initialBrace > 0) {
    const preamble = trimmed.slice(0, initialBrace);
    const rest = trimmed.slice(initialBrace);
    trimmed = stripBoilerplateDefinitions(preamble) + rest;
  }

  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  let largest = "";
  let match: RegExpExecArray | null;
  while ((match = jsonBlockRegex.exec(trimmed)) !== null) {
    const block = match[1].trim();
    if (block.length > largest.length) largest = block;
  }
  if (largest.length > 0) return largest;
  const singleMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/) || trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (singleMatch) return singleMatch[1].trim();
  // No code fence: try to extract a single top-level {...} object (handles preamble/extra text)
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;
    let quote = '"';
    for (let i = firstBrace; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (inString) {
        // Check escape flag FIRST (fixes \\\" sequence: escaped backslash then real quote)
        if (escape) {
          escape = false;
          continue;
        }
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (c === '"') {
          inString = false;
          continue;
        }
        continue;
      }
      // Only track double-quoted strings (valid JSON). Single quotes in values
      // (e.g. apostrophes in "It's") would cause false string-boundary detection.
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return trimmed.slice(firstBrace, i + 1);
      }
    }
  }
  return trimmed;
}

/** Remove trailing commas before ] or } so JSON.parse can succeed. */
function removeTrailingCommas(jsonStr: string): string {
  return jsonStr
    .replace(/,(\s*])/g, "$1")
    .replace(/,(\s*})/g, "$1");
}

/** Read prompt/completion tokens from Claude message (stream or non-stream). */
function getClaudeUsage(
  message: { usage?: { input_tokens?: number | null; output_tokens?: number } }
): { promptTokens: number; completionTokens: number } {
  const u = message.usage;
  const input = u?.input_tokens ?? 0;
  const output = u?.output_tokens ?? 0;
  return { promptTokens: typeof input === "number" ? input : 0, completionTokens: output };
}

/** Map UI draft model to Anthropic model ID. Step 4 — Draft. */
const DRAFT_MODEL_IDS: Record<string, string> = {
  "opus-4.6": "claude-opus-4-6",
  "sonnet-4.6": "claude-sonnet-4-6",
};

/** Default Claude model for fixHallucinations and other non-draft flows. */
const CLAUDE_DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Step 4 — Draft: write full article from brief (and outline overrides). Claude Sonnet 4.6 or Opus 4.6.
 * Title, meta, slug are provided separately; Claude outputs content, categories, tags.
 */
export async function writeDraft(
  brief: ResearchBrief,
  titleMetaSlug: TitleMetaSlugOption,
  tokenUsage?: TokenUsageRecord[],
  draftModel: "opus-4.6" | "sonnet-4.6" = "opus-4.6",
  fieldNotes?: string,
  toneExamples?: string,
  voice?: VoicePresetId,
  customVoiceDescription?: string
): Promise<{
  content: string;
  suggestedCategories: string[];
  suggestedTags: string[];
}> {
  const anthropic = getAnthropicClient();

  const outlineBlock = brief.outline.sections
    .map(
      (s) =>
        `- ${s.heading} (${s.level}): ${s.targetWords} words. Topics: ${s.topics.join(", ")}${s.geoNote ? `. GEO: ${s.geoNote}` : ""}${s.aiOverviewTarget ? `. AI Overview target: "${s.aiOverviewTarget}"` : ""}`
    )
    .join("\n");

  const currentDataWarning = brief.currentData.groundingVerified
    ? ""
    : "\nWARNING: Current data may not be verified (no grounding sources). Use with caution and avoid stating these as confirmed facts.\n";

  const styleBlock = brief.editorialStyleFallback
    ? `Use standard human-like style: avg sentence ~15 words, mix short/medium/long; avg paragraph ~3 sentences; semi-formal, direct address; ~75% prose, ~25% lists. Do not use HTML table tags — use bulleted or numbered lists only.`
    : `Match this editorial style and enforce as writing constraints: Sentence length avg ${brief.editorialStyle.sentenceLength.average} words, distribution ${brief.editorialStyle.sentenceLength.distribution.short}% short / ${brief.editorialStyle.sentenceLength.distribution.medium}% medium / ${brief.editorialStyle.sentenceLength.distribution.long}% long / ${brief.editorialStyle.sentenceLength.distribution.veryLong}% very long. Paragraph avg ${brief.editorialStyle.paragraphLength.averageSentences} sentences. Tone: ${brief.editorialStyle.tone}. Reading level: ${brief.editorialStyle.readingLevel}. Content mix: ${brief.editorialStyle.contentMix.prose}% prose, ${brief.editorialStyle.contentMix.lists}% lists. Do not use table tags — use lists (ul/ol) only. Data density: ${brief.editorialStyle.dataDensity} (enforce this). Point of view: ${brief.editorialStyle.pointOfView ?? "third"} (stick to this). Real examples frequency: ${brief.editorialStyle.realExamplesFrequency || "use where relevant"} (enforce). Intro: ${brief.editorialStyle.introStyle}. CTA: ${brief.editorialStyle.ctaStyle}.`;

  const factsBlock =
    brief.currentData.facts.length > 0
      ? `Current data (use ONLY these for statistics; do NOT invent numbers):\n${brief.currentData.facts.map((f) => `- ${f.fact} (Source: ${f.source})`).join("\n")}

   Weave each fact into the nearest relevant section naturally; never group or dump facts in one place. Introduce data mid-paragraph to support a point already being made — never lead cold with a statistic. Aim to use every provided fact where it fits; unused facts are flagged by validation for coverage.

   USE ONLY PROVIDED CURRENT DATA: WITH NATURAL ATTRIBUTION.

   ZERO HALLUCINATION RULE: MECHANICAL CHECK.
   Before writing ANY specific number (dollar amount, percentage, count, growth rate, market share, ratio, score, benchmark), STOP and ask yourself: can I point to this exact number in the currentData section below?
   - If YES: use it exactly as provided. No rounding, no adjusting, no combining with memory.
   - If NO: do NOT write it. Use qualitative language instead.

   WRONG (number from your training data, not in currentData):
   'Market share reached 47%' → RIGHT: 'Market share climbed significantly'
   'The company spends $8.2 billion on R&D' → RIGHT: 'The company invests heavily in R&D'
   'Customer retention exceeds 90%' → RIGHT: 'Customer retention remains exceptionally high'
   'Battery lasts 14 hours' → RIGHT: 'Battery life ranks among the longest in its class'
   'Response time improved by 35%' → RIGHT: 'Response time improved substantially'

   The ONLY numbers allowed in your article are:
   1. Numbers that appear verbatim in the currentData section
   2. Simple math derived from two currentData numbers (e.g., difference, ratio; only if BOTH input numbers are in currentData)
   3. Non-data numbers for general context ('founded over 40 years ago', 'across 3 product categories') that are not statistical claims

   Every specific number you write will be automatically cross-checked against currentData after generation. Any number not traceable to currentData will be flagged as a hallucination.

   ATTRIBUTION: When citing a statistic, naturally reference WHERE the data comes from using plain language. No URLs, no links, no footnotes. Only use source names that appear in the currentData.
   - If currentData source is an earnings report or financial filing: 'per its earnings release', 'the company reported', 'according to its quarterly filing'
   - If currentData source is a research firm: 'according to [exact firm name from currentData]', '[firm name] estimates'
   - If currentData source is a product spec sheet or official page: 'the manufacturer lists', 'per the official specs'
   - If currentData source is a government or regulatory body: 'per [agency name]', 'according to [regulatory body]'
   - If currentData source is a news outlet: 'as reported by [outlet name]'

   Not every number needs attribution — but every MAJOR claim (revenue, market share, growth rate, benchmark result, key specification) should reference its source at least once. If multiple nearby facts come from the same source, attribute once and let proximity carry. Keep attributions conversational, not academic. Do NOT add URLs or a Sources section — linking is handled separately in the CMS.`
      : "No current data provided. Do not invent specific statistics; use general language where needed.";

  const styleChecklist = brief.editorialStyleFallback
    ? `Tone, POV, data density, and example frequency from the editorial style below are pipeline constraints — not optional.`
    : `## CHECKLIST (pipeline constraints — not optional)
- Tone: ${brief.editorialStyle.tone}
- POV: ${brief.editorialStyle.pointOfView ?? "third"}
- Data density: ${brief.editorialStyle.dataDensity}
- Real examples frequency: ${brief.editorialStyle.realExamplesFrequency || "use where relevant"}
Enforce these in every section.`;

  const userPrompt = `Write a blog post using ONLY the following research brief. No image placeholders, internal/external links, or ToC.

${styleChecklist}

## GOOGLE & RANK MATH (article-specific)
- Search intent / primary keyword: "${brief.keyword.primary}". Write so a reader achieves their goal and gets substantial value beyond existing results.
- Title, meta, and slug are provided — do NOT generate them. Output only content, suggestedCategories, suggestedTags.
- Keyword in first 100 words and in at least one H2/H3; prefer primary keyword or close variant in at least one H2 (e.g. "Best ${brief.keyword.primary} Tools"). Paragraphs ≤120 words; sequential H2/H3/H4; 3-8 Q&As under H2 "Frequently Asked Questions".

## KEYWORD & INTENT
- Primary: ${brief.keyword.primary}
- Secondary: ${brief.keyword.secondary.join(", ") || "None"}
- PASF: ${brief.keyword.pasf.join(", ") || "None"}
${currentDataWarning}
## MANDATORY OUTLINE (follow exactly; do not skip, reorder, or add H2s; you may add H3s)
${outlineBlock}
Treat each section's targetWords as a hard constraint, not a suggestion. Use the per-section word targets to distribute the total word count; proportion content so section lengths align with these targets. Validation flags any section that misses its target by more than 5%.

## GAPS TO ADDRESS
${brief.gaps.length ? brief.gaps.join("\n") : "None"}
${(brief.extraValueThemes?.length ?? 0) > 0 || (brief.similaritySummary?.trim?.() ?? "") !== ""
      ? `
## EXTRA VALUE (do not only repeat competitors)
${brief.similaritySummary?.trim() ? `Top results cover: ${brief.similaritySummary.trim()}\n` : ""}${(brief.extraValueThemes?.length ?? 0) > 0 ? `Themes to cover:\n${brief.extraValueThemes!.map((t) => `- ${t}`).join("\n")}\n` : ""}`
      : `
## DIFFERENTIATION
Add clear value beyond the outline; lead with current data where provided.`}
${brief.freshnessNote?.trim() ? `## FRESHNESS\n${brief.freshnessNote.trim()}\n` : ""}
${brief.knowledgeEngine?.proprietaryFramework ? `## PROPRIETARY FRAMEWORK (Core thesis)
Name: ${brief.knowledgeEngine.proprietaryFramework.name}
Tagline: ${brief.knowledgeEngine.proprietaryFramework.tagline}
How it beats standard SERP: ${brief.knowledgeEngine.proprietaryFramework.howItBeatsTheSerp}
Pillars: ${brief.knowledgeEngine.proprietaryFramework.corePillars.map((p: any) => p.name).join(", ")}
Introduce or reference this framework naturally to build authority.
` : ""}
${brief.knowledgeEngine?.algorithmicInsights?.length ? `## PRACTITIONER INSIGHTS (Information Gain)
Weave these original observations in naturally if relevant to the outline:
${brief.knowledgeEngine.algorithmicInsights.map((i: any) => `- [${i.type.toUpperCase()}] ${i.headline}: ${i.explanation}`).join("\n")}
` : ""}
${brief.competitorDifferentiation?.trim() ? `## COMPETITOR DIFFERENTIATION (avoid these patterns)\n${brief.competitorDifferentiation.trim()}\n\nDeliberately avoid the phrases, section structures, and intro styles described above so the article does not read like AI-generated competitor content.\n` : ""}${(brief.povInsights?.length ?? 0) > 0 ? `## POV / INFORMATION GAIN (use these to differentiate)
These are contrarian or nuanced angles that most competitors miss. Weave them naturally into the relevant sections to increase Information Gain.
${brief.povInsights!.map((p) => `- Topic: ${p.topic}. Most say: "${p.conventionalView}". But: "${p.contrarian}" (source: ${p.source}).`).join("\n")}
` : ""}${sanitizeUserInput(fieldNotes) ? `## FIELD DATA (real-world experience, integrate naturally for E-E-A-T)
The following are raw notes/quotes from the author. Weave these "I did this" moments into relevant sections. Do not use them as block quotes; rephrase naturally to match the article voice. Attribute to the author's experience when appropriate. These real-world signals are the strongest E-E-A-T differentiator.

${sanitizeUserInput(fieldNotes)}
` : ""}## CURRENT DATA — ZERO HALLUCINATION
${factsBlock}

## EDITORIAL STYLE
${styleBlock}
${buildVoiceConstraintsBlock(voice)}
${sanitizeUserInput(toneExamples) ? `
## TONE CALIBRATION (match this voice)
The following is a sample of the client's existing writing. Match the tone, vocabulary level, sentence rhythm, and personality. Do NOT copy the content — only calibrate your voice to sound like this author:

"""${sanitizeUserInput(toneExamples)}"""
` : ""}

Intro: Mirror the best-performing intro pattern or subvert the weakest; follow the pattern provided. Open with a problem the reader recognizes in themselves — not a definition or statistic. CTA: Address a reader fear or desire — not just a click request.

## WRITING QUALITY
Vary sentence and paragraph length and openings. E-E-A-T: 2-3 experience signals (e.g. "anyone who…", "the first time you…"), cite data with natural attribution, only numbers from currentData. Every section must advance the reader's goal; no fluff.

## GEO & FAQ
- Every major section must open with a 2-3 sentence Answer Capsule (direct, unambiguous answer) before expanding. Use clear, unambiguous factual statements — no hedged language. Use definition-style sentences and numbered steps where appropriate.
- ANSWER-FIRST STRUCTURE (enforced): For every H2, the first 2-3 sentences MUST directly answer the heading's implied question. This is the "AI Overview target" — a self-contained snippet that AI engines can extract verbatim. Follow the answer with nuance, details, and supporting evidence. If an AI Overview target is provided in the outline, use it as the basis for those opening sentences.
- Direct answer: ${brief.geoRequirements.directAnswer}
- Stats: ${brief.geoRequirements.statDensity}
- Entities: ${brief.geoRequirements.entities}
- FAQ answers: max 300 characters each. Each answer must add at least one of: a so-what, a comparison, a forward look, a caveat, or a concrete next step — not a condensed repeat of the body. No repeating body numbers; every FAQ answer must teach something new to someone who read the full article.
${brief.geoRequirements.faqStrategy ? `- FAQ strategy: ${brief.geoRequirements.faqStrategy}` : ""}

## WORD COUNT (STRICT)
Section word targets sum to ${brief.outline.estimatedWordCount}; article total must be ${brief.wordCount.target} words (±5%). Write to each section's targetWords so the total lands on target. After writing, verify each section's word count meets its target; validation flags any section off by more than 5%.
Target: ${brief.wordCount.target} words. ${brief.wordCount.note}
Minimum 300 words. Article MUST be within ±5% of target. Meet the target — add or trim as needed.

## OUTPUT (valid JSON only)
Output only the JSON object below. No text before or after the JSON. Do NOT include title, metaDescription, or suggestedSlug — they are provided separately.

{
  "content": "<p>...</p><h2>...</h2>...",
  "suggestedCategories": ["cat1", "cat2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

If you approach the response limit, prioritize completing the final H2 and FAQ; you may shorten middle sections. Write to pass the automated SEO, typography, and fact-check audits. No em-dashes, en-dashes, or curly quotes; no excessive symbols (..., !!, !!!). Never use HTML table tags — use ul/ol only.`;


  const modelId = DRAFT_MODEL_IDS[draftModel] ?? CLAUDE_DEFAULT_MODEL;
  const systemPrompt = buildSystemPrompt(voice, customVoiceDescription);
  const draftTemperature = getVoiceTemperature(voice);
  const writeDraftStartMs = Date.now();
  const stream = anthropic.messages.stream({
    model: modelId,
    max_tokens: 32000,
    temperature: draftTemperature,
    system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();
  const writeDraftDurationMs = Date.now() - writeDraftStartMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "writeDraft",
      model: modelId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      durationMs: writeDraftDurationMs,
    });
  }

  // Detect truncation — if the model hit max_tokens, the JSON is likely cut off
  const stopReason = (message as { stop_reason?: string }).stop_reason;
  if (stopReason === "max_tokens") {
    console.warn("[claude] writeDraft response TRUNCATED at max_tokens — output may be incomplete");
  }

  const content = message.content?.[0];
  if (!content || content.type !== "text") {
    throw new Error("Claude writeDraft returned an empty or non-text response");
  }
  const rawExtracted = stripJsonFromResponse(content.text);
  let jsonText = normalizeJsonString(rawExtracted);
  jsonText = escapeControlCharactersInJsonStrings(jsonText);
  // Repair unescaped double quotes inside string values (common in HTML/content)
  jsonText = repairUnescapedQuotesInJsonStrings(jsonText);
  // Only apply trailing-comma removal as a repair strategy (naive regex can corrupt string values)
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    // First repair attempt: remove trailing commas
    try {
      parsed = JSON.parse(removeTrailingCommas(jsonText)) as Record<string, unknown>;
    } catch (err) {
      const snippet = content.text.slice(0, 600);
      const errMsg = err instanceof Error ? err.message : String(err);
      const truncationHint = stopReason === "max_tokens" ? " (NOTE: response was truncated at max_tokens)" : "";
      throw new Error(`Claude writeDraft returned invalid JSON: ${errMsg}${truncationHint}. First 600 chars: ${snippet}`);
    }
  }

  const validated = ClaudeDraftOutputSchema.safeParse(parsed);
  if (validated.success) {
    const v = validated.data;
    return {
      content: v.content,
      suggestedCategories: v.suggestedCategories ?? [],
      suggestedTags: v.suggestedTags ?? [],
    };
  }

  return {
    content: (parsed.content as string) ?? "",
    suggestedCategories: Array.isArray(parsed.suggestedCategories) ? parsed.suggestedCategories.filter((c: unknown): c is string => typeof c === "string") : [],
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags.filter((t: unknown): t is string => typeof t === "string") : [],
  };
}

/**
 * Step 4 (Section-by-Section) — Draft a single outline section.
 * Much better for quality and word count adherence than drafting 2000 words at once.
 */
export async function writeDraftSection(
  brief: ResearchBrief,
  section: OutlineSection,
  previousContent: string,
  tokenUsage?: TokenUsageRecord[],
  draftModel: "opus-4.6" | "sonnet-4.6" = "opus-4.6",
  fieldNotes?: string,
  toneExamples?: string,
  redditQuotes?: string[],
  isFirstSection: boolean = false,
  primaryKeyword?: string,
  voice?: VoicePresetId,
  customVoiceDescription?: string
): Promise<string> {
  const anthropic = getAnthropicClient();

  const currentDataWarning = brief.currentData.groundingVerified
    ? ""
    : "\nWARNING: Current data may not be verified (no grounding sources). Use with caution and avoid stating these as confirmed facts.\n";

  const styleChecklist = brief.editorialStyleFallback
    ? `Tone, POV, data density, and example frequency from the editorial style below are pipeline constraints — not optional.`
    : `## CHECKLIST (pipeline constraints — not optional)
- Tone: ${brief.editorialStyle.tone}
- POV: ${brief.editorialStyle.pointOfView ?? "third"}
- Data density: ${brief.editorialStyle.dataDensity}
- Real examples frequency: ${brief.editorialStyle.realExamplesFrequency || "use where relevant"}
Enforce these in this specific section.`;

  const factsBlock = brief.currentData.facts.length > 0
    ? `Current data ALLOCATED FOR THIS SECTION (use ONLY these stats; do NOT invent numbers; do NOT reference stats from previous sections — they are not available to you):\n${brief.currentData.facts.map((f) => `- ${f.fact} (Source: ${f.source})`).join("\n")}\n\nYou have ${brief.currentData.facts.length} stat(s) for this section. Use them naturally. If you need more data points, use qualitative language instead of inventing numbers.`
    : "No statistics allocated for this section. Use qualitative language (e.g. 'significantly increased', 'most practitioners find'). Do NOT invent specific numbers.";

  // Only pass previous content if it exists to establish context, but limit it so we don't blow up context size
  const contextBlock = previousContent.trim().length > 0
    ? `\n## PREVIOUS SECTIONS (Content written so far)\nDo not repeat information already covered here. Continue naturally from where this leaves off.\n\n${previousContent.slice(-4000)}\n`
    : "";

  const frameworkBlock = brief.knowledgeEngine?.proprietaryFramework
    ? `\n## PROPRIETARY FRAMEWORK (Core thesis)\nName: ${brief.knowledgeEngine.proprietaryFramework.name}\nTagline: ${brief.knowledgeEngine.proprietaryFramework.tagline}\nHow it beats standard SERP advice: ${brief.knowledgeEngine.proprietaryFramework.howItBeatsTheSerp}\nCore Pillars: ${brief.knowledgeEngine.proprietaryFramework.corePillars.map((p: any) => p.name).join(", ")}\nEmbed this framework naturally if it fits the section topics. Do NOT force it if irrelevant.\n`
    : "";

  const insightsBlock = brief.knowledgeEngine?.algorithmicInsights && brief.knowledgeEngine.algorithmicInsights.length > 0
    ? `\n## PRACTITIONER INSIGHTS (Information Gain)\nThese are non-obvious insights generated to beat competitors. Weave them in if relevant to this section's topics:\n${brief.knowledgeEngine.algorithmicInsights.map((i: any) => `- [${i.type.toUpperCase()}] ${i.headline}: ${i.explanation}`).join("\n")}\n`
    : "";

  const userPrompt = `Write the content for ONE specific section of a blog post.
Do NOT write the HTML heading tag for the section title itself (e.g. do not write \`<h2>${section.heading}</h2>\`) — the system will inject the heading. Just write the content that goes *under* the heading.
${contextBlock}
${frameworkBlock}
${insightsBlock}
${styleChecklist}

## SECTION ASSIGNMENT
You are writing the section: "${section.heading}"
- Target word count: ${section.targetWords} words. You MUST hit this target (±10%).
- Topics to cover: ${section.topics.join(", ")}
${section.geoNote ? `- GEO Constraint: ${section.geoNote}` : ""}
${section.aiOverviewTarget ? `- AI Overview target: "${section.aiOverviewTarget}" (Directly answer this in the first 2-3 sentences of this section)` : ""}
${section.sectionHook ? `- OPENING HOOK (mandatory): Open this section with a "${section.sectionHook}" approach. Do NOT open with a definition, "X means...", "X refers to...", or "X is...". Start with something that hooks the reader immediately.` : `- OPENING HOOK: Do NOT open with a definition. Start with a pain point, bold claim, question, or financial outcome.`}
${section.visualSuggestion ? `- VISUAL ASSET PLANNED: "${section.visualSuggestion}". Write natural transitions that accommodate this visual (e.g. "As the comparison below shows..." or "The workflow diagram illustrates...").` : ""}
${isFirstSection && primaryKeyword ? `\nFATAL ERROR: You MUST include the exact phrase "${primaryKeyword}" within the first 2 paragraphs of this section to establish SEO relevance.` : ""}

## CURRENT DATA — ZERO HALLUCINATION
${factsBlock}
Every specific number you write will be cross-checked. Use natural attribution (e.g. "according to [source]").
${currentDataWarning}
${redditQuotes?.length ? `\n## COMMUNITY QUOTES 
Weave these real-world quotes/experiences naturally into this section if relevant. Integrate them smoothly without relying on repetitive phrases like "One practitioner noted".
${redditQuotes.map(q => `- ${q}`).join("\n")}\n` : ""}
${sanitizeUserInput(fieldNotes) ? `\n## FIELD DATA (real-world experience)
${sanitizeUserInput(fieldNotes)}\n` : ""}
${sanitizeUserInput(toneExamples) ? `\n## TONE CALIBRATION
Match this voice:\n"""${sanitizeUserInput(toneExamples)}"""\n` : ""}
${buildVoiceConstraintsBlock(voice)}

## OUTPUT FORMAT
Return ONLY valid JSON containing the section HTML content, NO markdown formatting outside the JSON block. Do not include the H2 tag for the section title itself.

FINAL INSTRUCTIONS: You MUST wrap all headings in proper <h2> and <h3> HTML tags. Do not output plain text headings. You MUST use straight quotes and commas instead of em-dashes.

Example output:
{
  "content": "<p>...</p><h3>...</h3><p>...</p>"
}
`;

  const modelId = DRAFT_MODEL_IDS[draftModel] ?? CLAUDE_DEFAULT_MODEL;
  const sectionSystemPrompt = buildSystemPrompt(voice, customVoiceDescription);
  const sectionTemperature = getVoiceTemperature(voice);
  const startMs = Date.now();

  const stream = anthropic.messages.stream({
    model: modelId,
    max_tokens: 4000,
    temperature: sectionTemperature,
    system: [{ type: "text" as const, text: sectionSystemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "writeDraftSection",
      model: modelId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      durationMs,
    });
  }

  const contentBlock = message.content?.[0];
  if (!contentBlock || contentBlock.type !== "text") {
    throw new Error("Claude writeDraftSection returned an empty or non-text response");
  }

  const rawExtracted = stripJsonFromResponse(contentBlock.text);
  const jsonText = repairUnescapedQuotesInJsonStrings(
    escapeControlCharactersInJsonStrings(normalizeJsonString(rawExtracted))
  );

  try {
    const parsed = JSON.parse(jsonText) as { content: string };
    if (!parsed.content) return "";
    return parsed.content;
  } catch (err) {
    // If repair fails, fall back to tolerant extraction of the "content" string
    console.error("[writeDraftSection] JSON parse failed, attempting tolerant content extraction", err);

    // Use a safer search that specifically targets the JSON key pattern `"content":`
    const contentKeyMatch = /"content"\s*:/g.exec(jsonText);
    const keyIndex = contentKeyMatch ? contentKeyMatch.index : -1;
    if (keyIndex === -1) {
      throw new Error(`Claude writeDraftSection JSON parse failed (no "content" key): ${err}`);
    }

    const colonIndex = jsonText.indexOf(":", keyIndex);
    if (colonIndex === -1) {
      throw new Error(`Claude writeDraftSection JSON parse failed (no colon after "content"): ${err}`);
    }

    // Find the opening quote for the content string
    let i = colonIndex + 1;
    while (i < jsonText.length && /\s/.test(jsonText[i])) i++;
    if (jsonText[i] !== '"') {
      throw new Error(`Claude writeDraftSection JSON parse failed (content is not a JSON string): ${err}`);
    }
    i++; // move past opening quote

    let extracted = "";
    let escapeNext = false;
    for (; i < jsonText.length; i++) {
      const ch = jsonText[i];
      if (escapeNext) {
        // Preserve the full escape sequence (backslash + character) so that subsequent
        // unescape logic can correctly decode sequences like \" or \n.
        extracted += "\\" + ch;
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        // End of string
        break;
      }
      extracted += ch;
    }

    const unescaped = extracted
      // First collapse double-backslashes into a single backslash
      .replace(/\\\\/g, "\\")
      // Then decode common escape sequences
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\u2028/g, "\u2028")
      .replace(/\\u2029/g, "\u2029")
      .replace(/\\"/g, '"');

    return unescaped;
  }
}

/**
 * Multi-Pass Humanization: Run after draft assembly to smooth transitions,
 * vary sentence lengths, and make AI prose read more naturally.
 */
export async function humanizeContent(
  draftHtml: string,
  toneExamples?: string,
  tokenUsage?: TokenUsageRecord[],
  voice?: VoicePresetId
): Promise<string> {
  const anthropic = getAnthropicClient();
  const startMs = Date.now();

  const preset = getVoicePreset(voice);
  const voiceAddendum = preset?.humanizeAddendum
    ? `\n7. ${preset.humanizeAddendum}`
    : "";

  const system = `You are an expert human editor. Your job is to take an AI-generated draft and make it read like it was written by a senior human practitioner.
RULES:
1. Do not change the HTML structure, H2/H3 tags, or remove any statistics/facts.
2. Vary sentence openings (no repeating "Additionally,", "Moreover,", "Furthermore,").
3. Smooth out transitions between paragraphs so the text flows beautifully.
4. Remove robotic AI "fluff" and "wrap-up" conclusions (e.g. "In conclusion", "Ultimately").
5. If tone examples are provided, match that exact voice.
6. Return ONLY the edited HTML. Do not wrap in JSON. Do not wrap in markdown code blocks. Just the raw HTML.${voiceAddendum}`;

  const userMessage = `${toneExamples?.trim() ? `TONE TO MATCH:\n"""${toneExamples.trim()}"""\n\n` : ""}
DRAFT HTML TO HUMANIZE:
${draftHtml}`;

  const humanizeTemp = getHumanizeTemperature(voice);
  const stream = anthropic.messages.stream({
    model: CLAUDE_DEFAULT_MODEL,
    max_tokens: 32000,
    temperature: humanizeTemp,
    system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: userMessage }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "humanizeContent",
      model: CLAUDE_DEFAULT_MODEL,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      durationMs,
    });
  }

  const contentBlock = message.content?.[0];
  if (!contentBlock || contentBlock.type !== "text") return draftHtml;

  let html = contentBlock.text.trim();
  if (html.startsWith("```html")) html = html.slice(7);
  else if (html.startsWith("```")) html = html.slice(3);
  if (html.endsWith("```")) html = html.slice(0, -3);

  return html.trim() || draftHtml;
}

/** Strip markdown code fences from JSON string. */
function stripJsonMarkdown(raw: string): string {
  let s = raw.trim();
  const backtick = "```";
  if (s.startsWith(backtick)) {
    const end = s.indexOf(backtick, backtick.length);
    s = end > 0 ? s.slice(backtick.length, end) : s.slice(backtick.length);
  }
  const jsonMatch = s.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : s;
}

/**
 * Generate 2 SEO-optimized title/meta/slug options from draft content.
 * Uses the same Claude model as the article draft (Sonnet 4.6 or Opus 4.6).
 * Aligned with article audit system: Google Search Central + Rank Math.
 */
export async function generateTitleMetaSlugFromContent(
  primaryKeyword: string,
  intent: string,
  content: string,
  tokenUsage?: TokenUsageRecord[],
  draftModel: "opus-4.6" | "sonnet-4.6" = "opus-4.6"
): Promise<TitleMetaSlugResult> {
  const anthropic = getAnthropicClient();
  const modelId = DRAFT_MODEL_IDS[draftModel] ?? CLAUDE_DEFAULT_MODEL;
  const startMs = Date.now();

  const plainText = content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fullExcerpt = plainText.slice(0, 4500);

  const h2Matches = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const headings = h2Matches
    .map((m) => m.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 12);

  const auditRules = getAuditRulesForPrompt();
  const intentGuidance = getIntentGuidanceForMeta(intent);

  const systemPrompt = `You are an expert SEO copywriter. Generate exactly TWO distinct, high-quality meta options for a blog post. Each option must pass Google Search Central and Rank Math 100/100 checks.

CRITICAL RULES (each option MUST satisfy — our audit will fail otherwise):
${auditRules}

VARIANT STRATEGY:
• optionA: Lead with sentiment + power words. E.g. "Proven Guide to…", "Discover the Best…", "Avoid These [X] Mistakes…"
• optionB: Lead with numbers + action. E.g. "7 Tips for…", "How to [X] in 5 Steps", "[N] Ways to…"

ADDITIONAL GUIDANCE:
• Match the article's actual content — never mislead
• Search intent: ${intentGuidance}
• Title: front-load the primary keyword; make every word earn its place. FATAL ERROR: Both optionA and optionB MUST contain a specific number (e.g., "7", "2025", "5 Ways"). Numbers critically improve CTR.
• Meta: write a compelling pitch, not a dry summary; include keyword naturally in first 120 chars
• Slug: concise, keyword-rich; omit articles (a, the) and prepositions where possible

Return ONLY valid JSON, no markdown or explanation:
{"optionA":{"title":"...","metaDescription":"...","suggestedSlug":"..."},"optionB":{"title":"...","metaDescription":"...","suggestedSlug":"..."}}`;

  const headingsBlock = headings.length > 0
    ? `\nArticle structure (H2s):\n${headings.map((h) => `- ${h}`).join("\n")}\n`
    : "";

  const userMessage = `Primary keyword: "${primaryKeyword}"
Search intent: ${intent}
${headingsBlock}
Article content (first part):
${fullExcerpt}

Generate two distinct meta options (optionA and optionB). Each must satisfy all audit rules. Return JSON only.`;

  const stream = anthropic.messages.stream({
    model: modelId,
    max_tokens: 4096,
    temperature: 0.25,
    system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: userMessage }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "generateTitleMetaSlugFromContent",
      model: modelId,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      durationMs,
    });
  }

  const contentBlock = message.content[0];
  if (contentBlock.type !== "text") {
    throw new Error("generateTitleMetaSlugFromContent: Claude returned non-text response");
  }
  const rawContent = contentBlock.text;
  if (!rawContent?.trim()) {
    throw new Error("generateTitleMetaSlugFromContent: empty response from Claude");
  }
  const raw = stripJsonMarkdown(rawContent);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    throw new Error(`generateTitleMetaSlugFromContent: invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }

  const optionARaw = (parsed.optionA ?? parsed.optiona) as Record<string, unknown> | undefined;
  const optionBRaw = (parsed.optionB ?? parsed.optionb) as Record<string, unknown> | undefined;

  if (!optionARaw || !optionBRaw) {
    throw new Error("generateTitleMetaSlugFromContent: response must include optionA and optionB");
  }

  const optionA = normalizeMetaOption(optionARaw, primaryKeyword);
  const optionB = normalizeMetaOption(optionBRaw, primaryKeyword);

  return {
    options: [optionA, optionB],
  };
}

/**
 * Generate 5-10 title options for A/B testing, with different angles.
 */
export async function generateTitleVariations(
  primaryKeyword: string,
  contentExcerpt: string,
  tokenUsage?: TokenUsageRecord[]
): Promise<{ title: string; approach: string; ctrSignal: "High" | "Medium" }[]> {
  const anthropic = getAnthropicClient();
  const startMs = Date.now();

  const systemPrompt = `You are a viral headline copywriter. Generate 7 distinctly different, highly clickable SEO title options for the provided article.
Strategies to use: 1) Number/Listicle, 2) How-To/Guide, 3) Question/Curiosity Gap, 4) Negative Angle (e.g. "Mistakes to Avoid"), 5) Contrarian, 6) Ultimate Guide, 7) Benefit-Driven.
For each, provide the title (max 60 chars, must include the keyword "${primaryKeyword}") and the approach used. Also provide a predicted CTR signal (High/Medium).
Return valid JSON only:
{ "titles": [ { "title": "...", "approach": "...", "ctrSignal": "High" } ] }`;

  const stream = anthropic.messages.stream({
    model: CLAUDE_DEFAULT_MODEL,
    max_tokens: 1024,
    temperature: 0.7,
    system: [{ type: "text" as const, text: systemPrompt, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: `Keyword: ${primaryKeyword}\n\nContent Excerpt:\n${contentExcerpt.slice(0, 3000)}` }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) tokenUsage.push({
    callName: "generateTitleVariations",
    model: CLAUDE_DEFAULT_MODEL,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.promptTokens + usage.completionTokens,
    durationMs,
  });

  try {
    let raw = (message.content[0] as { type: "text"; text: string }).text;
    raw = stripJsonFromResponse(raw);
    const parsed = JSON.parse(raw);
    if (!parsed.titles || !Array.isArray(parsed.titles)) return [];

    const titles = parsed.titles
      .filter((t: unknown) => t && typeof t === "object")
      .map((t: any) => {
        const title = typeof t.title === "string" ? t.title : "";
        const approach = typeof t.approach === "string" ? t.approach : "";
        const rawCtr = t.ctrSignal;
        const ctr: "High" | "Medium" =
          rawCtr === "High" || rawCtr === "Medium" ? rawCtr : "Medium";
        return { title, approach, ctrSignal: ctr };
      })
      .filter((t: { title: string; approach: string; ctrSignal: "High" | "Medium" }) => t.title && t.approach);

    return titles;
  } catch (err) {
    console.error("[generateTitleVariations] Parse error:", err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Auto-fix fact-check hallucinations (surgical rewrite, preserve flow)
// ---------------------------------------------------------------------------

const HALLUCINATION_FIX_SYSTEM = `You are an editor fixing only specific flagged issues in an article. You will receive:
1. The article HTML
2. A list of hallucination flags from a fact-checker (unverified statistics or fabricated source attributions)
3. Verified facts from currentData that you MAY use to replace bad data when it fits naturally

RULES:
- For EACH flagged hallucination, REWRITE the surrounding sentence or two so the text flows naturally WITHOUT the problematic statistic or attribution. Do NOT simply delete a sentence — that would leave an awkward gap. Rewrite to preserve readability and flow.
- If a verified fact from currentData can naturally replace the hallucinated claim in context, use it and set replacedWithVerifiedFact to true.
- If not, rewrite the sentence to make the same point without the specific statistic or attribution; set replacedWithVerifiedFact to false.
- Do NOT change any content outside the immediate vicinity of each hallucination.
- Preserve ALL HTML structure, tags, headings, and formatting exactly. Only change the text content where hallucinations appear.
- Target ONLY the items in the hallucinations list. Do not second-guess or "fix" other numbers or attributions.

OUTPUT FORMAT:
1. Output the complete fixed HTML first (the full article with your edits).
2. Then on a new line write exactly: HALLUCINATION_FIXES:
3. Then a JSON array of objects, one per fix: [{ "originalText": "exact phrase or sentence you replaced", "replacement": "the new text", "reason": "brief reason", "replacedWithVerifiedFact": true or false }]
Use double quotes in JSON. No markdown code fence around the JSON.`;

const HALLUCINATION_FIX_TIMEOUT_MS = 45_000;

export type FixHallucinationsResult = {
  fixedHtml: string;
  fixes: HallucinationFix[];
};

/**
 * Surgically fix fact-check hallucinations in draft HTML using Claude.
 * Rewrites only the immediate context of each hallucination to preserve flow; does not second-guess the fact-checker's skip logic.
 */
export async function fixHallucinationsInContent(
  draftHtml: string,
  hallucinations: string[],
  currentData: CurrentData,
  tokenUsage?: TokenUsageRecord[]
): Promise<FixHallucinationsResult> {
  if (hallucinations.length === 0) {
    return { fixedHtml: draftHtml, fixes: [] };
  }
  const anthropic = getAnthropicClient();
  const fixStartMs = Date.now();
  const verifiedFactsBlock = currentData.facts
    .slice(0, 50)
    .map((f) => `- "${f.fact}" (source: ${f.source})`)
    .join("\n");
  const userContent = `Fix the following hallucinations in this article. Preserve HTML and flow.

VERIFIED FACTS (you may use these to replace hallucinated stats when they fit):
${verifiedFactsBlock || "(none)"}

HALLUCINATIONS TO FIX (each is a flag from the fact-checker; fix only these):
${hallucinations.map((h) => `- ${h}`).join("\n")}

ARTICLE HTML:
${draftHtml}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HALLUCINATION_FIX_TIMEOUT_MS);
  try {
    const stream = anthropic.messages.stream(
      {
        model: CLAUDE_DEFAULT_MODEL,
        max_tokens: 16384,
        temperature: 0.1,
        system: HALLUCINATION_FIX_SYSTEM,
        messages: [{ role: "user", content: userContent }],
      },
      { signal: controller.signal }
    );
    const message = await stream.finalMessage();
    const fixDurationMs = Date.now() - fixStartMs;
    const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
    if (tokenUsage) {
      tokenUsage.push({
        callName: "fixHallucinationsInContent",
        model: CLAUDE_DEFAULT_MODEL,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.promptTokens + usage.completionTokens,
        durationMs: fixDurationMs,
      });
    }
    const content = message.content[0];
    if (content.type !== "text") {
      return { fixedHtml: draftHtml, fixes: [] };
    }
    const text = content.text.trim();
    const fixesMarker = "HALLUCINATION_FIXES:";
    const idx = text.indexOf(fixesMarker);
    let fixedHtml = draftHtml;
    let fixes: HallucinationFix[] = [];
    if (idx >= 0) {
      const htmlPart = text.slice(0, idx).trim();
      const jsonPart = text.slice(idx + fixesMarker.length).trim();
      const codeMatch = htmlPart.match(/```(?:html)?\s*([\s\S]*?)```/);
      fixedHtml = (codeMatch ? codeMatch[1].trim() : htmlPart) || draftHtml;
      try {
        const parsed = JSON.parse(jsonPart) as unknown;
        if (Array.isArray(parsed)) {
          fixes = parsed
            .filter(
              (p): p is HallucinationFix =>
                p != null &&
                typeof p === "object" &&
                typeof (p as HallucinationFix).originalText === "string" &&
                typeof (p as HallucinationFix).replacement === "string" &&
                typeof (p as HallucinationFix).reason === "string" &&
                typeof (p as HallucinationFix).replacedWithVerifiedFact === "boolean"
            )
            .map((p) => ({
              originalText: String((p as HallucinationFix).originalText),
              replacement: String((p as HallucinationFix).replacement),
              reason: String((p as HallucinationFix).reason),
              replacedWithVerifiedFact: Boolean((p as HallucinationFix).replacedWithVerifiedFact),
            }));
        }
      } catch {
        // Keep fixes [] if JSON parse fails
      }
    } else {
      const codeMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
      fixedHtml = (codeMatch ? codeMatch[1].trim() : text) || draftHtml;
    }
    return { fixedHtml, fixes };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[fixHallucinations] Timeout or abort — returning original content");
    } else {
      console.error("[fixHallucinations]", err);
    }
    return { fixedHtml: draftHtml, fixes: [] };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Auto-fix loop for SEO/Typography audit failures.
 * Receives the HTML and a list of failure messages from the audit.
 * Rewrites only what's necessary to fix the issues.
 */
export async function fixAuditIssues(
  draftHtml: string,
  auditFailures: string[],
  tokenUsage?: TokenUsageRecord[]
): Promise<string> {
  if (auditFailures.length === 0) return draftHtml;

  const anthropic = getAnthropicClient();
  const startMs = Date.now();

  const system = `You are an SEO Editor fixing a blog post.
The post failed automated audits with the following errors:
${auditFailures.map(f => `- ${f}`).join("\n")}

Rewrite the article HTML to fix exactly these issues.
- If it says keyword is missing in the first 10%, weave it naturally into the first paragraph.
- If paragraphs are too long (>120 words), break them up.
- If it mentions excessive symbols or "AI-sounding" phrases, remove them.
- Preserve the overall structure and facts.
- Return ONLY the raw fixed HTML. Do NOT return markdown blocks or JSON.`;

  const stream = anthropic.messages.stream({
    model: CLAUDE_DEFAULT_MODEL,
    max_tokens: 32000,
    temperature: 0.2,
    system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: draftHtml }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) tokenUsage.push({
    callName: "fixAuditIssues",
    model: CLAUDE_DEFAULT_MODEL,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.promptTokens + usage.completionTokens,
    durationMs,
  });

  const contentBlock = message.content?.[0];
  if (!contentBlock || contentBlock.type !== "text") return draftHtml;

  let html = contentBlock.text.trim();
  if (html.startsWith("```html")) html = html.slice(7);
  else if (html.startsWith("```")) html = html.slice(3);
  if (html.endsWith("```")) html = html.slice(0, -3);

  return html.trim() || draftHtml;
}