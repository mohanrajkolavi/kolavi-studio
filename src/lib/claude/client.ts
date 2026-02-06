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

const SYSTEM_PROMPT = `You are an expert SEO content writer. Align with:

1. **Google Search Central** (developers.google.com/search/docs) – SEO Starter Guide, Creating Helpful Content
2. **Rank Math** (rankmath.com/kb/score-100-in-tests)

**Google: People-first, helpful content**
- Create content people find compelling and useful. Prioritize readers over search engines.
- Text: Easy-to-read, well organized, free of spelling/grammar errors. Break into paragraphs and sections with headings.
- Content: Unique; do not copy others. Create based on what you know; don't rehash competitors.
- Expect readers' search terms: Anticipate keyword variations (e.g., "charcuterie" vs "cheese board"). Write for different knowledge levels.
- Provide expert or experienced sources where it helps demonstrate expertise.
- Google: "Keyword stuffing is against spam policies." Keep language natural; avoid excessive repetition.
- Good title: Unique to the page, clear, concise, accurately describes contents.
- Good meta description: Short, unique, includes most relevant points.
- Google: "E-E-A-T is not a ranking factor" but helps create helpful content; demonstrate expertise through specific, actionable advice.
- Avoid clickbait; manage expectations. Use qualifiers ("often," "typically") instead of unsupported superlatives.

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
  const primaryKeyword = input.keywords.split(",")[0]?.trim() || input.keywords.trim();
  const secondaryKeywords = input.keywords
    .split(",")
    .slice(1, 10)
    .map((k) => k.trim())
    .filter(Boolean);
  const intentList = Array.isArray(input.intent)
    ? input.intent
    : input.intent
    ? [input.intent]
    : ["informational"];
  const intentLabel = intentList.join(", ");
  const intentGuidesRaw = intentList.map((i) => INTENT_GUIDE[i as keyof typeof INTENT_GUIDE]).filter(Boolean);
  const intentGuides = intentGuidesRaw.length > 0 ? intentGuidesRaw : [INTENT_GUIDE.informational];

  const prompt = `Generate a blog post aligned with Rank Math 100/100 (rankmath.com/kb/score-100-in-tests) and Google Search Central (developers.google.com/search/docs).

**Do NOT include:** image placeholders, internal links, external links, or Table of Contents. Those are added later in WordPress.

## INPUT
- **Primary Focus Keyword:** ${primaryKeyword}
- **Secondary Keywords (1–9):** ${secondaryKeywords.length ? secondaryKeywords.join(", ") : "None"}
- **People Also Search For:** ${input.peopleAlsoSearchFor || "None"}
- **Search Intent(s):** ${intentLabel}
- **Competitor articles:** ${input.competitorContent?.length ? input.competitorContent.map((c) => c.url).join(", ") : "None"}

## BASIC SEO (Rank Math – must pass all)
- **Title:** Primary keyword within first 50 characters (Google shows ~60 desktop, ~50 mobile). Max 60 chars. E.g. "7 Proven ${primaryKeyword} Tips for 2025".
- **Meta Description:** Primary keyword in first 120–160 chars. Max 160 chars. Compelling, click-worthy. End with CTA (Learn more, Get started, Read on).
- **URL Slug:** Primary keyword in slug. Lowercase, hyphens. Max 75 chars.
- **First 10%:** Primary keyword in first 10% of content (or first 300 words if post is short).
- **Keywords in content:** All focus keywords (primary + secondary) appear naturally. Singular and plural both count.
- **Keyword density:** 1–1.5%. Never exceed 2.5% (Rank Math warns).
- **Word count:** 2500+ words = 100% Rank Math score. Minimum 1500 for pillar content. (2000–2500 = 70%, 1500–2000 = 60%)

## ADDITIONAL SEO (Rank Math) – AI output only
- **Subheadings:** Primary AND secondary keywords in H2/H3. Rank Math runs this test on all focus keywords. Include these in content.

## TITLE READABILITY (Rank Math)
- Primary keyword in first 50% of title.
- Evoke strong sentiment (curiosity, value, urgency; avoid clickbait).
- Power word: Proven, Essential, Best, Ultimate, Complete, Simple, Easy, etc.
- Number in title when suitable (7, 10, 5).

## CONTENT READABILITY (Rank Math) – AI output only
- **Short paragraphs:** No paragraph >120 words. Rank Math fails this test if any paragraph exceeds 120.
- **FAQ:** For informational intent, add <h2>Frequently Asked Questions</h2> with 3–5 Q&As. Use "People Also Search For" questions when available. Format: <h3>Question?</h3><p>Answer...</p>. Enables FAQ rich snippets.

## GOOGLE SEARCH CENTRAL (developers.google.com/search/docs)
- **Helpful, reliable, people-first.** Create content people find compelling and useful.
- **Easy-to-read, well organized.** Paragraphs, sections, headings. No spelling/grammar errors.
- **Unique content.** Do not copy competitors. Create based on expertise; don't rehash.
- **Expect readers' search terms.** Anticipate keyword variations; write for different knowledge levels.
- **Demonstrate expertise.** Specific, actionable advice. Examples, steps, data. Expert sources when helpful.
- **Avoid keyword stuffing** (against Google's spam policies). Natural language; qualifiers over superlatives.

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
1. Intro (2–4 sentences) with primary keyword in first 10%.
2. H2/H3 sections with primary + secondary keywords in subheadings.
3. Short paragraphs (≤120 words each).
4. FAQ section (3–5 Q&As) for informational intent.
5. Conclusion with CTA matching intent.

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

    if (!parsed.title || !parsed.content) {
      throw new Error("Invalid response from Claude: missing required fields");
    }

    const titleChars = [...parsed.title];
    const title =
      titleChars.length > SEO.TITLE_MAX_CHARS
        ? titleChars.slice(0, SEO.TITLE_MAX_CHARS - 3).join("").trim() + "..."
        : parsed.title;
    const metaDescChars = parsed.metaDescription ? [...parsed.metaDescription] : [];
    const metaDescription =
      metaDescChars.length > SEO.META_DESCRIPTION_MAX_CHARS
        ? metaDescChars.slice(0, SEO.META_DESCRIPTION_MAX_CHARS - 3).join("").trim() + "..."
        : parsed.metaDescription ?? undefined;
    const slug =
      parsed.suggestedSlug ||
      primaryKeyword.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
