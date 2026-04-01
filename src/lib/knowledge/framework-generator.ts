import { getClient, stripJsonMarkdown } from "@/lib/openai/client";
import { ProprietaryFrameworkSchema } from "@/lib/pipeline/types";
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
    const parsed = (JSON.parse(raw) as { framework: unknown }).framework;
    const validated = ProprietaryFrameworkSchema.safeParse(parsed);
    if (!validated.success) {
        console.warn("synthesizeProprietaryFramework: schema validation failed:", validated.error.issues);
    }
    return (validated.success ? validated.data : parsed) as ProprietaryFramework;
}
