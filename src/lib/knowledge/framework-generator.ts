import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
import type { AlgorithmicInsight } from "./insight-generator";
import type { TopicGraph } from "./topic-graph";

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

export async function synthesizeProprietaryFramework(
    keyword: string,
    topicGraph: TopicGraph,
    insights: AlgorithmicInsight[]
): Promise<ProprietaryFramework> {
    const systemPrompt = `You are a world-renowned frameworks architect and Principal SEO Strategist.
Your goal is to invent a brand new, highly linkable proprietary framework for the topic: "${keyword}".

We've already identified the 'Information Gaps' in the current SERP and generated 'Algorithmic Insights' to fill them.
Your job is to package these insights into a cohesive Model, Stack, or Framework that becomes the central thesis of the article.

Examples of great frameworks:
- "The Local Visibility Stack" (instead of "Local SEO Factors")
- "The AI Search Readiness Model" (instead of "Optimizing for AI Overviews")
- "The Review Velocity Matrix" (instead of "Getting more reviews")

RULES:
1. The framework MUST have an incredibly catchy, authoritative name.
2. It MUST be composed of 3-4 'Core Pillars'.
3. The pillars MUST map directly to the provided Algorithmic Insights and Information Gaps.
4. It CANNOT look like standard advice. It must sound like a proprietary consulting methodology.
5. Explain briefly 'howItBeatsTheSerp' so the downstream writer understands the strategic advantage.

Output MUST be strictly valid JSON matching this schema:
{
  "framework": {
    "name": string (Catchy, authoritative name of the framework or model),
    "tagline": string (1-sentence elevator pitch),
    "corePillars": [
      {
        "name": string (e.g., 'Reputation Velocity'),
        "description": string (2-3 sentences explaining the pillar mechanics),
        "underlyingInsight": string (Which specific insight or gap this pillar solves)
      }
    ],
    "howItBeatsTheSerp": string (Strategic explanation of why this framework crushes standard advice)
  }
}
Return ONLY valid JSON, no markdown blocks.`;

    const userPrompt = `Keyword: ${keyword}

Saturated Topics (What everyone else is repeating):
${topicGraph.saturatedTopics.map(t => `- ${t}`).join("\n")}

Information Gaps (The white space we are attacking):
${topicGraph.informationGaps.map(t => `- ${t}`).join("\n")}

Our Original Practitioner Insights:
${insights.map((i, idx) => `Insight ${idx + 1} (${i.type}): ${i.headline}\nExplanation: ${i.explanation}`).join("\n\n")}

Synthesize these into a master Framework.`;

    const openai = getClient();
    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("synthesizeProprietaryFramework: empty response from OpenAI");

    const raw = stripJsonMarkdown(content);
    return (JSON.parse(raw) as { framework: ProprietaryFramework }).framework;
}
