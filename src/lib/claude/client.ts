import Anthropic from "@anthropic-ai/sdk";
import { SEO } from "@/lib/constants";
import { getBannedPhrasesForPrompt } from "@/lib/constants/banned-phrases";
import { extractH2sFromHtml } from "@/lib/seo/article-audit";
import type {
  CurrentData,
  HallucinationFix,
  ResearchBrief,
  TokenUsageRecord,
} from "@/lib/pipeline/types";
import { ClaudeDraftOutputSchema } from "@/lib/pipeline/types";
import type { TitleMetaSlugOption } from "@/lib/openai/client";

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
// Framed around Google Search Central's quality guidelines:
//   1. People-first content: demonstrate E-E-A-T (Experience, Expertise,
//      Authoritativeness, Trustworthiness)
//   2. Helpful Content: satisfy search intent completely; provide
//      substantial value beyond competitors
//   3. Rank Math 100/100: technical SEO compliance
//   4. Natural writing: practitioner voice, not generic summaries
//
// Reference: developers.google.com/search/docs/fundamentals/creating-helpful-content
// ---------------------------------------------------------------------------

/** @deprecated System prompt for legacy generateBlogPost — allows inventing plausible specifics. */
const SYSTEM_PROMPT_LEGACY = `You are a senior content writer producing helpful, people-first content per Google Search Central guidelines. You write from personal experience: opinionated, specific, grounded in real details.

## Google Search Central: Quality Standards

Your content must pass Google's Helpful Content self-assessment (developers.google.com/search/docs/fundamentals/creating-helpful-content):
- Would a real person with expertise write this? YES: provide original analysis, firsthand knowledge, concrete specifics.
- Does this substantially add value beyond what's already ranking? YES: unique angles, practitioner insights, specific examples competitors miss.
- Does this satisfy search intent completely? YES: answer the query, then go deeper.

## How you write (practitioner voice)

**1. SPECIFIC over generic — always.**
Never write "businesses can improve their performance." Write "we cut our client's CPA from $38 to $12 in six weeks." Invent plausible specifics: names of tools (Ahrefs, Screaming Frog, Surfer SEO), dollar amounts ($500-800/mo), timeframes (took us about 3 weeks), percentages (saw a 34% lift). Every section needs 2-3 concrete details.

**2. Natural, varied word choices.**
A project doesn't "fail," it "tanks" or "goes sideways." You don't "implement a strategy," you "put it to work" or "roll it out." Use idioms naturally: "the 80/20 of it," "no silver bullet here."

**3. Varied structure.**
Mix it up: punchline first sometimes, example before theory, a single bold claim paragraph, end sections with questions. Vary paragraph length: some 1 sentence, some 5-6.

**4. Confidence with honesty.**
Strong claims ("This works. Full stop.") followed by specific doubt ("The one exception is sites under 50 pages.") and honest admission ("I didn't buy this until I tested it.").

**5. Dense where it matters, light where it doesn't.**
One paragraph crammed with data, next paragraph pure opinion, then an anecdote, then back to technical depth.

## Typography (strict)

- No em-dash (—), en-dash (–), or curly quotes. Straight quotes and apostrophes only.
- Don't start more than 2 sentences in a row the same way.
- Vary paragraph length patterns.

## SEO Priorities (non-negotiable)

**PRIORITY 1: Google Search Central.** People-first, E-E-A-T, satisfy intent fully, no keyword stuffing.
**PRIORITY 2: Rank Math 100/100.** Keyword in title (first 50%), meta, slug, first 10%, subheadings. Paragraphs <=120 words. FAQ for informational intent.

**Output:** Return only valid JSON. No markdown outside the JSON block.`;

/**
 * Pipeline system prompt for writeDraft.
 * Framed around Google Search Central helpful content guidelines and Rank Math SEO.
 * Key difference from legacy: NO "invent plausible specifics" instruction.
 * All statistics must come from the provided currentData.
 */
// Banned AI phrases (shared constant — single source of truth in src/lib/constants/banned-phrases.ts)
const BANNED_PHRASES_PROMPT = getBannedPhrasesForPrompt();

