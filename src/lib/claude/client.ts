import Anthropic from "@anthropic-ai/sdk";
import { SEO } from "@/lib/constants";
import type {
  ResearchBrief,
  CurrentData,
  EditorialStyle,
  TitleMetaVariant,
  GapTopicWithAction,
} from "@/lib/pipeline/types";
import { ClaudeDraftOutputSchema } from "@/lib/pipeline/types";

let _client: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}

export type CompetitorContent = {
  url: string;
  content: string;
  success: boolean;
};

/** @deprecated Use pipeline writeDraft(ResearchBrief) instead. */
export type BlogGenerationInput = {
  keywords: string;
  peopleAlsoSearchFor?: string;
  intent?: string | string[];
  competitorContent?: CompetitorContent[];
};

export type BlogGenerationOutput = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
};

const INTENT_GUIDE = {
  informational:
    "How-to, guides, educational. No hard sell. Focus on teaching and answering questions. Use clear H2/H3 structure. Include an FAQ section (3-5 Q&As) for rich snippets.",
  navigational:
    "Direct users to a specific resource. Include clear navigation links and signposts.",
  commercial:
    "Compare options, soft sell, reviews. Include 'best of' lists, comparisons, pros/cons.",
  transactional:
    "Strong CTA. Focus on pricing, signup, or conversion. Clear next steps.",
};

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
//
// This prompt is designed around how AI detectors actually work:
//   1. Perplexity: how predictable each word is (token-level)
//   2. Burstiness: how much perplexity varies across the document
//   3. Neural classifiers: trained on AI vs human text patterns
//   4. Log probability curvature: AI text sits at probability peaks
//
// The goal: force the model to make less-probable token choices, vary
// predictability across sentences, and break the structural patterns
// classifiers are trained on — WITHOUT harming SEO.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a senior content writer with 10+ years of SEO experience. You write from personal experience — opinionated, specific, grounded in real details.

## How you write (non-negotiable writing DNA)

You write the way a real person with expertise writes a blog post. Not the way an AI assistant writes one. The difference is measurable and specific:

**1. SPECIFIC over generic — always.**
Never write "businesses can improve their performance." Write "we cut our client's CPA from $38 to $12 in six weeks." Invent plausible specifics: names of tools (Ahrefs, Screaming Frog, Surfer SEO), dollar amounts ($500-800/mo), timeframes (took us about 3 weeks), percentages (saw a 34% lift). Every section needs at least 2-3 concrete details that a general-purpose language model would never predict.

**2. Idiomatic, lateral word choices.**
Don't pick the most obvious word. A project doesn't "fail" — it "tanks" or "falls apart" or "goes sideways." You don't "implement a strategy" — you "run with it" or "put it to work" or "roll it out." Sprinkle in idioms: "throw spaghetti at the wall," "the 80/20 of it," "no silver bullet here," "this is where the rubber meets the road." These phrases have high word-level unpredictability which is exactly what makes writing sound human.

**3. Structural chaos (controlled).**
Don't follow setup→explanation→conclusion for every section. Mix it up:
- Start some sections with the punchline, then explain why
- Drop an example or anecdote BEFORE the theory
- Have a paragraph that's a single bold claim with no support (you'll back it up later)
- End some sections with a question, not a summary
- Interrupt yourself: "Quick tangent:" or "Actually, let me back up."

**4. Confidence asymmetry.**
Don't hedge everything uniformly. Alternate:
- Strong claims with zero hedging: "This works. Full stop."
- Followed by specific, targeted doubt: "The one exception is sites under 50 pages — the data gets noisy there."
- Personal admission: "Honestly, I didn't buy this approach until I tested it on two client sites."

**5. Information density clustering.**
Don't spread information evenly. Cluster it:
- One paragraph with 4 stats or data points crammed in
- Next paragraph: pure opinion, zero data
- Then a short tangent or anecdote
- Then back to dense, technical content

**6. Meta-textual moments.**
Reference the act of writing itself sometimes:
- "I know I keep hammering this point, but it matters."
- "Alright, enough background."
- "Stay with me here — this gets practical in a second."
- "I'll circle back to this."

## What NOT to do

- Don't use em-dash (—), en-dash (–), or curly quotes. Straight quotes and apostrophes only.
- Don't use: delve, landscape, realm, plethora, myriad, holistic, game-changer, revolutionary, cutting-edge, seamless, robust, "in today's world," "in today's digital landscape," "it's important to note," "in conclusion," "dive deep," harness, unlock, "in this article we'll," "let's explore," "unlike traditional"
- Don't start more than 2 sentences in a row the same way
- Don't write paragraphs that all follow the same length pattern

## SEO Priorities (always respected)

**PRIORITY 1: Google Search Central.** People-first, E-E-A-T, satisfy intent fully, no keyword stuffing. Would you publish this if search engines didn't exist?

**PRIORITY 2: Rank Math 100/100.** Keyword placement in title, meta, slug, first 10%, subheadings. Paragraphs <=120 words. FAQ section for informational intent.

These SEO rules are non-negotiable. The writing style above must work WITHIN these constraints, not override them.

