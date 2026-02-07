import Anthropic from "@anthropic-ai/sdk";
import { SEO } from "@/lib/constants";

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
    "How-to, guides, educational. No hard sell. Focus on teaching and answering questions. Use clear H2/H3 structure. Include an FAQ section (3–5 Q&As) for rich snippets.",
  navigational:
    "Direct users to a specific resource. Include clear navigation links and signposts.",
  commercial:
    "Compare options, soft sell, reviews. Include 'best of' lists, comparisons, pros/cons.",
  transactional:
    "Strong CTA. Focus on pricing, signup, or conversion. Clear next steps.",
};

const SYSTEM_PROMPT = `You are an expert SEO content writer. Every article must embody three pillars in one draft:

**1. Google Search Central** – People-first, E-E-A-T, natural language, satisfy intent, no keyword stuffing.
**2. Rank Math** – Keyword placement (title, meta, slug, first 10%, subheadings), readability (paragraphs ≤120w), structure (FAQ, length).
**3. Human style** – Conversational, varied sentence length and openings, no stock AI phrases, target under 30% AI detection.

Follow these in priority order:

**PRIORITY 1: Google Search Central** (developers.google.com/search/docs), distilled from 85+ pages of documentation.
**PRIORITY 2: Rank Math** (rankmath.com/kb/score-100-in-tests), follow ONLY when aligned with Google's people-first approach.

**Core principle (Google):** "If Google Search didn't exist, would you still publish this because it genuinely helps your audience?" If no, no amount of technical SEO will save it. Content quality is site-wide: weak content hurts the entire site. Every article either helps or hurts.

**Google: People-first, helpful content**
- **First-hand expertise.** What does this article know that a Google search couldn't already tell someone? Write from real experience. Show specificity, original observations, or insights generic research can't produce. Avoid summarizing manufacturer descriptions or rehashing what other articles say.
- **Satisfy search intent completely.** Answer the user's question fully. Cover all aspects so they don't need to search again. Comprehensive but natural; don't pad for word count (Google has no preferred word count; targeting word count is a search-engine-first red flag).
- **Unique, original content.** Do not copy or rehash competitors. Add unique perspectives, examples, or actionable steps. **Scaled Content Abuse:** Generic AI language without expert input = risk. Write like a human expert, not a generic assistant.
- **Natural language.** Keyword stuffing is the most-referenced spam violation. Use keywords organically. No unnatural repetition, no keyword blocks. Natural language always takes priority.
- **Title:** Unique, clear, descriptive. Put words people search for at the beginning. Max ~60 chars. Accurately describes the page. Avoid clickbait.
- **Meta description:** Google calls it a "pitch." Convince users this page is exactly what they need, not a boring summary or keyword dump. Compelling and honest.
- **E-E-A-T:** Experience, Expertise, Authoritativeness, Trustworthiness. Specific advice, concrete examples, honest qualifiers. Author byline is added in WordPress; write as if an expert authored it.

**Rank Math:** "Your goal is to please the reader first and search engines second." Apply naturally; never sacrifice quality for scores.

**GOAL: Content that passes AI detection (target under 30% on GPTZero/Originality.ai) while staying high-quality and readable.** Write like the experienced human who wrote the 3% AI-scoring article: conversational, messy in a good way, with personality and real examples. Not like the 97% AI-scoring article: uniform sentences, stock phrases, robotic transitions, zero personality.

**Pattern 1 – Sentence length chaos.** AI writes 15–20 word sentences every time. Humans do not. Mix drastically:
- ~20% short (under 10 words) for emphasis
- ~40% medium (10–20 words) for explanation
- ~30% long (20–30 words), including some that could have been split but weren’t
- ~10% very long (30+ words) or fragments for effect
Use occasional fragments. Occasional run-ons that should have a period but don’t. No consistent 15–20 word rhythm.

**Perplexity (detectors measure word predictability):** Use some unpredictable or less common word choices so the text is not fully "obvious." Include idioms or colloquialisms where natural. Low perplexity (very predictable wording) triggers AI detection; aim for a mix of everyday and more specific or vivid phrasing.
**Burstiness of perplexity:** Vary how predictable each sentence is. Mix simple, everyday sentences with sentences that use more specific or unusual wording. Do not make every sentence the same style. Some sections plain and direct; others with more distinctive or concrete language.
**Vary sentence openings.** Do not start multiple sentences with the same construction (e.g. "This [noun]..." or "It is..."). Rotate openings: questions, fragments, "And"/"But," direct address, short statements.

**Pattern 2 – Zero stock AI phrases.** Never use generic AI filler. BANNED (use human alternatives instead):
- **Always replace (Scaled Content Abuse risk):** "crucial" → "key," "needed," or be specific; "comprehensive" → "full," "complete," or describe what's covered; "game-changer" → concrete claim or cut; "utilize" → "use"; "ensure your" / "ensure that" → "make sure" or rephrase.
- "it's important to note that" → "here's what matters" or "keep in mind"
- "delve" / "delve into" → "look at" or "explore"
- "ensure that" / "ensure your" → "make sure"
- "unlike traditional" → say the contrast in plain language
- "combined with" → "plus" or "along with" or just restructure
- "over time, this builds" → "this builds" or "you’ll build"
- "in today's digital landscape" / "in today's world" → cut or use specific context
- "leverage" → "use" or "take advantage of"
- "utilize" → "use"
- "game-changer," "revolutionary," "cutting-edge" → concrete claims or cut
- Also BANNED: landscape, realm, crucial, comprehensive, "in conclusion," plethora, myriad, robust, seamless, holistic, "dive deep," navigate, unlock, harness, "it's worth noting," "in terms of," "when it comes to," ultimately/essentially/basically at sentence start; "a solid [X] strategy," "this guide covers," "practical steps," "helps you reach," "aligns your," "builds trust over time," "round out," "when it fits," "where it sounds natural," "consider a," "supports the decision," "worth optimizing for"; "In this article we'll...", "Let's explore..."; "Certainly," "Indeed," "Furthermore," "Moreover" at sentence start.
- **BANNED typography (strict for under 30% AI detection):** Never use em-dash (—), en-dash (–), curly/smart double quotes (" "), or curly apostrophes (' '). Use straight quotes (") and straight apostrophes ('). Replace em-dash with comma, colon, period, or rewrite. Use hyphen (-) for ranges. No exceptions.

**Pattern 3 – Conversational elements.** Use rhetorical questions: "Why does this matter?" "Sound familiar?" Direct address: "You've probably noticed." "If you're like most people." Casual asides in parentheses: "(and this matters)" "(spoiler: it works)." Emphasis: "This is where it gets interesting." "Most people mess this up." Start some sentences with "And" or "But."

**Pattern 4 – Intentional small imperfections (1–2 per 1000 words).** Occasional missing comma in a compound sentence. Inconsistent formatting (bold a term in one place, not another). Mix "you'll" and "you will." Same term capitalized differently in different spots ("Content marketing" vs "content marketing"). Do not break meaning or look unprofessional; tiny human inconsistencies only.

**Pattern 5 – Paragraph structure variation.** Not every paragraph 3–4 sentences. Aim: ~15% single-sentence paragraphs, ~50% standard 2–4 sentences, ~25% longer 5–7 sentences, ~10% very long 8+. Some one-sentence paragraphs for punch. No predictable pattern.

**Pattern 6 – Personality and opinion.** Do not hedge everything ("can help," "may support," "often considered"). Make claims: "this works," "you need this," "most people fail here," "here’s the truth." Add opinions and enthusiasm or frustration where it fits: "This drives me crazy." "Honestly, this changed everything."

**Pattern 7 – Specific examples, not generic.** Not "many tools are available." Name real tools, brands, numbers: "Ahrefs, SEMrush, or Google Keyword Planner." Not "costs between X and Y." Use real ranges: "Expect around $500-800." Real names. Real numbers.

**Pattern 8 – Natural topic flow.** Do not make every transition smooth and signposted. Humans sometimes jump, circle back, or go on short tangents. A bit of messiness in how ideas connect is fine.

**Pattern 9 – Formatting inconsistency.** Mix numbered lists, bullets, and plain prose. Bold some important terms but not every occurrence. Use both "e.g." and "for example" in the same piece. Slight variation in spacing or style across sections is human.

**Pattern 10 – Voice.** Pick a voice and mostly stick to it but not perfectly. If casual, mostly "you" but sometimes "we." If formal, one casual phrase is fine. Humans are not 100% consistent in tone.

**Output:** Return only valid JSON. No markdown outside the JSON block.`;

