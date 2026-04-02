/**
 * Semantic Similarity Scoring
 * Checks if the generated article is too derivative of competitor content.
 */

import { stripHtml } from "@/lib/seo/article-audit";

const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "from", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might", "shall",
    "can", "this", "that", "these", "those", "it", "its", "not", "no", "nor", "so",
    "if", "then", "than", "when", "where", "how", "what", "which", "who", "whom",
    "all", "each", "every", "both", "few", "more", "most", "other", "some", "such",
    "only", "own", "same", "too", "very", "just", "also", "now", "here", "there",
    "about", "up", "out", "into", "over", "after", "before", "between", "under",
    "your", "you", "they", "them", "their", "our", "his", "her", "we", "my",
]);

/**
 * Split text into individual words for basic term frequency, filtering stop words.
 */
function tokenize(text: string): string[] {
    return text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Calculate basic edit distance / exact match similarity.
 * In a production env, use embeddings for true semantic similarity.
 * This is a lightweight proxy using Jaccard index of words.
 */
export function computeSemanticSimilarity(
    articleHtml: string,
    competitors: { url: string; content: string }[]
): { highestSimilarity: number; mostSimilarUrl: string; isTooDerivative: boolean } {
    const articleTokens = new Set(tokenize(stripHtml(articleHtml)));

    if (articleTokens.size === 0 || competitors.length === 0) {
        return { highestSimilarity: 0, mostSimilarUrl: "", isTooDerivative: false };
    }

    let highestSimilarity = 0;
    let mostSimilarUrl = "";

    for (const comp of competitors) {
        if (!comp.content) continue;

        const compTokens = new Set(tokenize(stripHtml(comp.content)));
        let intersection = 0;

        for (const token of articleTokens) {
            if (compTokens.has(token)) intersection++;
        }

        const union = articleTokens.size + compTokens.size - intersection;
        const similarity = union > 0 ? intersection / union : 0;

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            mostSimilarUrl = comp.url;
        }
    }

    // Cap at 0.99
    highestSimilarity = Math.min(0.99, highestSimilarity);

    // Anything > 0.4 on this basic word-overlap metric implies heavy structural/phrasing copying
    const isTooDerivative = highestSimilarity > 0.4;

    return {
        highestSimilarity: Math.round(highestSimilarity * 100) / 100,
        mostSimilarUrl,
        isTooDerivative
    };
}
