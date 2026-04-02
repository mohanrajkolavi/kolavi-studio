/**
 * Content Decay Monitoring
 * Assesses the risk of an article becoming outdated based on its publish date and topic volatility.
 */

export type ContentDecayResult = {
    decayRisk: "Low" | "Medium" | "High";
    ageMonths: number;
    recommendation: string;
    refreshPriority: "Low" | "Standard" | "Urgent";
};

/**
 * Assess content decay risk for a given article.
 * @param publishDate The ISO date when the article was published/last updated.
 * @param topicCategory e.g., "technology", "news", "evergreen"
 */
export function assessContentDecay(
    publishDate: string,
    topicCategory: string = "general"
): ContentDecayResult {
    const date = new Date(publishDate);
    if (isNaN(date.getTime())) {
        return {
            decayRisk: "Medium",
            ageMonths: 0,
            recommendation: "Valid publish date required for accurate tracking.",
            refreshPriority: "Standard",
        };
    }

    const ageMs = Date.now() - date.getTime();
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30);

    // Fast-moving topics decay quicker (tech, news, SEO, marketing, AI, social media, etc.)
    // topicCategory may be an actual category or a keyword — match broadly
    const volatilityMultiplier = /\b(?:tech|technology|news|seo|marketing|ai|artificial intelligence|machine learning|social media|crypto|blockchain|saas|software|digital|startup|algorithm|llm|gpt|chatgpt)\b/i.test(topicCategory)
        ? 1.5
        : 1.0;
    const adjustedAge = ageMonths * volatilityMultiplier;

    let decayRisk: "Low" | "Medium" | "High" = "Low";
    let refreshPriority: "Low" | "Standard" | "Urgent" = "Low";
    let recommendation = "Content is fresh. No action needed.";

    if (adjustedAge >= 12) {
        decayRisk = "High";
        refreshPriority = "Urgent";
        recommendation = "Content is highly likely to be outdated. Schedule a comprehensive refresh.";
    } else if (adjustedAge >= 6) {
        decayRisk = "Medium";
        refreshPriority = "Standard";
        recommendation = "Content is aging. Review stats and links within the next 3 months.";
    }

    return {
        decayRisk,
        ageMonths: Math.round(ageMonths * 10) / 10,
        recommendation,
        refreshPriority,
    };
}
