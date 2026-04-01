import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
import type { CompetitorArticle } from "@/lib/pipeline/types";
import { TopicGraphSchema } from "@/lib/pipeline/types";

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

    const systemPrompt = `You build semantic topic graphs for content strategy. Your output feeds the Insight Generator (which finds non-obvious angles) and the Brief Builder (which constructs the article outline).

For the keyword "${keyword}":

1. Map the IDEAL topic universe for a definitive guide on this subject.
2. Score each topic against the provided competitor content, PAA questions, and Reddit discussions.
3. Scoring guide:
   - relevanceScore (1-10): 10 = directly answers the search query, 7 = important supporting concept, 4 = tangentially related, 1 = barely relevant.
   - competitorCoverage (0-100%): percentage of top competitors that meaningfully cover this topic (1+ substantive paragraphs, not just a mention).
4. informationGaps: Topics with relevance >= 7 AND competitorCoverage <= 30%. These are high-value content opportunities the article MUST address.
5. saturatedTopics: Topics with competitorCoverage >= 80%. The writer must differentiate on these, not duplicate.

Prioritize unique angles from PAA and Reddit data that competitors missed. These become the raw material for the Insight Generator downstream.

Output strictly formatted JSON:
{
  "nodes": [{ "topic": string, "category": "core"|"entity"|"strategy"|"tactic"|"concept", "relevanceScore": number (1-10), "competitorCoverage": number (0-100) }],
  "edges": [{ "source": string, "target": string, "relationship": string }],
  "informationGaps": [string],
  "saturatedTopics": [string]
}
Return ONLY valid JSON, no markdown blocks.`;

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
    const parsed = JSON.parse(raw);
    const validated = TopicGraphSchema.safeParse(parsed);
    if (!validated.success) {
        console.warn("buildTopicGraph: schema validation failed, using raw parse:", validated.error.issues);
    }
    return (validated.success ? validated.data : parsed) as TopicGraph;
}