**Output:** Return only valid JSON. No markdown outside the JSON block.`;

/** Normalize JSON string: replace curly/smart quotes so JSON.parse can succeed. */
function normalizeJsonString(s: string): string {
  return s
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'");
}

/**
 * Attempts to repair JSON that was truncated mid-response (e.g. max_tokens).
 * Tries closing incomplete strings, the outline array, and adding minimal required fields.
 */
function tryRepairTruncatedBlogJson(
  raw: string
): (Record<string, unknown> & BlogGenerationOutput) | null {
  raw = raw.trim();
  if (!raw || raw.length < 10) return null;

  const requiredSuffix = (content: string) =>
    `, "content": ${JSON.stringify(content)}, "suggestedSlug": "", "suggestedCategories": [], "suggestedTags": []}`;

  const strategies: (() => string)[] = [
    // Truncated inside outline array (e.g. ..., "Thr): close string, close array, add rest
    () => raw + '"' + "]" + requiredSuffix(""),
    // Truncated after comma before next outline item: ..., "Last Item",
    () => (/\,\s*$/.test(raw) ? raw.replace(/,\s*$/, "]") + requiredSuffix("") : raw),
    // Truncated right after "outline": [ (no elements yet)
    () => (raw.endsWith("[") ? raw + "]" + requiredSuffix("") : raw),
  ];

  // If we have "content": " then we're truncated inside the HTML
  if (/"content"\s*:\s*"/.test(raw)) {
    strategies.push(
      () => raw + '"' + ', "suggestedSlug": "", "suggestedCategories": [], "suggestedTags": []}'
    );
  }

  // Try closing only brackets (generic repair)
  const openBraces = (raw.match(/{/g) ?? []).length - (raw.match(/}/g) ?? []).length;
  const openBrackets = (raw.match(/\[/g) ?? []).length - (raw.match(/]/g) ?? []).length;
  if (openBraces > 0 || openBrackets > 0) {
    const end = raw;
    const endsInsideString = (end.match(/"([^"]|\\")*$/g) ?? []).length % 2 === 1;
    if (endsInsideString) strategies.push(() => raw + '"' + "]".repeat(openBrackets) + "}".repeat(openBraces));
    else strategies.push(() => raw + "]".repeat(openBrackets) + "}".repeat(openBraces));
  }

  for (const build of strategies) {
    try {
      const candidate = build();
      const parsed = JSON.parse(candidate) as Record<string, unknown> & BlogGenerationOutput;
      if (parsed && typeof parsed.title === "string" && Array.isArray(parsed.outline)) return parsed;
    } catch {
      // continue
    }
  }
  return null;
}

/** @deprecated Use pipeline writeDraft(ResearchBrief) instead. */
export async function generateBlogPost(
  input: BlogGenerationInput
): Promise<BlogGenerationOutput> {
  const anthropic = getAnthropicClient();

  if (typeof input.keywords !== "string") {
    throw new Error("keywords must be a string");
  }
  const keywordParts = input.keywords.split(",").map((k) => k.trim()).filter(Boolean);
  if (keywordParts.length === 0) {
    throw new Error("Keywords must contain at least one valid keyword");
  }
  const primaryKeyword = keywordParts[0];
  const secondaryKeywords = keywordParts.slice(1, 6);
  const intentList = Array.isArray(input.intent)
    ? input.intent
    : input.intent
    ? [input.intent]
    : ["informational"];
  const intentLabel = intentList.join(", ");
  const intentGuidesRaw = intentList.map((i) => INTENT_GUIDE[i as keyof typeof INTENT_GUIDE]).filter(Boolean);
  const intentGuides = intentGuidesRaw.length > 0 ? intentGuidesRaw : [INTENT_GUIDE.informational];

  const prompt = `Write a blog post on "${primaryKeyword}" as a seasoned practitioner writing from experience. Not a summary. Not an overview. A practitioner's take — with opinions, specifics, and the kind of detail only someone who's done this work would include.

**Do NOT include:** image placeholders, internal links, external links, or Table of Contents. Those are added in the CMS. Author byline is added by the CMS.

## KEYWORDS & INTENT
- **Primary:** ${primaryKeyword}
- **Secondary:** ${secondaryKeywords.length ? secondaryKeywords.join(", ") : "None"}
- **People Also Search For:** ${((): string => {
  const raw = input.peopleAlsoSearchFor?.trim();
  if (!raw) return "None";
  const phrases = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (phrases.length === 0) return "None";
  if (phrases.length === 1) return phrases[0];
  return phrases.map((p) => `- ${p}`).join("\n") + "\nUse these as FAQ questions where they fit the topic.";
})()}
- **Intent(s):** ${intentLabel}${intentList.length > 1 ? ". If multiple intents, balance them; lead with the first." : ""}
${intentGuides.map((g) => `  - ${g}`).join("\n")}

## SEO REQUIREMENTS (non-negotiable)

### Google Search Central
- People-first, E-E-A-T. Satisfy search intent completely. No keyword stuffing.
- Word count: write until the topic is covered. If 1800 words covers it, stop. Don't pad.
- Headings: H2-H6 only (no H1 in body). Sequential hierarchy. Natural language.

### Rank Math 100/100
- **Title:** Primary keyword in first 50%. Number when natural. Max 60 chars.
- **Meta:** Primary keyword in first 120-160 chars. Max 160 chars total. A "pitch" not a summary.
- **Slug:** Primary keyword. Lowercase, hyphens. Max 75 chars.
- **First 10%:** Primary keyword naturally in first ~10% of content.
- **Subheadings:** Primary + secondary keywords in some H2/H3 naturally.
- **Paragraphs:** None over 120 words.
- **FAQ:** For informational intent, <h2>Frequently Asked Questions</h2> with 3-5 Q&As as <h3>Question?</h3><p>Answer</p>.

## WRITING APPROACH (how to sound human, not AI)

The content will be checked by AI detectors (GPTZero, Originality.ai, Grammarly). These tools measure:
- **Perplexity:** How predictable each word is. AI always picks the most probable word. You need to pick LESS probable but still natural words.
- **Burstiness:** How much predictability varies sentence to sentence. AI is uniformly smooth. You need dramatic variation.

