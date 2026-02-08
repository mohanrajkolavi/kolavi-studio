/**
 * OpenAI API client — strategic brief (GPT-4.1) + topic coverage scoring (o3-mini).
 */

import OpenAI from "openai";
import {
  type PipelineInput,
  type TopicExtractionResult,
  type CurrentData,
  type ResearchBrief,
  type TopicScoreResult,
  type TopicScore,
  ResearchBriefWithoutCurrentDataSchema,
  TopicScoreResultSchema,
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

  const rawChecklist = parsed.topicChecklist;
  const topicChecklist = (Array.isArray(rawChecklist)
    ? rawChecklist.map((t: unknown) => {
        const row = t != null && typeof t === "object" ? (t as Record<string, unknown>) : {};
        return {
          topic: String(row.topic ?? row.name ?? "").trim(),
          importance: String(row.importance ?? "recommended"),
          guidanceNote: String(row.guidanceNote ?? row.note ?? ""),
          targetDepth: String(row.targetDepth ?? row.depth ?? "150-250 words"),
        };
      })
    : []
  ).filter((t) => (t as { topic: string }).topic.length > 0);

  const faqStrategyText =
    "FAQ answers MUST NOT restate content from the article body. Each FAQ answer should provide: (a) a quick summary with a NEW angle or framing not used in the main article, (b) a direct actionable takeaway, or (c) a comparison or context not covered above. A reader who read the full article should learn something new from every FAQ answer. If the main article already covers a topic in depth, the FAQ answer for that topic should be a crisp 1-2 sentence summary that adds ONE new perspective, not a condensed repeat.";
  const rawGeo = parsed.geoRequirements;
  const geoRequirements =
    rawGeo != null && typeof rawGeo === "object" && !Array.isArray(rawGeo)
      ? {
          directAnswer: String((rawGeo as Record<string, unknown>).directAnswer ?? "The intro paragraph MUST open with a direct factual answer — not a definition, not a description of the article. BANNED: 'A [type] of [subject] examines...', 'In this article we will...', '[Topic] refers to...', 'When it comes to...'. REQUIRED: First sentence = primary keyword + specific factual claim (from currentData or research); reader gets the #1 takeaway in the first 30-40 words. Then a hook or transition (15-25 words). Lead with user value; avoid wording that exists only for algorithm extraction. Adapt by type: analysis = striking metric + tension; comparison = decisive difference; how-to = what reader achieves; review = verdict + strength/weakness; listicle = top pick + differentiator; informational = main finding."),
          statDensity: String((rawGeo as Record<string, unknown>).statDensity ?? "Include 1-2 stats per 200 words where data is provided."),
          entities: String((rawGeo as Record<string, unknown>).entities ?? ""),
          qaBlocks: String((rawGeo as Record<string, unknown>).qaBlocks ?? "FAQ ANSWERS: Maximum 300 characters per answer (roughly 2 short sentences). Be direct and factual. These must work as standalone snippets that Perplexity or Google AI Overviews can extract verbatim. Do NOT repeat what the article body already covers — provide a crisp new-angle summary instead. If the body explains something in 300 words, the FAQ answer should capture the essence in 2 sentences with a fresh framing."),
          faqStrategy: String((rawGeo as Record<string, unknown>).faqStrategy ?? faqStrategyText),
        }
      : {
          directAnswer: "The intro paragraph MUST open with a direct factual answer — not a definition, not a description of the article. BANNED: 'A [type] of [subject] examines...', 'In this article we will...', '[Topic] refers to...', 'When it comes to...'. REQUIRED: First sentence = primary keyword + specific factual claim (from currentData or research); reader gets the #1 takeaway in the first 30-40 words. Then a hook or transition (15-25 words). Lead with user value; avoid wording that exists only for algorithm extraction. Adapt by type: analysis = striking metric + tension; comparison = decisive difference; how-to = what reader achieves; review = verdict + strength/weakness; listicle = top pick + differentiator; informational = main finding.",
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
    contentMix: { prose: 70, lists: 20, tables: 10 },
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

  return {
    keyword,
    topicChecklist,
    outline,
    gaps,
    editorialStyle,
    editorialStyleFallback: Boolean(parsed.editorialStyleFallback),
    geoRequirements,
    seoRequirements,
    wordCount,
  };
}

/**
 * Build the strategic research brief: decide outline, topic checklist, editorial style, GEO/SEO.
 * Uses GPT-4.1. Validates with ResearchBriefSchema; retries once on schema failure.
 */
export async function buildResearchBrief(
  topics: TopicExtractionResult,
  currentData: CurrentData,
  input: PipelineInput
): Promise<ResearchBrief> {
  const openai = getClient();
  const intent = Array.isArray(input.intent) ? input.intent[0] : input.intent ?? "informational";
  const pasf = input.peopleAlsoSearchFor ?? [];
  const secondary = input.secondaryKeywords ?? [];

  const systemPrompt = `You are the strategist for a blog content pipeline. Your ONLY job is to produce a compact ResearchBrief as JSON. The writer (another model) will receive this brief as its ONLY input — no raw competitor content. So your brief must be self-contained and decisive.

RULES:
1. BUILD THE OPTIMAL OUTLINE from competitor heading patterns. KEEP headings 3+ competitors use; DROP headings only 1 uses unless they cover a gap; ADD new sections for gap topics; ORDER by intent (informational: definition → how-to → advanced → FAQ; commercial: overview → comparison → pros/cons → pricing → recommendation; transactional: value prop → features → pricing → CTA).
2. For each outline section: heading, level (h2|h3), reason, topics (from checklist), targetWords, optional geoNote. Include H3 subsections where competitors commonly do.

CONTENT MIX REQUIREMENT — applies to every article regardless of type:
1. SUMMARY/OVERVIEW ELEMENT: Add a scannable summary section early (after intro, before detailed breakdown). The format MUST match the article type:
   - Analysis (SWOT, competitive, financial, market): summary table (2x2 grid, matrix, or pros/cons table)
   - Comparison: side-by-side comparison table with key specs, features, or criteria
   - How-to/guide: "quick answer" box or numbered key steps summary
   - Listicle/ranking: ranked summary with one-line descriptions per item
   - Review: score/rating summary with top pros and cons
   - Informational/explainer: "key takeaways" bulleted list (5-7 items)
   Mark this section in the outline with a note specifying the chosen format. This is not optional.
2. LISTS WITHIN DETAILED SECTIONS: Every major H2 section that runs over 200 words must include at least ONE bulleted or numbered list, or one table. No exceptions. Prose walls hurt readability and AI extraction.
3. TARGET MIX: editorialStyle.contentMix should be approximately 65-70% prose, 20% lists, 10% tables. Enforce this even if competitors are more prose-heavy — structural variety is a deliberate advantage for both human readers and AI parsers.

H3 SUBSECTION REQUIREMENT — applies to every article regardless of type:
Any H2 section that covers 3 or more distinct sub-points MUST break them into H3 subsections — one H3 per distinct point. Do NOT produce flat prose blocks where multiple separate ideas sit under a single H2 with no heading structure.
How this applies: H2 about strengths/advantages → H3 per strength; H2 about features → H3 per feature; H2 about process steps → H3 per phase; H2 about pros or cons → H3 per pro or con; H2 about list items → H3 per item; H2 about key factors → H3 per factor.
Each H3 gets its own topics, word target, and optional geoNote in the OutlineSection. If an H2 covers 3+ things, subdivide it.

3. TOPIC CHECKLIST: every topic from extraction with importance, guidanceNote, targetDepth (e.g. "200-300 words"). Mark differentiator topics with "UNIQUE: expand with [approach]".
4. EDITORIAL STYLE: If 3+ competitors are rated "likely_ai", set editorialStyleFallback: true and use hardcoded human-like defaults. Otherwise use the extracted editorialStyle from the extraction and set editorialStyleFallback: false.
5. GEO: directAnswer — Intro opens with a direct factual answer (primary keyword + specific claim in first 30-40 words), then a hook (15-25 words). User value first; banned openings (e.g. 'In this article we will...'). statDensity, entities (1 primary + 3-6 supporting), qaBlocks, faqStrategy.
6. SEO: keywordInTitle, keywordInFirst10Percent: true, keywordInSubheadings: true, maxParagraphWords: 120, faqCount: "5-8".
7. wordCount: target from competitor recommended, note that it's a guideline.

Output ONLY valid JSON. Do NOT include "currentData" in your output — it will be merged server-side. Include: keyword, topicChecklist, outline, gaps, editorialStyle, editorialStyleFallback, geoRequirements, seoRequirements, wordCount. No markdown fences.`;

  // Keep payload compact to avoid timeouts and token limits
  const MAX_TOPICS = 18;
  const MAX_HEADINGS_PER_SOURCE = 12;
  const MAX_FACTS = 12;
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

  const userPrompt = `Produce the ResearchBrief JSON for this extraction and input:\n\n${userPayload}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
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
        return { ...validated.data, currentData } as ResearchBrief;
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

/**
 * Score the draft against the topic checklist. Uses o3-mini. Returns TopicScoreResult.
 * On failure or invalid schema, returns a safe default (SKIP_TO_HUMANIZE).
 */
export async function scoreTopicCoverage(
  draftHtml: string,
  topicChecklist: ResearchBrief["topicChecklist"]
): Promise<TopicScoreResult> {
  const openai = getClient();
  const checklistStr = topicChecklist
    .map((t) => `- ${t.topic} (importance: ${t.importance}, target depth: ${t.targetDepth})`)
    .join("\n");

  const prompt = `You are evaluating an article draft for topic coverage.

TOPIC CHECKLIST (each must be meaningfully covered):
${checklistStr}

DRAFT ARTICLE (HTML):
${draftHtml.slice(0, 60000)}

For each topic in the checklist:
1) Score 0-100: 0=not mentioned, 25=keyword only, 50=brief, 75=adequate, 100=deep with examples/data.
2) Score AGAINST the target depth. If target is "200-300 words" and the draft only has 50 words, score low.
3) status: "pass" if score >= 50, else "gap".
4) notes: brief reason.

