/**
 * Keyword Cannibalization Detection
 *
 * Before generating a new article, compare the target keyword against existing
 * blog URLs/titles. If significant overlap is detected, warn and suggest:
 * - Update the existing article instead
 * - Differentiate the angle
 * - Merge content
 *
 * Uses Jaccard similarity on word tokens for fast, dependency-free comparison.
 */

export type CannibalizationMatch = {
  /** Existing URL that overlaps with the target keyword. */
  url: string;
  /** Title or slug-derived label of the existing page. */
  title: string;
  /** Jaccard similarity score (0-1). */
  similarity: number;
  /** Overlapping word tokens. */
  overlappingWords: string[];
};

export type CannibalizationResult = {
  /** Whether any existing page significantly overlaps (similarity >= threshold). */
  hasConflict: boolean;
  /** Matches sorted by similarity (highest first). */
  matches: CannibalizationMatch[];
  /** Suggested action if conflict found. */
  suggestion?: string;
};

/** Common English stop words to exclude from similarity. */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "was", "are", "be",
  "has", "had", "have", "this", "that", "these", "those", "will", "would",
  "can", "could", "should", "may", "might", "do", "does", "did", "not",
  "no", "so", "if", "up", "out", "about", "into", "over", "after",
  "how", "what", "when", "where", "who", "which", "why", "all", "each",
  "every", "both", "few", "more", "most", "other", "some", "such",
  "than", "too", "very", "just", "your", "you", "my", "our", "its",
]);

/** Tokenize a string into meaningful word tokens. */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

/** Compute Jaccard similarity between two token sets. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): { score: number; overlap: string[] } {
  const overlap: string[] = [];
  for (const token of a) {
    if (b.has(token)) overlap.push(token);
  }
  const union = new Set([...a, ...b]);
  return {
    score: union.size > 0 ? overlap.length / union.size : 0,
    overlap,
  };
}

/** Extract a readable title from a URL slug. */
function slugToTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  } catch {
    return url;
  }
}

/**
 * Detect keyword cannibalization against existing blog URLs.
 *
 * @param targetKeyword - The primary keyword for the new article.
 * @param existingUrls - Array of existing blog URLs (with optional titles).
 * @param threshold - Similarity threshold to flag (default 0.3 = 30% overlap).
 */
export function detectCannibalization(
  targetKeyword: string,
  existingUrls: { url: string; title?: string }[],
  threshold = 0.3,
): CannibalizationResult {
  if (!targetKeyword.trim() || existingUrls.length === 0) {
    return { hasConflict: false, matches: [] };
  }

  const targetTokens = tokenize(targetKeyword);
  const matches: CannibalizationMatch[] = [];

  for (const existing of existingUrls) {
    // Compare against both title and URL slug
    const titleTokens = tokenize(existing.title ?? slugToTitle(existing.url));
    const urlTokens = tokenize(existing.url);
    const combinedTokens = new Set([...titleTokens, ...urlTokens]);

    const { score, overlap } = jaccardSimilarity(targetTokens, combinedTokens);

    if (score >= threshold * 0.5) {
      // Include even low matches for reference, filter by threshold later
      matches.push({
        url: existing.url,
        title: existing.title ?? slugToTitle(existing.url),
        similarity: Math.round(score * 100) / 100,
        overlappingWords: overlap,
      });
    }
  }

  matches.sort((a, b) => b.similarity - a.similarity);

  const conflicts = matches.filter((m) => m.similarity >= threshold);
  const hasConflict = conflicts.length > 0;

  let suggestion: string | undefined;
  if (hasConflict) {
    const topMatch = conflicts[0];
    if (topMatch.similarity >= 0.6) {
      suggestion = `High overlap (${Math.round(topMatch.similarity * 100)}%) with "${topMatch.title}". Consider updating the existing article instead of creating a new one.`;
    } else if (topMatch.similarity >= 0.4) {
      suggestion = `Moderate overlap (${Math.round(topMatch.similarity * 100)}%) with "${topMatch.title}". Differentiate the angle or merge content to avoid keyword cannibalization.`;
    } else {
      suggestion = `Some overlap (${Math.round(topMatch.similarity * 100)}%) with "${topMatch.title}". Ensure distinct search intent to avoid cannibalization.`;
    }
  }

  return {
    hasConflict,
    matches: matches.slice(0, 5), // Top 5 matches
    suggestion,
  };
}
