/**
 * Gemini API client — current data (grounded search) + topic & editorial style extraction.
 * Uses @google/genai (supports Google Search Grounding).
 */

import { GoogleGenAI } from "@google/genai";
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
 * Fetch current, grounded data for a keyword using Gemini Flash with Google Search.
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

  const prompt = `Search for current, up-to-date information about "${primaryKeyword}"${keywordContext}. Find:
1) Latest statistics, financial data, or metrics
2) Recent developments or news from the past 6 months
3) Current market data, pricing, or benchmarks

Return as structured JSON with this exact format (no other text):
{
  "facts": [{"fact": "string", "source": "full URL", "date": "optional date"}],
  "recentDevelopments": ["string"],
  "lastUpdated": "string e.g. January 2026"
}

Only include facts you can verify with sources. If no current data is available for a topic, say so — do NOT invent data.`;

  const config = {
    temperature: 0.3,
    tools: [{ googleSearch: {} }],
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
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

/**
 * Extract topics, raw heading patterns, gaps, editorial style, and competitor analysis from competitors.
 * EXTRACT only — does not decide the outline (that's Step 3).
 */
export async function extractTopicsAndStyle(
  competitors: CompetitorArticle[]
): Promise<TopicExtractionResult> {
  const ai = getClient();
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

  const prompt = `You are analyzing competitor articles for a content strategy. EXTRACT and REPORT the following. Do NOT decide the final outline — only report what you observe.

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
- competitorAverage, recommended (avg + 15%), note.

Return ONLY valid JSON matching this structure (no markdown):
{
  "topics": [{"name","importance","coverageCount","keyTerms","exampleContent","recommendedDepth"}],
  "competitorHeadings": [{"url","h2s":[],"h3s":[]}],
  "gaps": [{"topic","opportunity","recommendedApproach"}],
  "competitorStrengths": [{"url","strengths","weaknesses","aiLikelihood":"likely_human"|"uncertain"|"likely_ai"}],
  "editorialStyle": {"sentenceLength":{"average", "distribution":{"short","medium","long","veryLong"}}, "paragraphLength":{"averageSentences", "distribution":{"single","standard","long","veryLong"}}, "tone","readingLevel","contentMix":{"prose","lists","tables"},"dataDensity","introStyle","ctaStyle"},
  "wordCount": {"competitorAverage","recommended","note"}
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    // Prompt FIRST to avoid "lost in the middle" — model knows what to extract before reading content
    contents: prompt + "\n\n--- COMPETITOR ARTICLES ---\n\n" + payload,
    config: { temperature: 0.3 },
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