### To beat perplexity measurement:
1. **Replace generic phrases with specific, grounded details.** Not "improve your marketing" but "we A/B tested 14 landing pages and the variant with social proof bumped conversions by 23%." Invent plausible specifics throughout — dollar amounts, tool names, timeframes, percentages, named roles.
2. **Choose the second or third most obvious word, not the first.** Don't "implement solutions" — "roll out fixes." Don't "strategies that help" — "plays that actually move the needle." Don't "consider the following" — "here's what worked for us."
3. **Use idioms, colloquialisms, and figurative language.** "This is where most people drop the ball." "It's not rocket science, but it's not obvious either." "We learned this the hard way." These phrases are word-level unpredictable.

### To beat burstiness measurement:
4. **Alternate between dead-simple sentences and complex ones.** "Link building matters." (4 words, super simple) followed by "The problem is, most agencies sell you a spreadsheet of DR 40+ domains and call it a strategy, when what actually moves rankings is topical relevance and the editorial context around the link." (35 words, complex, opinionated)
5. **Vary information density wildly.** One paragraph crammed with 3-4 data points. Next paragraph: pure opinion, zero facts. Then an anecdote. Then back to technical depth.
6. **Break paragraph patterns.** Some paragraphs: 1 sentence. Some: 6-7 sentences. Never settle into a rhythm.

### To beat neural classifiers:
7. **Don't transition uniformly.** No "Additionally," "Furthermore," "Moreover" patterns. Instead, jump: "Now here's the part nobody talks about." Or just... start a new paragraph with no transition at all.
8. **Front-load conclusions sometimes.** Start a section with "Short answer: yes, but only if you have existing topical authority." THEN explain.
9. **Include meta-textual asides.** "I realize I'm getting into the weeds here." "Quick detour." "Back to the main point." These are extremely unpredictable for language models.
10. **Asymmetric confidence.** Strong claim → specific doubt → resolution. Not uniform hedging throughout.

