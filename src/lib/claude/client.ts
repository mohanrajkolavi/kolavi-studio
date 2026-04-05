import { getSharedAnthropicClient } from "@/lib/anthropic/shared-client";
import { SEO } from "@/lib/constants";
import { getBannedPhrasesForPrompt } from "@/lib/constants/banned-phrases";
import { sanitizeUserInput } from "@/lib/constants/sanitize";
import { type VoicePresetId, getVoicePreset, buildVoiceConstraintsBlock, getIntentModifier, getIndustryModifier, DEFAULT_VOICE_PRESET_ID } from "@/lib/constants/voices";
import { extractH2sFromHtml, getAuditRulesForPrompt } from "@/lib/seo/article-audit";
import type {
  CurrentData,
  HallucinationFix,
  PipelineInput,
  ResearchBrief,
  TokenUsageRecord,
  TopicExtractionResult,
} from "@/lib/pipeline/types";
import { ClaudeDraftOutputSchema, ResearchBriefWithoutCurrentDataSchema } from "@/lib/pipeline/types";
import type {
  TitleMetaSlugOption,
  TitleMetaSlugResult,
  WordCountOverride,
} from "@/lib/openai/client";
import {
  getIntentGuidanceForMeta,
  normalizeMetaOption,
  normalizeBriefOutput,
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

1. **Answer Capsule / Citation Capsule (first 40-60 words):** A direct, factual, standalone answer to the implicit question behind the heading. Write it so a search engine or AI system can extract it verbatim as a citation. No opinion, no hedging, no metaphor. Pure information density. This capsule MUST contain at least one specific data point (number, percentage, dollar amount) with source attribution. This is the single most important passage in the section — it targets featured snippets, AI Overviews, and citation extraction. The audit system validates that each H2 opens with a data-rich capsule.
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

## 3. Citation-Worthy Writing (what makes content get cited by search and AI engines)

- **Extraction Targets:** Every H2 must contain at least one dense "If X, then Y" statement or a comma-separated factual list that can be extracted verbatim as a citation. Place these in mid-paragraph, not at the start.
- **Named Entity Saturation:** Never use pronouns for tools, companies, platforms, or concepts. Write "Google Search Console shows..." not "It shows..." Proper nouns build entity graphs that search engines and AI systems use to assess authority.
- **Structured Data Lists:** Include at least one structured data list (bulleted, with bold labels and metrics) per 1000 words. Structured data earns significantly more citations than prose-only sections.
- **Inline Citations (Wikipedia-style — MANDATORY, audited):** Every quantitative claim, major finding, or attributed statement MUST have a numbered superscript citation: \`<sup><a href="SOURCE_URL" target="_blank" rel="noopener noreferrer">[1]</a></sup>\`. Assign citation numbers sequentially across the entire article (not per section). MINIMUM: 1-2 citations per H2 section. Target: 8-15 total citations per 2000-word article (scale proportionally for longer articles). Use source URLs from the currentData facts AND from competitor URLs provided in the research brief. At the end of the article (after FAQ), include a "## References" section as a numbered \`<ol>\` list matching the citation numbers, each item containing the source name and URL as an \`<a>\` tag. Do NOT cite common knowledge. DO cite: statistics, research findings, expert claims, specific benchmarks, tool adoption numbers, and named-source attributions. If a section has zero citations, it FAILS the audit.
- **Factual Density:** Kill filler phrases. Start sentences with the subject or data point. Every sentence must either inform or persuade — if a sentence states the obvious without adding value, delete it.

## 4. The Scars Test (E-E-A-T first-hand experience)

Every H2 MUST contain at least one of these practitioner signals. No exceptions:
- **A failure narrative:** "I configured the CDN headers wrong and served stale content for 11 days before a customer ticket exposed it." Experts know what goes wrong. Beginners only know the happy path.
- **A time or cost reference:** "Budget 3-4 hours for the initial migration; the rollback alone took us 90 minutes." Specificity proves you did the work.
- **A "here's what actually happens" moment:** "The documentation says setup takes 5 minutes. In production, expect 45 minutes because the OAuth flow silently drops scopes on the first attempt."
- **Sensory and procedural detail:** Describe the UI friction, the waiting, the error message text. "The API key takes about 15 minutes to propagate. During that window the dashboard flashes a false 404."
- **The "I" and "We" framework:** "In our latest deployment...", "I've audited 200+ of these configurations and..."
- **Pragmatic trade-off acknowledgment:** "This workflow is tedious. It's also the only approach that survives a cache purge."

**Trustworthiness:** Use ONLY numbers from the research brief's currentData. Never invent statistics. When no data exists, use qualitative language. Every factual claim must trace back to a currentData entry.

## 4a. The Inverted Pyramid (answer first, always)

Front-load value at EVERY level. Most web users scan — they don't read word-by-word. If you build to a conclusion, readers leave before reaching it.

- **Article level:** The first 100 words must contain the core answer or takeaway. No throat-clearing, no "In this article we will..."
- **Section level:** The answer capsule IS the first thing after the H2. This is already enforced. Good.
- **Paragraph level:** The first sentence of every paragraph must be the point, not setup. NEVER open a paragraph with "There are several...", "It is important to...", "When it comes to...", "One of the most...". Lead with the specific claim, number, or insight.
- **Sentence level:** Put information-carrying words first. "Redis cut response time by 80%" not "It was found that response time could be reduced by using Redis."

BAD paragraph opening: "There are several factors that can influence your website's loading speed."
GOOD paragraph opening: "Three factors control 90% of your loading speed: image compression, server response time, and render-blocking JavaScript."

## 4b. Emotional Architecture (what keeps humans reading)

Every section must trigger at least one emotion from this hierarchy:

1. **Recognition** (opening): "You've seen this before..." / "If you've ever spent 3 hours debugging..." — the reader feels understood.
2. **Curiosity** (before key insight): "But here's what most guides miss..." / "The counterintuitive part:" — creates a gap the brain needs to close.
3. **Surprise** (key finding): Deliver a counterintuitive data point or contrarian insight that challenges assumptions.
4. **Validation** (after evidence): "This confirms what experienced practitioners have known..." — the reader feels smart.
5. **Forward pull** (section ending): "But that's only half the equation." / "The real challenge isn't X, it's Y." — momentum to next section.

**Bucket brigades (mandatory: 4-6 per 1000 words, audited post-generation):** Short transitional phrases that create micro-curiosity gaps. Use at paragraph transitions where attention dips. Examples: "Here's the thing:", "But it gets worse.", "The real question:", "So what does this mean?", "Here's where it gets interesting:", "But here's what most guides miss:", "Now here's the catch:", "Think about it this way:", "Want to know the difference?". End with a colon when possible — it forces the brain to continue. Vary the phrasing; never use the same bucket brigade twice. The audit system counts these and flags articles below the minimum.

## 4c. Concrete-First Rule (example before concept)

ALWAYS lead with the specific example, case study, data point, or scenario. THEN generalize. Never explain the abstract concept first and then give an example.

BAD (textbook pattern):
"Caching is a technique that stores frequently accessed data in a temporary location to reduce latency. For example, Redis can store session data to speed up API responses."

GOOD (concrete-first):
"Redis cut our API response time from 340ms to 12ms by storing session data in memory. That's caching in action — keeping frequently accessed data close so the database doesn't get hammered on every request."

The concrete-first pattern works because specificity builds trust (readers believe "340ms to 12ms" more than "reduces latency") and the brain anchors to concrete details before abstract principles.`;

const SYSTEM_PROMPT_POSTAMBLE = `## 5. Natural Writing Style (mandatory — the output must read like a skilled human writer)

Write the way experienced practitioners actually write — with personality, rhythm variation, and the rough edges that come from real expertise. Follow every rule below:

- **Sentence length variance (CRITICAL — this is audited):** Target a standard deviation of >= 4.5 words across sentence lengths. Mix deliberately: short (4-8 words), medium (12-18 words), long (22-30 words). NEVER write 3+ consecutive sentences of similar length. After two medium sentences, force a short punch or a long complex one. Vary sentence STRUCTURE too: start some with a noun, some with a verb, some with a prepositional phrase, some with "But" or "So." Monotonous sentence openings are the #1 AI detection signal.
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

**QUOTE RULES:** Never reuse the same community quote, Reddit quote, or practitioner quote in multiple sections. Each quote may appear ONCE in the entire article. If you've already used a quote in a previous section (check the previousContent context), do not use it again. Vary your quote attributions: don't use the same phrasing like "As one user put it" more than once.

**DATA DENSITY MINIMUM:** Each H2 section MUST contain at least 2 specific data points: numbers, percentages, timeframes, named tools, version numbers, user counts, or measurable outcomes. Vague claims like "significant improvement" fail. Replace with specifics: "40-60% improvement in documentation velocity." If the research brief doesn't provide enough data for a section, use specific practitioner observations with measurable details (tool names, timeframes, team sizes).

**EVERY PARAGRAPH EARNS ITS PLACE:** Before writing any paragraph, ask: does this contain a specific fact, example, number, or actionable recommendation that the reader can't get from the heading alone? If a paragraph merely restates the heading in different words, or states something obvious ("SEO is important for businesses"), delete it. Zero filler tolerance. A 1500-word article with zero filler beats a 2500-word article padded with obvious statements.

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
- Paragraphs: target 40-80 words, max 120 words. Vary paragraph lengths (some 1-sentence, some 3-4 sentence). Short paragraphs after dense blocks create rhythm.
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

/** TIER 3 quality differentiators — injected into user prompts to reduce system prompt cognitive load. */
const TIER_3_QUALITY = `## TIER 3 — QUALITY DIFFERENTIATORS (applied during writing, checked at audit)

### E-E-A-T: First-Hand Experience Proof
At least 2 sections must include a **failure narrative**: a specific mistake or friction point only a practitioner would know, with a concrete outcome (number, timeline, or observable result). Example: "The API key takes ~15 minutes to propagate, during which the dashboard throws a false 404."
- Use "I" and "We" authority framing: "In our latest deployment...", "I've reviewed hundreds of these audits..."
- Acknowledge trade-offs honestly: "This workflow is tedious, but it's the only way to bypass the caching issue."
- Every H2 must add unique value. Never restate the intro.

### Practitioner Voice
1. **Specific over generic.** Name tools (Ahrefs, Screaming Frog), reference timeframes ("took about 3 weeks"), describe concrete scenarios.
2. **Natural vocabulary.** A project "tanks" or "goes sideways," not just "fails." Use idioms naturally: "the 80/20 of it," "no silver bullet here."
3. **Varied structure.** Punchline first sometimes, example before theory, bold claim then evidence.
4. **Confidence with honesty.** Strong claims ("This works.") paired with specific limits ("Except for sites under 50 pages.").
5. **Density variation.** One paragraph crammed with data, next paragraph pure opinion, then an anecdote.

### The Contrarian Pivot (minimum 3 sections)
In at least 3 H2 sections, apply this framework:
- **Acknowledge** the standard industry advice in 1 sentence.
- **Pivot** with the practitioner reality: cite a specific data point, mechanism, or named-entity observation that directly contradicts a widely-held assumption or a named competitor claim.
- **Resolve** with the advanced, nuanced approach. The resolution must include a concrete next step, not just "it depends."
Success test: if you removed the pivot, the section would read like every other SERP result.

### Visual Hierarchy
- **Bold 2-4 key phrases per H2** (never full sentences). Bolded phrases should form a scannable summary.
- **1-3-1 paragraph structure:** 1-sentence claim, 3-sentence evidence/data, 1-sentence transition.
- Format complex data as nested bullet points with bold labels (HTML tables are banned).

### Humanization
- Never open a section with a dictionary definition in ANY form. This includes: "X is the process of...", "X is the strategic creation of...", "X refers to...", "X, [stat], is the [noun]...". The post-processing linter will delete any opening sentence matching these patterns. Instead, lead with an opinionated answer: entity + specific claim + data point.
- Vary quote attribution: "one engineer on a forum shared...", "a practitioner in an online community reported...", "as one user put it..." Never use "One practitioner noted" or attribute to Reddit by name.
- Use each community quote ONCE in the entire article. The quote pool shrinks after each section. If no quotes remain for your section, do not fabricate one.
- At least one named example, tool, or scenario per H2. No abstract-only sections.

### Reader Engagement
- H2s use curiosity gaps. Vary sentence rhythm (short after long). Second person by default; brief's pointOfView overrides this.
- End each section with a forward-looking claim or insight, not a meta-narration preview ("which is why...", "let's explore..."). Good: state a consequence. Bad: announce the next section.

### Originality Gate
- Every H2 must contain at least one insight, angle, or data point that competitors are unlikely to have. This can be: a non-obvious interpretation of the data, a failure narrative, a contrarian position backed by evidence, a specific workflow detail, or a "what they don't tell you" moment.
- If you find yourself writing a paragraph that any competent writer could produce from the heading alone (generic advice, obvious statements, common knowledge restated), STOP and replace it with something specific from the research brief, currentData, or practitioner experience.
- Test: if you removed the article byline, could a reader tell this apart from the top 3 SERP results? If not, the section needs more original value.

### Anti-Bloat Checkpoint
Before finalizing each section, delete any sentence that:
1. Restates the heading in different words ("Let's look at why X matters" under an H2 about X)
2. States something the target audience already knows ("Having a website is important for businesses")
3. Uses vague qualifiers without specifics ("can significantly improve your results")
4. Exists only to transition ("Now that we've covered X, let's move on to Y")
Replace deleted sentences with nothing — shorter and tighter is better than padded.`;

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

/** Opus model for high-stakes generation (brief, title/meta, section regen). */
const CLAUDE_OPUS_MODEL = "claude-opus-4-6";

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
  customVoiceDescription?: string,
  intent?: string
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

   Every MAJOR claim (revenue, market share, growth rate, benchmark result, key specification) MUST have an inline citation using the Wikipedia-style numbered format: \`<sup><a href="SOURCE_URL" target="_blank" rel="noopener noreferrer">[N]</a></sup>\`. Use the source URL from the currentData entry. If multiple nearby facts come from the same source, reuse the same citation number. Keep the prose conversational — the citation sits after the claim, not as the sentence structure. Example: "Response times improved by 40%<sup><a href="https://example.com/report" target="_blank" rel="noopener noreferrer">[3]</a></sup>, making it the fastest in its category."

   At the end of the article (after FAQ), output a References section:
   <h2>References</h2>
   <ol>
   <li><a href="URL" target="_blank" rel="noopener noreferrer">Source Name</a></li>
   ...
   </ol>
   Match each numbered citation in the article to the corresponding list item.`
      : "No current data provided. Do not invent specific statistics; use general language where needed.";

  const styleChecklist = brief.editorialStyleFallback
    ? `Tone, POV, data density, and example frequency from the editorial style below are pipeline constraints — not optional.`
    : `## CHECKLIST (pipeline constraints — not optional)
- Tone: ${brief.editorialStyle.tone}
- POV: ${brief.editorialStyle.pointOfView ?? "third"}
- Data density: ${brief.editorialStyle.dataDensity}
- Real examples frequency: ${brief.editorialStyle.realExamplesFrequency || "use where relevant"}
Enforce these in every section.`;

  const userPrompt = `Write a blog post using ONLY the following research brief. No image placeholders, internal/external links, or ToC. Title/meta/slug are handled separately — output only content, suggestedCategories, suggestedTags.

${styleChecklist}

## KEYWORD & INTENT
- Primary: "${brief.keyword.primary}" (must appear in first 100 words + at least one H2/H3)
- KEYWORD DENSITY CEILING: Keep the exact primary keyword phrase under 2.5% density. After the first natural use in each section, prefer synonyms, pronouns, abbreviations, and related terms. The audit flags anything over 3% as keyword stuffing.
- Secondary: ${brief.keyword.secondary.join(", ") || "None"}
- PASF: ${brief.keyword.pasf.join(", ") || "None"}
${brief.clusterPosition && brief.clusterPosition !== "standalone" ? `
## CLUSTER POSITION: ${brief.clusterPosition.toUpperCase()}
${brief.clusterPosition === "pillar" ? `This is a PILLAR page — the definitive hub for this topic cluster.
- Cover the topic comprehensively. Every essential subtopic should appear, each at enough depth to be useful standalone.
- Link concepts to spoke articles naturally: "For a deeper dive on [subtopic], see [our guide to X]."
- This should be the page a reader bookmarks as their go-to reference.
- Breadth AND depth: cover more ground than any single competitor, but don't sacrifice quality for quantity.
- Target 3-5 internal links per 1000 words where relevant spoke content exists.` : ""}${brief.clusterPosition === "spoke" ? `This is a SPOKE page — deep specialization on a specific subtopic.
- Go significantly deeper than the pillar page on this specific topic. Your unique depth IS the value.
- Reference the broader topic "${brief.clusterTopic || brief.keyword.primary}" naturally 1-2 times.
- Link back to the pillar page once in the intro and once near the conclusion.
- Link to 1-2 related spoke pages where the reader would benefit from cross-referencing.
- Your reader likely came from the pillar page — don't repeat what's already covered there. Add new depth, examples, and data.` : ""}
${brief.internalLinkSuggestions?.length ? `Related articles in this cluster (reference naturally where relevant):\n${brief.internalLinkSuggestions.slice(0, 10).map((l) => `- ${l.url}`).join("\n")}` : ""}
` : ""}${currentDataWarning}
## MANDATORY OUTLINE (follow exactly; do not skip, reorder, or add H2s; you may add H3s)
${outlineBlock}

## GAPS TO ADDRESS
${brief.gaps.length ? brief.gaps.join("\n") : "None"}
${(brief.extraValueThemes?.length ?? 0) > 0 || (brief.similaritySummary?.trim?.() ?? "") !== ""
      ? `
## DIFFERENTIATION (what we add that competitors don't)
${brief.similaritySummary?.trim() ? `Competitor landscape: ${brief.similaritySummary.trim()}\n` : ""}${(brief.extraValueThemes?.length ?? 0) > 0 ? `Our unique themes:\n${brief.extraValueThemes!.map((t) => `- ${t}`).join("\n")}\n` : ""}`
      : ""}
${brief.freshnessNote?.trim() ? `## FRESHNESS\n${brief.freshnessNote.trim()}\n` : ""}
${brief.knowledgeEngine?.proprietaryFramework ? `## PROPRIETARY FRAMEWORK (weave as the article's core thesis)
Name: ${brief.knowledgeEngine.proprietaryFramework.name}
Tagline: ${brief.knowledgeEngine.proprietaryFramework.tagline}
Strategic advantage: ${brief.knowledgeEngine.proprietaryFramework.howItBeatsTheSerp}
Pillars: ${brief.knowledgeEngine.proprietaryFramework.corePillars.map((p: any) => `${p.name} (${p.underlyingInsight})`).join("; ")}
Reference the framework by name in at least 2 sections. Each pillar should map to a specific H2.
` : ""}
${brief.knowledgeEngine?.algorithmicInsights?.length ? `## PRACTITIONER INSIGHTS (from Knowledge Engine — use for Information Gain)
These insights were generated from topic graph gaps and current facts. Weave them naturally into relevant sections:
${brief.knowledgeEngine.algorithmicInsights.map((i: any) => `- [${i.type.toUpperCase()}] ${i.headline}: ${i.explanation}${i.supportingDataPoint ? ` (Data: ${i.supportingDataPoint})` : ""}`).join("\n")}
` : ""}
${brief.competitorDifferentiation?.trim() ? `## COMPETITOR DIFFERENTIATION (avoid these patterns)\n${brief.competitorDifferentiation.trim()}\n\nDeliberately avoid the phrases, section structures, and intro styles described above so the article does not read like AI-generated competitor content.\n` : ""}${(brief.povInsights?.length ?? 0) > 0 ? `## POV / INFORMATION GAIN (use these to differentiate)
These are contrarian or nuanced angles that most competitors miss. Weave them naturally into the relevant sections to increase Information Gain.
${brief.povInsights!.map((p) => `- Topic: ${p.topic}. Most say: "${p.conventionalView}". But: "${p.contrarian}" (source: ${p.source}).`).join("\n")}
` : ""}${sanitizeUserInput(fieldNotes) ? `## FIELD DATA (real-world experience, integrate naturally for E-E-A-T)
The following are raw notes/quotes from the author. Weave these "I did this" moments into relevant sections. Do not use them as block quotes; rephrase naturally to match the article voice. Attribute to the author's experience when appropriate. These real-world signals are the strongest E-E-A-T differentiator.

${sanitizeUserInput(fieldNotes)}
` : ""}## CURRENT DATA — ZERO HALLUCINATION
${factsBlock}
Every number in the article must trace back to a fact above. The audit system will cross-check.

## EDITORIAL STYLE
${styleBlock}
${buildVoiceConstraintsBlock(voice)}
${sanitizeUserInput(toneExamples) ? `
## TONE CALIBRATION (match this voice)
The following is a sample of the client's existing writing. Match the tone, vocabulary level, sentence rhythm, and personality. Do NOT copy the content — only calibrate your voice to sound like this author:

"""${sanitizeUserInput(toneExamples)}"""
` : ""}

## GEO & FAQ
- Direct answer: ${brief.geoRequirements.directAnswer}
- Stats density: ${brief.geoRequirements.statDensity}
- Entities: ${brief.geoRequirements.entities}
- FAQ (REQUIRED — critical for AI SEO): The last H2 MUST be "Frequently Asked Questions" with 5-8 H3 questions and concise <p> answers.
  - Each answer: max 300 characters. Write the answer in the first sentence, then add one unique insight.
  - Each answer must teach something NEW (so-what, comparison, caveat, next step). NEVER repeat body content.
  - Google Featured Snippets, AI Overviews, Perplexity, and ChatGPT Search extract FAQ blocks directly. This section is the highest-value AI SEO asset in the article.
${brief.geoRequirements.faqStrategy ? `- FAQ strategy: ${brief.geoRequirements.faqStrategy}` : ""}
${brief.faqPlan?.length ? `- FAQ plan (use as basis):\n${brief.faqPlan.map((f) => `  Q: ${f.question}`).join("\n")}` : ""}

## WORD COUNT
Target: ${brief.wordCount.target} words (±5% total). Section targetWords sum to ${brief.outline.estimatedWordCount}. Each section ±10%.
${brief.wordCount.note}

${TIER_3_QUALITY}

## OUTPUT (valid JSON only)
{
  "content": "<p>...</p><h2>...</h2>...<h2>References</h2><ol><li><a href=\"URL\" target=\"_blank\" rel=\"noopener noreferrer\">Source Name</a></li>...</ol>",
  "suggestedCategories": ["cat1", "cat2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}
The content MUST end with a References section (after FAQ) listing all inline citations as a numbered <ol>. No text outside the JSON. If approaching token limit, shorten middle sections but complete FAQ and References.`;


  const modelId = DRAFT_MODEL_IDS[draftModel] ?? CLAUDE_DEFAULT_MODEL;
  const systemPrompt = buildSystemPrompt(voice, customVoiceDescription);
  const draftTemperature = voice ? getVoiceTemperature(voice) : ((intent === "informational" || intent === "commercial") ? 0.35 : 0.5);
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
  customVoiceDescription?: string,
  intent?: string,
  authorContext?: { authorName?: string; authorBio?: string; authorExpertise?: string },
  industry?: string,
  allSourceUrls?: string[],
  semanticTerms?: { term: string; recommendedCount: number; tfidf: number }[]
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
  // Strip specific numbers from previousContent to prevent the model from echoing stats it sees in context
  const sanitizedPrevious = previousContent.trim().length > 0
    ? previousContent.slice(-4000).replace(/\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|percent|billion|million|trillion|x)\b/gi, "[stat cited]")
    : "";
  const contextBlock = sanitizedPrevious.length > 0
    ? `\n## PREVIOUS SECTIONS (Content written so far)\nDo NOT repeat any information, statistic, or community quote already covered. Each stat and quote is single-use across the entire article. Continue naturally from where this leaves off.\n\n${sanitizedPrevious}\n`
    : "";

  const frameworkBlock = brief.knowledgeEngine?.proprietaryFramework
    ? `\n## PROPRIETARY FRAMEWORK (Core thesis)\nName: ${brief.knowledgeEngine.proprietaryFramework.name}\nTagline: ${brief.knowledgeEngine.proprietaryFramework.tagline}\nHow it beats standard SERP advice: ${brief.knowledgeEngine.proprietaryFramework.howItBeatsTheSerp}\nCore Pillars: ${brief.knowledgeEngine.proprietaryFramework.corePillars.map((p: any) => p.name).join(", ")}\nEmbed this framework naturally if it fits the section topics. Do NOT force it if irrelevant.\n`
    : "";

  const insightsBlock = brief.knowledgeEngine?.algorithmicInsights && brief.knowledgeEngine.algorithmicInsights.length > 0
    ? `\n## PRACTITIONER INSIGHTS (Information Gain)\nThese are non-obvious insights generated to beat competitors. Weave them in if relevant to this section's topics:\n${brief.knowledgeEngine.algorithmicInsights.map((i: any) => `- [${i.type.toUpperCase()}] ${i.headline}: ${i.explanation}`).join("\n")}\n`
    : "";

  const clusterBlock = brief.clusterPosition && brief.clusterPosition !== "standalone"
    ? `\n## CLUSTER POSITION: ${brief.clusterPosition.toUpperCase()}\n${brief.clusterPosition === "pillar"
      ? "PILLAR page: comprehensive hub. Cover this section's topics thoroughly — readers should feel they don't need another source. Mention related subtopics briefly and link to deeper content where it exists."
      : `SPOKE page: deep specialization.${brief.clusterTopic ? ` Reference the broader topic "${brief.clusterTopic}" if natural for this section.` : ""} Go deeper than a pillar would — add extra examples, edge cases, and practitioner insights.`}\n${brief.internalLinkSuggestions?.length ? `Related cluster articles (reference if relevant to this section):\n${brief.internalLinkSuggestions.slice(0, 5).map((l) => `- ${l.url}`).join("\n")}\n` : ""}`
    : "";

  // Detect FAQ section by heading
  const isFaqSection = /faq|frequently asked/i.test(section.heading);

  // Build FAQ plan block if available
  const faqPlanBlock = isFaqSection && brief.faqPlan?.length
    ? `\n## FAQ PLAN (use these as basis — rephrase for natural voice)\n${brief.faqPlan.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n")}\n`
    : "";

  // FAQ-specific output instructions
  const faqInstructions = isFaqSection
    ? `\n## FAQ FORMATTING (STRICT REQUIREMENTS)
This is a Frequently Asked Questions section. It is CRITICAL for AI SEO (Google Featured Snippets, AI Overviews, Perplexity, ChatGPT Search).
- Output 5-8 question/answer pairs.
- Each question MUST be an <h3> tag: <h3>Question text here?</h3>
- Each answer MUST be a single <p> tag immediately after the <h3>.
- Each answer MUST be under 300 characters (the validation system will truncate longer answers).
- Each answer must teach something NEW — a so-what, comparison, caveat, concrete next step, or forward look. NEVER condense or repeat what the body already said.
- Use conversational, direct language. Answer the question in the first sentence, then add one insight.
- Include the primary keyword naturally in 2-3 of the answers.
${faqPlanBlock}`
    : "";

  const userPrompt = `Write the content for ONE section of a blog post. The system injects the H2 heading — do NOT include it. Write only the body content under "${section.heading}".
${contextBlock}
${frameworkBlock}
${insightsBlock}
${clusterBlock}
${styleChecklist}

## SECTION ASSIGNMENT
You are writing the section: "${section.heading}"
- Target word count: ${section.targetWords} words. You MUST hit this target (±10%).
- Topics to cover: ${section.topics.join(", ")}
${section.targetWords > 150 && !isFaqSection ? `- STRUCTURE: This section is ${section.targetWords} words — use 2-3 <h3> sub-headings to break it up. Walls of text under a single H2 hurt readability and SEO. Each H3 should cover a distinct sub-topic.` : ""}
${section.geoNote ? `- GEO Constraint: ${section.geoNote}` : ""}
${section.aiOverviewTarget ? `- AI Overview target: "${section.aiOverviewTarget}" (Directly answer this in the first 2-3 sentences of this section)` : ""}
${section.sectionHook ? `- OPENING HOOK (mandatory): Open this section with a "${section.sectionHook}" approach. Do NOT open with a definition, "X means...", "X refers to...", or "X is...". Start with something that hooks the reader immediately.` : `- OPENING HOOK: Do NOT open with a definition. Start with a pain point, bold claim, question, or financial outcome.`}
${section.visualSuggestion ? `- VISUAL ASSET PLANNED: "${section.visualSuggestion}". Write natural transitions that accommodate this visual (e.g. "As the comparison below shows..." or "The workflow diagram illustrates...").` : ""}
${isFirstSection && primaryKeyword ? `\nFATAL ERROR: You MUST include the exact phrase "${primaryKeyword}" within the first 2 paragraphs of this section to establish SEO relevance.\n- FEATURED SNIPPET: Write a 40-60 word definition paragraph near the top that directly answers "What is ${primaryKeyword}?" in a concise, factual voice. This paragraph targets Google's featured snippet and AI Overview extraction.` : ""}
${faqInstructions}

${brief.keyword.secondary?.length ? `## SEMANTIC KEYWORDS (weave naturally — do NOT force)\nInclude 2-4 of these related terms where they fit the context: ${brief.keyword.secondary.join(", ")}.\nDo NOT stuff them. Use synonyms, related phrases, and natural variations.\n` : ""}
${semanticTerms && semanticTerms.length > 0 ? `## TOPICAL COVERAGE TERMS — CRITICAL FOR CONTENT SCORE (from TF-IDF competitor analysis)
Top-ranking competitors use these terms extensively. Your content score depends heavily on including them.
**YOU MUST use at least 5-8 of these terms in this section.** Work them into sentences, headings, lists, or examples — wherever they fit the topic.
${semanticTerms.filter(t => t.term.toLowerCase() !== primaryKeyword?.toLowerCase()).slice(0, 20).map(t => `- "${t.term}" (target: ~${t.recommendedCount}x across full article)`).join("\n")}
After writing, mentally check: did you use at least 5 terms from this list? If not, revise to include more.
IMPORTANT: Do NOT over-repeat the primary keyword "${primaryKeyword ?? brief.keyword.primary}". Use synonyms, pronouns, and related terms instead after the first mention. Target keyword density under 2.5%.
` : `${primaryKeyword ? `\nIMPORTANT: Do NOT over-repeat the primary keyword "${primaryKeyword}". After the first natural mention, use synonyms, pronouns ("it", "this format", "the syntax"), and related terms. Target keyword density under 2.5%.\n` : ""}`}
## CURRENT DATA — ZERO HALLUCINATION
${factsBlock}
${currentDataWarning}
## INLINE CITATIONS — MANDATORY
Every factual claim, statistic, percentage, named tool feature, or attributed statement MUST have an inline citation. Format: \`<sup><a href="SOURCE_URL" target="_blank" rel="noopener noreferrer">[N]</a></sup>\` placed immediately after the claim.

**Citation rules:**
- MINIMUM ${Math.max(2, Math.ceil(section.targetWords / 250))} citations in this section (non-negotiable)
- Cite every stat, dollar amount, percentage, growth figure, benchmark, and named study
- Cite factual claims about tools, platforms, or specifications using the source URL
- Common knowledge (e.g. "Markdown uses # for headings") does NOT need citation
- Reuse the same citation number if multiple nearby facts come from the same source
- Use source URLs from the data above. If a fact has a Source field, that IS the citation URL
${allSourceUrls && allSourceUrls.length > 0 ? `\nAvailable source URLs for citations (use when making factual claims about these sources):\n${allSourceUrls.map(u => `- ${u}`).join("\n")}\n` : ""}
${previousContent.trim().length > 0 ? (() => { const citationMatches = previousContent.match(/\[(\d+)\]/g); const lastNum = citationMatches ? Math.max(...citationMatches.map(m => parseInt(m.replace(/\[|\]/g, ""), 10))) : 0; return lastNum > 0 ? `Start YOUR citations at [${lastNum + 1}].` : "Start citations at [1]."; })() : "Start citations at [1]."}
${redditQuotes?.length ? `\n## COMMUNITY QUOTES (weave naturally if relevant)
Vary attribution: "one engineer on a developer forum shared...", "a practitioner in an online community reported...", "as one user put it...". Never use "One practitioner noted." Never name Reddit or specific subreddits.
${redditQuotes.map(q => `- ${q}`).join("\n")}\n` : ""}
${sanitizeUserInput(fieldNotes) ? `\n## FIELD DATA (real-world experience)
${sanitizeUserInput(fieldNotes)}\n` : ""}
${sanitizeUserInput(toneExamples) ? `\n## TONE CALIBRATION
Match this voice:\n"""${sanitizeUserInput(toneExamples)}"""\n` : ""}
${buildVoiceConstraintsBlock(voice)}
${getIntentModifier(intent) ? `\n${getIntentModifier(intent)}\n` : ""}${getIndustryModifier(industry) ? `\n${getIndustryModifier(industry)}\n` : ""}
${authorContext?.authorName ? `
## AUTHOR CONTEXT (E-E-A-T signals)
Author: ${authorContext.authorName}${authorContext.authorExpertise ? ` — ${authorContext.authorExpertise}` : ""}${authorContext.authorBio ? `\nBio: ${authorContext.authorBio}` : ""}
Write as if this author is sharing their professional perspective. Naturally weave in first-person experience signals where relevant ("in my experience", "I've seen teams that...", "what I recommend is..."). Do NOT over-reference the author name — let the expertise show through specific, practitioner-level insights.` : ""}

${isFaqSection ? "" : TIER_3_QUALITY}

## OUTPUT
Return ONLY valid JSON. No H2 tag for the section title. All sub-headings must use <h3> HTML tags. Straight quotes only, no em-dashes.
{ "content": "${isFaqSection ? "<h3>Question?</h3><p>Answer under 300 chars.</p><h3>Question?</h3><p>Answer.</p>..." : "<p>...</p><h3>...</h3><p>...</p>"}" }
`;


  const modelId = DRAFT_MODEL_IDS[draftModel] ?? CLAUDE_DEFAULT_MODEL;
  const sectionSystemPrompt = buildSystemPrompt(voice, customVoiceDescription);
  const sectionTemperature = voice ? getVoiceTemperature(voice) : ((intent === "informational" || intent === "commercial") ? 0.35 : 0.5);
  const startMs = Date.now();

  const stream = anthropic.messages.stream({
    model: modelId,
    max_tokens: 8192,
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

  // Detect truncation at section level
  const sectionStopReason = (message as { stop_reason?: string }).stop_reason;
  if (sectionStopReason === "max_tokens") {
    console.warn("[writeDraftSection] Response TRUNCATED at max_tokens — will attempt partial recovery");
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
    if (!parsed.content) {
      console.warn("[writeDraftSection] Claude returned empty or falsy content field — section will be blank");
      return "";
    }
    return parsed.content;
  } catch (err) {
    // If repair fails, fall back to tolerant extraction of the "content" string
    console.error("[writeDraftSection] JSON parse failed, attempting tolerant content extraction", err);

    // Use a safer search that specifically targets the JSON key pattern `"content":`
    const contentKeyMatch = /"content"\s*:/g.exec(jsonText);
    const keyIndex = contentKeyMatch ? contentKeyMatch.index : -1;
    if (keyIndex === -1) {
      // Last resort: if Claude returned raw HTML without JSON wrapper, use it directly
      const rawText = contentBlock.text.trim();
      if (rawText.includes("<h2") || rawText.includes("<h3") || rawText.includes("<p>")) {
        console.warn("[writeDraftSection] No JSON wrapper found — using raw HTML response as content");
        return rawText;
      }
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
  if (html.startsWith("```html")) html = html.slice(7).replace(/^\n/, "");
  else if (html.startsWith("```")) html = html.slice(3).replace(/^\n/, "");
  if (html.endsWith("```")) html = html.slice(0, -3).replace(/\n$/, "");

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

  const systemPrompt = `You generate title/meta/slug for articles in a content pipeline. The article is already written — your meta must accurately reflect the actual content. The audit system validates your output against Rank Math and Google Search Central rules.

AUDIT RULES (violations block publication):
${auditRules}

VARIANT STRATEGY (options must be genuinely different approaches, not word swaps):
• optionA: Sentiment + power words. E.g. "Proven Guide to...", "Avoid These [X] Mistakes..."
• optionB: Numbers + action. MUST contain a number (year, count, or stat from the article). E.g. "7 Tips for...", "How to [X] in 2026", "5 Ways to..."
At least ONE option MUST contain a number. Numbers in titles improve CTR by 15-36% (Rank Math audit checks for this).

ACCURACY RULE: Title must match content. No exaggeration. If the article covers 5 tips, do not claim 10. Superlatives ("best", "ultimate", "complete") must be justified by the article's actual scope.

GUIDANCE:
• Search intent: ${intentGuidance}
• Title: front-load the primary keyword. Strongly prefer including a specific number (year, count, percentage) — numbers improve CTR 15-30%. If the content doesn't naturally support a number, omit rather than force.
• Meta: compelling pitch (not a dry summary). Include keyword naturally in first 120 chars. MUST include at least one specific number (stat, percentage, year, or count from the article) — numbers in meta descriptions improve CTR and signal data-backed content.
• Slug: concise, keyword-rich. Omit articles (a, the) and prepositions.

Return ONLY valid JSON:
{"optionA":{"title":"...","metaDescription":"...","suggestedSlug":"..."},"optionB":{"title":"...","metaDescription":"...","suggestedSlug":"..."}}`;

  const headingsBlock = headings.length > 0
    ? `\nArticle structure (H2s):\n${headings.map((h) => `- ${h}`).join("\n")}\n`
    : "";

  const userMessage = `Primary keyword: "${primaryKeyword}"
Search intent: ${intent}
${headingsBlock}
Article content (first part):
${fullExcerpt}

Generate two distinct meta options. Return JSON only.`;

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

  const systemPrompt = `Generate 7 distinct SEO title options for A/B testing. Each title must include "${primaryKeyword}" and be max 60 characters.

STRATEGIES (one per title):
1) Number/Listicle ("7 Ways to...")
2) How-To/Guide ("How to [X] in 2026")
3) Question/Curiosity Gap ("Is [X] Actually Worth It?")
4) Negative Angle ("5 [X] Mistakes That Cost You...")
5) Contrarian ("Why [Common Advice] Is Wrong")
6) Comprehensive ("The Complete [X] Playbook")
7) Benefit-Driven ("[X]: Get [Specific Outcome]")

Each title must accurately reflect the article content. No exaggeration. Rate CTR potential (High/Medium) based on emotional pull + specificity.
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

const HALLUCINATION_FIX_SYSTEM = `You are a precision editor in a content pipeline. The fact-verification system flagged specific hallucinations. You fix ONLY those flags.

INPUTS: (1) Article HTML, (2) Hallucination flags from the fact-checker, (3) Verified facts from currentData.

RULES:
- For each flagged hallucination, rewrite the sentence containing it and up to one adjacent sentence if needed for flow. Do not delete sentences — rewrite to preserve readability.
- If a verified currentData fact can naturally replace the hallucinated claim, use it (set replacedWithVerifiedFact: true).
- If no replacement fits, rewrite the sentence to make the same point qualitatively. If removing the stat leaves a claim without evidence, hedge it: "industry observers suggest" or "early indicators show" (set replacedWithVerifiedFact: false).
- Do NOT touch content outside the immediate vicinity of each flag.
- Preserve ALL HTML structure, tags, headings, and formatting exactly.
- Fix ONLY items in the hallucinations list. Do not second-guess other numbers.

OUTPUT FORMAT:
1. Complete fixed HTML (full article with edits).
2. On a new line, exactly: HALLUCINATION_FIXES:
3. JSON array: [{ "originalText": "...", "replacement": "...", "reason": "...", "replacedWithVerifiedFact": true/false }]
No markdown code fences.`;

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
const AUDIT_FIX_TIMEOUT_MS = 60_000;

export async function fixAuditIssues(
  draftHtml: string,
  auditFailures: string[],
  tokenUsage?: TokenUsageRecord[]
): Promise<string> {
  if (auditFailures.length === 0) return draftHtml;

  const anthropic = getAnthropicClient();
  const startMs = Date.now();

  const system = `You are the audit-fix editor in a content pipeline. The automated audit system flagged these failures:
${auditFailures.map(f => `- ${f}`).join("\n")}

Fix ONLY the listed issues. Preserve the author's voice, all HTML structure, headings, statistics, and facts.

PRIORITY:
- Level 1 = publication blockers. Every Level 1 must be resolved.
- Level 2 = ranking factors. Fix without restructuring.

FIX INSTRUCTIONS BY TYPE:
- **Typography** (em-dashes, curly quotes): Character-level replacement only. Em-dash → comma or colon. En-dash → hyphen. Curly quotes → straight quotes. Do not rewrite surrounding text.
- **Keyword placement**: Weave naturally into the first paragraph or relevant subheading. Do not force awkward phrasing.
- **Paragraph length** (>120 words): Split at a natural sentence boundary. Do not remove content.
- **Structural** (missing lists, paragraph formatting): You may rewrite the affected paragraph to add a list or split structure.
- **Symbols/phrases** (!! or ... or AI phrases): Replace with specific language or remove.

Return ONLY the raw fixed HTML. No markdown blocks, no JSON wrapper, no explanation.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUDIT_FIX_TIMEOUT_MS);
  try {
  const stream = anthropic.messages.stream(
    {
    model: CLAUDE_DEFAULT_MODEL,
    max_tokens: 32000,
    temperature: 0.2,
    system: [{ type: "text" as const, text: system, cache_control: { type: "ephemeral" as const } }],
    messages: [{ role: "user", content: draftHtml }],
    },
    { signal: controller.signal }
  );
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
  if (html.startsWith("```html")) html = html.slice(7).replace(/^\n/, "");
  else if (html.startsWith("```")) html = html.slice(3).replace(/^\n/, "");
  if (html.endsWith("```")) html = html.slice(0, -3).replace(/\n$/, "");

  return html.trim() || draftHtml;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[fixAuditIssues] Timeout — returning original content");
    } else {
      console.error("[fixAuditIssues]", err);
    }
    return draftHtml;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Section-level regeneration (Post-generation chatbot)
// ---------------------------------------------------------------------------

/** Extract a section from HTML by its H2 heading text. */
export function extractSection(html: string, heading: string): {
  before: string;
  section: string;
  after: string;
} {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(<h2[^>]*>\\s*${escaped}\\s*<\\/h2>)`,
    "i"
  );
  const match = html.match(pattern);
  if (!match || match.index === undefined) {
    return { before: html, section: "", after: "" };
  }

  const sectionStart = match.index;
  const afterHeading = sectionStart + match[0].length;
  const nextH2 = html.slice(afterHeading).search(/<h2[\s>]/i);
  const sectionEnd = nextH2 === -1 ? html.length : afterHeading + nextH2;

  return {
    before: html.slice(0, sectionStart),
    section: html.slice(sectionStart, sectionEnd),
    after: html.slice(sectionEnd),
  };
}

/**
 * Regenerate a single section of an article based on user instructions.
 * Used by the post-generation chatbot for targeted edits.
 */
/** Internal link to be placed in a regenerated section. */
export type ChatInternalLink = {
  url: string;
  anchorText?: string;
};

export async function regenerateSection(
  fullArticleHtml: string,
  sectionHeading: string,
  userInstructions: string,
  brief: ResearchBrief,
  tokenUsage?: TokenUsageRecord[],
  internalLinks?: ChatInternalLink[]
): Promise<{ updatedHtml: string; sectionHtml: string }> {
  const anthropic = getAnthropicClient();
  const { before, section, after } = extractSection(fullArticleHtml, sectionHeading);

  if (!section) {
    throw new Error(`Section "${sectionHeading}" not found in article`);
  }

  const prevContext = before.slice(-800);
  const nextContext = after.slice(0, 800);
  const originalWordCount = section.split(/\s+/).filter(Boolean).length;

  const factsBlock = brief.currentData.facts.length > 0
    ? `Current data (use ONLY these for statistics):\n${brief.currentData.facts.map((f) => `- ${f.fact} (Source: ${f.source})`).join("\n")}`
    : "No current data. Do not invent statistics.";

  const internalLinksBlock = internalLinks && internalLinks.length > 0
    ? `\n## INTERNAL LINKS TO INCLUDE
Place these links naturally within the section. Use the provided anchor text, or create contextually appropriate anchor text if none is given. Links must feel editorial, not forced.

${internalLinks.map((l) => `- <a href="${l.url}">${l.anchorText || "contextual anchor text"}</a>`).join("\n")}

Rules:
- Place each link on its first natural mention of the related topic.
- Never cluster multiple links in one paragraph.
- Anchor text must read naturally in the sentence — no "click here" or naked URLs.
- Maximum ${Math.min(internalLinks.length, 3)} internal links in this section.
`
    : "";

  const userPrompt = `Rewrite the section under "${sectionHeading}". This is a targeted edit in a post-generation chatbot — the user is refining a specific section of their published article.

## USER INSTRUCTIONS
${userInstructions}

## ORIGINAL SECTION
${section}

## SURROUNDING CONTEXT (match transitions)
Previous section ending:
${prevContext}

Next section beginning:
${nextContext}
${internalLinksBlock}
## CONSTRAINTS
- Preserve the section's role and position in the article's argument flow.
- Word count: ${originalWordCount} words (±15%).
- Maintain consistent terminology with the rest of the article.
- If the user's instructions introduce new data, integrate it naturally — do not append it.
- Editorial style: ${brief.editorialStyle.tone}, ${brief.editorialStyle.pointOfView ?? "third"} person.
- ${factsBlock}

## OUTPUT
Return ONLY the complete section HTML including the H2 tag. No markdown wrapping, no explanation, no content from other sections.`;

  const startMs = Date.now();
  const stream = anthropic.messages.stream({
    model: CLAUDE_OPUS_MODEL,
    max_tokens: 4000,
    temperature: 0.35,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) tokenUsage.push({
    callName: "regenerateSection",
    model: CLAUDE_OPUS_MODEL,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.promptTokens + usage.completionTokens,
    durationMs,
  });

  const contentBlock = message.content?.[0];
  if (!contentBlock || contentBlock.type !== "text") {
    return { updatedHtml: fullArticleHtml, sectionHtml: section };
  }

  let newSection = contentBlock.text.trim();
  if (newSection.startsWith("```html")) newSection = newSection.slice(7);
  else if (newSection.startsWith("```")) newSection = newSection.slice(3);
  if (newSection.endsWith("```")) newSection = newSection.slice(0, -3);
  newSection = newSection.trim();

  if (!newSection) {
    return { updatedHtml: fullArticleHtml, sectionHtml: section };
  }

  const updatedHtml = before + newSection + after;
  return { updatedHtml, sectionHtml: newSection };
}

/**
 * Organic brief revision — patches an existing approved brief based on user instructions.
 * Unlike buildResearchBrief which starts from extraction data, this takes the existing
 * brief as baseline and applies targeted changes, preserving what the user already approved.
 */
export async function reviseBrief(
  existingBrief: ResearchBrief,
  revisionInstructions: string,
  topics: TopicExtractionResult,
  currentData: CurrentData,
  input: PipelineInput,
  wordCountOverride?: WordCountOverride,
  tokenUsage?: TokenUsageRecord[],
  structuredEdits?: {
    sectionEdits?: Array<{ heading: string; action: string; newHeading?: string; newPosition?: number }>;
    addSections?: Array<{ heading: string; afterSection?: string; reason?: string }>;
  }
): Promise<ResearchBrief> {
  const anthropic = getAnthropicClient();

  const systemPrompt = `You are revising an existing content brief that the user has already approved. Your job is to apply ONLY the changes the user requests while preserving everything else exactly as-is.

## CRITICAL RULES
1. The existing brief is the BASELINE. Do NOT rebuild from scratch.
2. Sections the user did not mention must remain IDENTICAL — same heading, targetWords, topics, geoNote, aiOverviewTarget, reason.
3. When adding sections, distribute word count from existing sections or increase total — never leave other sections starved.
4. When removing sections, redistribute their word count to remaining sections proportionally.
5. All SEO requirements from the original brief must be preserved (keyword placement, density rules, geoNotes, aiOverviewTargets).
6. The sum of all section targetWords must equal the wordCount.target (±5%).
7. Maintain the same editorial style, tone, and point of view unless the user explicitly asks to change them.
8. Keep all knowledgeEngine data references (topicGraph, algorithmicInsights, proprietaryFramework) intact.
9. Preserve povInsights, faqPlan, gaps, similaritySummary, extraValueThemes, freshnessNote unless the user's changes directly affect them.

## OUTPUT
Return the COMPLETE revised ResearchBrief as valid JSON (same schema as the original). No markdown fences, no explanation. Include ALL fields from the original — this replaces it entirely.`;

  // Build the structured edits block
  let structuredEditsBlock = "";
  if (structuredEdits?.sectionEdits?.length) {
    structuredEditsBlock += "\n\n## STRUCTURED SECTION EDITS\n";
    for (const edit of structuredEdits.sectionEdits) {
      switch (edit.action) {
        case "remove":
          structuredEditsBlock += `- REMOVE section: "${edit.heading}"\n`;
          break;
        case "rename":
          structuredEditsBlock += `- RENAME section "${edit.heading}" → "${edit.newHeading}"\n`;
          break;
        case "reorder":
          structuredEditsBlock += `- MOVE section "${edit.heading}" to position ${edit.newPosition}\n`;
          break;
        case "keep":
          structuredEditsBlock += `- KEEP section "${edit.heading}" unchanged\n`;
          break;
      }
    }
  }
  if (structuredEdits?.addSections?.length) {
    structuredEditsBlock += "\n## NEW SECTIONS TO ADD\n";
    for (const add of structuredEdits.addSections) {
      structuredEditsBlock += `- Add "${add.heading}"${add.afterSection ? ` after "${add.afterSection}"` : " at the end"}${add.reason ? ` (reason: ${add.reason})` : ""}\n`;
    }
  }

  // Serialize the existing brief (omit currentData and knowledgeEngine to save tokens)
  const { currentData: _cd, knowledgeEngine: _ke, ...briefWithoutLargeFields } = existingBrief;
  const existingBriefJson = JSON.stringify(briefWithoutLargeFields, null, 2);

  // Detect significant word count increase to trigger gap-filling behavior
  const existingWordCount = existingBrief.outline?.sections?.reduce((sum, s) => sum + (s.targetWords || 0), 0) ?? 0;
  const isSignificantIncrease = wordCountOverride && existingWordCount > 0 && wordCountOverride.target > existingWordCount * 1.3;

  // Compact extraction context — richer when word count is increasing significantly
  const extractionContext = JSON.stringify(isSignificantIncrease ? {
    topics: topics.topics.slice(0, 20).map(t => ({ name: t.name, importance: t.importance })),
    gaps: topics.gaps.slice(0, 10),
    primaryKeyword: input.primaryKeyword,
    competitorHeadings: topics.competitorHeadings?.slice(0, 30),
  } : {
    topics: topics.topics.slice(0, 10).map(t => ({ name: t.name, importance: t.importance })),
    gaps: topics.gaps.slice(0, 5),
    primaryKeyword: input.primaryKeyword,
  });

  const wordCountNote = wordCountOverride
    ? isSignificantIncrease
      ? `\n\nNEW WORD COUNT TARGET: ${wordCountOverride.target} words (up from ~${existingWordCount}).

IMPORTANT — INTELLIGENT EXPANSION (word count increased by ${Math.round(((wordCountOverride.target - existingWordCount) / existingWordCount) * 100)}%):

Your goal: after reading this article, the reader should NEVER need to click back to search results, visit another article, or ask an AI chatbot. Complete satisfaction.

STEP 1 — EVALUATE EXISTING COVERAGE:
Look at the existing sections and compare them against the RESEARCH CONTEXT (gaps, competitor headings, topics). Ask: "Does this outline already cover every important subtopic?" If yes, the existing sections need MORE DEPTH, not more sections.

STEP 2 — DEEPEN EXISTING SECTIONS FIRST (primary strategy):
- Identify sections that directly answer search intent or cover high-importance topics. Give these 30-60% more words.
- Add more practitioner depth: edge cases, real-world gotchas, specific tool comparisons, concrete examples, data points, step-by-step walkthroughs.
- Add sub-sections (H3s) within existing H2s to break up the added depth.
- Keep thin sections thin — FAQ answers, definitions, and transitional sections stay at their current size.

STEP 3 — ADD NEW SECTIONS ONLY FOR REAL GAPS:
- Check the RESEARCH CONTEXT gaps and competitor headings. If there is a genuinely important subtopic that NO existing section covers AND that a reader would need to search separately for, add 1-2 new H2 sections.
- Do NOT add sections just to hit the word count. Every new section must pass this test: "Would a reader leave the article to search for this topic if it were missing?"
- If no real gaps exist, distribute ALL extra words into existing sections as deeper coverage.

STEP 4 — FINAL CHECK:
- The sum of all section targetWords must equal ${wordCountOverride.target} (±5%).
- Every additional word must teach something new. Padding is worse than a shorter article.

Use the RESEARCH CONTEXT below to evaluate gaps vs existing coverage.`
      : `\n\nNEW WORD COUNT TARGET: ${wordCountOverride.target} words. Adjust section targetWords to meet this total.`
    : "";

  const userPrompt = `## EXISTING APPROVED BRIEF
${existingBriefJson}

## USER'S REVISION INSTRUCTIONS
${revisionInstructions}${structuredEditsBlock}${wordCountNote}

## RESEARCH CONTEXT (for adding new content only)
${extractionContext}

Apply the user's changes to the existing brief. Return the complete revised brief JSON.`;

  const startMs = Date.now();
  const stream = anthropic.messages.stream({
    model: CLAUDE_OPUS_MODEL,
    max_tokens: 8192,
    temperature: 0.15,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();

  const durationMs = Date.now() - startMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "reviseBrief",
      model: CLAUDE_OPUS_MODEL,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.promptTokens + usage.completionTokens,
      durationMs,
    });
  }

  const contentBlock = message.content[0];
  if (!contentBlock || contentBlock.type !== "text") {
    throw new Error("reviseBrief: Claude returned non-text response");
  }
  const content = contentBlock.text;
  if (!content?.trim()) {
    throw new Error("reviseBrief: empty response from Claude");
  }

  const raw = stripJsonMarkdown(content);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch (jsonErr) {
    throw new Error(`reviseBrief: JSON parse failed: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
  }

  const normalized = normalizeBriefOutput(parsed, input.primaryKeyword);
  const validated = ResearchBriefWithoutCurrentDataSchema.safeParse(normalized);

  if (!validated.success) {
    throw new Error(`reviseBrief: invalid schema: ${JSON.stringify(validated.error.flatten())}`);
  }

  // Merge back currentData and knowledgeEngine from the original
  const brief: ResearchBrief = {
    ...validated.data,
    currentData,
    knowledgeEngine: existingBrief.knowledgeEngine,
    clusterPosition: existingBrief.clusterPosition ?? input.clusterPosition ?? "standalone",
    ...(existingBrief.clusterTopic && { clusterTopic: existingBrief.clusterTopic }),
  };

  // Apply word count override if provided (same logic as buildResearchBrief)
  if (wordCountOverride && brief.outline?.sections?.length) {
    const sections = brief.outline.sections;
    const currentTotal = sections.reduce((sum, s) => sum + (s.targetWords || 0), 0);
    const target = Math.round(wordCountOverride.target);
    if (currentTotal > 0 && target > 0 && Math.abs(currentTotal - target) > target * 0.05) {
      const scaledSections = sections.map((s) => {
        const base = s.targetWords && s.targetWords > 0 ? s.targetWords : Math.max(50, Math.round(target / sections.length));
        const scaled = Math.max(50, Math.round((base * target) / currentTotal));
        return { ...s, targetWords: scaled };
      });
      const newTotal = scaledSections.reduce((sum, s) => sum + (s.targetWords || 0), 0);
      return {
        ...brief,
        wordCount: { ...wordCountOverride, target },
        outline: { ...brief.outline, sections: scaledSections, totalSections: scaledSections.length, estimatedWordCount: newTotal },
      };
    }
  }

  return brief;
}

/**
 * Step 3 — Brief: build strategic research brief (outline, H2/H3, word count from intent, keyword rules).
 * Uses Claude Opus for superior strategic reasoning and outline construction.
 * Validates with ResearchBriefSchema; retries once on schema failure.
 */
export async function buildResearchBrief(
  topics: TopicExtractionResult,
  currentData: CurrentData,
  input: PipelineInput,
  wordCountOverride?: WordCountOverride,
  tokenUsage?: TokenUsageRecord[],
  topicGraph?: any,
  algorithmicInsights?: any[],
  proprietaryFramework?: any
): Promise<ResearchBrief> {
  const anthropic = getAnthropicClient();
  const intent = Array.isArray(input.intent) ? input.intent[0] : input.intent ?? "informational";
  const pasf = input.peopleAlsoSearchFor ?? [];
  const secondary = input.secondaryKeywords ?? [];

  const systemPrompt = `You are the content strategist in a multi-model pipeline. Your output (a ResearchBrief JSON) is the ONLY input the writer model receives — no raw competitor data. Make it self-contained and decisive.

## PIPELINE CONTEXT
You receive: (1) extraction from Step 2 (topics, gaps, headings, editorial style, PAA analysis, competitor strengths), (2) currentData from Gemini (grounded facts), (3) Knowledge Engine outputs (topic graph, algorithmic insights, proprietary framework). You must use ALL of them. The writer model enforces TIER 1 typography/fact rules from its own system prompt — your job is strategic direction, not style enforcement.

---

## 1. AUDIT-CRITICAL REQUIREMENTS (the writer's audit system checks these)

**SEO (Rank Math):**
- At least one H2 heading must contain the EXACT primary keyword (not just a variant).
- Keyword must appear in first 10% of body + at least one subheading.
- Paragraphs max 120 words. Density < 3%. Title/meta/slug handled separately.

**GEO / AI Overview Targets (per-H2 aiOverviewTarget):**
- For every H2, write a 40-50 word Information Payload as aiOverviewTarget: [Definition] + [Statistic from currentData] + [Mechanism or rule]. No marketing language. This is what AI engines extract.
- In each section's geoNote, instruct the writer to include one citation-ready sentence (entity + verb + data point) within the first 3 sentences.

**Fact Integrity:**
- Every number must trace to currentData. For sections without data, note in geoNote: "Use qualitative language — no statistics available."

**Information Gain (povInsights):**
- Incorporate the Algorithmic Insights from the Knowledge Engine. Each povInsight must be a raw factual contrast: { topic, conventionalView, contrarian, source }. No conversational framing ("experts say") — data only. The writer adds practitioner voice.
- If a Proprietary Framework is provided, it MUST structure the article. Map each framework pillar to specific H2 sections. Competitor heading patterns yield to the framework when they conflict.

---

## 2. OUTLINE CONSTRUCTION

**Building the outline:**
- KEEP headings used by 3+ competitors. DROP headings used by only 1 unless they fill a gap. ADD new H2s for high-value gaps. ORDER by intent: informational (definition → how-to → advanced → FAQ), commercial (overview → comparison → pricing → recommendation), transactional (value prop → features → CTA).
- Never use "What is [Topic]?" headings. Use benefit-driven or curiosity-driven headings.
- Every H2 must map to either a competitor theme or a gap.

**Per-section fields:** heading, level (h2|h3), reason, topics, targetWords, geoNote (optional), aiOverviewTarget (required for H2s), visualSuggestion (optional).

**Gap prioritization (from extraction.gaps):**
- Strong readerDemand + strong actionableAngle → own H2
- One strong, one weak → fold as H3 or geoNote under closest H2
- Both weak → skip. Output only gaps you actually address.

**PAA integration:** Every paaAnalysis item with gapCandidate=true must map to an H3 or a "Must answer: [question]" in a section's topics/geoNote.

**H3 rule:** Any H2 covering 3+ distinct sub-points must break into H3s. Each H3 gets its own topics, targetWords, and geoNote.

**BLUF section (required):** Immediately after the intro, include an H2 with two H3s:
- "The Short Version" — 3-bullet answer/takeaway (ul/ol only)
- "Why It Matters in ${new Date().getFullYear()}" — 2-sentence market context

**FAQ section (REQUIRED for informational and commercial intent):**
- The LAST H2 in the outline MUST be "Frequently Asked Questions".
- Include 5-8 H3 sub-sections, each an H3 question heading with a concise answer paragraph.
- Target 200-300 words total for the FAQ section.
- Use PAA questions (paaAnalysis) as FAQ source material. Supplement with questions the article body raises but doesn't fully resolve.
- If faqPlan is provided in the input payload, use those Q&A pairs as the basis (you may rephrase or expand).
- This section is CRITICAL for AI SEO: Google Featured Snippets, AI Overviews, Perplexity, and ChatGPT Search all extract FAQ content directly.

**Content mix:** ~75% prose, ~25% lists. Every H2 section >200 words must contain at least one list (3-7 items). No HTML tables — lists only.

---

## 3. WORD COUNT & CLUSTER

**Word count:** Total = extraction.wordCount.recommended (or override). Distribute across sections using topic importance and recommendedDepth. Sum of targetWords must equal total. Article total ±5%.

**Cluster positioning:**
- "pillar": 20-30% more words than competitor avg. Cover ALL essential + recommended topics. Broad headings.
- "spoke": Standard word count. Deep on subtopic. Reference clusterTopic 1-2 times in geoNotes.
- "standalone": Default. Pass clusterPosition/clusterTopic through to output.

---

## 4. EDITORIAL STYLE & DIFFERENTIATION

**Style enforcement:** If 3+ competitors are "likely_ai", set editorialStyleFallback: true (use human-like defaults). Otherwise copy extraction's editorialStyle unchanged — pointOfView, tone (specific, not "professional"), realExamplesFrequency, dataDensity.

**Competitor differentiation:** For each "likely_ai" competitor, output 2-4 specific patterns to avoid (generic intros, phrases, structures). The writer will deliberately diverge.

**Best-version fields (required):**
- similaritySummary: 2-4 sentences on what top 5 competitors cover collectively
- extraValueThemes: 3-6 actionable strings (5-12 words each, specific not vague)
- freshnessNote: 1-2 sentences on freshness positioning

**E-E-A-T hooks:** Include geoNotes encouraging experience signals (failure narratives, practitioner observations) in at least 2 sections. Set dataDensity target for adequate stats.

---

## OUTPUT

Valid JSON only. No markdown fences. Do NOT include currentData (merged server-side).
Required keys: keyword, outline, gaps, editorialStyle, editorialStyleFallback, geoRequirements, seoRequirements, wordCount, similaritySummary, extraValueThemes, freshnessNote, competitorDifferentiation (if applicable), povInsights, faqPlan (array of {question, answer} with 5-8 Q&A pairs).`;

  // Keep payload compact to avoid timeouts and token limits
  const MAX_TOPICS = 14;
  const MAX_HEADINGS_PER_SOURCE = 10;
  const MAX_FACTS = 5;
  const MAX_DEVELOPMENTS = 5;

  const trimmedHeadings = topics.competitorHeadings.slice(0, 5).map((ch) => ({
    url: ch.url.slice(0, 80),
    h2s: ch.h2s.slice(0, MAX_HEADINGS_PER_SOURCE),
    h3s: ch.h3s.slice(0, MAX_HEADINGS_PER_SOURCE),
  }));

  const userPayload = JSON.stringify({
    extraction: {
      topics: topics.topics.slice(0, MAX_TOPICS),
      competitorHeadings: trimmedHeadings,
      gaps: topics.gaps,
      competitorStrengths: topics.competitorStrengths.slice(0, 5),
      editorialStyle: topics.editorialStyle,
      wordCount: topics.wordCount,
      paaAnalysis: topics.paaAnalysis ?? [],
    },
    currentData: {
      facts: currentData.facts.slice(0, MAX_FACTS),
      recentDevelopments: currentData.recentDevelopments.slice(0, MAX_DEVELOPMENTS),
      lastUpdated: currentData.lastUpdated,
    },
    input: {
      primaryKeyword: input.primaryKeyword,
      secondaryKeywords: secondary,
      peopleAlsoSearchFor: pasf,
      intent,
      clusterPosition: input.clusterPosition ?? "standalone",
      clusterTopic: input.clusterTopic,
    },
    knowledgeEngine: {
      topicGraph,
      algorithmicInsights,
      proprietaryFramework
    }
  });

  const userPromptBase = `Produce the ResearchBrief JSON for this extraction and input:\n\n${userPayload}`;
  const bestVersionHint = `\n\nIMPORTANT: Your response must include the best-version fields: similaritySummary (2-4 sentences on what top 5 cover), extraValueThemes (array of 3-6 short strings — what we add that they don't), and freshnessNote (1-2 sentences). Add them now.`;

  function hasBestVersionFields(n: Record<string, unknown>): boolean {
    const themes = n.extraValueThemes;
    const hasThemes = Array.isArray(themes) && themes.length >= 3;
    const hasSummary = typeof n.similaritySummary === "string" && (n.similaritySummary as string).trim().length > 0;
    const hasFreshness = typeof n.freshnessNote === "string" && (n.freshnessNote as string).trim().length > 0;
    return hasThemes && (hasSummary || hasFreshness);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const userPrompt = attempt === 2 ? userPromptBase + bestVersionHint : userPromptBase;
    try {
      const briefStartMs = Date.now();
      const stream = anthropic.messages.stream({
        model: CLAUDE_OPUS_MODEL,
        max_tokens: 8192,
        temperature: 0.1,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const message = await stream.finalMessage();

      const briefDurationMs = Date.now() - briefStartMs;
      const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
      if (tokenUsage) {
        tokenUsage.push({
          callName: "buildResearchBrief",
          model: CLAUDE_OPUS_MODEL,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.promptTokens + usage.completionTokens,
          durationMs: briefDurationMs,
        });
      }

      const contentBlock = message.content[0];
      if (!contentBlock || contentBlock.type !== "text") {
        throw new Error("buildResearchBrief: Claude returned non-text response");
      }
      const content = contentBlock.text;
      if (!content?.trim()) {
        throw new Error("buildResearchBrief: empty response from Claude");
      }
      const raw = stripJsonMarkdown(content);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch (jsonErr) {
        throw new Error(`buildResearchBrief: JSON parse failed after markdown stripping (attempt ${attempt}): ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
      }
      const normalized = normalizeBriefOutput(parsed, input.primaryKeyword);

      const validated = ResearchBriefWithoutCurrentDataSchema.safeParse(normalized);
      if (validated.success) {
        let brief = {
          ...validated.data,
          currentData,
          knowledgeEngine: { topicGraph, algorithmicInsights, proprietaryFramework },
          clusterPosition: input.clusterPosition ?? "standalone",
          ...(input.clusterTopic && { clusterTopic: input.clusterTopic }),
        } as ResearchBrief;

        // When a wordCountOverride is provided (revise flow), align the per-section
        // targetWords with the new total target so the outline and UI stay in sync.
        if (wordCountOverride && brief.outline?.sections?.length) {
          const sections = brief.outline.sections;
          const currentTotal = sections.reduce((sum, s) => sum + (s.targetWords || 0), 0);
          const target = Math.round(wordCountOverride.target);

          if (currentTotal > 0 && target > 0) {
            const scaledSections = sections.map((s) => {
              const base = s.targetWords && s.targetWords > 0 ? s.targetWords : Math.max(50, Math.round(target / sections.length));
              const scaled = Math.max(50, Math.round((base * target) / currentTotal));
              return { ...s, targetWords: scaled };
            });
            const newTotal = scaledSections.reduce((sum, s) => sum + (s.targetWords || 0), 0);
            brief = {
              ...brief,
              wordCount: { ...wordCountOverride, target },
              outline: {
                ...brief.outline,
                sections: scaledSections,
                totalSections: scaledSections.length,
                estimatedWordCount: newTotal,
              },
            };
          } else {
            brief = { ...brief, wordCount: wordCountOverride };
          }
        } else if (wordCountOverride) {
          brief = { ...brief, wordCount: wordCountOverride };
        }

        if (!hasBestVersionFields(normalized)) {
          if (attempt === 1) {
            if (process.env.NODE_ENV !== "test") {
              console.warn("[claude] buildResearchBrief: best-version fields missing, retrying with hint");
            }
            continue;
          }
          // Attempt 2: log warning but return what we have rather than looping forever
          if (process.env.NODE_ENV !== "test") {
            console.warn("[claude] buildResearchBrief: best-version fields still missing after retry, proceeding anyway");
          }
        }
        return brief;
      }
      lastError = validated.error;
      if (attempt === 1) {
        if (process.env.NODE_ENV !== "test") {
          console.warn("[claude] buildResearchBrief: schema validation failed, retrying with hint", validated.error.flatten());
        }
      } else {
        throw new Error(`buildResearchBrief: invalid schema after retry: ${JSON.stringify(validated.error.flatten())}`);
      }
    } catch (e) {
      if (attempt === 2) throw e;
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}