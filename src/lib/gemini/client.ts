/**
 * Gemini API client — Step 2 (current data with search grounding) and topic extraction.
 * Uses @google/genai (supports Google Search Grounding).
 */

import { GoogleGenAI } from "@google/genai";

/** Model used for current-data fetch and topic extraction (Step 2). */
const GEMINI_MODEL = "gemini-3-flash-preview";
import {
  type CurrentData,
  type CompetitorArticle,
  type TopicExtractionResult,
  CurrentDataSchema,
  TopicExtractionResultSchema,
} from "@/lib/pipeline/types";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;

function getClient(): GoogleGenAI {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY or GOOGLE_AI_API_KEY is not set. Get a key at https://aistudio.google.com");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
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
 * Validate source URLs via HEAD requests. Returns validation summary and filters
 * facts to only those with accessible sources.
 */
async function validateSourceUrls(
  facts: { fact: string; source: string; date?: string }[]
): Promise<{
  filteredFacts: { fact: string; source: string; date?: string }[];
  total: number;
  accessible: number;
  inaccessible: string[];
}> {
  const urls = [...new Set(facts.map((f) => f.source).filter((u) => u.startsWith("http")))];
  const inaccessible: string[] = [];
  const results = await Promise.allSettled(
    urls.map(async (url): Promise<{ url: string; ok: boolean }> => {
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        return { url, ok: res.ok || (res.status >= 300 && res.status < 400) };
      } catch {
        return { url, ok: false };
      }
    })
  );
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const url = urls[i];
    if (r.status === "fulfilled" && !r.value.ok) inaccessible.push(url);
    if (r.status === "rejected") inaccessible.push(url);
  }
  const accessibleSet = new Set(urls.filter((u) => !inaccessible.includes(u)));
  // Keep both: (1) HTTP-sourced facts with verified URLs, and (2) non-HTTP sourced facts
  // (e.g. "Wikipedia", "Company 10-K filing") which are legitimate attributions.
  const nonUrlFacts = facts.filter((f) => !f.source.startsWith("http"));
  const verifiedUrlFacts = facts.filter((f) => f.source.startsWith("http") && accessibleSet.has(f.source));
  const filteredFacts = [...verifiedUrlFacts, ...nonUrlFacts];
  if (process.env.NODE_ENV !== "test") {
    console.log(`[gemini] Source URL validation: ${accessibleSet.size}/${urls.length} accessible, ${nonUrlFacts.length} non-URL sources preserved`);
  }
  return {
    filteredFacts,
    total: urls.length,
    accessible: accessibleSet.size,
    inaccessible,
  };
}

/**
 * Step 2 — Current data: fetch grounded facts for keyword using Gemini with Google Search.
 * Returns structured facts with source URLs. Validates grounding and source URLs.
 */
