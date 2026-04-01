import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
import { AlgorithmicInsightSchema } from "@/lib/pipeline/types";
import type { TopicGraph } from "./topic-graph";

export interface AlgorithmicInsight {
    type: "contrarian" | "correlation" | "myth_buster" | "practitioner_observation" | "framework_pillar";
    headline: string;
    explanation: string;
    supportingDataPoint?: string;
    whyCompetitorsMissedIt: string;
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

    const userPrompt = `Keyword: ${keyword}

Saturated Topics (What everyone else wrote about - ignore or contradict these):
${topicGraph.saturatedTopics.map(t => `- ${t}`).join("\n")}

Information Gaps (What the SERP missed entirely):
${topicGraph.informationGaps.map(t => `- ${t}`).join("\n")}

Current Grounded Facts (Use these to back up your claims):
${currentFacts.map(f => `- ${f}`).join("\n")}

Derive 5 original insights for "${keyword}". Connect the gaps with the facts to look like a true industry expert.`;

    const openai = getClient();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.25,
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("generateAlgorithmicInsights: empty response from OpenAI");

    const raw = stripJsonMarkdown(content);
    const parsed = (JSON.parse(raw) as { insights: unknown[] }).insights;
    const validated = parsed.map(item => {
        const result = AlgorithmicInsightSchema.safeParse(item);
        if (!result.success) console.warn("generateAlgorithmicInsights: insight validation failed:", result.error.issues);
        return result.success ? result.data : item;
    });
    return validated as AlgorithmicInsight[];
}
