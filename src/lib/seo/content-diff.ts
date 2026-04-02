/**
 * Competitor Content Diff
 * Compares the generated article against competitor content to highlight unique value.
 */

import { stripHtml } from "@/lib/seo/article-audit";

export type ContentDiffResult = {
    coveredByUs: string[];
    coveredByCompetitorsOnly: string[];
    uniqueToUs: string[];
};

/**
 * Basic keyword/phrase extraction for content diff.
 * In a production system, this could use NLP/embeddings to match semantic topics.
 */
function extractKeyPhrases(text: string): Set<string> {
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 1);
    const phrases = new Set<string>();

    // Extract 2-grams and 3-grams as simple proxies for topics
    for (let i = 0; i < words.length - 1; i++) {
        phrases.add(`${words[i]} ${words[i + 1]}`);
        if (i < words.length - 2) {
            phrases.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
        }
    }
    return phrases;
}

/**
 * Generate a diff comparing our article's topics against competitors.
 */
export function generateContentDiff(
    articleHtml: string,
    competitors: { content: string }[],
    extractedTopics: string[] = []
): ContentDiffResult {
    const articleText = stripHtml(articleHtml);

    // If we have explicit topics from the brief, use those as the baseline for tracking coverage
    if (extractedTopics.length > 0) {
        const articleLower = articleText.toLowerCase();
        const coveredByUs: string[] = [];
        const missedByUs: string[] = [];

        for (const topic of extractedTopics) {
            if (articleLower.includes(topic.toLowerCase())) {
                coveredByUs.push(topic);
            } else {
                missedByUs.push(topic);
            }
        }

        // Simplistic unique check: topics we covered that aren't mentioned heavily in competitors
        const compText = competitors.map(c => c.content.toLowerCase()).join(" ");
        const uniqueToUs = coveredByUs.filter(t => !compText.includes(t.toLowerCase()));

        const coveredByCompetitorsOnly = missedByUs.filter(t =>
            compText.includes(t.toLowerCase())
        );

        return {
            coveredByUs,
            coveredByCompetitorsOnly,
            uniqueToUs
        };
    }

    // Fallback: heuristic n-gram extraction (less accurate but works without AI)
    const ourPhrases = extractKeyPhrases(articleText);
    const compPhrases = new Set<string>();
    for (const c of competitors) {
        const p = extractKeyPhrases(c.content);
        for (const phrase of p) compPhrases.add(phrase);
    }

    // Sample phrases from sets (no guaranteed order or frequency ranking)
    const covered = Array.from(ourPhrases).filter(p => compPhrases.has(p)).slice(0, 10);
    const compOnly = Array.from(compPhrases).filter(p => !ourPhrases.has(p)).slice(0, 5);
    const unique = Array.from(ourPhrases).filter(p => !compPhrases.has(p)).slice(0, 5);

    return {
        coveredByUs: covered,
        coveredByCompetitorsOnly: compOnly,
        uniqueToUs: unique
    };
}
