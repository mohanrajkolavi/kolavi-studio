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

const SYSTEM_PROMPT = `You are an expert SEO content writer. Follow these guidelines in priority order:

**PRIORITY 1: Google Search Central** (developers.google.com/search/docs) – SEO Starter Guide, Creating Helpful Content
**PRIORITY 2: Rank Math** (rankmath.com/kb/score-100-in-tests) – Follow Rank Math guidelines ONLY when they don't conflict with Google's people-first approach.

**Google: People-first, helpful content (Helpful Content Update, March 2024)**
- **Write for humans first, search engines second.** Create content people find compelling and useful. Prioritize readers over search engines.
- **Demonstrate real expertise.** Write from first-hand knowledge and experience. Show you understand the topic deeply, not just summarizing others.
- **Satisfy search intent completely.** Answer the user's question fully so they don't need to search again. Cover all aspects of the topic thoroughly.
- **Unique, original content.** Do not copy or rehash competitors. Create based on your expertise; add unique insights, examples, or perspectives.
- **Easy-to-read, well organized.** Free of spelling/grammar errors. Break into paragraphs and sections with clear headings. Use logical flow.
- **Expect readers' search terms.** Anticipate keyword variations (e.g., "charcuterie" vs "cheese board"). Write for different knowledge levels—beginner to advanced.
- **Demonstrate E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) through:
  - Specific, actionable advice based on real experience
  - Concrete examples, case studies, or data
  - Expert sources cited where helpful
  - Honest, transparent information (use qualifiers like "often," "typically" instead of unsupported superlatives)
- **Natural language.** Google: "Keyword stuffing is against spam policies." Keep language natural; avoid excessive keyword repetition. Keywords should appear organically.
- **Good title:** Unique to the page, clear, concise, accurately describes contents. Avoid clickbait; manage expectations.
- **Good meta description:** Short, unique, includes most relevant points. Compelling but honest.

**Rank Math:** "Your goal is to please the reader first and search engines second."

**Do NOT sound like AI.** Write like a 10 plus years of experience human expert in Content Marketing, SEO and Copywriting. Avoid:
- Em-dashes (—). Use commas, semicolons, or separate sentences instead.
- AI-ish phrases: "delve," "landscape," "realm," "crucial," "comprehensive," "it's important to note," "in conclusion," "in today's world," "game-changer," "leverage," "utilize" (use "use"), "plethora," "myriad," "robust," "seamless," "holistic," "dive deep," "navigate," "unlock," "harness."
- Overused openings: "In this article we'll...", "Let's explore...", "When it comes to..."
- Filler: "Certainly," "Indeed," "Furthermore," "Moreover" at sentence start; repetitive "However" / "Therefore."
- Lists or bullets for every point; use full sentences and normal prose.
- Same sentence length; vary it. Short. Then a longer one that adds detail.

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
  const secondaryKeywords = keywordParts.slice(1, 10);
  const intentList = Array.isArray(input.intent)
    ? input.intent
    : input.intent
    ? [input.intent]
    : ["informational"];
  const intentLabel = intentList.join(", ");
  const intentGuidesRaw = intentList.map((i) => INTENT_GUIDE[i as keyof typeof INTENT_GUIDE]).filter(Boolean);
  const intentGuides = intentGuidesRaw.length > 0 ? intentGuidesRaw : [INTENT_GUIDE.informational];

  const prompt = `Generate a blog post following Google Search Central guidelines FIRST, then Rank Math guidelines where they align.

**PRIORITY: Google guidelines take precedence. Rank Math guidelines are secondary and should only be followed when they don't conflict with Google's people-first approach.**

**Do NOT include:** image placeholders, internal links, external links, or Table of Contents. Those are added later in WordPress.

## INPUT
- **Primary Focus Keyword:** ${primaryKeyword}
- **Secondary Keywords (1–9):** ${secondaryKeywords.length ? secondaryKeywords.join(", ") : "None"}
- **People Also Search For:** ${input.peopleAlsoSearchFor || "None"}
- **Search Intent(s):** ${intentLabel}
- **Competitor articles:** ${input.competitorContent?.length ? input.competitorContent.map((c) => c.url).join(", ") : "None"}

## PRIORITY 1: GOOGLE SEARCH CENTRAL GUIDELINES (developers.google.com/search/docs) - Helpful Content Update
- **People-first content.** Write for humans first, search engines second. Create content that genuinely helps readers.
- **Satisfy search intent completely.** Answer the user's question fully. Cover all aspects so readers don't need additional searches.
- **Demonstrate real expertise.** Write from first-hand knowledge. Show deep understanding through specific examples, actionable steps, data, or case studies.
- **Unique, original content.** Do not copy or rehash competitors. Add unique insights, perspectives, or approaches based on your expertise.
- **Easy-to-read, well organized.** Clear paragraphs, logical sections, proper headings. No spelling/grammar errors.
- **Expect readers' search terms.** Anticipate keyword variations and synonyms. Write for different knowledge levels (beginner to advanced).
- **Demonstrate E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness):
  - Show experience through real examples and case studies
  - Demonstrate expertise with specific, actionable advice
  - Build authority through accurate, well-researched information
  - Establish trust with honest, transparent content (use qualifiers, avoid unsupported claims)
- **Natural language.** Google's spam policies prohibit keyword stuffing. Keywords should appear organically in natural, conversational language.
- **Complete answers.** Don't leave readers hanging. Provide comprehensive information that fully addresses their query.

