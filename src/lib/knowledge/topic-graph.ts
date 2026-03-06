import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
import type { CompetitorArticle } from "@/lib/pipeline/types";

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

export async function buildTopicGraph(
    keyword: string,
    competitorArticles: CompetitorArticle[],
    paaQuestions?: string[],
    redditThreads?: any[]
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

    const userPrompt = `Keyword: ${keyword}\n\n${paaContext}\n\n${redditContext}\n\nCompetitor Content (Truncated):\n${competitorSummaries}`;

    const openai = getClient();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("buildTopicGraph: empty response from OpenAI");

    const raw = stripJsonMarkdown(content);
    return JSON.parse(raw) as TopicGraph;
}
