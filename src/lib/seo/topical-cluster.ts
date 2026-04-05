/**
 * Topical Cluster Engine (P5)
 *
 * Manages topical authority building through pillar/spoke relationships:
 * 1. Maps existing blog content into a topical cluster structure
 * 2. Generates internal link suggestions based on cluster relationships
 * 3. Identifies cluster gaps (missing spoke topics)
 * 4. Detects cannibalization within clusters
 * 5. Recommends cluster position for new articles
 *
 * Integrates with the research brief to provide cluster-aware internal linking.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClusterPosition = "pillar" | "spoke" | "standalone";

export type ClusterPage = {
  url: string;
  title: string;
  /** Primary keyword/topic of this page. */
  keyword: string;
  /** Position in the cluster. */
  position: ClusterPosition;
  /** Parent pillar URL (for spoke pages). */
  pillarUrl?: string;
  /** Word count (if known). */
  wordCount?: number;
};

export type TopicalCluster = {
  /** Cluster topic (broad theme). */
  topic: string;
  /** Pillar page URL. */
  pillarUrl: string;
  /** Pillar page title. */
  pillarTitle: string;
  /** Spoke pages in this cluster. */
  spokes: ClusterPage[];
  /** Total pages in cluster (pillar + spokes). */
  totalPages: number;
  /** Coverage score 0-100 (how well the cluster covers its topic). */
  coverageScore: number;
  /** Missing subtopics that need spoke articles. */
  gaps: string[];
};

export type ClusterLinkSuggestion = {
  /** Source page (the article being written). */
  sourceSection: string;
  /** Target page URL to link to. */
  targetUrl: string;
  /** Target page title. */
  targetTitle: string;
  /** Suggested anchor text. */
  anchorText: string;
  /** Link type: pillar-to-spoke, spoke-to-pillar, spoke-to-spoke. */
  linkType: "pillar-to-spoke" | "spoke-to-pillar" | "spoke-to-spoke" | "standalone";
  /** Relevance score 0-1. */
  relevance: number;
};

export type ClusterAnalysisResult = {
  /** Recommended cluster position for the new article. */
  recommendedPosition: ClusterPosition;
  /** Reason for the recommendation. */
  positionReason: string;
  /** Identified cluster this article belongs to (if any). */
  cluster?: TopicalCluster;
  /** Internal link suggestions based on cluster relationships. */
  linkSuggestions: ClusterLinkSuggestion[];
  /** Cannibalization warnings. */
  cannibalizationWarnings: { url: string; title: string; overlap: number }[];
  /** Suggested cluster topic (for new clusters). */
  suggestedClusterTopic?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "was", "are", "be",
  "has", "had", "have", "this", "that", "these", "those", "will", "would",
  "can", "could", "should", "may", "might", "do", "does", "did", "not",
  "how", "what", "when", "where", "who", "which", "why", "your", "you",
  "best", "top", "guide", "complete", "ultimate",
]);

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let overlap = 0;
  for (const token of a) if (b.has(token)) overlap++;
  const union = new Set([...a, ...b]);
  return union.size > 0 ? overlap / union.size : 0;
}

function slugToTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  } catch {
    return url;
  }
}

function extractKeywordFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^\d+\s+(?:best|top|ways|tips)\s+/i, "")
    .replace(/\b(?:guide|review|comparison|tutorial|tips|how to|what is|complete)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Cluster building
// ---------------------------------------------------------------------------

/**
 * Build topical clusters from existing blog pages.
 * Groups pages by topic similarity and identifies pillar/spoke relationships.
 */
export function buildClusters(
  existingPages: { url: string; title?: string; wordCount?: number }[],
): TopicalCluster[] {
  if (existingPages.length === 0) return [];

  // Convert to cluster pages with extracted keywords
  const pages: ClusterPage[] = existingPages.map((p) => ({
    url: p.url,
    title: p.title ?? slugToTitle(p.url),
    keyword: extractKeywordFromTitle(p.title ?? slugToTitle(p.url)),
    position: "standalone" as ClusterPosition,
    wordCount: p.wordCount,
  }));

  // Build similarity matrix
  const tokenSets = pages.map((p) => tokenize(p.title + " " + p.keyword));
  const groups: number[][] = [];
  const assigned = new Set<number>();

  // Group pages by topic similarity (threshold 0.25)
  for (let i = 0; i < pages.length; i++) {
    if (assigned.has(i)) continue;
    const group = [i];
    assigned.add(i);

    for (let j = i + 1; j < pages.length; j++) {
      if (assigned.has(j)) continue;
      const similarity = jaccardSimilarity(tokenSets[i], tokenSets[j]);
      if (similarity >= 0.25) {
        group.push(j);
        assigned.add(j);
      }
    }

    if (group.length >= 2) {
      groups.push(group);
    }
  }

  // Convert groups to clusters
  const clusters: TopicalCluster[] = groups.map((group) => {
    const groupPages = group.map((i) => pages[i]);

    // Pillar = longest article or broadest keyword
    const pillar = groupPages.reduce((best, page) => {
      const score = (page.wordCount ?? 0) + (page.keyword.split(" ").length <= 2 ? 500 : 0);
      const bestScore = (best.wordCount ?? 0) + (best.keyword.split(" ").length <= 2 ? 500 : 0);
      return score > bestScore ? page : best;
    });

    pillar.position = "pillar";
    const spokes = groupPages
      .filter((p) => p.url !== pillar.url)
      .map((p) => ({ ...p, position: "spoke" as ClusterPosition, pillarUrl: pillar.url }));

    // Extract common topic from all page keywords
    const allTokens = groupPages.flatMap((p) => [...tokenize(p.keyword)]);
    const tokenCounts = new Map<string, number>();
    for (const t of allTokens) tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
    const commonTokens = [...tokenCounts.entries()]
      .filter(([, c]) => c >= groupPages.length * 0.5)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
    const topic = commonTokens.slice(0, 3).join(" ") || pillar.keyword;

    return {
      topic,
      pillarUrl: pillar.url,
      pillarTitle: pillar.title,
      spokes,
      totalPages: groupPages.length,
      coverageScore: Math.min(100, Math.round((groupPages.length / 8) * 100)), // 8 pages = full coverage
      gaps: [], // Would need topic extraction to identify gaps
    };
  });

  return clusters.sort((a, b) => b.totalPages - a.totalPages);
}

// ---------------------------------------------------------------------------
// Cluster-aware analysis for new articles
// ---------------------------------------------------------------------------

/**
 * Analyze where a new article fits in the existing cluster structure.
 * Provides cluster position recommendation and internal link suggestions.
 */
export function analyzeClusterFit(
  primaryKeyword: string,
  secondaryKeywords: string[],
  existingPages: { url: string; title?: string; wordCount?: number }[],
  outlineSections?: string[],
  declaredPosition?: ClusterPosition,
): ClusterAnalysisResult {
  if (existingPages.length === 0) {
    return {
      recommendedPosition: declaredPosition ?? "standalone",
      positionReason: "No existing pages to form clusters",
      linkSuggestions: [],
      cannibalizationWarnings: [],
    };
  }

  const clusters = buildClusters(existingPages);
  const keywordTokens = tokenize(primaryKeyword + " " + secondaryKeywords.join(" "));

  // Find best-matching cluster
  let bestCluster: TopicalCluster | undefined;
  let bestClusterSimilarity = 0;

  for (const cluster of clusters) {
    const clusterTokens = tokenize(cluster.topic + " " + cluster.pillarTitle);
    const similarity = jaccardSimilarity(keywordTokens, clusterTokens);
    if (similarity > bestClusterSimilarity) {
      bestClusterSimilarity = similarity;
      bestCluster = cluster;
    }
  }

  // Recommend position
  let recommendedPosition: ClusterPosition = declaredPosition ?? "standalone";
  let positionReason = "";

  if (bestCluster && bestClusterSimilarity >= 0.2) {
    // Article fits an existing cluster
    const isVeryBroad = primaryKeyword.split(/\s+/).length <= 2;
    const existingPillarIsSimilar = jaccardSimilarity(
      keywordTokens,
      tokenize(bestCluster.pillarTitle),
    ) >= 0.4;

    if (existingPillarIsSimilar && isVeryBroad) {
      recommendedPosition = declaredPosition ?? "pillar";
      positionReason = `This keyword closely matches the existing pillar "${bestCluster.pillarTitle}". Consider updating that pillar instead or make this the new pillar.`;
    } else {
      recommendedPosition = declaredPosition ?? "spoke";
      positionReason = `Fits as a spoke in the "${bestCluster.topic}" cluster (pillar: "${bestCluster.pillarTitle}"). Link to/from the pillar for topical authority.`;
    }
  } else if (primaryKeyword.split(/\s+/).length <= 2) {
    recommendedPosition = declaredPosition ?? "pillar";
    positionReason = "Broad keyword with no existing cluster — ideal as a new pillar page.";
  } else {
    recommendedPosition = declaredPosition ?? "standalone";
    positionReason = "No matching cluster found. Consider creating related spoke articles later.";
  }

  // Generate internal link suggestions
  const linkSuggestions = generateClusterLinks(
    primaryKeyword,
    outlineSections ?? [],
    existingPages,
    bestCluster,
    recommendedPosition,
  );

  // Check cannibalization
  const cannibalizationWarnings: { url: string; title: string; overlap: number }[] = [];
  for (const page of existingPages) {
    const pageTitle = page.title ?? slugToTitle(page.url);
    const pageTokens = tokenize(pageTitle);
    const similarity = jaccardSimilarity(keywordTokens, pageTokens);
    if (similarity >= 0.4) {
      cannibalizationWarnings.push({
        url: page.url,
        title: pageTitle,
        overlap: Math.round(similarity * 100),
      });
    }
  }

  return {
    recommendedPosition,
    positionReason,
    cluster: bestCluster,
    linkSuggestions,
    cannibalizationWarnings,
    suggestedClusterTopic: bestCluster ? undefined : primaryKeyword,
  };
}

// ---------------------------------------------------------------------------
// Cluster-aware internal link generation
// ---------------------------------------------------------------------------

function generateClusterLinks(
  primaryKeyword: string,
  outlineSections: string[],
  existingPages: { url: string; title?: string }[],
  cluster: TopicalCluster | undefined,
  position: ClusterPosition,
): ClusterLinkSuggestion[] {
  const suggestions: ClusterLinkSuggestion[] = [];
  const usedUrls = new Set<string>();

  // If part of a cluster, prioritize cluster links
  if (cluster) {
    // Link to pillar (for spoke articles)
    if (position === "spoke") {
      const section = outlineSections[0] ?? "Introduction";
      suggestions.push({
        sourceSection: section,
        targetUrl: cluster.pillarUrl,
        targetTitle: cluster.pillarTitle,
        anchorText: extractKeywordFromTitle(cluster.pillarTitle) || cluster.topic,
        linkType: "spoke-to-pillar",
        relevance: 1.0,
      });
      usedUrls.add(cluster.pillarUrl);
    }

    // Link to related spokes
    for (const spoke of cluster.spokes) {
      if (usedUrls.has(spoke.url)) continue;

      // Find best-matching section for this spoke
      const spokeTokens = tokenize(spoke.title);
      let bestSection = outlineSections[0] ?? "Body";
      let bestScore = 0;

      for (const section of outlineSections) {
        const sectionTokens = tokenize(section);
        const score = jaccardSimilarity(spokeTokens, sectionTokens);
        if (score > bestScore) {
          bestScore = score;
          bestSection = section;
        }
      }

      if (bestScore >= 0.15 || suggestions.length < 3) {
        suggestions.push({
          sourceSection: bestSection,
          targetUrl: spoke.url,
          targetTitle: spoke.title,
          anchorText: extractKeywordFromTitle(spoke.title) || spoke.keyword,
          linkType: position === "pillar" ? "pillar-to-spoke" : "spoke-to-spoke",
          relevance: Math.round(Math.max(bestScore, 0.3) * 100) / 100,
        });
        usedUrls.add(spoke.url);
      }
    }
  }

  // Fill remaining slots with general relevance matching
  const keywordTokens = tokenize(primaryKeyword);
  for (const page of existingPages) {
    if (usedUrls.has(page.url)) continue;
    if (suggestions.length >= 8) break;

    const pageTitle = page.title ?? slugToTitle(page.url);
    const pageTokens = tokenize(pageTitle);
    const relevance = jaccardSimilarity(keywordTokens, pageTokens);

    if (relevance >= 0.2) {
      // Find best section match
      let bestSection = outlineSections[Math.floor(outlineSections.length / 2)] ?? "Body";
      let bestScore = 0;
      for (const section of outlineSections) {
        const score = jaccardSimilarity(pageTokens, tokenize(section));
        if (score > bestScore) { bestScore = score; bestSection = section; }
      }

      suggestions.push({
        sourceSection: bestSection,
        targetUrl: page.url,
        targetTitle: pageTitle,
        anchorText: extractKeywordFromTitle(pageTitle),
        linkType: "standalone",
        relevance: Math.round(relevance * 100) / 100,
      });
      usedUrls.add(page.url);
    }
  }

  // Sort by relevance
  suggestions.sort((a, b) => b.relevance - a.relevance);

  return suggestions;
}

/**
 * Convert cluster link suggestions to the brief's internalLinkSuggestions format.
 */
export function toBriefLinkSuggestions(
  links: ClusterLinkSuggestion[],
): { url: string; anchorText: string; targetSection: string }[] {
  return links.map((link) => ({
    url: link.targetUrl,
    anchorText: link.anchorText,
    targetSection: link.sourceSection,
  }));
}