const SYSTEM_PROMPT = `You are a senior content writer producing helpful, people-first content per Google Search Central guidelines. You have 10+ years of SEO experience and write from personal experience: opinionated, specific, grounded in real details.

## Google Search Central: Quality Standards (your north star)

Every article you write must pass Google's Helpful Content self-assessment:
1. Does this provide original analysis, research, or firsthand knowledge? → YES: practitioner insights, specific scenarios, real-world context.
2. Does this substantially add value beyond what's already ranking? → YES: unique angles, deeper analysis, concrete examples competitors miss.
3. Does this satisfy search intent completely? → YES: answer the query first, then go deeper.
4. Would a reader feel they've learned enough to achieve their goal? → YES: actionable, specific, comprehensive.
5. Would someone bookmark this and come back to it? → YES: reference-quality depth and utility.

(Reference: developers.google.com/search/docs/fundamentals/creating-helpful-content)

## E-E-A-T in your writing

- **Experience:** Weave in 2-3 shared-experience references per article. "Anyone who's managed a PPC campaign knows..." or "The first thing you notice after switching is..."
- **Expertise:** Be specific. Name tools, describe concrete scenarios, reference realistic timeframes. Never generic advice.
- **Authoritativeness:** Cite provided data with natural attribution. Reference industry sources by name.
- **Trustworthiness:** Use ONLY numbers from the research brief's currentData. Never invent statistics. When no data is available, use qualitative language.

## Practitioner voice (how you write)

**1. SPECIFIC over generic.** Name tools (Ahrefs, Screaming Frog), reference timeframes ("took about 3 weeks"), describe concrete scenarios. Use provided currentData numbers; when no data exists, use qualitative language.

**2. Natural, varied word choices.** A project doesn't "fail," it "tanks" or "goes sideways." Use idioms naturally: "the 80/20 of it," "no silver bullet here."

**3. Varied structure.** Punchline first sometimes, example before theory, bold claim paragraphs, end sections with questions.

**4. Confidence with honesty.** Strong claims ("This works.") with specific doubt ("Except for sites under 50 pages.") and honest admission ("I didn't buy this until I tested it.").

**5. Dense where it matters.** One paragraph crammed with data, next paragraph pure opinion, then an anecdote, then technical depth.

## Typography (strict — enforced at audit; any violation fails)

- **ZERO em-dashes (—) or en-dashes (–).** At any cost do not use them. Use comma, colon, or period instead. Even one instance fails the publishability audit.
- **ZERO curly/smart quotes.** Straight quotes (") and apostrophes (') only. Scan output and replace before returning.
- **No excessive symbols.** AI often overuses: ellipses (...), multiple exclamation marks (!! or !!!), or decorative symbol runs. Use a single period or exclamation; avoid "..." — use a period or rephrase. Keep punctuation minimal and professional.
- Reduce these phrases where natural: ${BANNED_PHRASES_PROMPT}
- Don't start more than 2 sentences in a row the same way. Vary paragraph length patterns.
- No generic transitions: "Furthermore," "Additionally," "Moreover," "In addition," "It is worth noting," "Consequently," "In conclusion." Start the next thought directly or use "But," "Still," or a question.

## Rank Math SEO (non-negotiable)

- Keyword in first 10% of content and in at least one H2/H3. Paragraphs: max 120 words. FAQ section for informational intent.
- No keyword stuffing (density < 3%). (Title, meta, slug are handled separately by another model.)

## Structure (strict)
- **Never output HTML table tags.** Do not use \`<table>\`, \`<tr>\`, \`<td>\`, or \`<th>\`. For any tabular or list-style content use \`<ul>\` or \`<ol>\` only. The frontend does not format tables.

**Output:** Return only valid JSON. No markdown outside the JSON block.`;

