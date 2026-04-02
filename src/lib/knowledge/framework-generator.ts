import { callClaudeJson, stripJsonMarkdown } from "@/lib/anthropic/shared-client";
import type { AlgorithmicInsight } from "./insight-generator";
import type { TopicGraph } from "./topic-graph";
import { z } from "zod";

export interface ProprietaryFramework {
    name: string;
    tagline: string;
    corePillars: {
        name: string;
        description: string;
        underlyingInsight: string;
    }[];
    howItBeatsTheSerp: string;
}

// ---------------------------------------------------------------------------
// Zod validation schema
// ---------------------------------------------------------------------------

const CorePillarSchema = z.object({
    name: z.string(),
    description: z.string(),
    underlyingInsight: z.string().catch(""),
});

const ProprietaryFrameworkSchema = z.object({
    name: z.string(),
    tagline: z.string(),
    corePillars: z.array(CorePillarSchema).min(1).catch([{ name: "Core", description: "Primary framework pillar", underlyingInsight: "" }]),
    howItBeatsTheSerp: z.string().catch("Offers a structured methodology competitors lack"),
});

/** Default fallback when LLM fails. */
function fallbackFramework(keyword: string): ProprietaryFramework {
    const titleCase = keyword.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return {
        name: `The ${titleCase} Framework`,
        tagline: `A structured approach to mastering ${keyword}`,
        corePillars: [
            { name: "Foundation", description: `Core principles of ${keyword}`, underlyingInsight: "Baseline knowledge most competitors cover superficially" },
            { name: "Execution", description: `Practical implementation strategies for ${keyword}`, underlyingInsight: "The gap between theory and practice" },
            { name: "Optimization", description: `Advanced techniques to maximize ${keyword} results`, underlyingInsight: "Where practitioners differentiate from beginners" },
        ],
        howItBeatsTheSerp: "Provides actionable depth that standard listicle-style SERP content cannot match",
    };
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

export async function synthesizeProprietaryFramework(
    keyword: string,
    topicGraph: TopicGraph,
    insights: AlgorithmicInsight[]
): Promise<ProprietaryFramework> {
    const systemPrompt = `You create proprietary frameworks for content marketing. Your output becomes the article's central thesis — the Brief Builder maps each pillar to H2 sections, and the Writer weaves the framework throughout the article.

INPUT: Topic Graph (saturated topics + information gaps) + Algorithmic Insights from the Insight Generator.
YOUR JOB: Package the insights into a memorable, structured framework that differentiates the article from every SERP competitor.

NAMING RULES:
- 3-5 words. Must use a concrete metaphor or acronym. Must instantly communicate purpose.
- Good: "The RACE Framework", "The Content Velocity Stack", "The 3-Layer Authority Model"
- Bad: "The Comprehensive Guide Framework" (generic), "The SEO Method" (too vague)

STRUCTURE:
- 3-5 Core Pillars (use the natural number for the topic — don't force-fit 4 pillars if 3 or 5 is right).
- Each pillar must map to a specific information gap or insight. A pillar that can't be explained in 2-3 paragraphs is too broad — split it.
- Each pillar needs: name (catchy, specific), description (2-3 sentences on mechanics), underlyingInsight (which gap/insight it addresses).

DIFFERENTIATION:
- howItDifferentiates: Explain which information gap from the topic graph this framework fills that competitors' standard advice misses. Be specific about what competitors do that this framework replaces.

Output strictly valid JSON:
{
  "framework": {
    "name": string,
    "tagline": string (1-sentence elevator pitch),
    "corePillars": [
      {
        "name": string,
        "description": string (2-3 sentences, mechanics),
        "underlyingInsight": string (which insight/gap this pillar solves)
      }
    ],
    "howItBeatsTheSerp": string (which specific SERP gap this framework fills)
  }
}
Return ONLY valid JSON, no markdown blocks.`;

    const simpleSystemPrompt = `Invent a proprietary framework for "${keyword}" with 3-4 pillars. Return JSON: { "framework": { "name": string, "tagline": string, "corePillars": [{ "name": string, "description": string, "underlyingInsight": string }], "howItBeatsTheSerp": string } }.`;

    const userPrompt = `Keyword: ${keyword}

Saturated Topics (What everyone else is repeating):
${topicGraph.saturatedTopics.map(t => `- ${t}`).join("\n")}

Information Gaps (The white space we are attacking):
${topicGraph.informationGaps.map(t => `- ${t}`).join("\n")}

Our Original Practitioner Insights:
${insights.map((i, idx) => `Insight ${idx + 1} (${i.type}): ${i.headline}\nExplanation: ${i.explanation}`).join("\n\n")}

Synthesize these into a master Framework.`;

    const callLLM = async (system: string) => {
        const result = await callClaudeJson(system, userPrompt, { temperature: 0.3 });
        const content = result.content;
        if (!content) throw new Error("synthesizeProprietaryFramework: empty response from Claude");

        const raw = stripJsonMarkdown(content);
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            throw new Error(`synthesizeProprietaryFramework: invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Unwrap: LLM may return { framework: {...} } or the framework directly
        let frameworkObj: unknown = parsed;
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            if ("framework" in obj && obj.framework != null && typeof obj.framework === "object") {
                frameworkObj = obj.framework;
            } else if (!("name" in obj) || !("corePillars" in obj)) {
                for (const val of Object.values(obj)) {
                    if (val != null && typeof val === "object" && "name" in (val as Record<string, unknown>) && "corePillars" in (val as Record<string, unknown>)) {
                        frameworkObj = val;
                        break;
                    }
                }
            }
        }

        const validated = ProprietaryFrameworkSchema.safeParse(frameworkObj);
        if (!validated.success) {
            console.warn("[knowledge/framework-generator] Zod validation failed, using fallback:", validated.error.flatten());
            return fallbackFramework(keyword);
        }
        return validated.data;
    };

    return withSingleRetry(
        () => callLLM(systemPrompt),
        () => callLLM(simpleSystemPrompt),
        "framework-generator"
    );
}