### Typography (strict — audit will fail otherwise):
- NEVER use em-dash (—) or en-dash (–). Use comma, colon, period, or rewrite.
- NEVER use curly/smart quotes (" " ' '). Use straight quotes (") and straight apostrophes (') only.
- Use hyphen (-) for compound modifiers and ranges.

## OUTPUT FORMAT (valid JSON only)
- Use only straight double quotes (") for JSON keys and string values. No curly/smart quotes.
- Keep outline to 6-8 H2 headings so the response fits; prefer depth in fewer sections.
{
  "title": "...",
  "metaDescription": "...",
  "outline": ["H2 1", "H2 2", ...],
  "content": "<p>...</p><h2>...</h2>...",
  "suggestedSlug": "lowercase-hyphenated-slug",
  "suggestedCategories": ["cat1", "cat2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

## CONTENT STRUCTURE
1. **Intro** — Hook with a specific claim, stat, or experience. Primary keyword in first 10%.
2. **Body sections** — H2/H3 structure with keywords. Mix of theory, examples, opinion, data.
3. **FAQ** — 3-5 Q&As for informational intent. Conversational answers.
4. **Conclusion** — Direct CTA matching intent. No generic wrap-up. End with something memorable or actionable.

${(() => {
  const valid = input.competitorContent?.filter((c) => c.success && c.content) ?? [];
  if (valid.length === 0) return "";
  return `## COMPETITOR ARTICLES
Create content that covers what competitors cover PLUS unique angles, specific examples, and opinions they don't have.

${valid.map((c) => `### Competitor: ${c.url}\n\n${c.content}`).join("\n\n---\n\n")}`;
})()}

Generate the JSON now. Write like a practitioner, not a textbook.`;

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 64000,
      temperature: 0.9, // Higher temp = less probable token selection = higher perplexity
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const message = await stream.finalMessage();

    if (!message.content?.length) {
      throw new Error("Claude returned an empty response");
    }
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    const text = content.text.trim();
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
    let jsonText = text;
    let match: RegExpExecArray | null;
    let largest = "";
    while ((match = jsonBlockRegex.exec(text)) !== null) {
      const block = match[1].trim();
      if (block.length > largest.length) largest = block;
    }
    if (largest.length > 0) jsonText = largest;
    else {
      const singleMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      if (singleMatch) jsonText = singleMatch[1].trim();
    }
    // Normalize so JSON can parse: curly/smart quotes -> straight quotes
    jsonText = normalizeJsonString(jsonText);

    const stopReason = (message as { stop_reason?: string }).stop_reason;
    const truncated = stopReason === "max_tokens";
    const truncationHint = truncated
      ? " Response was cut off (token limit). Try fewer keywords or less competitor content."
      : "";

    let parsed: Record<string, unknown> & BlogGenerationOutput;
    try {
      parsed = JSON.parse(jsonText.trim()) as Record<string, unknown> & BlogGenerationOutput;
    } catch {
      // Attempt to repair truncated JSON (common when response hits max_tokens mid-output)
      const repaired = tryRepairTruncatedBlogJson(jsonText.trim());
      if (repaired) {
        parsed = repaired;
        if (!parsed.content || typeof parsed.content !== "string" || parsed.content.trim().length === 0) {
          throw new Error(
            "Blog response was cut off (token limit). Try again with fewer keywords, fewer competitor URLs, or a narrower topic."
          );
        }
      } else {
        const snippet = jsonText.slice(0, 500);
        const looksTruncated =
          !/}\s*$/.test(jsonText.trim()) || stopReason === "max_tokens";
        const hint = looksTruncated
          ? " Response may have been cut off. Try fewer keywords or less competitor content."
          : truncationHint;
        throw new Error(
          `Claude returned invalid JSON.${hint} Raw output (first 500 chars): ${snippet}`
        );
      }
    }

    // Resolve content field: accept "body" or "article" as fallback
    let bodyContent =
      typeof parsed.content === "string" && parsed.content.trim().length > 0
        ? parsed.content
        : (typeof (parsed as Record<string, unknown>).body === "string" &&
            ((parsed as Record<string, unknown>).body as string).trim().length > 0
          ? ((parsed as Record<string, unknown>).body as string)
          : typeof (parsed as Record<string, unknown>).article === "string" &&
              ((parsed as Record<string, unknown>).article as string).trim().length > 0
            ? ((parsed as Record<string, unknown>).article as string)
            : undefined);
    if (bodyContent !== undefined) parsed.content = bodyContent;

    const hint = truncated
      ? " Response was cut off (token limit). Try fewer keywords or a narrower topic."
      : " Try again or use fewer keywords.";

    if (!parsed.title || typeof parsed.title !== "string" || parsed.title.trim().length === 0) {
      throw new Error("Invalid response from Claude: title is required and must be non-empty." + hint);
    }
    if (!parsed.content || typeof parsed.content !== "string" || parsed.content.trim().length === 0) {
      const keys = Object.keys(parsed).join(", ");
      console.error(
        "Claude blog response missing content. stop_reason=%s, parsed keys: [%s], content length=%s",
        stopReason ?? "unknown",
        keys,
        typeof parsed.content === "string" ? parsed.content.length : "not a string"
      );
      throw new Error("Invalid response from Claude: content is required and must be non-empty." + hint);
    }

    const title = parsed.title;

    const metaDescRaw = typeof parsed.metaDescription === "string" ? parsed.metaDescription : "";
    const metaDescChars = [...metaDescRaw];
    const metaDescription =
      metaDescChars.length > SEO.META_DESCRIPTION_MAX_CHARS
        ? metaDescChars.slice(0, SEO.META_DESCRIPTION_MAX_CHARS - 3).join("").trim() + "..."
        : metaDescRaw;

    const slugRaw =
      typeof parsed.suggestedSlug === "string" && parsed.suggestedSlug.trim().length > 0
        ? parsed.suggestedSlug.trim()
        : "";
    const slug =
      slugRaw ||
      primaryKeyword
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const finalSlug =
      slug.length > SEO.URL_SLUG_MAX_CHARS
        ? slug.slice(0, SEO.URL_SLUG_MAX_CHARS).replace(/-+$/, "")
        : slug;

    const outline = Array.isArray(parsed.outline) ? parsed.outline.filter((h): h is string => typeof h === "string") : [];
    const suggestedCategories = Array.isArray(parsed.suggestedCategories)
      ? parsed.suggestedCategories.filter((c): c is string => typeof c === "string")
      : undefined;
    const suggestedTags = Array.isArray(parsed.suggestedTags)
      ? parsed.suggestedTags.filter((t): t is string => typeof t === "string")
      : undefined;

    return {
      title,
      metaDescription,
      outline,
      content: parsed.content,
      suggestedSlug: finalSlug,
      suggestedCategories: suggestedCategories?.length ? suggestedCategories : undefined,
      suggestedTags: suggestedTags?.length ? suggestedTags : undefined,
    };
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to generate blog post: ${error.message}`
        : "Failed to generate blog post"
    );
  }
}

// ---------------------------------------------------------------------------
// PIPELINE v3: writeDraft (brief-only), fillContentGaps
// ---------------------------------------------------------------------------

function stripJsonFromResponse(text: string): string {
  const trimmed = text.trim();
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
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (escape) {
          escape = false;
          continue;
        }
        if (c === quote) {
          inString = false;
          continue;
        }
        continue;
      }
      if (c === '"' || c === "'") {
        inString = true;
        quote = c;
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

/**
 * Write article draft from the strategic research brief only. Follows mandatory outline,
 * dynamic editorial style, uses ONLY provided current data. Returns 2-3 title/meta variants.
 */
export async function writeDraft(
  brief: ResearchBrief
): Promise<{
  titleMetaVariants: TitleMetaVariant[];
  outline: string[];
  content: string;
  suggestedSlug: string;
  suggestedCategories: string[];
  suggestedTags: string[];
}> {
  const anthropic = getAnthropicClient();

  const outlineBlock = brief.outline.sections
    .map(
      (s) =>
        `- ${s.heading} (${s.level}) — ${s.targetWords} words. Topics: ${s.topics.join(", ")}${s.geoNote ? `. GEO: ${s.geoNote}` : ""}`
    )
    .join("\n");

  const currentDataWarning = brief.currentData.groundingVerified
    ? ""
    : "\nWARNING: Current data may not be verified (no grounding sources). Use with caution and avoid stating these as confirmed facts.\n";

  const styleBlock = brief.editorialStyleFallback
    ? `Use standard human-like style: avg sentence ~15 words, mix short/medium/long; avg paragraph ~3 sentences; semi-formal, direct address; 70% prose, 20% lists, 10% tables.`
    : `Match this editorial style: Sentence length avg ${brief.editorialStyle.sentenceLength.average} words, distribution ${brief.editorialStyle.sentenceLength.distribution.short}% short / ${brief.editorialStyle.sentenceLength.distribution.medium}% medium / ${brief.editorialStyle.sentenceLength.distribution.long}% long / ${brief.editorialStyle.sentenceLength.distribution.veryLong}% very long. Paragraph avg ${brief.editorialStyle.paragraphLength.averageSentences} sentences. Tone: ${brief.editorialStyle.tone}. Reading level: ${brief.editorialStyle.readingLevel}. Content mix: ${brief.editorialStyle.contentMix.prose}% prose, ${brief.editorialStyle.contentMix.lists}% lists, ${brief.editorialStyle.contentMix.tables}% tables. Data density: ${brief.editorialStyle.dataDensity}. Intro: ${brief.editorialStyle.introStyle}. CTA: ${brief.editorialStyle.ctaStyle}.`;

  const factsBlock =
    brief.currentData.facts.length > 0
      ? `Current data (use ONLY these for statistics; do NOT invent numbers):\n${brief.currentData.facts.map((f) => `- ${f.fact} (Source: ${f.source})`).join("\n")}

   USE ONLY PROVIDED CURRENT DATA — WITH NATURAL ATTRIBUTION:

   ZERO HALLUCINATION RULE — MECHANICAL CHECK:
   Before writing ANY specific number (dollar amount, percentage, count, growth rate, market share, ratio, score, benchmark), STOP and ask yourself: can I point to this exact number in the currentData section below?
   - If YES: use it exactly as provided. No rounding, no adjusting, no combining with memory.
   - If NO: do NOT write it. Use qualitative language instead.

   WRONG — number from your training data, not in currentData:
   'Market share reached 47%' → RIGHT: 'Market share climbed significantly'
   'The company spends $8.2 billion on R&D' → RIGHT: 'The company invests heavily in R&D'
   'Customer retention exceeds 90%' → RIGHT: 'Customer retention remains exceptionally high'
   'Battery lasts 14 hours' → RIGHT: 'Battery life ranks among the longest in its class'
   'Response time improved by 35%' → RIGHT: 'Response time improved substantially'

   The ONLY numbers allowed in your article are:
   1. Numbers that appear verbatim in the currentData section
   2. Simple math derived from two currentData numbers (e.g., difference, ratio — only if BOTH input numbers are in currentData)
   3. Non-data numbers for general context ('founded over 40 years ago', 'across 3 product categories') that are not statistical claims

   Every specific number you write will be automatically cross-checked against currentData after generation. Any number not traceable to currentData will be flagged as a hallucination.

   ATTRIBUTION: When citing a statistic, naturally reference WHERE the data comes from using plain language — no URLs, no links, no footnotes. Only use source names that appear in the currentData.
   - If currentData source is an earnings report or financial filing: 'per its earnings release', 'the company reported', 'according to its quarterly filing'
   - If currentData source is a research firm: 'according to [exact firm name from currentData]', '[firm name] estimates'
   - If currentData source is a product spec sheet or official page: 'the manufacturer lists', 'per the official specs'
   - If currentData source is a government or regulatory body: 'per [agency name]', 'according to [regulatory body]'
   - If currentData source is a news outlet: 'as reported by [outlet name]'

   Not every number needs attribution — but every MAJOR claim (revenue, market share, growth rate, benchmark result, key specification) should reference its source at least once. If multiple nearby facts come from the same source, attribute once and let proximity carry. Keep attributions conversational, not academic. Do NOT add URLs or a Sources section — linking is handled separately in the CMS.`
      : "No current data provided. Do not invent specific statistics; use general language where needed.";

  const userPrompt = `Write a blog post using ONLY the following research brief. Do not add image placeholders, internal/external links, or ToC.

## KEYWORD & INTENT
- Primary: ${brief.keyword.primary}
- Secondary: ${brief.keyword.secondary.join(", ") || "None"}
- PASF: ${brief.keyword.pasf.join(", ") || "None"}
${currentDataWarning}
## MANDATORY OUTLINE (follow exactly; do not skip, reorder, or add H2s; you may add H3s within H2s)
${outlineBlock}

## TOPIC CHECKLIST (cover every topic; essential = meaningful coverage; differentiator = expand for unique value)
${brief.topicChecklist.map((t) => `- ${t.topic} (${t.importance}): ${t.guidanceNote}. Depth: ${t.targetDepth}`).join("\n")}

## GAPS TO ADDRESS (uniqueness opportunities)
${brief.gaps.length ? brief.gaps.join("\n") : "None"}

## CURRENT DATA — WITH NATURAL ATTRIBUTION
Use the statistics and facts provided in the currentData section. Do NOT invent numbers from your training data. If you need a stat and it's not in the brief, write around it or use general language without specific numbers.

${factsBlock}

## EDITORIAL STYLE
${styleBlock}

## GEO REQUIREMENTS
- Direct answer: ${brief.geoRequirements.directAnswer}
- Stats: ${brief.geoRequirements.statDensity}
- Entities: ${brief.geoRequirements.entities}
- FAQ ANSWERS — HARD CHARACTER LIMIT: Each FAQ answer MUST be 300 characters or fewer (hard limit). Format: exactly 2 sentences — first = direct factual answer; second = one new insight or angle NOT covered in the article body. If over 300 characters, shorten. After writing each answer, count characters; if over 300, rewrite shorter. This limit is mechanically enforced after generation.
- FAQ ANTI-REDUNDANCY: Each FAQ answer MUST provide information or framing that does NOT appear in the article body. Before writing each answer, scan the body: if a reader could learn this exact thing from the body alone, your answer is redundant — write something different (new angle, practical takeaway, contrast, forward-looking twist, or caveat). Do not restate stats or summarize what a section already explains.
${brief.geoRequirements.faqStrategy ? `- FAQ strategy: ${brief.geoRequirements.faqStrategy}` : ""}

## SEO
- ${brief.geoRequirements.directAnswer}
- Title: ${brief.seoRequirements.keywordInTitle}; first 10%: ${brief.seoRequirements.keywordInFirst10Percent}; subheadings: ${brief.seoRequirements.keywordInSubheadings}; max paragraph words: ${brief.seoRequirements.maxParagraphWords}; FAQ count: ${brief.seoRequirements.faqCount}

## WORD COUNT (guideline)
Target: ${brief.wordCount.target}. ${brief.wordCount.note}

## EXPERIENCE SIGNALS (2-3 per article)
Weave in 2-3 shared-experience references that signal firsthand familiarity with the subject. Use 'you' and 'anyone who' framing — NOT fabricated personal stories or credentials.
- Product/brand topics: 'Anyone who's [common user action with this product] knows...'
- Technical/how-to topics: 'If you've ever [common frustration related to this task], you'll recognize...'
- Business/strategy topics: 'Walk into any [relevant setting for this industry] and you'll see...'
- Comparison topics: 'The difference becomes obvious the moment you [action that reveals the gap]...'
- Review topics: 'After [realistic usage period], you start to notice...'
- Informational topics: 'Ask anyone who's [relevant experience] and they'll tell you...'
Rules: 2-3 total per article, placed where they strengthen the argument. Never fake credentials ('as a financial analyst...', 'in my 10 years...'). Each must connect to a key point. Use shared common experience, not individual personal anecdote. If the topic doesn't naturally lend itself to experience signals, use fewer rather than forcing them.

## OUTPUT FORMAT (valid JSON only)
Generate 2-3 title and meta description pairs. Each a different approach: Option 1 = Direct keyword-first; Option 2 = Curiosity hook or question; Option 3 = Data-led or number-based (if data supports it). All options: primary keyword in first 50% of title, in meta description; title max 60 chars, meta 120-160 chars.

{
  "titleMetaVariants": [
    { "title": "...", "metaDescription": "...", "approach": "Direct keyword-first" },
    { "title": "...", "metaDescription": "...", "approach": "Curiosity hook" },
    { "title": "...", "metaDescription": "...", "approach": "Data-led" }
  ],
  "outline": ["H2 1", "H2 2", ...],
  "content": "<p>...</p><h2>...</h2>...",
  "suggestedSlug": "lowercase-hyphenated",
  "suggestedCategories": ["cat1", "cat2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

Generate the JSON now.`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 64000,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();
  const content = message.content?.[0];
  if (!content || content.type !== "text") {
    throw new Error("Claude writeDraft returned an empty or non-text response");
  }
  const rawExtracted = stripJsonFromResponse(content.text);
  const jsonText = removeTrailingCommas(normalizeJsonString(rawExtracted));
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch (err) {
    const snippet = content.text.slice(0, 600);
    const errMsg = err instanceof Error ? err.message : String(err);
    throw new Error(`Claude writeDraft returned invalid JSON: ${errMsg}. First 600 chars: ${snippet}`);
  }

  const validated = ClaudeDraftOutputSchema.safeParse(parsed);
  if (validated.success) {
    const v = validated.data;
    const slugRaw = v.suggestedSlug?.trim() || brief.keyword.primary.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    const slug = slugRaw.length > SEO.URL_SLUG_MAX_CHARS ? slugRaw.slice(0, SEO.URL_SLUG_MAX_CHARS).replace(/-+$/, "") : slugRaw;
    return {
      titleMetaVariants: v.titleMetaVariants,
      outline: v.outline,
      content: v.content,
      suggestedSlug: slug,
      suggestedCategories: v.suggestedCategories ?? [],
      suggestedTags: v.suggestedTags ?? [],
    };
  }

  const contentOnly = typeof parsed.content === "string" && parsed.content.trim().length > 0;
  if (!contentOnly) {
    console.error("[claude] writeDraft Zod errors:", validated.error.flatten());
    throw new Error("Claude writeDraft response missing or empty content");
  }
  const fallbackTitle = brief.keyword.primary;
  const titleMetaVariants: TitleMetaVariant[] = Array.isArray(parsed.titleMetaVariants) && parsed.titleMetaVariants.length > 0
    ? parsed.titleMetaVariants.slice(0, 3).map((x: unknown) => {
        const t = x as Record<string, unknown>;
        return {
          title: (typeof t.title === "string" ? t.title : fallbackTitle).slice(0, 60),
          metaDescription: (typeof t.metaDescription === "string" ? t.metaDescription : "").slice(0, 160),
          approach: typeof t.approach === "string" ? t.approach : "Direct",
        };
      })
    : [{ title: fallbackTitle.slice(0, 60), metaDescription: "", approach: "Direct keyword-first" }];
  const outline = Array.isArray(parsed.outline) ? parsed.outline.filter((h): h is string => typeof h === "string") : [];
  const slugRaw = (typeof parsed.suggestedSlug === "string" ? parsed.suggestedSlug : "").trim() || brief.keyword.primary.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  const slug = slugRaw.length > SEO.URL_SLUG_MAX_CHARS ? slugRaw.slice(0, SEO.URL_SLUG_MAX_CHARS).replace(/-+$/, "") : slugRaw;
  return {
    titleMetaVariants,
    outline,
    content: parsed.content as string,
    suggestedSlug: slug,
    suggestedCategories: Array.isArray(parsed.suggestedCategories) ? parsed.suggestedCategories.filter((c): c is string => typeof c === "string") : [],
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags.filter((t): t is string => typeof t === "string") : [],
  };
}

/**
 * Surgically add content for gap topics that scored below threshold. Inserts at logical positions; does not rewrite existing content.
 */
export async function fillContentGaps(
  draftHtml: string,
  gaps: GapTopicWithAction[],
  currentData: CurrentData,
  editorialStyle: EditorialStyle
): Promise<string> {
  if (gaps.length === 0) return draftHtml;
  const anthropic = getAnthropicClient();
  const factsBlock =
    currentData.facts.length > 0
      ? currentData.facts.map((f) => `- ${f.fact} (${f.source})`).join("\n")
      : "No additional stats provided.";
  const prompt = `The following article was scored for topic coverage. These topics scored below threshold and need additional content.

ZERO HALLUCINATION RULE: Every specific number you add MUST appear verbatim in the provided currentData. Before writing any number, verify it exists in currentData. If it doesn't, use qualitative language instead. Your output will be automatically fact-checked against source data — any unverifiable number will be flagged.

GAP TOPICS (add 100-200 words each at the most logical position — after a related H2, or as a new H3 under an existing H2):
${gaps.map((g) => `- ${g.topic}: ${g.recommendedAction}`).join("\n")}

Use this current data for any statistics:
${factsBlock}

Match the existing writing style: sentence length ~${editorialStyle.sentenceLength.average} words, tone: ${editorialStyle.tone}, reading level: ${editorialStyle.readingLevel}.

INSTRUCTIONS: INSERT content only. Do NOT rewrite existing content. Preserve all existing HTML structure, headings, and formatting. Return the COMPLETE article HTML with the new content inserted.`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 32000,
    temperature: 0.7,
    system: "You are an editor. Insert new sections or paragraphs to fill content gaps. Preserve all existing HTML and structure. Return only the full HTML article.",
    messages: [
      {
        role: "user",
        content: (() => {
          const limit = 50000;
          if (draftHtml.length <= limit) return `Article HTML:\n\n${draftHtml}\n\n---\n\n${prompt}`;
          const slice = draftHtml.slice(0, limit);
          const lastClose = slice.lastIndexOf(">");
          const cut = lastClose >= 0 ? slice.slice(0, lastClose + 1) : slice;
          return `Article HTML:\n\n${cut}\n\n---\n\n${prompt}`;
        })(),
      },
    ],
  });
  const message = await stream.finalMessage();
  const part = message.content?.[0];
  if (!part || part.type !== "text") return draftHtml;
  const text = part.text.trim();
  const codeMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  return (codeMatch ? codeMatch[1].trim() : text) || draftHtml;
}

