import { callClaudeJson, stripJsonMarkdown } from "@/lib/anthropic/shared-client";
import type { CompetitorArticle } from "@/lib/pipeline/types";
import { z } from "zod";

export interface TopicNode {
    topic: string;
    category: "core" | "entity" | "strategy" | "tactic" | "concept";
    relevanceScore: number;
    competitorCoverage: number;
}

export interface TopicGraph {
    nodes: TopicNode[];
    edges: { source: string; target: string; relationship: string }[];
    informationGaps: string[];
    saturatedTopics: string[];
}

// ---------------------------------------------------------------------------
// Zod validation schemas
// ---------------------------------------------------------------------------

const TopicNodeSchema = z.object({
    topic: z.string(),
    category: z.enum(["core", "entity", "strategy", "tactic", "concept"]).catch("concept"),
    relevanceScore: z.coerce.number().min(0).max(10).catch(5),
    competitorCoverage: z.coerce.number().min(0).max(100).catch(50),
});

const TopicEdgeSchema = z.object({
    source: z.string(),
    target: z.string(),
    relationship: z.string(),
});

const TopicGraphSchema = z.object({
    nodes: z.array(TopicNodeSchema).catch([]),
    edges: z.array(TopicEdgeSchema).catch([]),
    informationGaps: z.array(z.string()).catch([]),
    saturatedTopics: z.array(z.string()).catch([]),
});

/** Default fallback when LLM returns garbage or call fails. */
function fallbackTopicGraph(keyword: string): TopicGraph {
    return {
        nodes: [{ topic: keyword, category: "core", relevanceScore: 10, competitorCoverage: 50 }],
        edges: [],
        informationGaps: [`Comprehensive guide to ${keyword}`],
        saturatedTopics: [],
    };
}

// ---------------------------------------------------------------------------
// Retry helper (1 retry with simpler prompt fallback)
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

export async function buildTopicGraph(
    keyword: string,
    competitorArticles: CompetitorArticle[],
    paaQuestions?: string[],
    redditThreads?: { title: string }[]
): Promise<TopicGraph> {
    const competitorSummaries = competitorArticles.map((c, i) => `Competitor ${i + 1} (${c.url}):\n${c.content.substring(0, 3000)}...`).join("\n\n");
    const paaContext = paaQuestions && paaQuestions.length ? `People Also Ask:\n${paaQuestions.join("\n")}` : "";
    const redditContext = redditThreads && redditThreads.length ? `Reddit Discussions:\n${redditThreads.map(r => r.title).join("\n")}` : "";

    const systemPrompt = `You are a world-class Semantic SEO Architect and Knowledge Graph extraction engine.
Your goal is to build a "Topic Graph" for the keyword: "${keyword}".

1. Identify the IDEAL universe of topics, entities, and concepts that SHOULD be covered in a definitive master guide on this subject.
2. Analyze the provided competitor content, PAA questions, and Reddit discussions to determine current SERP coverage.
3. Calculate the 'competitorCoverage' (0-100%) for each ideal topic based on how well the provided competitors cover it.
4. Identify 'informationGaps': Topics that have high relevance (>7) but low competitor coverage (<30%). THIS IS CRITICAL for Information Gain.
5. Identify 'saturatedTopics': Topics that all competitors are covering heavily (>80% coverage).

Output this as a strictly formatted JSON object matching this schema:
{
  "nodes": [{ "topic": string, "category": "core"|"entity"|"strategy"|"tactic"|"concept", "relevanceScore": number (1-10), "competitorCoverage": number (0-100) }],
  "edges": [{ "source": string, "target": string, "relationship": string }],
  "informationGaps": [string],
  "saturatedTopics": [string]
}
Focus highly on unique angles from PAA and Reddit data that competitors missed. Return ONLY valid JSON, no markdown blocks.`;

    const simpleSystemPrompt = `You are a Semantic SEO Architect. Build a topic graph for "${keyword}".
Return valid JSON with keys: nodes (array of {topic, category, relevanceScore, competitorCoverage}), edges (array of {source, target, relationship}), informationGaps (string[]), saturatedTopics (string[]).`;

    const userPrompt = `Keyword: ${keyword}\n\n${paaContext}\n\n${redditContext}\n\nCompetitor Content (Truncated):\n${competitorSummaries}`;

    const callLLM = async (system: string) => {
        const result = await callClaudeJson(system, userPrompt, { temperature: 0.2 });
        const content = result.content;
        if (!content) throw new Error("buildTopicGraph: empty response from Claude");

        const raw = stripJsonMarkdown(content);
        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            throw new Error(`buildTopicGraph: invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
        }

        // Unwrap if GPT nests under a key like "topicGraph" or "graph"
        if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
            const obj = parsed as Record<string, unknown>;
            if (!("nodes" in obj)) {
                for (const val of Object.values(obj)) {
                    if (val != null && typeof val === "object" && "nodes" in (val as Record<string, unknown>)) {
                        parsed = val;
                        break;
                    }
                }
            }
        }

        const validated = TopicGraphSchema.safeParse(parsed);
        if (!validated.success) {
            console.warn("[knowledge/topic-graph] Zod validation failed, using fallback:", validated.error.flatten());
            return fallbackTopicGraph(keyword);
        }
        return validated.data;
    };

    return withSingleRetry(
        () => callLLM(systemPrompt),
        () => callLLM(simpleSystemPrompt),
        "topic-graph"
    );
}
