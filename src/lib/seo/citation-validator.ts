/**
 * Citation Validator — validates inline Wikipedia-style citations in generated articles.
 *
 * Checks:
 * 1. Citation density (target: 8-15 per 2000 words)
 * 2. All citation URLs exist in source data (no hallucinated URLs)
 * 3. Citation numbering is sequential and consistent
 * 4. References section exists and matches inline citations
 * 5. Uncited quantitative claims are flagged
 */

export interface Citation {
  /** Citation number as used in the article (e.g., 1, 2, 3) */
  number: number;
  /** The URL in the citation link */
  url: string;
  /** The text surrounding the citation (for context) */
  context: string;
}

export interface CitationValidationResult {
  /** Total inline citations found */
  citationCount: number;
  /** Citations per 1000 words */
  citationDensity: number;
  /** Whether the References section exists */
  hasReferencesSection: boolean;
  /** Number of references in the References section */
  referencesCount: number;
  /** Citations with URLs not found in source data */
  orphanCitations: Citation[];
  /** Citation numbers in article that don't appear in References */
  unmatchedCitations: number[];
  /** Reference numbers that aren't used in the article body */
  unusedReferences: number[];
  /** Approximate count of uncited quantitative claims */
  uncitedClaimsCount: number;
  /** All extracted citations */
  citations: Citation[];
  /** Overall pass/fail */
  passed: boolean;
  /** Issues found */
  issues: string[];
}

/** Extract all inline citations from HTML content. */
function extractInlineCitations(html: string): Citation[] {
  const citations: Citation[] = [];
  // Match <sup><a href="URL"...>[N]</a></sup> pattern
  const citationRegex = /<sup>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>\s*\[(\d+)\]\s*<\/a>\s*<\/sup>/gi;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(html)) !== null) {
    const fullMatchStart = Math.max(0, match.index - 100);
    const fullMatchEnd = Math.min(html.length, match.index + match[0].length + 50);
    const context = html.slice(fullMatchStart, fullMatchEnd).replace(/<[^>]+>/g, "").trim();

    citations.push({
      number: parseInt(match[2], 10),
      url: match[1],
      context,
    });
  }

  return citations;
}

/** Extract reference list items from the References section. */
function extractReferences(html: string): { number: number; url: string; text: string }[] {
  const refs: { number: number; url: string; text: string }[] = [];

  // Find References section
  const refSectionMatch = html.match(/<h2[^>]*>\s*References?\s*<\/h2>([\s\S]*?)(?=<h2|$)/i);
  if (!refSectionMatch) return refs;

  const refSection = refSectionMatch[1];
  // Extract <li> items with <a> tags
  const liRegex = /<li[^>]*>\s*<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  let match: RegExpExecArray | null;
  let index = 1;

  while ((match = liRegex.exec(refSection)) !== null) {
    refs.push({
      number: index++,
      url: match[1],
      text: match[2].trim(),
    });
  }

  return refs;
}

/** Count approximate quantitative claims that lack citations. */
function countUncitedClaims(html: string): number {
  // Strip references section first
  const bodyHtml = html.replace(/<h2[^>]*>\s*References?\s*<\/h2>[\s\S]*$/i, "");
  // Strip all HTML tags
  const text = bodyHtml.replace(/<[^>]+>/g, " ");

  // Match patterns that look like quantitative claims
  const quantPatterns = [
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*%/g,              // percentages: 40%, 3.5%
    /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:million|billion|trillion))?/gi, // dollar amounts
    /\b\d+(?:\.\d+)?x\b/g,                                // multipliers: 4.1x
    /\b(?:increased|decreased|grew|declined|improved|reduced)\s+by\s+\d/gi, // change claims
  ];

  let totalClaims = 0;
  for (const pattern of quantPatterns) {
    const matches = text.match(pattern);
    if (matches) totalClaims += matches.length;
  }

  // Count cited claims (those near a citation marker)
  const citedPattern = /\[\d+\]/g;
  const citedMatches = text.match(citedPattern);
  const citedCount = citedMatches?.length ?? 0;

  // Uncited = total claims minus cited (rough approximation)
  return Math.max(0, totalClaims - citedCount);
}

