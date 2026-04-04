/**
 * Internal Linking Suggestions
 *
 * After content generation, match existing blog URLs/titles against
 * the new article's section topics. Suggest 3-5 links per 1000 words
 * with natural anchor text.
 *
 * Zero external dependencies — uses term overlap matching.
 */

export type InternalLinkSuggestion = {
  /** Existing blog URL to link to. */
  url: string;
  /** Title of the existing page. */
  title: string;
  /** Suggested anchor text (derived from overlapping terms). */
  anchorText: string;
  /** Which section heading this link fits under. */
  sectionHeading: string;
  /** Relevance score (0-1). */
  relevance: number;
};

export type InternalLinkingResult = {
  /** All suggestions sorted by relevance. */
  suggestions: InternalLinkSuggestion[];
  /** Target link count based on word count. */
  targetLinkCount: number;
  /** Current article word count. */
  wordCount: number;
};

/** Common stop words excluded from matching. */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "was", "are", "be",
  "has", "had", "have", "this", "that", "these", "those", "will", "would",
  "can", "could", "should", "may", "might", "do", "does", "did", "not",
  "how", "what", "when", "where", "who", "which", "why", "your", "you",
]);

/** Tokenize text into meaningful content words. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** Extract sections from HTML (H2 headings with their content). */
function extractSections(html: string): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  let match: RegExpExecArray | null;
  const positions: { heading: string; start: number; end: number }[] = [];

  while ((match = h2Regex.exec(html)) !== null) {
    positions.push({
      heading: match[1].replace(/<[^>]+>/g, "").trim(),
      start: match.index + match[0].length,
      end: html.length,
    });
  }

  for (let i = 0; i < positions.length; i++) {
    const end = i + 1 < positions.length ? positions[i + 1].start - positions[i + 1].heading.length - 10 : html.length;
    sections.push({
      heading: positions[i].heading,
      content: html.slice(positions[i].start, end),
    });
  }

  return sections;
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

/** Compute term overlap score between section content and page title/url. */
function computeRelevance(
  sectionTokens: Set<string>,
  pageTokens: Set<string>,
): number {
  let overlap = 0;
  for (const token of pageTokens) {
    if (sectionTokens.has(token)) overlap++;
  }
  return pageTokens.size > 0 ? overlap / pageTokens.size : 0;
}

/**
 * Generate internal link suggestions for an article.
 *
 * @param articleHtml - The generated article HTML.
 * @param existingPages - Existing blog pages with URL and optional title.
 * @param articleUrl - The new article's URL (to exclude self-links).
 */
export function suggestInternalLinks(
  articleHtml: string,
  existingPages: { url: string; title?: string }[],
  articleUrl?: string,
): InternalLinkingResult {
  const wordCount = articleHtml.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const targetLinkCount = Math.max(3, Math.round((wordCount / 1000) * 4)); // 3-5 per 1000 words

  const sections = extractSections(articleHtml);
  if (sections.length === 0 || existingPages.length === 0) {
    return { suggestions: [], targetLinkCount, wordCount };
  }

  // Exclude self-links
  const pages = articleUrl
    ? existingPages.filter((p) => p.url !== articleUrl)
    : existingPages;

  const suggestions: InternalLinkSuggestion[] = [];
  const usedUrls = new Set<string>();

  for (const section of sections) {
    const sectionTokens = new Set(tokenize(section.content));

    for (const page of pages) {
      if (usedUrls.has(page.url)) continue;

      const pageTitle = page.title ?? slugToTitle(page.url);
      const pageTokens = new Set(tokenize(pageTitle));
      const relevance = computeRelevance(sectionTokens, pageTokens);

      if (relevance >= 0.4) {
        // Generate natural anchor text from overlapping terms
        const overlap = [...pageTokens].filter((t) => sectionTokens.has(t));
        const anchorText = overlap.length >= 2
          ? overlap.slice(0, 4).join(" ")
          : pageTitle.toLowerCase();

        suggestions.push({
          url: page.url,
          title: pageTitle,
          anchorText,
          sectionHeading: section.heading,
          relevance: Math.round(relevance * 100) / 100,
        });

        usedUrls.add(page.url);
      }
    }
  }

  suggestions.sort((a, b) => b.relevance - a.relevance);

  return {
    suggestions: suggestions.slice(0, targetLinkCount + 3), // Return a few extra for user choice
    targetLinkCount,
    wordCount,
  };
}
