import { callClaudeJson, stripJsonMarkdown } from "@/lib/anthropic/shared-client";
import type { TopicGraph } from "./topic-graph";
import { z } from "zod";

export interface AlgorithmicInsight {
    type: "contrarian" | "correlation" | "myth_buster" | "practitioner_observation" | "framework_pillar";
    headline: string;
    explanation: string;
    supportingDataPoint?: string;
    whyCompetitorsMissedIt: string;
}

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

const InsightTypeEnum = z.enum([
    "contrarian", "correlation", "myth_buster", "practitioner_observation", "framework_pillar"
]);

const AlgorithmicInsightSchema = z.object({
    type: InsightTypeEnum.catch("practitioner_observation"),
    headline: z.string(),
    explanation: z.string(),
    supportingDataPoint: z.string().optional(),
    whyCompetitorsMissedIt: z.string().catch("Not addressed by standard SERP content"),
});

const InsightsArraySchema = z.array(AlgorithmicInsightSchema);

/** Required insight types that must each appear at least once. */
const REQUIRED_TYPES: AlgorithmicInsight["type"][] = ["contrarian", "myth_buster", "practitioner_observation"];

/**
 * Post-generation validation: check array length and required type distribution.
 * Logs warnings but returns what we have (graceful degradation).
 */
function validateInsightConstraints(insights: AlgorithmicInsight[], keyword: string): AlgorithmicInsight[] {
    if (insights.length === 0) {
        console.warn(`[knowledge/insight-generator] No insights generated for "${keyword}"`);
        return insights;
    }

    const types = new Set(insights.map(i => i.type));
    const missingTypes = REQUIRED_TYPES.filter(t => !types.has(t));

    if (missingTypes.length > 0) {
        console.warn(
            `[knowledge/insight-generator] Missing required insight types for "${keyword}": ${missingTypes.join(", ")}. Got: ${[...types].join(", ")}`
        );
    }

    if (insights.length < 3) {
        console.warn(
            `[knowledge/insight-generator] Only ${insights.length} insights generated for "${keyword}" (expected 5)`
        );
    }

    return insights;
}

/** Default fallback insights when LLM fails. */
function fallbackInsights(keyword: string): AlgorithmicInsight[] {
    return [
        {
            type: "practitioner_observation",
            headline: `Most ${keyword} advice ignores implementation complexity`,
            explanation: `Standard SERP articles cover the "what" but skip the "how hard." Practitioners know the gap between theory and execution is where most projects fail.`,
            whyCompetitorsMissedIt: "Competitors optimize for search volume, not practitioner depth",
        },
    ];
}

// ---------------------------------------------------------------------------
// Retry helper
// ---------------------------------------------------------------------------

async function withSingleRetry<T>(
    fn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    label: string
): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        console.warn(`[knowledge/${label}] First attempt failed, retrying with simpler prompt:`, err instanceof Error ? err.message : String(err));
        return fallbackFn();
    }
}

export async function generateAlgorithmicInsights(
    keyword: string,
    topicGraph: TopicGraph,
    currentFacts: string[]
): Promise<AlgorithmicInsight[]> {
    const systemPrompt = `You generate original insights that give the article a measurable Information Gain advantage over competitors. Your output feeds directly into the Brief Builder (which maps insights to outline sections) and the Writer (which weaves them into prose).

INPUT: Topic Graph information gaps (high-relevance topics competitors missed) + Current Facts (grounded data from Gemini search).
YOUR JOB: Connect gaps with facts to produce insights NO competitor has published.

RULES:
1. Exactly 5 insights. Each must include at least one specific mechanism, metric, or named entity. Vague claims ("many companies are adopting X") fail. Specific claims ("companies using X see 23% improvement in Y according to Z") pass.
2. At least 1 "contrarian" — argues against standard SERP advice with a specific data point or mechanism.
3. At least 1 "myth_buster" — debunks an outdated belief, citing what changed and when.
4. At least 1 "practitioner_observation" — a gritty, specific observation only someone doing the work daily would know.
5. FRESHNESS: Reference post-2025 context ONLY if grounded in the provided Current Facts. If Current Facts lack recent data, frame insights using timeless principles rather than fabricating trends.
6. whyCompetitorsMissedIt: Explain which SERP pattern creates the gap (e.g., "all 5 competitors focus on feature comparison, none discuss implementation cost"). Observable, not speculative.

Output strictly valid JSON:
{
  "insights": [
    {
      "type": "contrarian" | "correlation" | "myth_buster" | "practitioner_observation" | "framework_pillar",
      "headline": string (punchy, tweetable),
      "explanation": string (2-3 sentences, specific mechanisms),
      "supportingDataPoint": string (optional, tied to a Current Fact),
      "whyCompetitorsMissedIt": string (which SERP pattern creates this gap)
    }
  ]
}
Return ONLY valid JSON, no markdown blocks.`;

    const simpleSystemPrompt = `Generate 5 unique industry insights for "${keyword}". Return JSON: { "insights": [{ "type": "contrarian"|"correlation"|"myth_buster"|"practitioner_observation"|"framework_pillar", "headline": string, "explanation": string, "whyCompetitorsMissedIt": string }] }.`;

    const userPrompt = `Keyword: ${keyword}

Saturated Topics (What everyone else wrote about - ignore or contradict these):
${topicGraph.saturatedTopics.map(t => `- ${t}`).join("\n")}

Information Gaps (What the SERP missed entirely):
${topicGraph.informationGaps.map(t => `- ${t}`).join("\n")}

Current Grounded Facts (Use these to back up your claims):
${currentFacts.map(f => `- ${f}`).join("\n")}

Derive 5 original insights for "${keyword}". Connect the gaps with the facts to look like a true industry expert.`;

    const callLLM = async (system: string) => {
        const result = await callClaudeJson(system, userPrompt, { temperature: 0.25 });
        const content = result.content;
        if (!content) throw new Error("generateAlgorithmicInsights: empty response from Claude");

        const raw = stripJsonMarkdown(content);
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            throw new Error(`generateAlgorithmicInsights: invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Unwrap: LLM may return { insights: [...] } or just the array
        let insightsArray: unknown;
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            insightsArray = obj.insights ?? obj.data ?? obj.results;
            if (!insightsArray) {
                for (const val of Object.values(obj)) {
                    if (Array.isArray(val)) { insightsArray = val; break; }
                    if (val != null && typeof val === "object" && "insights" in (val as Record<string, unknown>)) {
                        insightsArray = (val as Record<string, unknown>).insights;
                        break;
                    }
                }
            }
        } else if (Array.isArray(parsed)) {
            insightsArray = parsed;
        }

        if (!Array.isArray(insightsArray)) {
            console.warn("[knowledge/insight-generator] Could not find insights array in response");
            return fallbackInsights(keyword);
        }

        const validated = InsightsArraySchema.safeParse(insightsArray);
        if (!validated.success) {
            console.warn("[knowledge/insight-generator] Zod validation failed, using fallback:", validated.error.flatten());
            return fallbackInsights(keyword);
        }

        return validateInsightConstraints(validated.data, keyword);
    };

    return withSingleRetry(
        () => callLLM(systemPrompt),
        () => callLLM(simpleSystemPrompt),
        "insight-generator"
    );
}
