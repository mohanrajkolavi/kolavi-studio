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

export async function generateBlogPost(
  input: BlogGenerationInput
): Promise<BlogGenerationOutput> {
  const anthropic = getAnthropicClient();

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
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      temperature: 0.9, // Higher temp = less probable token selection = higher perplexity
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

    const title = parsed.title;

    const metaDescChars = parsed.metaDescription ? [...parsed.metaDescription] : [];
    const metaDescription =
      metaDescChars.length > SEO.META_DESCRIPTION_MAX_CHARS
        ? metaDescChars.slice(0, SEO.META_DESCRIPTION_MAX_CHARS - 3).join("").trim() + "..."
        : parsed.metaDescription ?? undefined;

    const slug =
      parsed.suggestedSlug ||
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

You understand that AI detectors measure three things:
1. **Perplexity (word-level):** How predictable each word is. AI text = uniformly low perplexity (every word is the most probable choice). Human text = variable perplexity with spikes of unexpected words.
2. **Burstiness (sentence-level):** How much the predictability varies from sentence to sentence. AI = flat, uniform. Human = zigzag.
3. **Pattern matching:** Classifiers trained on AI vs human text looking for structural patterns.

Your job: inject perplexity spikes, create burstiness variation, and break classifier patterns. While preserving all SEO elements.

## RULES

### PRESERVE (do not touch):
- All H2 and H3 headings and their text
- Keywords in the first 10% of content
- Keywords in the body (don't remove them)
- The factual content, claims, and data
- Overall structure and section order
- HTML tags and formatting

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

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    temperature: 1.0, // High temperature = less probable token choices = higher perplexity
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