export async function fetchCurrentData(
  primaryKeyword: string,
  secondaryKeywords: string[] = []
): Promise<CurrentData> {
  const ai = getClient();
  const keywordContext =
    secondaryKeywords.length > 0
      ? ` and related terms: ${secondaryKeywords.slice(0, 3).join(", ")}`
      : "";

  const systemInstruction = `You are a fact-checking research assistant. Your only job is to search for current information and return structured JSON.

RULES (strict):
- Use ONLY information from the search results. Do NOT use numbers or stats from training data.
- Every fact must have a "source" field with the full URL from search. Include optional "date" when available.
- If you cannot find a current statistic, omit it or set fact text to "No current data found". Never invent numbers.
- If no facts are found, return: {"facts": [], "recentDevelopments": [], "lastUpdated": "No recent data found"}.
- Output ONLY valid JSON. No markdown code fences, no explanation before or after. The response must parse as JSON.`;

  const prompt = `Search for current, up-to-date information about "${primaryKeyword}"${keywordContext}. Find:
1) Latest statistics, financial data, or metrics
2) Recent developments or news from the past 6 months
3) Current market data, pricing, or benchmarks

Return as structured JSON with this exact format (no other text):
{
  "facts": [{"fact": "string", "source": "full URL", "date": "optional date"}],
  "recentDevelopments": ["string"],
  "lastUpdated": "string e.g. January 2026"
}`;

  const config = {
    systemInstruction,
    temperature: 0.1,
    maxOutputTokens: 4096,
    responseMimeType: "application/json" as const,
    tools: [{ googleSearch: {} }],
  };

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config,
  });

  const text = response.text ?? "";
  const rawJson = stripJsonMarkdown(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[gemini] fetchCurrentData: failed to parse JSON, returning empty CurrentData");
    }
    return {
      facts: [],
      recentDevelopments: [],
      lastUpdated: "Unknown",
      groundingVerified: false,
      sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
    };
  }

  const validated = CurrentDataSchema.safeParse({
    ...(parsed as Record<string, unknown>),
    groundingVerified: true,
    sourceUrlValidation: undefined,
  });
  if (!validated.success) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[gemini] fetchCurrentData: Zod validation failed", validated.error.flatten());
    }
    return {
      facts: [],
      recentDevelopments: [],
      lastUpdated: "Unknown",
      groundingVerified: false,
      sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
    };
  }

  const candidate = response.candidates?.[0];
  const groundingMetadata = candidate?.groundingMetadata;
  const hasGroundingChunks = (groundingMetadata?.groundingChunks?.length ?? 0) > 0;
  const sourceUrlsFromFacts = validated.data.facts.some((f) => f.source.startsWith("http"));

  let groundingVerified = hasGroundingChunks || sourceUrlsFromFacts;
  if (!groundingVerified && process.env.NODE_ENV !== "test") {
    console.warn(
      "[gemini] Grounding may not be active — response contains no source URLs. Data may be from training data, not live search."
    );
  }

  const factsToValidate = validated.data.facts.filter((f) => f.source.startsWith("http"));
  const { filteredFacts, total, accessible, inaccessible } =
    factsToValidate.length > 0
      ? await validateSourceUrls(validated.data.facts)
      : { filteredFacts: validated.data.facts, total: 0, accessible: 0, inaccessible: [] as string[] };

  if (total > 0 && accessible === 0) {
    groundingVerified = false;
  }

  return {
    facts: filteredFacts,
    recentDevelopments: validated.data.recentDevelopments,
    lastUpdated: validated.data.lastUpdated,
    groundingVerified,
    sourceUrlValidation: { total, accessible, inaccessible },
  };
}

/** Options for topic extraction (e.g. PAA questions from Serper for gap detection). */
export type ExtractTopicsAndStyleOptions = {
  /** People Also Ask questions from Serper. Each PAA skipped or answered poorly = automatic gap candidate. */
  paaQuestions?: string[];
};

/**
 * Extract topics, raw heading patterns, gaps, editorial style, and competitor analysis from competitors.
 * EXTRACT only — does not decide the outline (that's Step 3).
 * When paaQuestions are provided, also analyzes how well competitors answer each PAA and marks gap candidates.
 */
