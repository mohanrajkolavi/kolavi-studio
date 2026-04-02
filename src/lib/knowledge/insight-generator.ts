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
    const systemPrompt = `You are a world-class Industry Analyst and Principal SEO Strategist writing for an expert audience.
Your task is to generate original "Information Gain."
You will NOT summarize what the SERP is already saying.
Instead, you will look at the 'Information Gaps' (topics with low competitor coverage but high relevance) and 'Current Facts', and derive entirely new, non-obvious algorithmic insights.

RULES FOR INSIGHTS:
1. Generate exactly 5 highly unique, non-obvious insights.
2. At least 1 MUST be a "Contrarian Take" (arguing against standard SERP advice).
3. At least 1 MUST be a "Myth Buster" (debunking an outdated but commonly held belief in the industry).
4. At least 1 MUST be a "Practitioner Observation" (a realistic, gritty observation that only someone who does the work every day would know).
5. DO NOT sound generic, fluffy, or theoretical.

Output MUST be strictly valid JSON matching this schema:
{
  "insights": [
    {
      "type": "contrarian" | "correlation" | "myth_buster" | "practitioner_observation" | "framework_pillar",
      "headline": string (Punchy, tweetable statement),
      "explanation": string (2-3 sentences mechanics),
      "supportingDataPoint": string (optional, a fact tied back to the Current Facts),
      "whyCompetitorsMissedIt": string (1 sentence explaining why standard articles ignore this)
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

        // Unwrap: GPT may return { insights: [...] } or just the array
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