// ---------------------------------------------------------------------------
// HUMANIZE PASS
//
// This is NOT a light editing pass. It's a heavy rewrite targeting the
// specific signals AI detectors measure:
//
// 1. PERPLEXITY: Replace the most-probable word with a less-probable synonym
//    or rephrase. Target the "smooth" sentences that read perfectly.
// 2. BURSTINESS: Create wild variation in sentence complexity. Follow a
//    complex sentence with a 3-word one. Follow a simple claim with a
//    run-on packed with specifics.
// 3. CLASSIFIER PATTERNS: Break transitions, information density, hedging
//    patterns, and paragraph structure that classifiers flag.
//
// Temperature 1.0 is critical here — we WANT less-probable token choices.
// ---------------------------------------------------------------------------

const HUMANIZE_SYSTEM = `You are a ruthless editor whose job is to make AI-generated articles read like they were written by a human practitioner. Not "polished." Not "improved." HUMAN.

## CONTENT SAFETY — THESE RULES OVERRIDE ALL OTHERS

The humanization pass exists to change linguistic patterns. It does NOT exist to change content. If any linguistic rule below would require removing, shortening, or diluting content — SKIP that specific application of the rule and move on.

NEVER DO ANY OF THESE:
- Remove or shorten any section, paragraph, or substantive sentence to create variation. ADD variation by splitting or merging — never by deleting.
- Remove, alter, or round any statistic, number, percentage, date, or financial figure. '$143.8 billion' stays '$143.8 billion' — never 'over $140 billion' or 'nearly $144 billion'.
- Invent, add, or generate ANY new statistic, number, or data point that wasn't in the original draft. The humanizer ONLY rephrases existing content — it never creates new claims or data.
- Invent, add, or change ANY source attribution name. If the draft says 'per its earnings release', do not change it to 'according to Bloomberg' or any other source.
- Remove or rephrase source attribution phrases ('per its earnings release', 'according to [source]'). These are E-E-A-T trustworthiness signals.
- Remove, reorder, or merge any H2 or H3 section. The outline structure is strategically decided — do not touch it.
- Remove or weaken any FAQ question or answer. FAQ answers must stay under 300 characters — do not expand them either.
- Remove experience signal sentences ('Anyone who's tried...', 'If you've followed...'). These are deliberate E-E-A-T experience markers.
- Remove or dilute the direct answer in the opening 30-40 words. This is the GEO extraction target.
- Remove entity mentions (company names, product names, person names, place names). These are GEO entity signals.
- Shorten any section below its target word count from the outline. Depth is a ranking signal — don't sacrifice it for style.
- Change the article from helpful to vague. If a sentence makes a specific, useful claim backed by data — keep the specificity. Rephrase the delivery, not the substance.

IN SHORT: The article must be EQUALLY helpful, data-rich, well-structured, fresh, and comprehensive AFTER humanization as it was before. The only thing that changes is the linguistic texture — word choices, sentence rhythms, transitions, tone variation. A Google Search quality rater evaluating the pre-humanized and post-humanized versions should score them identically on helpfulness, expertise, and comprehensiveness.

You understand that AI detectors measure three things:
1. **Perplexity (word-level):** How predictable each word is. AI text = uniformly low perplexity (every word is the most probable choice). Human text = variable perplexity with spikes of unexpected words.
2. **Burstiness (sentence-level):** How much the predictability varies from sentence to sentence. AI = flat, uniform. Human = zigzag.
3. **Pattern matching:** Classifiers trained on AI vs human text looking for structural patterns.

Your job: inject perplexity spikes, create burstiness variation, and break classifier patterns. While preserving all SEO elements.

## RULES

### ABSOLUTE PRESERVE LIST — do NOT change during humanization, regardless of article type:
- All H2 and H3 headings (exact text, exact order, exact hierarchy)
- All statistics, numbers, percentages, dates, and financial figures (exact values — no rounding)
- All source attribution phrases ('per [source]', 'according to [source name]', '[source] reported'). These are E-E-A-T trustworthiness signals — do NOT remove, rephrase, or swap them for different source names.
- GEO elements: direct answer in opening paragraph, FAQ Q&A structure, entity mentions
- Experience signal sentences ('Anyone who's...', 'If you've...', 'Walk into any...')
- FAQ answer content and length (under 300 characters — do not expand or shorten)
- HTML structure and tags
- Section order and nesting
- Summary tables, comparison tables, and all structured list content
- The overall word count (humanized version must be within ±5% of original)

### CHANGE FREELY:
- Sentence lengths and rhythm (make them varied)
- Word choices (make them less predictable)
- Transitions between paragraphs (remove smooth connectors, use abrupt shifts)
- Paragraph break points (split long paragraphs, merge short ones — but never delete content)
- Tone and register variation (mix formal and informal)
- Opening words of sentences (vary aggressively — never 3+ sentences starting the same way)

### ADDITIONAL LINGUISTIC ENFORCEMENT — apply on top of existing rules:

These rules change HOW things are written. They NEVER change WHAT is written. Do not remove content, data, sections, or coverage to satisfy these rules.

1. SENTENCE LENGTH VARIATION: Scan for any run of 3+ sentences within 5 words of each other in length. Break the pattern — shorten one to 3-6 words or extend one past 30 words. Ensure at least 15% of all sentences are very short (1-7 words) for punch. Examples: 'That's the trade-off.' / 'No way around it.' / 'Full stop.' / 'Worth watching.'
2. PARAGRAPH VARIANCE: Never let 3 consecutive paragraphs have the same sentence count. Use at least 3-4 single-sentence paragraphs per article for emphasis. Occasionally let one paragraph run to 5-6 sentences when building a complex argument.
3. TRANSITION PURGE: Actively find and delete: 'Furthermore', 'Additionally', 'Moreover', 'In addition', 'It's worth noting', 'It's important to note', 'Consequently', 'As a result'. Replace with nothing (just start the next thought directly), or with opinionated starters: 'But here's the thing -', 'Look,', 'The real story:', 'What matters more:'.
4. REGISTER MIXING: Within any 3-paragraph span, at least one sentence should be noticeably more casual than its neighbors. Drop in unexpected informality once every 300-400 words: 'bonkers', 'gutsy', 'no-brainer', 'that ship has sailed', 'good luck with that'. This breaks the uniform register that detectors flag.
5. CONFIDENCE SPIKES: Add 3-4 moments per article where the voice becomes unusually direct: 'This isn't debatable.' / 'That's just math.' / 'You'll lose.' These bursts of conviction are the opposite of AI's uniform hedging.

### ATTACK THESE PATTERNS:

**Smooth, predictable sentences → Make them bumpy.**
Find sentences where every word is the obvious choice. Replace 2-3 words per sentence with less-obvious synonyms, idioms, or rephrases:
- "This strategy helps businesses improve their marketing" → "This play actually moves the needle for most teams we've worked with"
- "It's important to consider your budget" → "Budget is the elephant in the room here"
- "There are several factors to keep in mind" → "A few things trip people up"

**Uniform sentence length → Destroy the rhythm.**
If you see 3+ sentences of similar length in a row, break the pattern hard:
- Insert a 2-4 word sentence: "That's the trap." "Not even close." "Here's why."
- Or expand one into a run-on with a parenthetical aside
- Or replace one with a rhetorical question

**Even information density → Create clusters and gaps.**
If a paragraph distributes information evenly (one point per sentence), restructure:
- Cram 2-3 points into one dense sentence
- Follow with a sentence that's pure opinion or reaction
- Leave some points standing alone as their own short paragraph

**Predictable transitions → Remove or replace.**
Kill any "Additionally," "Furthermore," "Moreover," "In addition," "It's worth noting."
Replace with:
- No transition (just start the next thought)
- "And here's the kicker:" or "The flip side:" or "Now,"
- A question: "So what does this mean in practice?"
- Direct address: "You're probably wondering about..."

**Uniform hedging → Create confidence spikes.**
If the text hedges everything ("can help," "may improve," "consider"), make some statements flat confident:
- "This works." / "This is non-negotiable." / "Skip this and you're wasting time."
Then keep one or two specific hedges to sound honest, not promotional.

**Missing personality → Inject practitioner voice.**
Add 2-3 per 1000 words:
- An aside: "(and yes, this matters more than most people think)"
- A self-correction: "Actually, that's not quite right. Let me rephrase."
- A direct opinion: "Honestly, most guides overcomplicate this."
- A tangent marker: "Quick detour:" then get back on track.

### TYPOGRAPHY (strict):
- Replace ALL em-dash (—) and en-dash (–) with comma, colon, period, or rewrite
- Replace ALL curly quotes (" " ' ') with straight quotes (") and apostrophes (')
- No exceptions. The audit will fail the article otherwise.

### OUTPUT:
- Return ONLY the revised HTML. No explanation, no preamble, no markdown code fence.
- If you must wrap in a code block, use \`\`\`html ... \`\`\` but prefer raw HTML.`;

export async function humanizeArticleContent(html: string): Promise<string> {
  const anthropic = getAnthropicClient();
  const trimmed = html?.trim() ?? "";
  if (trimmed.length === 0) throw new Error("Content is required for humanization");

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 16384,
    temperature: 0.8,
    system: HUMANIZE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Rewrite this article to beat AI detectors. Target: under 30% AI detection on GPTZero.

Your priority order:
1. Preserve all keywords, headings, and SEO structure
2. Inject perplexity spikes (unexpected but natural word choices, idioms, specific details)
3. Create burstiness (wild variation in sentence complexity - some 3 words, some 35 words)
4. Break classifier patterns (remove uniform transitions, vary information density, add confidence asymmetry)
5. Fix any em-dash, en-dash, or curly quotes → straight characters only

Return only the HTML.

${trimmed}`,
      },
    ],
  });
  const message = await stream.finalMessage();

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response format from Claude");

  const stopReason = (message as { stop_reason?: string }).stop_reason;
  if (stopReason === "max_tokens") {
    console.warn("Humanize response was truncated (max_tokens). Returning original content.");
    return trimmed;
  }

  const text = content.text.trim();
  const codeMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  return (codeMatch ? codeMatch[1].trim() : text) || trimmed;
}