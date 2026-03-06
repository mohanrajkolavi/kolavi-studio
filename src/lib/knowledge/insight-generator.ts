import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
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

    const userPrompt = `Keyword: ${keyword}

Saturated Topics (What everyone else wrote about - ignore or contradict these):
${topicGraph.saturatedTopics.map(t => `- ${t}`).join("\\n")}

Information Gaps (What the SERP missed entirely):
${topicGraph.informationGaps.map(t => `- ${t}`).join("\\n")}

Current Grounded Facts (Use these to back up your claims):
${currentFacts.map(f => `- ${f}`).join("\\n")}

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
    return (JSON.parse(raw) as { insights: AlgorithmicInsight[] }).insights;
}