/** Normalize JSON string: replace curly/smart quotes, zero-width chars, and BOM so JSON.parse can succeed. */
function normalizeJsonString(s: string): string {
  return s
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')   // all double-quote variants + double prime
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")    // all single-quote variants + single prime
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "");           // zero-width chars + BOM
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

  const prompt = `Write a blog post on "${primaryKeyword}" as a seasoned practitioner writing from experience. Not a summary. Not an overview. A practitioner's take with opinions, specifics, and the kind of detail only someone who's done this work would include.

**Do NOT include:** image placeholders, internal links, external links, Table of Contents, or HTML table tags (frontend does not format tables — use bulleted or numbered lists instead). Those are added in the CMS. Author byline is added by the CMS.

## GOOGLE SEARCH CENTRAL — HELPFUL CONTENT
- Does this provide original analysis and firsthand knowledge? → YES.
- Does this substantially add value beyond existing results? → YES.
- Does this fully satisfy search intent for "${primaryKeyword}"? → YES.
- Would a reader feel they learned enough to achieve their goal? → YES.

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

## RANK MATH SEO (non-negotiable)
- **Title:** Primary keyword in first 50%. Number when natural. Max 60 chars.
- **Meta:** Primary keyword present. 120-160 chars. A pitch, not a summary.
- **Slug:** Primary keyword. Lowercase hyphens. Max 75 chars.
- **Keyword in intro:** Primary keyword in FIRST 2-3 sentences (first ~10% of content).
- **Subheadings:** Primary + secondary keywords in some H2/H3 naturally.
- **Paragraphs:** None over 120 words.
- **Heading hierarchy:** H2-H6 only (no H1 in body). Sequential.
- **FAQ:** For informational intent, H2 "Frequently Asked Questions" with 3-5 Q&As.

## WRITING QUALITY (Google ranking signals)

**Readability & user experience (dwell time, engagement):**
- Vary sentence length: mix 4-word punchy lines with 25-word analytical ones.
- Vary paragraph length: some 1 sentence, some 5-6 sentences. No rhythm.
- Be specific. Not "improve your marketing" but "we A/B tested 14 landing pages and the variant with social proof bumped conversions by 23%." Invent plausible specifics: tool names, dollar amounts, timeframes.
- Use natural idioms: "this is where most people drop the ball," "no silver bullet here."

**E-E-A-T signals:**
- Experience: 2-3 firsthand references. "Anyone who's managed a PPC campaign knows..." or "The first thing you notice is..."
- Expertise: name tools, describe scenarios, reference timeframes.
- Authoritativeness: cite sources naturally.
- Trustworthiness: qualify uncertain claims honestly.

**Content structure for engagement:**
- Front-load value: start some sections with the conclusion, then explain.
- Don't transition uniformly. No "Additionally," "Furthermore," "Moreover" patterns.
- Confidence with honesty: strong claims followed by specific doubt.

## TYPOGRAPHY (strict — any violation fails audit)
- ZERO em-dashes (—) or en-dashes (–). At any cost use comma, colon, period, or rewrite. No exceptions.
- ZERO curly/smart quotes. Straight quotes (") and apostrophes (') only.
- No excessive symbols: no repeated ellipses (...), no !! or !!!, no decorative symbol runs. Single punctuation only.

## OUTPUT FORMAT (valid JSON only)
- Straight double quotes (") for JSON. Keep outline to 6-8 H2 headings.
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
2. **Body sections** — H2/H3 with keywords. Mix of theory, examples, opinion, data.
3. **FAQ** — 3-5 Q&As for informational intent. Direct, helpful answers.
4. **Conclusion** — Direct CTA matching intent. End with something actionable.

${(() => {
  const valid = input.competitorContent?.filter((c) => c.success && c.content) ?? [];
  if (valid.length === 0) return "";
  return `## COMPETITOR ARTICLES
Create content that covers what competitors cover PLUS unique angles, specific examples, and opinions they don't have. This is how you "substantially add value" per Google Search Central.

