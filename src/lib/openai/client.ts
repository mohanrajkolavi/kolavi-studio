/**
 * OpenAI API client — topic extraction (GPT-4.1) + strategic brief (GPT-4.1).
 */

import OpenAI from "openai";
import {
  type PipelineInput,
  type TopicExtractionResult,
  type CurrentData,
  type ResearchBrief,
  type CompetitorArticle,
  ResearchBriefWithoutCurrentDataSchema,
  TopicExtractionResultSchema,
} from "@/lib/pipeline/types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Get a key at https://platform.openai.com");
  }
  if (!_client) {
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

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
 * Extract topics, heading patterns, gaps, editorial style, and competitor analysis from competitors.
 * Uses GPT-4.1 for strong schema adherence and reasoning. EXTRACT only — outline is decided in buildResearchBrief.
 */
export async function extractTopicsAndStyle(
  competitors: CompetitorArticle[]
): Promise<TopicExtractionResult> {
  const openai = getClient();
  const successful = competitors.filter((c) => c.fetchSuccess && c.content.length > 0);
  const payload =
    successful.length > 0
      ? successful
          .map(
            (c) =>
              `--- URL: ${c.url}\nTitle: ${c.title}\nWord count: ${c.wordCount}\n\n${c.content.slice(0, 12000)}`
          )
          .join("\n\n---\n\n")
      : "No competitor content provided. Generate expected topics and a default editorial style for a generic blog article.";

  const systemPrompt = `You are analyzing competitor articles for a content strategy. EXTRACT and REPORT the following. Do NOT decide the final outline — only report what you observe.

A) TOPIC EXTRACTION
- Extract 10-20 SEMANTIC TOPICS (concepts, not single keywords). Example: "budgeting and cost planning" not just "budget".
- For each topic: importance = "essential" (4-5/5 cover it), "recommended" (2-3/5), "differentiator" (0-1/5).
- coverageCount: e.g. "4/5".
- keyTerms: array of terms.
- exampleContent: brief description of what competitors say.
- recommendedDepth: e.g. "200-300 words".
- Identify GAPS: topics 0-1 competitors cover well (uniqueness opportunities).

B) HEADING PATTERN EXTRACTION (raw data only)
- For EACH competitor: list their H2 and H3 headings exactly as used.
- competitorHeadings: array of { url, h2s: string[], h3s: string[] }.
- Do NOT create a "recommended outline".

C) EDITORIAL STYLE ANALYSIS
- Average sentence length (words) across competitors.
- Sentence length distribution: % short (1-8), medium (9-17), long (18-30), veryLong (30+).
- Average paragraph length (sentences).
- Paragraph distribution: % single, standard (2-4), long (5-7), veryLong (8+).
- Tone, reading level (e.g. "Grade 8-9"), contentMix (prose/lists/tables %), dataDensity, introStyle, ctaStyle.

D) COMPETITOR ANALYSIS
- Per competitor: url, strengths, weaknesses.
- For EACH competitor assess AI-generated likelihood: "likely_human", "uncertain", or "likely_ai" based on: uniform sentence length, repetitive structure, AI-typical phrases (delve, landscape, crucial, comprehensive, leverage, seamless, robust), lack of personal voice.

E) WORD COUNT
- competitorAverage, recommended (avg + 15%), note. The note must state that length is a guideline only; prioritize value over length; the goal is to provide more value than competitors, not just match word count.

Return ONLY valid JSON matching this EXACT top-level structure (no wrapper keys, no nesting under "extraction" or "data" or "result"):
{
  "topics": [{"name":"...","importance":"essential"|"recommended"|"differentiator","coverageCount":"4/5","keyTerms":["..."],"exampleContent":"...","recommendedDepth":"200-300 words"}],
  "competitorHeadings": [{"url":"...","h2s":["..."],"h3s":["..."]}],
  "gaps": [{"topic":"...","opportunity":"...","recommendedApproach":"..."}],
  "competitorStrengths": [{"url":"...","strengths":"...","weaknesses":"...","aiLikelihood":"likely_human"|"uncertain"|"likely_ai"}],
  "editorialStyle": {"sentenceLength":{"average":15,"distribution":{"short":20,"medium":40,"long":30,"veryLong":10}},"paragraphLength":{"averageSentences":3,"distribution":{"single":15,"standard":50,"long":30,"veryLong":5}},"tone":"...","readingLevel":"Grade 8-10","contentMix":{"prose":65,"lists":20,"tables":15},"dataDensity":"...","introStyle":"...","ctaStyle":"..."},
  "wordCount": {"competitorAverage":1500,"recommended":1725,"note":"..."}
}

The JSON root must have exactly these 6 keys: topics, competitorHeadings, gaps, competitorStrengths, editorialStyle, wordCount. No markdown fences.`;

  const userMessage = `Analyze these competitor articles and return the extraction JSON.

--- COMPETITOR ARTICLES ---

${payload}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("extractTopicsAndStyle: empty response from GPT-4.1");
  }
  const raw = stripJsonMarkdown(content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`extractTopicsAndStyle: invalid JSON from OpenAI: ${e instanceof Error ? e.message : String(e)}`);
  }

  // GPT sometimes wraps the result in a single top-level key (e.g. "extraction", "data", "result").
  // Unwrap if the expected keys are missing at the top level but present one level down.
  const EXPECTED_KEYS = ["topics", "competitorHeadings", "gaps", "competitorStrengths", "editorialStyle", "wordCount"];
  if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    const hasExpected = EXPECTED_KEYS.every((k) => k in obj);
    if (!hasExpected) {
      // Try to find the expected keys one level down
      for (const val of Object.values(obj)) {
        if (val != null && typeof val === "object" && !Array.isArray(val)) {
          const inner = val as Record<string, unknown>;
          if (EXPECTED_KEYS.every((k) => k in inner)) {
            parsed = inner;
            if (process.env.NODE_ENV !== "test") {
              console.warn("[openai] extractTopicsAndStyle: unwrapped nested response object");
            }
            break;
          }
        }
      }
      // Also handle: GPT uses snake_case or different key names
      if (parsed === obj && !EXPECTED_KEYS.every((k) => k in (parsed as Record<string, unknown>))) {
        const normalized: Record<string, unknown> = { ...obj };
        const ALIASES: Record<string, string[]> = {
          topics: ["topic_extraction", "extracted_topics", "semantic_topics"],
          competitorHeadings: ["competitor_headings", "heading_patterns", "headings"],
          gaps: ["content_gaps", "topic_gaps"],
          competitorStrengths: ["competitor_strengths", "competitor_analysis", "competitors"],
          editorialStyle: ["editorial_style", "editorial_style_analysis", "style_analysis", "style"],
          wordCount: ["word_count", "word_count_analysis"],
        };
        for (const [expected, aliases] of Object.entries(ALIASES)) {
          if (!(expected in normalized)) {
            for (const alias of aliases) {
              if (alias in normalized) {
                normalized[expected] = normalized[alias];
                break;
              }
            }
          }
        }
        parsed = normalized;
      }
    }
  }

  const validated = TopicExtractionResultSchema.safeParse(parsed);
  if (!validated.success) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[openai] extractTopicsAndStyle: Zod validation failed", validated.error.flatten());
    }
    throw new Error(
      `extractTopicsAndStyle: response did not match schema: ${JSON.stringify(validated.error.flatten())}`
    );
  }
  return validated.data;
}

/** Normalize GPT response into our brief schema (GPT often returns different shapes). */
function normalizeBriefOutput(parsed: Record<string, unknown>, primaryKeyword: string): Record<string, unknown> {
  const keyword =
    parsed.keyword != null && typeof parsed.keyword === "object" && !Array.isArray(parsed.keyword)
      ? {
          primary: String((parsed.keyword as Record<string, unknown>).primary ?? primaryKeyword),
          secondary: Array.isArray((parsed.keyword as Record<string, unknown>).secondary)
            ? ((parsed.keyword as Record<string, unknown>).secondary as unknown[]).map(String)
            : [],
          pasf: Array.isArray((parsed.keyword as Record<string, unknown>).pasf)
            ? ((parsed.keyword as Record<string, unknown>).pasf as unknown[]).map(String)
            : [],
        }
      : {
          primary: typeof parsed.keyword === "string" ? parsed.keyword : primaryKeyword,
          secondary: [] as string[],
          pasf: [] as string[],
        };

  function normSection(item: unknown): Record<string, unknown> {
    if (item != null && typeof item === "object" && !Array.isArray(item)) {
      const o = item as Record<string, unknown>;
      return {
        heading: String(o.heading ?? o.title ?? ""),
        level: o.level === "h3" ? "h3" : "h2",
        reason: String(o.reason ?? ""),
        topics: Array.isArray(o.topics) ? o.topics.map(String) : [],
        targetWords: typeof o.targetWords === "number" ? o.targetWords : Number(o.targetWords) || 150,
        geoNote: o.geoNote != null ? String(o.geoNote) : undefined,
        subsections: Array.isArray(o.subsections) ? o.subsections.map(normSection) : undefined,
      };
    }
    return {
      heading: String(item),
      level: "h2" as const,
      reason: "",
      topics: [] as string[],
      targetWords: 150,
    };
  }

  const rawOutline = parsed.outline;
  let sections: Record<string, unknown>[] = [];
  if (Array.isArray(rawOutline) && rawOutline.length > 0) {
    sections = rawOutline.map(normSection);
  } else if (rawOutline != null && typeof rawOutline === "object" && Array.isArray((rawOutline as Record<string, unknown>).sections)) {
    sections = ((rawOutline as Record<string, unknown>).sections as unknown[]).map(normSection);
  }
  const outline = {
    sections,
    totalSections: sections.length,
    estimatedWordCount:
      typeof parsed.wordCount === "object" && parsed.wordCount != null && "target" in (parsed.wordCount as object)
        ? Number((parsed.wordCount as Record<string, unknown>).target) || 1500
        : 1500,
  };

  const rawGaps = parsed.gaps;
  const gaps = Array.isArray(rawGaps)
    ? rawGaps.map((g: unknown) => (typeof g === "string" ? g : typeof g === "object" && g != null && "topic" in (g as object) ? String((g as Record<string, unknown>).topic) : String(g)))
    : [];

  const faqStrategyText =
    "FAQ answers MUST NOT restate content from the article body. Each FAQ answer should provide: (a) a quick summary with a NEW angle or framing not used in the main article, (b) a direct actionable takeaway, or (c) a comparison or context not covered above. A reader who read the full article should learn something new from every FAQ answer. If the main article already covers a topic in depth, the FAQ answer for that topic should be a crisp 1-2 sentence summary that adds ONE new perspective, not a condensed repeat.";
  const rawGeo = parsed.geoRequirements;
  const geoRequirements =
    rawGeo != null && typeof rawGeo === "object" && !Array.isArray(rawGeo)
      ? {
          directAnswer: String((rawGeo as Record<string, unknown>).directAnswer ?? "The very first sentence of the article MUST contain a specific number from the research data. Not the second sentence. Not the third. The FIRST. THE TEST: Can an AI engine extract a complete factual answer from your first sentence alone, without reading anything else? If your first sentence contains zero numbers, it fails. BANNED FIRST SENTENCES (never write these): '[Subject] analysis reveals a company with unmatched brand value, record-setting financials, and a vast global ecosystem.' (no number, just adjectives); 'A [framework] breaks down [components] to assess where a business stands.' (definition of format); '[Subject] operates as the world's most valuable technology company.' (no specific data); '[Product] is one of the most popular choices in its category.' (vague, no data); 'This comprehensive guide covers everything you need to know about [topic].' (describes the article); 'When it comes to [topic], there are several factors to consider.' (says nothing). REQUIRED STRUCTURE: [Primary keyword] + [specific number from currentData] + [what that number means for the reader]. The number must come from currentData (revenue, market share, growth rate, price, benchmark score, user count). Pick the single most impressive or relevant number and lead with it. After this factual first sentence (30-40 words), follow with a hook (15-25 words)."),
          statDensity: String((rawGeo as Record<string, unknown>).statDensity ?? "Include 1-2 stats per 200 words where data is provided."),
          entities: String((rawGeo as Record<string, unknown>).entities ?? ""),
          qaBlocks: String((rawGeo as Record<string, unknown>).qaBlocks ?? "FAQ ANSWERS: Maximum 300 characters per answer (roughly 2 short sentences). Be direct and factual. These must work as standalone snippets that Perplexity or Google AI Overviews can extract verbatim. Do NOT repeat what the article body already covers — provide a crisp new-angle summary instead. If the body explains something in 300 words, the FAQ answer should capture the essence in 2 sentences with a fresh framing."),
          faqStrategy: String((rawGeo as Record<string, unknown>).faqStrategy ?? faqStrategyText),
        }
      : {
          directAnswer: "The very first sentence of the article MUST contain a specific number from the research data. Not the second sentence. Not the third. The FIRST. THE TEST: Can an AI engine extract a complete factual answer from your first sentence alone, without reading anything else? If your first sentence contains zero numbers, it fails. BANNED FIRST SENTENCES (never write these): '[Subject] analysis reveals a company with unmatched brand value, record-setting financials, and a vast global ecosystem.' (no number, just adjectives); 'A [framework] breaks down [components] to assess where a business stands.' (definition of format); '[Subject] operates as the world's most valuable technology company.' (no specific data); '[Product] is one of the most popular choices in its category.' (vague, no data); 'This comprehensive guide covers everything you need to know about [topic].' (describes the article); 'When it comes to [topic], there are several factors to consider.' (says nothing). REQUIRED STRUCTURE: [Primary keyword] + [specific number from currentData] + [what that number means for the reader]. The number must come from currentData (revenue, market share, growth rate, price, benchmark score, user count). Pick the single most impressive or relevant number and lead with it. After this factual first sentence (30-40 words), follow with a hook (15-25 words).",
          statDensity: "Include 1-2 stats per 200 words where data is provided.",
          entities: "",
          qaBlocks: "FAQ ANSWERS: Maximum 300 characters per answer (roughly 2 short sentences). Be direct and factual. Do NOT repeat what the article body already covers — provide a crisp new-angle summary instead.",
          faqStrategy: faqStrategyText,
        };

  const rawSeo = parsed.seoRequirements;
  const seoRequirements =
    rawSeo != null && typeof rawSeo === "object" && !Array.isArray(rawSeo)
      ? {
          keywordInTitle: String((rawSeo as Record<string, unknown>).keywordInTitle ?? "Primary keyword in first 50% of title."),
          keywordInFirst10Percent: Boolean((rawSeo as Record<string, unknown>).keywordInFirst10Percent),
          keywordInSubheadings: Boolean((rawSeo as Record<string, unknown>).keywordInSubheadings),
          maxParagraphWords: Number((rawSeo as Record<string, unknown>).maxParagraphWords) || 120,
          faqCount: String((rawSeo as Record<string, unknown>).faqCount ?? "5-8"),
        }
      : {
          keywordInTitle: "Primary keyword in first 50% of title.",
          keywordInFirst10Percent: true,
          keywordInSubheadings: true,
          maxParagraphWords: 120,
          faqCount: "5-8",
        };

  const wordCount =
    parsed.wordCount != null && typeof parsed.wordCount === "object" && !Array.isArray(parsed.wordCount)
      ? {
          target: Number((parsed.wordCount as Record<string, unknown>).target) || 1500,
          note: String((parsed.wordCount as Record<string, unknown>).note ?? "Guideline only."),
        }
      : { target: 1500, note: "Guideline only." };

  const defaultEditorialStyle = {
    sentenceLength: { average: 15, distribution: { short: 20, medium: 40, long: 30, veryLong: 10 } },
    paragraphLength: { averageSentences: 3, distribution: { single: 15, standard: 50, long: 30, veryLong: 5 } },
    tone: "Semi-formal, instructional, direct address with 'you'",
    readingLevel: "Grade 8-10",
    contentMix: { prose: 65, lists: 20, tables: 15 },
    dataDensity: "1 stat per 200 words, 1 example per 400 words",
    introStyle: "Direct answer or definition in first 1-2 sentences, then expand",
    ctaStyle: "Soft recommendation with next step suggestion",
  };
  const rawStyle = parsed.editorialStyle;
  const editorialStyle =
    rawStyle != null && typeof rawStyle === "object" && !Array.isArray(rawStyle)
      ? {
          sentenceLength: (rawStyle as Record<string, unknown>).sentenceLength ?? defaultEditorialStyle.sentenceLength,
          paragraphLength: (rawStyle as Record<string, unknown>).paragraphLength ?? defaultEditorialStyle.paragraphLength,
          tone: String((rawStyle as Record<string, unknown>).tone ?? defaultEditorialStyle.tone),
          readingLevel: String((rawStyle as Record<string, unknown>).readingLevel ?? defaultEditorialStyle.readingLevel),
          contentMix: (rawStyle as Record<string, unknown>).contentMix ?? defaultEditorialStyle.contentMix,
          dataDensity: String((rawStyle as Record<string, unknown>).dataDensity ?? defaultEditorialStyle.dataDensity),
          introStyle: String((rawStyle as Record<string, unknown>).introStyle ?? defaultEditorialStyle.introStyle),
          ctaStyle: String((rawStyle as Record<string, unknown>).ctaStyle ?? defaultEditorialStyle.ctaStyle),
        }
      : defaultEditorialStyle;

  const similaritySummary =
    typeof parsed.similaritySummary === "string" && parsed.similaritySummary.trim().length > 0
      ? parsed.similaritySummary.trim()
      : undefined;
  const extraValueThemes = Array.isArray(parsed.extraValueThemes)
    ? (parsed.extraValueThemes as unknown[]).map((t) => String(t)).filter(Boolean)
    : undefined;
  const freshnessNote =
    typeof parsed.freshnessNote === "string" && parsed.freshnessNote.trim().length > 0
      ? parsed.freshnessNote.trim()
      : undefined;

  const out: Record<string, unknown> = {
    keyword,
    outline,
    gaps,
    editorialStyle,
    editorialStyleFallback: Boolean(parsed.editorialStyleFallback),
    geoRequirements,
    seoRequirements,
    wordCount,
  };
  if (similaritySummary != null) out.similaritySummary = similaritySummary;
  if (extraValueThemes != null && extraValueThemes.length > 0) out.extraValueThemes = extraValueThemes;
  if (freshnessNote != null) out.freshnessNote = freshnessNote;
  return out;
}

/** Word count override when user selects a preset (concise/standard/in_depth/custom). */
export type WordCountOverride = { target: number; note: string };

/**
 * Build the strategic research brief: decide outline, editorial style, GEO/SEO.
 * Uses GPT-4.1. Validates with ResearchBriefSchema; retries once on schema failure.
 * When wordCountOverride is provided, it replaces the extraction-derived word count in the brief.
 */
export async function buildResearchBrief(
  topics: TopicExtractionResult,
  currentData: CurrentData,
  input: PipelineInput,
  wordCountOverride?: WordCountOverride
): Promise<ResearchBrief> {
  const openai = getClient();
  const intent = Array.isArray(input.intent) ? input.intent[0] : input.intent ?? "informational";
  const pasf = input.peopleAlsoSearchFor ?? [];
  const secondary = input.secondaryKeywords ?? [];

  const systemPrompt = `You are the strategist for a blog content pipeline. Your ONLY job is to produce a compact ResearchBrief as JSON. The writer (another model) will receive this brief as its ONLY input — no raw competitor content. So your brief must be self-contained and decisive.

RULES:
1. BUILD THE OPTIMAL OUTLINE from competitor heading patterns. KEEP headings 3+ competitors use; DROP headings only 1 uses unless they cover a gap; ADD new sections for gap topics; ORDER by intent (informational: definition → how-to → advanced → FAQ; commercial: overview → comparison → pros/cons → pricing → recommendation; transactional: value prop → features → pricing → CTA). Every H2 must map to either a competitor theme (what top results cover) or a gap (what we add that they don't).
2. For each outline section: heading, level (h2|h3), reason, topics (from checklist), targetWords, optional geoNote. Include H3 subsections where competitors commonly do.
3. BEST-VERSION FIELDS (required in your JSON): (a) similaritySummary: 2-4 sentences summarizing what the top 5 competitors collectively cover and how they're similar. (b) extraValueThemes: array of 3-6 short strings — "what we will add that they don't" (from gaps and currentData angles). Each should be a concrete theme the writer must clearly cover. (c) freshnessNote: 1-2 sentences on how to position for freshness (e.g. "Lead with currentData numbers; avoid pre-2024 framing; mention [recent development] where relevant.").

CONTENT MIX — MANDATORY STRUCTURE (applies to every article):
1. SUMMARY ELEMENT (required, non-optional): Place a scannable summary section early, after the intro, before detailed sections. Format by article type: Analysis = HTML table (2x2 grid, matrix, or pros/cons); Comparison = side-by-side HTML table; How-to = numbered key steps summary; Listicle = ranked list with one-line per item; Review = score/rating box with top pros and cons; Informational = key takeaways bulleted list (5-7 items). Must render as actual HTML structure (table tags, ul/ol). Not prose that describes a table.
2. INLINE LISTS IN EVERY H2 SECTION: Every H2 section that exceeds 200 words MUST contain at least one of: bulleted list (3-7 items), numbered list, or small comparison table. Place after the section makes its main argument. Pattern: 2-3 paragraphs of prose, then bulleted list of key data points or takeaways, then 1 closing paragraph.
3. TARGET MIX: 65% prose, 20% lists, 10-15% tables. Minimum 3-4 bulleted or numbered lists spread across H2 sections, plus at least one table. If an article has zero lists inside detailed sections, it fails this requirement.

H3 SUBSECTION REQUIREMENT — applies to every article regardless of type:
Any H2 section that covers 3 or more distinct sub-points MUST break them into H3 subsections — one H3 per distinct point. Do NOT produce flat prose blocks where multiple separate ideas sit under a single H2 with no heading structure.
How this applies: H2 about strengths/advantages → H3 per strength; H2 about features → H3 per feature; H2 about process steps → H3 per phase; H2 about pros or cons → H3 per pro or con; H2 about list items → H3 per item; H2 about key factors → H3 per factor.
Each H3 gets its own topics, word target, and optional geoNote in the OutlineSection. If an H2 covers 3+ things, subdivide it.

3. EDITORIAL STYLE: If 3+ competitors are rated "likely_ai", set editorialStyleFallback: true and use hardcoded human-like defaults. Otherwise use the extracted editorialStyle from the extraction and set editorialStyleFallback: false.
4. GEO: directAnswer — Intro opens with a direct factual answer (primary keyword + specific claim in first 30-40 words), then a hook (15-25 words). User value first; banned openings (e.g. 'In this article we will...'). statDensity, entities (1 primary + 3-6 supporting), qaBlocks, faqStrategy.
5. SEO: keywordInTitle, keywordInFirst10Percent: true, keywordInSubheadings: true, maxParagraphWords: 120, faqCount: "5-8".
6. wordCount: target from competitor recommended (or from override when provided). Note: it's a guideline only. Prioritize value over length; the article must provide more value than competitors.

POST-GENERATION VALIDATION AWARENESS — design the brief so the writer can pass these checks:

GOOGLE SEARCH CENTRAL ALIGNMENT:
- The article must pass Google's Helpful Content self-assessment: original analysis, substantial value beyond competitors, complete intent satisfaction, would-be-bookmarked quality.
- Design the outline to cover the topic comprehensively. Every H2 should earn its place by answering a real user question or providing unique value.

RANK MATH SEO AUDIT:
- Title: keyword in first 50%, max 60 chars, ideally with a number.
- Meta: 120-160 chars with keyword.
- Slug: keyword present, max 75 chars.
- Paragraphs: never exceed 120 words.
- Keyword in first 10% of body and in at least one subheading. Ensure at least one outline section heading includes the primary keyword or a natural variant (e.g. "SWOT Analysis" for keyword "SWOT analysis") so the writer can pass the subheading check.
- No keyword stuffing (< 3% density).

TYPOGRAPHY: The writer must use straight quotes/apostrophes only (no em-dash, en-dash, curly quotes). Design headings that don't tempt these patterns.

FACT CHECK: Every specific number must trace to currentData. The writer cannot invent stats. If the brief lacks data for a section, note in that section's geoNote that the writer should use qualitative language.

E-E-A-T QUALITY SCORING:
- Experience signals: 2-3 per article. Include geoNotes to encourage experience signals in at least 2 sections.
- Data density: set dataDensity target in editorialStyle that ensures adequate stats for E-E-A-T scoring.
- Entity density: named entities for GEO optimization.
- Readability variance: varied sentence patterns (no monotony).
- Sentence start variety: no 3+ sentences starting the same way.

Output ONLY valid JSON. Do NOT include "currentData" in your output — it will be merged server-side. Include: keyword, outline, gaps, editorialStyle, editorialStyleFallback, geoRequirements, seoRequirements, wordCount, similaritySummary, extraValueThemes, freshnessNote. No markdown fences.`;

  // Keep payload compact to avoid timeouts and token limits
  const MAX_TOPICS = 14;
  const MAX_HEADINGS_PER_SOURCE = 10;
  const MAX_FACTS = 10;
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
    },
  });

  const userPromptBase = `Produce the ResearchBrief JSON for this extraction and input:\n\n${userPayload}`;
  const bestVersionHint = `\n\nIMPORTANT: Your response must include the best-version fields: similaritySummary (2-4 sentences on what top 5 cover), extraValueThemes (array of 3-6 short strings — what we add that they don't), and freshnessNote (1-2 sentences). Add them now.`;

  function hasBestVersionFields(n: Record<string, unknown>): boolean {
    const themes = n.extraValueThemes;
    const hasThemes = Array.isArray(themes) && themes.length >= 2;
    const hasSummary = typeof n.similaritySummary === "string" && (n.similaritySummary as string).trim().length > 0;
    const hasFreshness = typeof n.freshnessNote === "string" && (n.freshnessNote as string).trim().length > 0;
    return hasThemes && (hasSummary || hasFreshness);
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const userPrompt = attempt === 2 ? userPromptBase + bestVersionHint : userPromptBase;
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from GPT-4.1");
      }
      const raw = stripJsonMarkdown(content);
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const normalized = normalizeBriefOutput(parsed, input.primaryKeyword);

      const validated = ResearchBriefWithoutCurrentDataSchema.safeParse(normalized);
      if (validated.success) {
        const data = { ...validated.data, currentData } as ResearchBrief;
        const briefWithWordCount = wordCountOverride
          ? { ...data, wordCount: wordCountOverride }
          : data;
        if (attempt === 1 && !hasBestVersionFields(normalized)) {
          if (process.env.NODE_ENV !== "test") {
            console.warn("[openai] buildResearchBrief: best-version fields missing, retrying with hint");
          }
          continue;
        }
        return briefWithWordCount;
      }
      lastError = validated.error;
      if (attempt === 1) {
        if (process.env.NODE_ENV !== "test") {
          console.warn("[openai] buildResearchBrief: schema validation failed, retrying with hint", validated.error.flatten());
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