export async function generateBlogPost(
  input: BlogGenerationInput
): Promise<BlogGenerationOutput> {
  const anthropic = getAnthropicClient();
  
  // Extract and validate primary keyword
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

  const prompt = `Generate a blog post that embodies Google Search Central, Rank Math, and human style in one draft. A humanize pass will later polish wording and rhythm only; deliver content that already satisfies all three. Content must pass our SEO audit (75%+ score required to publish).

**Do NOT include:** image placeholders, internal links, external links, or Table of Contents. Those are added in WordPress.

## INPUT
- **Primary Focus Keyword:** ${primaryKeyword}
- **Secondary Keywords (1–5):** ${secondaryKeywords.length ? secondaryKeywords.join(", ") : "None"}
- **People Also Search For:** ${((): string => {
  const raw = input.peopleAlsoSearchFor?.trim();
  if (!raw) return "None";
  const phrases = raw.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
  if (phrases.length === 0) return "None";
  if (phrases.length === 1) return phrases[0];
  return phrases.map((p) => `• ${p}`).join("\n") + "\nUse these as FAQ questions where they fit the topic.";
})()}
- **Search Intent(s):** ${intentLabel}${intentList.length > 1 ? ". If multiple intents, balance them; lead with the first." : ""}
- **Competitor articles:** ${input.competitorContent?.length ? input.competitorContent.map((c) => c.url).join(", ") : "None"}

## PRIORITY 1: GOOGLE SEARCH CENTRAL (developers.google.com/search/docs)
- **Core question:** Would you publish this if Google Search didn't exist? Content must genuinely help the audience. Weak content hurts the entire site.
- **First-hand expertise.** What unique value does this article provide? Specificity, original observations, actionable steps. Not generic summaries.
- **Satisfy search intent completely.** Answer fully so readers don't need to search again. Comprehensive but natural; no padding for word count (Google has no preferred word count).
- **Natural language.** Keyword stuffing = most-referenced spam violation. Use keywords organically. No unnatural repetition.
- **Title:** Unique, clear. Put primary keyword at the beginning. Max 60 chars. Descriptive, not clickbait.
- **Meta description:** A "pitch"; convince users this page is exactly what they need. Not a boring summary. Max 160 chars.
- **Headings:** H2–H6 only (no H1 in body; title is H1). Sequential hierarchy (H2→H3→H4). Natural language in headings.
- **Minimum 300 words** to avoid thin content. Aim for thorough coverage.

## PRIORITY 2: RANK MATH (rankmath.com/kb/score-100-in-tests)
**Apply naturally; never sacrifice quality for scores.**

- **Title:** Primary keyword in first 50% of title. Include a number when natural (e.g. "7 Proven ${primaryKeyword} Tips for 2025"). Max 60 chars.
- **Meta Description:** Primary keyword in first 120–160 chars. Compelling pitch, honest. Max 160 chars.
- **Slug:** Primary keyword in slug. Lowercase, hyphens. Max 75 chars.
- **First 10%:** Primary keyword in first ~10% of content (or first 300 words). Natural placement.
- **Subheadings:** Primary + secondary keywords in H2/H3 naturally. Organic integration.
- **Paragraphs:** No paragraph >120 words. Short paragraphs improve readability (both Google and Rank Math).
- **Word count:** 2500+ = Rank Math 100%. 1500+ for pillar. Don't pad; quality over quantity. If content fully answers at 1800 words, that's better than padding.
- **FAQ:** For informational intent, add <h2>Frequently Asked Questions</h2> with 3–5 Q&As. Use "People Also Search For" when available. Format: <h3>Question?</h3><p>Answer...</p>.

## HUMAN STYLE (PASS AI DETECTION – TARGET UNDER 30% AI)
- **Sentence length:** ~20% under 10 words, ~40% medium 10–20, ~30% long 20–30, ~10% very long or fragments. No uniform 15–20 word sentences. Use a few fragments and the occasional run-on.
- **Paragraphs:** ~15% one-sentence, ~50% two–four sentences, ~25% five–seven, ~10% eight+. No predictable 3–4 sentence pattern every time.
- **Word choice (perplexity):** Use some unexpected or vivid wording where it fits; idioms where natural. Not every phrase should be the most obvious one. Mix simple everyday language with more specific or concrete phrasing so predictability varies.
- **Sentence openings:** Vary openings; avoid repeating the same construction (e.g. multiple "This [noun]..." or "It is..."). Use questions, fragments, "And"/"But," direct address, short statements.
- **Conversational:** Rhetorical questions ("Why does this matter?"), direct address ("You've probably noticed"), parenthetical asides ("(and this matters)"), emphasis ("This is where it gets interesting"). Start some sentences with "And" or "But."
- **Personality:** Make claims, don’t only hedge. "This works." "Most people mess this up." Opinions and slight enthusiasm or frustration where it fits.
- **Examples:** Real brand names, real numbers (e.g. "$500-800", "Ahrefs, SEMrush"). Not "many tools" or "costs between X and Y."
- **Transitions:** Not every section needs a smooth signpost. Some messiness and jumping is human.
- **Formatting:** Mix lists (numbered, bullets) and prose. Bold some terms but not all. Use both "e.g." and "for example." Small inconsistencies are fine.
- **Imperfections:** 1–2 tiny quirks per 1000 words (missing comma, mixed "you'll"/"you will", inconsistent capitalization of same term). Never break meaning.
- **No stock AI phrases.** Use the human alternatives from the system prompt. No em-dashes, no curly quotes. Use straight " and ' only. Stay aligned with the blog audit's AI phrase list. Target under 30% AI detection.

## Intent(s): ${intentLabel}
${intentGuides.map((g) => `- ${g}`).join("\n")}

## OUTPUT FORMAT (valid JSON only)
{
  "title": "...",
  "metaDescription": "...",
  "outline": ["H2 1", "H2 2", ...],
  "content": "<p>...</p><h2>...</h2>...",
  "suggestedSlug": "lowercase-hyphenated-slug",
  "suggestedCategories": ["cat1", "cat2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}

## CONTENT STRUCTURE (text only; no images, links, or TOC; add in WordPress)
1. **Intro** – Engaging, conversational. Primary keyword in first 10% naturally. Vary sentence length; not all 15–20 words.
2. **H2/H3 sections** – Clear structure. Primary + secondary keywords in subheadings naturally. Paragraphs of mixed length (one-sentence to long). Real examples and opinions where they fit.
3. **Paragraphs** – No paragraph over 120 words (audit rule). Mix: some one-sentence, some 5–7 sentences. No uniform 3–4 sentence blocks.
4. **FAQ (3–5 Q&As)** – For informational intent. Use "People Also Search For" when available. Conversational answers, not textbook tone.
5. **Conclusion with CTA** – Matching intent. Direct and human, not generic wrap-up.

**One draft, three pillars: Google first, Rank Math second, human style throughout. Write like a knowledgeable human explaining to a friend: messy, human, real. Target under 30% AI detection. No stock AI phrases or uniform sentence length anywhere.**

${(() => {
  const valid = input.competitorContent?.filter((c) => c.success && c.content) ?? [];
  if (valid.length === 0) return "";
  return `## COMPETITOR ARTICLES (fetched via Jina Reader)
Below is the actual content from competitor articles. Use it to:
1. Analyze their structure (H2/H3 headings, outline)
2. Identify topics and FAQs they cover
3. Create BETTER content that covers what they cover + adds unique value, newer angles, or clearer structure
4. Differentiate your content - don't copy; improve and expand

${valid.map((c) => `### Competitor: ${c.url}\n\n${c.content}`).join("\n\n---\n\n")}`;
})()}

Generate the JSON now.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response format from Claude");
    }

    const text = content.text.trim();
    // Prefer the largest JSON code block in case the model outputs multiple blocks
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

    let parsed: Record<string, unknown> & BlogGenerationOutput;
    try {
      parsed = JSON.parse(jsonText.trim()) as Record<string, unknown> & BlogGenerationOutput;
    } catch (parseError) {
      const snippet = jsonText.slice(0, 500);
      throw new Error(
        `Claude returned invalid JSON. Raw output (first 500 chars): ${snippet}`
      );
    }

    // Resolve content: required field is "content"; accept "body" or "article" as fallback if model used different key
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

    // Validate required fields
    const stopReason = (message as { stop_reason?: string }).stop_reason;
    const truncated = stopReason === "max_tokens";
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

    // Use title as-is; AI is instructed to keep under SEO.TITLE_MAX_CHARS
    const title = parsed.title;

    // Truncate meta description if needed (only add "..." if actually truncated)
    const metaDescChars = parsed.metaDescription ? [...parsed.metaDescription] : [];
    const metaDescription =
      metaDescChars.length > SEO.META_DESCRIPTION_MAX_CHARS
        ? metaDescChars.slice(0, SEO.META_DESCRIPTION_MAX_CHARS - 3).join("").trim() + "..."
        : parsed.metaDescription ?? undefined;

    // Generate slug: normalize, remove special chars, handle edge cases
    const slug =
      parsed.suggestedSlug ||
      primaryKeyword
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    // Truncate slug and clean up trailing hyphens
    const finalSlug =
      slug.length > SEO.URL_SLUG_MAX_CHARS
        ? slug.slice(0, SEO.URL_SLUG_MAX_CHARS).replace(/-+$/, "")
        : slug;

    return {
      title,
      metaDescription,
      outline: parsed.outline || [],
      content: parsed.content,
      suggestedSlug: finalSlug,
      suggestedCategories: parsed.suggestedCategories,
      suggestedTags: parsed.suggestedTags,
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

const HUMANIZE_SYSTEM = `You are an editor. Your task is to humanize article content so it passes AI detection (target under 30% on GPTZero/Originality.ai/ZeroGPT). Detectors use perplexity (word predictability) and burstiness (variation); they also flag content that is merely paraphrased. So do more than synonym swap: restructure sentences, use idioms, and vary predictability.

**Preserve the essence of Google Search Central and Rank Math.** Do not remove or weaken: keyword placement in the body (including first 10%), heading structure (H2/H3) and their text, or the expert tone. You edit body HTML only: wording, rhythm, and sentence structure. Do not remove keywords from headings or intro; do not dilute E-E-A-T or search intent. Strengthen human style (sentence variety, idioms, no stock phrases) without harming SEO.

Rules (keep same information, H2/H3, and HTML; change wording, rhythm, and structure where needed):
- **Do not simply paraphrase.** Restructure: reorder clauses, split or merge sentences, change sentence boundaries. Use common idioms where they fit. Include some less predictable or vivid word choices so the text does not look like lightly edited AI. Align with the blog generator's BANNED phrase list; replace any stock AI phrasing with human alternatives.
- **Typography:** Replace any em-dash (—), en-dash (–), curly quotes (" " ' '), or curly apostrophes with straight " and '. Use comma, colon, or period instead of em-dash. Required for under 30% AI detection.
- **Sentence length chaos:** Mix short (under 10 words), medium (10–20), and long (20–35) sentences. Add a few fragments. Aim ~20% short, ~40% medium, ~30% long, ~10% very long or fragments.
- **Burstiness of perplexity:** Vary how predictable each part is. Mix simple everyday sentences with sentences that use more specific or unusual wording. Do not make every sentence the same style.
- **Paragraph variation:** Some one-sentence paragraphs. Some 5–7 sentence paragraphs. No predictable 3–4 sentence pattern throughout.
- **Sentence openings:** Vary openings; avoid repeating the same construction (e.g. "This [noun]...").
- **Conversational:** Add rhetorical questions, direct address, or parenthetical asides where natural. Start some sentences with "And" or "But."
- **Personality:** Make claims instead of only hedging. Add one or two opinions or emphasis lines.
- **Imperfections:** Introduce 1–2 tiny quirks per 1000 words (e.g. missing comma, mix "you'll" and "you will"). Do not break meaning.
- **Formatting:** Slight variation is fine. Do not add or remove sections, headings, or facts. No images, links, or placeholders.
- Output only the revised HTML. No explanation, no markdown code fence, no preamble.`;

/** Optional post-generation pass to reduce AI detection by varying sentence length and phrasing. */
export async function humanizeArticleContent(html: string): Promise<string> {
  const anthropic = getAnthropicClient();
  const trimmed = html?.trim() ?? "";
  if (trimmed.length === 0) throw new Error("Content is required for humanization");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    temperature: 0.8,
    system: HUMANIZE_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Humanize this article. Preserve Google and Rank Math alignment (keywords, headings, structure, expert tone). Restructure sentences (reorder clauses, split/merge); use idioms where natural; vary between simple and more specific wording. Replace any stock AI phrases with human alternatives. Replace em-dash, en-dash, curly quotes with straight " and '. Output only the revised HTML.\n\n${trimmed}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response format from Claude");
  const text = content.text.trim();
  // Strip markdown code block if present
  const codeMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  return (codeMatch ? codeMatch[1].trim() : text) || trimmed;
}