## PRIORITY 2: RANK MATH GUIDELINES (rankmath.com/kb/score-100-in-tests)
**Follow these ONLY when they align with Google's people-first approach. Never sacrifice content quality for Rank Math scores.**

### Basic SEO (Rank Math) - Apply naturally, don't force:
- **Title:** Primary keyword within first 50 characters (Google shows ~60 desktop, ~50 mobile). Max 60 chars. Natural, compelling title. E.g. "7 Proven ${primaryKeyword} Tips for 2025".
- **Meta Description:** Primary keyword in first 120–160 chars. Max 160 chars. Compelling, click-worthy, but honest (no clickbait). End with CTA when appropriate.
- **URL Slug:** Primary keyword in slug. Lowercase, hyphens. Max 75 chars. Keep it natural and readable.
- **First 10%:** Primary keyword in first 10% of content (or first 300 words if post is short). Appear naturally, not forced.
- **Keywords in content:** All focus keywords (primary + secondary) appear naturally. Singular and plural both count. Natural integration only.
- **Keyword density:** 1–1.5% target. Never exceed 2.5% (Rank Math warns, Google penalizes stuffing). Natural language always takes priority.
- **Word count:** 2500+ words = 100% Rank Math score. Minimum 1500 for pillar content. (2000–2500 = 70%, 1500–2000 = 60%) Don't pad for word count—quality over quantity. If content naturally ends at 1800 words and fully answers the query, that's better than padding to 2500.

### Additional SEO (Rank Math) - Apply naturally:
- **Subheadings:** Primary AND secondary keywords in H2/H3 naturally. Rank Math runs this test on all focus keywords. Include these organically in content structure.

### Title Readability (Rank Math) - When appropriate:
- Primary keyword in first 50% of title (when natural).
- Evoke strong sentiment (curiosity, value, urgency; avoid clickbait per Google).
- Power words when they add value: Proven, Essential, Best, Ultimate, Complete, Simple, Easy, etc.
- Numbers in title when suitable (7, 10, 5) and accurate.

### Content Readability (Rank Math) - Aligns with Google:
- **Short paragraphs:** No paragraph >120 words. Rank Math fails this test if any paragraph exceeds 120. This also improves readability per Google.
- **FAQ:** For informational intent, add <h2>Frequently Asked Questions</h2> with 3–5 Q&As. Use "People Also Search For" questions when available. Format: <h3>Question?</h3><p>Answer...</p>. Enables FAQ rich snippets (Google supports this).

## VOICE: HUMAN, NOT AI
- **No em-dashes (—).** Use commas, semicolons, or new sentences.
- **No AI telltales:** delve, landscape, realm, crucial, comprehensive, "it's important to note," "in conclusion," "in today's world," game-changer, leverage, utilize (use "use"), plethora, myriad, robust, seamless, holistic, "dive deep," navigate, unlock, harness.
- **No stock openings:** "In this article we'll...", "Let's explore...", "When it comes to..."
- **Vary sentence length.** Mix short and longer sentences. Prefer normal prose over bullet-heavy lists.

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

## CONTENT STRUCTURE (text only – no images, links, or TOC; add those in WordPress)
**Follow Google's people-first approach first, then naturally incorporate Rank Math elements:**

1. **Intro (2–4 sentences)** - Engaging, helpful opening. Primary keyword appears naturally in first 10% (Rank Math requirement, but must feel natural per Google).
2. **H2/H3 sections** - Clear structure per Google. Primary + secondary keywords in subheadings naturally (Rank Math requirement, but must be organic per Google).
3. **Short paragraphs (≤120 words each)** - Improves readability (both Google and Rank Math).
4. **FAQ section (3–5 Q&As)** - For informational intent. Helps users (Google) and enables rich snippets (Rank Math).
5. **Conclusion with CTA** - Matching intent, helpful and honest (Google). Natural CTA (Rank Math).

**Remember: If Rank Math requirements conflict with Google's people-first approach, prioritize Google. Natural, helpful content always wins.**

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
      max_tokens: 8192,
      temperature: 0.6,
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
    const jsonMatch =
      text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/```\s*([\s\S]*?)\s*```/);
    const jsonText = jsonMatch ? jsonMatch[1].trim() : text;

    let parsed: BlogGenerationOutput;
    try {
      parsed = JSON.parse(jsonText.trim()) as BlogGenerationOutput;
    } catch (parseError) {
      const snippet = jsonText.slice(0, 500);
      throw new Error(
        `Claude returned invalid JSON. Raw output (first 500 chars): ${snippet}`
      );
    }

    // Validate required fields
    if (!parsed.title || typeof parsed.title !== "string" || parsed.title.trim().length === 0) {
      throw new Error("Invalid response from Claude: title is required and must be non-empty");
    }
    if (!parsed.content || typeof parsed.content !== "string" || parsed.content.trim().length === 0) {
      throw new Error("Invalid response from Claude: content is required and must be non-empty");
    }

    // Truncate title if needed (only add "..." if actually truncated)
    const titleChars = [...parsed.title];
    const title =
      titleChars.length > SEO.TITLE_MAX_CHARS
        ? titleChars.slice(0, SEO.TITLE_MAX_CHARS - 3).join("").trim() + "..."
        : parsed.title;

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
