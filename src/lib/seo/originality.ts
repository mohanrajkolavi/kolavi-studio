/**
 * Originality check — n-gram similarity between generated article and competitor content.
 * Flags paragraphs with high overlap to ensure content uniqueness.
 */

/** Result of an originality check. */
export type OriginalityResult = {
    /** Overall originality score 0-100 (100 = fully original). */
    score: number;
    /** Paragraphs flagged as potentially derivative. */
    flaggedParagraphs: {
        text: string;
        similarity: number;
        matchedUrl: string;
    }[];
};

/** Extract n-grams from text. */
function getNgrams(text: string, n: number): Set<string> {
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter(Boolean);
    const ngrams = new Set<string>();
    for (let i = 0; i <= words.length - n; i++) {
        ngrams.add(words.slice(i, i + n).join(" "));
    }
    return ngrams;
}

/** Calculate Jaccard similarity between two n-gram sets. */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersection = 0;
    for (const gram of setA) {
        if (setB.has(gram)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return union > 0 ? intersection / union : 0;
}

/** Strip HTML tags for plain text comparison. */
function stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Check originality of generated article against competitor content.
 * Splits article into paragraphs, computes 4-gram overlap with each competitor.
 * @param articleHtml The generated article HTML content.
 * @param competitors Array of { url, content } from scraped competitors.
 * @param threshold Similarity threshold to flag a paragraph (default 0.3 = 30%).
 */
export function checkOriginality(
    articleHtml: string,
    competitors: { url: string; content: string }[],
    threshold = 0.3
): OriginalityResult {
    const articleText = stripHtml(articleHtml);
    const paragraphs = articleText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.split(/\s+/).length >= 10); // Only check paragraphs with 10+ words

    if (paragraphs.length === 0) {
        return { score: 100, flaggedParagraphs: [] };
    }

    // Pre-compute competitor n-grams
    const competitorNgrams = competitors
        .filter((c) => c.content.length > 0)
        .map((c) => ({
            url: c.url,
            ngrams: getNgrams(c.content, 4),
        }));

    const flaggedParagraphs: OriginalityResult["flaggedParagraphs"] = [];

    for (const para of paragraphs) {
        const paraNgrams = getNgrams(para, 4);
        if (paraNgrams.size < 3) continue; // too short for meaningful comparison

        let maxSimilarity = 0;
        let matchedUrl = "";

        for (const comp of competitorNgrams) {
            const sim = jaccardSimilarity(paraNgrams, comp.ngrams);
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                matchedUrl = comp.url;
            }
        }

        if (maxSimilarity >= threshold) {
            flaggedParagraphs.push({
                text: para.slice(0, 200) + (para.length > 200 ? "..." : ""),
                similarity: Math.round(maxSimilarity * 100) / 100,
                matchedUrl,
            });
        }
    }

    // Score: 100 = no flagged paragraphs, decreases with more flags
    const flagRate = flaggedParagraphs.length / paragraphs.length;
    const score = Math.max(0, Math.round((1 - flagRate) * 100));

    return { score, flaggedParagraphs };
}