export async function extractTopicsAndStyle(
  competitors: CompetitorArticle[],
  options?: ExtractTopicsAndStyleOptions
): Promise<TopicExtractionResult> {
  const ai = getClient();
  const paaQuestions = options?.paaQuestions ?? [];
  const hasPaa = paaQuestions.length > 0;

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

  const rootKeys = hasPaa
    ? "topics, competitorHeadings, gaps, competitorStrengths, editorialStyle, wordCount, paaAnalysis"
    : "topics, competitorHeadings, gaps, competitorStrengths, editorialStyle, wordCount";

  const systemInstruction = `You are a content-strategy analyst. You EXTRACT and REPORT only what you observe from competitor articles. You do NOT decide outlines or recommendations—only report data.

OUTPUT RULES (strict):
- Return ONLY valid JSON. No markdown code fences (no \`\`\`json), no wrapper keys like "extraction" or "data" or "result".
- The JSON root must have exactly these keys: ${rootKeys}.
- All numbers in distribution objects must be percentages (0-100). All required fields must be present.
- wordCount.note must include: "STRICT — the target word count MUST be met (within ±5%). Do not pad; do not fall short."`;

  const topicExamples = `SEMANTIC TOPICS (good): "budgeting and cost planning", "hiring and retention strategies", "compliance and legal considerations", "ROI measurement and KPIs".
SINGLE KEYWORDS (bad — do not use): "budget", "hiring", "compliance", "ROI".`;

  const gapRules = `GAP RULES (strict). A gap qualifies ONLY if all three are true:
1) Real reader demand (search intent, PAA question, or clear need).
2) Missing from MOST competitors (not just one).
3) Concrete actionable angle (specific angle we can take, not vague).
For EACH gap you MUST cite specific evidence: which competitor URLs fall short and how (e.g. "URL X only mentions Y in one sentence; URL Z omits it entirely"). No vague gaps. Include evidence (array of strings), readerDemand (string), and actionableAngle (string) for every gap.`;

  const paaSection = hasPaa
    ? `F) PAA (PEOPLE ALSO ASK) ANALYSIS
- For each PAA question below, check if competitors answer it and how well.
- answeredBy: list of competitor URLs that address this question (empty if none).
- quality: "full" (clear, direct answer), "partial" (mentioned but weak), "missing" (none address it).
- gapCandidate: true if quality is "missing" or "partial" — these are automatic gap candidates.
- note: one line on what competitors do or miss.
Output paaAnalysis as array of { question, answeredBy, quality, gapCandidate, note? }.`
    : "";

  const taskPrompt = `Analyze the competitor articles below and extract the following. Report only; do not invent a recommended outline.

A) TOPIC EXTRACTION
- Extract 15-25 SEMANTIC TOPICS (concepts, not single keywords).
- ${topicExamples}
- For each topic: importance = "essential" (4-5/5 cover it), "recommended" (2-3/5), "differentiator" (0-1/5).
- coverageCount: e.g. "4/5". keyTerms: array of terms. exampleContent: brief description. recommendedDepth: e.g. "200-300 words".

B) GAP IDENTIFICATION
- ${gapRules}
- Only include gaps that meet all three criteria above and cite specific evidence.

C) HEADING PATTERN EXTRACTION (raw data only)
- For EACH competitor: list their H2 and H3 headings exactly as used. competitorHeadings: array of { url, h2s: string[], h3s: string[] }. Do NOT create a "recommended outline".

D) EDITORIAL STYLE ANALYSIS
- sentenceLength: average (words), distribution: short (1-8), medium (9-17), long (18-30), veryLong (30+) as percentages.
- paragraphLength: averageSentences, distribution: single, standard (2-4), long (5-7), veryLong (8+) as percentages.
- tone: MUST be specific (e.g. "authoritative but approachable with short how-to lists") — NOT generic (avoid "professional", "informative" alone).
- readingLevel (e.g. "Grade 8-9"), contentMix: { prose, lists } percentages only (no tables).
- dataDensity: how data-heavy the writing is (e.g. "stats in most sections", "light on numbers") — specific, not generic.
- pointOfView: "first" | "second" | "third" | "mixed" (dominant POV across competitors).
- realExamplesFrequency: how often competitors use real examples (e.g. "rare", "one case study per article", "concrete names and numbers in 2/5 articles") — specific.
- introStyle, ctaStyle.

E) COMPETITOR ANALYSIS
- Per competitor: url, strengths, weaknesses, aiLikelihood: "likely_human" | "uncertain" | "likely_ai" (based on uniform length, repetitive structure, AI phrases like delve/landscape/crucial/comprehensive/leverage/seamless/robust, lack of personal voice).

F) WORD COUNT
- competitorAverage, recommended (avg + 15%), note with STRICT ±5% requirement.
${paaSection}

Return JSON with exactly: ${rootKeys}.`;

  const paaBlock =
    hasPaa ?
      `\n\n--- PAA QUESTIONS (from Serper; analyze coverage for each) ---\n${paaQuestions.map((q) => `- ${q}`).join("\n")}\n`
    : "";

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: taskPrompt + paaBlock + "\n--- COMPETITOR ARTICLES ---\n\n" + payload,
    config: {
      systemInstruction,
      temperature: 0.1,
      topP: 0.95,
      maxOutputTokens: 16384,
      responseMimeType: "application/json" as const,
    },
  });

  const text = response.text ?? "";
  const rawJson = stripJsonMarkdown(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (e) {
    throw new Error(`extractTopicsAndStyle: invalid JSON from Gemini: ${e instanceof Error ? e.message : String(e)}`);
  }

  const validated = TopicExtractionResultSchema.safeParse(parsed);
  if (!validated.success) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[gemini] extractTopicsAndStyle: Zod validation failed", validated.error.flatten());
    }
    throw new Error(
      `extractTopicsAndStyle: response did not match schema: ${JSON.stringify(validated.error.flatten())}`
    );
  }

  return validated.data;
}