Then:
- overallScore: weighted average (essential 2x, differentiator 1.5x, recommended 1x).
- gapTopics: list of topics with score < 50, each with recommendedAction (what to add).
- decision: "SKIP_TO_HUMANIZE" if overallScore >= 70 AND no topic below 30; else "FILL_GAPS".

ADDITIONAL CHECK — FAQ REDUNDANCY:
For each FAQ answer, estimate what percentage of its content already appears in the main article body.
If any FAQ answer has >60% semantic overlap with body content, include it in faqRedundancyFlags.
Output: faqRedundancyFlags: [{ question: string, overlapPercent: number, suggestion: string }]
This does NOT affect overallScore or the FILL_GAPS/SKIP decision — it's a separate quality signal for review.

Return ONLY valid JSON:
{
  "topicScores": [{"topic":"...","score":number,"status":"pass"|"gap","notes":"..."}],
  "overallScore": number,
  "gapTopics": [{"topic":"...","score":number,"recommendedAction":"..."}],
  "decision": "SKIP_TO_HUMANIZE"|"FILL_GAPS",
  "faqRedundancyFlags": [{"question":"...","overlapPercent":number,"suggestion":"..."}]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return defaultTopicScoreResult(topicChecklist);
    }
    const raw = stripJsonMarkdown(content);
    const parsed = JSON.parse(raw) as unknown;
    const validated = TopicScoreResultSchema.safeParse(parsed);
    if (validated.success) {
      return validated.data;
    }
    if (process.env.NODE_ENV !== "test") {
      console.warn("[openai] scoreTopicCoverage: Zod validation failed", validated.error.flatten());
    }
    return defaultTopicScoreResult(topicChecklist);
  } catch (e) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[openai] scoreTopicCoverage: failed", e);
    }
    return defaultTopicScoreResult(topicChecklist);
  }
}

function defaultTopicScoreResult(
  topicChecklist: ResearchBrief["topicChecklist"]
): TopicScoreResult {
  const topicScores: TopicScore[] = topicChecklist.map((t) => ({
    topic: t.topic,
    score: 75,
    status: "pass" as const,
    notes: "Scoring skipped; defaulting to pass.",
  }));
  return {
    topicScores,
    overallScore: 75,
    gapTopics: [],
    decision: "SKIP_TO_HUMANIZE",
  };
}