${valid.map((c) => `### Competitor: ${c.url}\n\n${c.content}`).join("\n\n---\n\n")}`;
})()}

Generate the JSON now. Write like a practitioner, not a textbook.`;

  try {
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 64000,
      temperature: 0.5,
      system: SYSTEM_PROMPT_LEGACY,
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
    jsonText = escapeControlCharactersInJsonStrings(jsonText);

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
// PIPELINE v3: writeDraft (brief-only)
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

/**
 * Write article draft from the strategic research brief only. Title, meta, slug are provided
 * (from OpenAI) — Claude outputs only content, categories, and tags.
 */
export async function writeDraft(
  brief: ResearchBrief,
  titleMetaSlug: TitleMetaSlugOption,
  tokenUsage?: TokenUsageRecord[]
): Promise<{
  content: string;
  suggestedCategories: string[];
  suggestedTags: string[];
}> {
  const anthropic = getAnthropicClient();

  const outlineBlock = brief.outline.sections
    .map(
      (s) =>
        `- ${s.heading} (${s.level}): ${s.targetWords} words. Topics: ${s.topics.join(", ")}${s.geoNote ? `. GEO: ${s.geoNote}` : ""}`
    )
    .join("\n");

  const currentDataWarning = brief.currentData.groundingVerified
    ? ""
    : "\nWARNING: Current data may not be verified (no grounding sources). Use with caution and avoid stating these as confirmed facts.\n";

  const styleBlock = brief.editorialStyleFallback
    ? `Use standard human-like style: avg sentence ~15 words, mix short/medium/long; avg paragraph ~3 sentences; semi-formal, direct address; ~75% prose, ~25% lists. Do not use HTML table tags — use bulleted or numbered lists only.`
    : `Match this editorial style: Sentence length avg ${brief.editorialStyle.sentenceLength.average} words, distribution ${brief.editorialStyle.sentenceLength.distribution.short}% short / ${brief.editorialStyle.sentenceLength.distribution.medium}% medium / ${brief.editorialStyle.sentenceLength.distribution.long}% long / ${brief.editorialStyle.sentenceLength.distribution.veryLong}% very long. Paragraph avg ${brief.editorialStyle.paragraphLength.averageSentences} sentences. Tone: ${brief.editorialStyle.tone}. Reading level: ${brief.editorialStyle.readingLevel}. Content mix: ${brief.editorialStyle.contentMix.prose}% prose, ${brief.editorialStyle.contentMix.lists}% lists. Do not use table tags — use lists (ul/ol) only. Data density: ${brief.editorialStyle.dataDensity}. Intro: ${brief.editorialStyle.introStyle}. CTA: ${brief.editorialStyle.ctaStyle}.`;

  const factsBlock =
    brief.currentData.facts.length > 0
      ? `Current data (use ONLY these for statistics; do NOT invent numbers):\n${brief.currentData.facts.map((f) => `- ${f.fact} (Source: ${f.source})`).join("\n")}

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

  const userPrompt = `Write a blog post using ONLY the following research brief. No image placeholders, internal/external links, or ToC.

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
Section word targets above are guidance; roughly proportion your content across sections accordingly.

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
## CURRENT DATA — ZERO HALLUCINATION
${factsBlock}

## EDITORIAL STYLE
${styleBlock}

## WRITING QUALITY
Vary sentence and paragraph length and openings. E-E-A-T: 2-3 experience signals (e.g. "anyone who…", "the first time you…"), cite data with natural attribution, only numbers from currentData. Every section must advance the reader's goal; no fluff.

## GEO & FAQ
- Direct answer: ${brief.geoRequirements.directAnswer}
- Stats: ${brief.geoRequirements.statDensity}
- Entities: ${brief.geoRequirements.entities}
- FAQ answers: max 300 characters each. Each answer must add at least one of: a so-what, a comparison, a forward look, a caveat, or a concrete next step — not a condensed repeat of the body. No repeating body numbers; every FAQ answer must teach something new to someone who read the full article.
${brief.geoRequirements.faqStrategy ? `- FAQ strategy: ${brief.geoRequirements.faqStrategy}` : ""}

## WORD COUNT (STRICT)
Section word targets sum to approximately ${brief.outline.estimatedWordCount}. Article total must be ${brief.wordCount.target} words (±5%). Distribute content accordingly.
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

  const writeDraftStartMs = Date.now();
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 32000,
    temperature: 0.5,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
  const message = await stream.finalMessage();
  const writeDraftDurationMs = Date.now() - writeDraftStartMs;
  const usage = getClaudeUsage(message as { usage?: { input_tokens?: number | null; output_tokens?: number } });
  if (tokenUsage) {
    tokenUsage.push({
      callName: "writeDraft",
      model: "claude-sonnet-4-5",
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

  const contentOnly = typeof parsed.content === "string" && parsed.content.trim().length > 0;
  if (!contentOnly) {
    console.error("[claude] writeDraft Zod errors:", validated.error.flatten());
    throw new Error("Claude writeDraft response missing or empty content");
  }
  return {
    content: (parsed.content as string) ?? "",
    suggestedCategories: Array.isArray(parsed.suggestedCategories) ? parsed.suggestedCategories.filter((c): c is string => typeof c === "string") : [],
    suggestedTags: Array.isArray(parsed.suggestedTags) ? parsed.suggestedTags.filter((t): t is string => typeof t === "string") : [],
  };
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
        model: "claude-sonnet-4-5",
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
        model: "claude-sonnet-4-5",
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