/** Count words in HTML content (strips tags). */
function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Validate citations in a generated article.
 *
 * @param html - The generated article HTML
 * @param sourceUrls - Known valid source URLs from research/currentData
 */
export function validateCitations(
  html: string,
  sourceUrls: string[] = []
): CitationValidationResult {
  const citations = extractInlineCitations(html);
  const references = extractReferences(html);
  const wordCount = countWords(html);
  const issues: string[] = [];

  // Citation density
  const citationDensity = wordCount > 0 ? (citations.length / wordCount) * 1000 : 0;

  // Check for References section
  const hasReferencesSection = references.length > 0;
  if (!hasReferencesSection && citations.length > 0) {
    issues.push("Article has inline citations but no References section at the end");
  }

  // Check citation-reference matching
  const citationNumbers = new Set(citations.map((c) => c.number));
  const referenceNumbers = new Set(references.map((r) => r.number));

  const unmatchedCitations = [...citationNumbers].filter((n) => !referenceNumbers.has(n));
  if (unmatchedCitations.length > 0) {
    issues.push(`Citation(s) [${unmatchedCitations.join(", ")}] not found in References section`);
  }

  const unusedReferences = [...referenceNumbers].filter((n) => !citationNumbers.has(n));
  if (unusedReferences.length > 0) {
    issues.push(`Reference(s) [${unusedReferences.join(", ")}] not cited in article body`);
  }

  // Check for hallucinated URLs (URLs not in source data)
  const normalizedSourceUrls = new Set(
    sourceUrls.map((u) => {
      try {
        const parsed = new URL(u);
        return parsed.hostname + parsed.pathname.replace(/\/$/, "");
      } catch {
        return u.toLowerCase();
      }
    })
  );

  const orphanCitations: Citation[] = [];
  if (sourceUrls.length > 0) {
    for (const citation of citations) {
      try {
        const parsed = new URL(citation.url);
        const normalized = parsed.hostname + parsed.pathname.replace(/\/$/, "");
        if (!normalizedSourceUrls.has(normalized)) {
          // Check if hostname at least matches any source
          const hostnameMatch = sourceUrls.some((u) => {
            try {
              return new URL(u).hostname === parsed.hostname;
            } catch {
              return false;
            }
          });
          if (!hostnameMatch) {
            orphanCitations.push(citation);
          }
        }
      } catch {
        orphanCitations.push(citation);
      }
    }
  }

  if (orphanCitations.length > 0) {
    issues.push(`${orphanCitations.length} citation(s) have URLs not found in source data`);
  }

  // Check density
  const targetMinCitations = Math.max(4, Math.round((wordCount / 2000) * 8));
  const targetMaxCitations = Math.round((wordCount / 2000) * 18);

  if (citations.length < targetMinCitations) {
    issues.push(`Only ${citations.length} citations found; target at least ${targetMinCitations} for ${wordCount} words`);
  }

  // Uncited quantitative claims
  const uncitedClaimsCount = countUncitedClaims(html);
  if (uncitedClaimsCount > 3) {
    issues.push(`Approximately ${uncitedClaimsCount} quantitative claims lack inline citations`);
  }

  // Sequential numbering check
  const sortedNumbers = [...citationNumbers].sort((a, b) => a - b);
  for (let i = 0; i < sortedNumbers.length; i++) {
    if (sortedNumbers[i] !== i + 1) {
      issues.push(`Citation numbering is not sequential (expected [${i + 1}], found [${sortedNumbers[i]}])`);
      break;
    }
  }

  const passed = issues.length === 0 || (issues.length <= 2 && orphanCitations.length === 0);

  return {
    citationCount: citations.length,
    citationDensity: Math.round(citationDensity * 10) / 10,
    hasReferencesSection,
    referencesCount: references.length,
    orphanCitations,
    unmatchedCitations,
    unusedReferences,
    uncitedClaimsCount,
    citations,
    passed,
    issues,
  };
}
