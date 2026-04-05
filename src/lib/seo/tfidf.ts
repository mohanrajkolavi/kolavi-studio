/**
 * TF-IDF Term Extraction Engine (P7A)
 *
 * Extracts important terms from competitor articles using TF-IDF weighting.
 * Identifies which terms top-ranking competitors use and how frequently,
 * providing term targets for our content to match or exceed.
 *
 * No external dependencies — pure TypeScript implementation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TermWeight = {
  /** The term (1-3 words). */
  term: string;
  /** TF-IDF score (higher = more important across corpus). */
  tfidf: number;
  /** How many competitor docs contain this term. */
  docFrequency: number;
  /** Average usage count across docs that contain it. */
  avgCount: number;
  /** Recommended usage count for our article (based on competitor avg + target word count). */
  recommendedCount: number;
  /** Whether this term appeared in competitor headings. */
  inHeadings: boolean;
};

export type TfidfResult = {
  /** Top terms ranked by TF-IDF score. */
  terms: TermWeight[];
  /** Total unique terms analyzed. */
  totalTermsAnalyzed: number;
  /** Number of competitor documents used. */
  documentsAnalyzed: number;
  /** Primary keyword and its competitor usage stats. */
  primaryKeywordStats?: { avgCount: number; avgDensity: number };
};

export type TfidfInput = {
  /** Competitor article content (plain text or HTML). */
  competitorTexts: { content: string; wordCount: number; headings?: string[] }[];
  /** Primary keyword to prioritize. */
  primaryKeyword: string;
  /** Secondary keywords to boost. */
  secondaryKeywords?: string[];
  /** Target word count for our article (scales recommended counts). */
  targetWordCount: number;
  /** Max terms to return. Default 80. */
  maxTerms?: number;
};

// ---------------------------------------------------------------------------
// Stop words (extended for SEO context)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "its", "as", "was", "are",
  "be", "been", "being", "has", "had", "have", "having", "this", "that",
  "these", "those", "will", "would", "can", "could", "should", "may",
  "might", "do", "does", "did", "not", "no", "nor", "so", "if", "then",
  "than", "too", "very", "just", "about", "also", "more", "most", "some",
  "any", "each", "every", "all", "both", "few", "many", "much", "own",
  "other", "such", "only", "same", "into", "over", "after", "before",
  "between", "under", "above", "out", "up", "down", "off", "through",
  "during", "while", "because", "until", "against", "here", "there",
  "when", "where", "how", "what", "which", "who", "whom", "why",
  "your", "you", "we", "they", "he", "she", "me", "him", "her", "us",
  "them", "my", "our", "their", "his", "i", "am", "were", "get", "got",
  "make", "made", "like", "even", "still", "well", "back", "way", "use",
  "used", "using", "one", "two", "new", "first", "last", "long", "great",
  "little", "right", "good", "big", "high", "different", "small", "large",
  "next", "early", "young", "important", "need", "help", "keep", "want",
  "able", "say", "said", "know", "take", "come", "think", "look", "see",
  "find", "give", "tell", "work", "call", "try", "put", "let", "set",
  "going", "really", "actually", "however", "although", "since", "now",
]);

// ---------------------------------------------------------------------------
// Text processing
// ---------------------------------------------------------------------------

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract headings from HTML. */
function extractHeadingsFromHtml(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    headings.push(stripHtml(m[1]).toLowerCase().trim());
  }
  return headings;
}

/** Tokenize text into lowercased words, filtering stop words. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));
}

/** Generate n-grams (1, 2, 3) from token array. */
function ngrams(tokens: string[], maxN: number = 3): string[] {
  const result: string[] = [];
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(" ");
      // Skip n-grams that start or end with a stop word (for n>1)
      if (n > 1) {
        const first = tokens[i];
        const last = tokens[i + n - 1];
        if (STOP_WORDS.has(first) || STOP_WORDS.has(last)) continue;
      }
      result.push(gram);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// TF-IDF computation
// ---------------------------------------------------------------------------

type DocTermFreq = Map<string, number>;

/** Count term frequencies in a single document. */
function termFrequency(text: string): { tf: DocTermFreq; totalTokens: number } {
  const tokens = tokenize(text);
  const grams = ngrams(tokens, 3);
  const tf: DocTermFreq = new Map();
  for (const gram of grams) {
    tf.set(gram, (tf.get(gram) ?? 0) + 1);
  }
  return { tf, totalTokens: tokens.length };
}

/** Compute inverse document frequency. */
function inverseDocFrequency(docCount: number, termDocCount: number): number {
  if (termDocCount === 0) return 0;
  return Math.log(1 + docCount / termDocCount);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Extract TF-IDF weighted terms from competitor articles.
 * Returns terms ranked by importance with recommended usage counts.
 */
export function extractTfidfTerms(input: TfidfInput): TfidfResult {
  const {
    competitorTexts,
    primaryKeyword,
    secondaryKeywords = [],
    targetWordCount,
    maxTerms = 80,
  } = input;

  if (competitorTexts.length === 0) {
    return { terms: [], totalTermsAnalyzed: 0, documentsAnalyzed: 0 };
  }

  const docs = competitorTexts.map((c) => {
    const plainText = stripHtml(c.content);
    const headings = c.headings ?? extractHeadingsFromHtml(c.content);
    const { tf, totalTokens } = termFrequency(plainText);
    return { tf, totalTokens, wordCount: c.wordCount || totalTokens, headings };
  });

  const docCount = docs.length;

  // Build document frequency map
  const dfMap = new Map<string, number>();
  const allTerms = new Set<string>();

  for (const doc of docs) {
    for (const term of doc.tf.keys()) {
      allTerms.add(term);
      dfMap.set(term, (dfMap.get(term) ?? 0) + 1);
    }
  }

  // Build heading terms set
  const headingTerms = new Set<string>();
  for (const doc of docs) {
    for (const h of doc.headings) {
      const tokens = tokenize(h);
      for (const t of tokens) headingTerms.add(t);
      for (const ng of ngrams(tokens, 3)) headingTerms.add(ng);
    }
  }

  // Compute TF-IDF for each term
  const termScores: TermWeight[] = [];
  const primaryTokens = new Set(tokenize(primaryKeyword.toLowerCase()));
  const secondaryTokens = new Set(
    secondaryKeywords.flatMap((k) => tokenize(k.toLowerCase()))
  );
  const keywordPhrases = new Set([
    primaryKeyword.toLowerCase(),
    ...secondaryKeywords.map((k) => k.toLowerCase()),
  ]);

  for (const term of allTerms) {
    const df = dfMap.get(term) ?? 0;
    const idf = inverseDocFrequency(docCount, df);

    // Average TF-IDF across documents
    let totalTfidf = 0;
    let totalCount = 0;
    let docsWithTerm = 0;

    for (const doc of docs) {
      const count = doc.tf.get(term) ?? 0;
      if (count > 0) {
        const tf = count / doc.totalTokens;
        totalTfidf += tf * idf;
        totalCount += count;
        docsWithTerm++;
      }
    }

    if (docsWithTerm === 0) continue;

    let avgTfidf = totalTfidf / docCount;
    const avgCount = totalCount / docsWithTerm;

    // Boost terms that match primary/secondary keywords
    const termTokens = term.split(" ");
    const matchesPrimary = termTokens.some((t) => primaryTokens.has(t));
    const matchesSecondary = termTokens.some((t) => secondaryTokens.has(t));
    const isExactKeyword = keywordPhrases.has(term);
    const inHeadings = headingTerms.has(term);

    if (isExactKeyword) avgTfidf *= 3.0;
    else if (matchesPrimary) avgTfidf *= 2.0;
    else if (matchesSecondary) avgTfidf *= 1.5;
    if (inHeadings) avgTfidf *= 1.3;

    // Filter low-value terms: must appear in at least 2 docs (or be a keyword match)
    if (df < 2 && !matchesPrimary && !matchesSecondary) continue;

    // Scale recommended count to our target word count
    const avgDocWords = docs.reduce((s, d) => s + d.wordCount, 0) / docCount;
    const scaleFactor = targetWordCount / (avgDocWords || 1);
    const recommendedCount = Math.max(1, Math.round(avgCount * scaleFactor));

    termScores.push({
      term,
      tfidf: Math.round(avgTfidf * 10000) / 10000,
      docFrequency: df,
      avgCount: Math.round(avgCount * 10) / 10,
      recommendedCount,
      inHeadings,
    });
  }

  // Sort by TF-IDF score, take top N
  termScores.sort((a, b) => b.tfidf - a.tfidf);

  // Deduplicate: if a bigram/trigram subsumes a unigram, keep the longer one
  const deduped = deduplicateTerms(termScores);
  const topTerms = deduped.slice(0, maxTerms);

  // Primary keyword stats
  const pkLower = primaryKeyword.toLowerCase();
  const pkStats = computeKeywordStats(docs, pkLower);

  return {
    terms: topTerms,
    totalTermsAnalyzed: allTerms.size,
    documentsAnalyzed: docCount,
    primaryKeywordStats: pkStats,
  };
}

/** Remove shorter terms that are fully contained in higher-scoring longer terms. */
function deduplicateTerms(terms: TermWeight[]): TermWeight[] {
  const result: TermWeight[] = [];
  const addedTerms: string[] = [];

  for (const tw of terms) {
    // Check if this term is a substring of an already-added higher-scoring term
    const isSubsumed = addedTerms.some(
      (added) =>
        added !== tw.term &&
        added.includes(tw.term) &&
        added.split(" ").length > tw.term.split(" ").length
    );
    if (!isSubsumed) {
      result.push(tw);
      addedTerms.push(tw.term);
    }
  }

  return result;
}

/** Compute avg count and density of a specific keyword across docs. */
function computeKeywordStats(
  docs: { tf: DocTermFreq; totalTokens: number; wordCount: number }[],
  keyword: string,
): { avgCount: number; avgDensity: number } | undefined {
  let totalCount = 0;
  let totalDensity = 0;
  let found = 0;

  for (const doc of docs) {
    const count = doc.tf.get(keyword) ?? 0;
    if (count > 0) {
      totalCount += count;
      totalDensity += (count / doc.totalTokens) * 100;
      found++;
    }
  }

  if (found === 0) return undefined;

  return {
    avgCount: Math.round((totalCount / found) * 10) / 10,
    avgDensity: Math.round((totalDensity / found) * 100) / 100,
  };
}

// ---------------------------------------------------------------------------
// Content Score (term coverage)
// ---------------------------------------------------------------------------

export type TermCoverage = {
  /** The term. */
  term: string;
  /** How many times it appears in our content. */
  count: number;
  /** Recommended count from competitors. */
  recommended: number;
  /** Coverage ratio (count / recommended). 1.0 = perfect, <1 = underused, >1.5 = overused. */
  ratio: number;
  /** Status: "missing" | "underused" | "optimal" | "overused". */
  status: "missing" | "underused" | "optimal" | "overused";
};

export type TermCoverageResult = {
  /** Per-term coverage analysis. */
  coverage: TermCoverage[];
  /** Overall content score 0-100. */
  score: number;
  /** Count of terms in each status. */
  summary: { missing: number; underused: number; optimal: number; overused: number };
};

/**
 * Score content against TF-IDF term targets.
 * Returns a 0-100 score based on how well the content covers recommended terms.
 */
export function scoreTermCoverage(
  contentHtml: string,
  tfidfTerms: TermWeight[],
): TermCoverageResult {
  const plainText = stripHtml(contentHtml).toLowerCase();
  const coverage: TermCoverage[] = [];
  let totalScore = 0;

  for (const tw of tfidfTerms) {
    const escaped = tw.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = plainText.match(regex);
    const count = matches?.length ?? 0;
    const ratio = tw.recommendedCount > 0 ? count / tw.recommendedCount : count > 0 ? 1.5 : 0;

    let status: TermCoverage["status"];
    let termScore: number;

    if (count === 0) {
      status = "missing";
      termScore = 0;
    } else if (ratio < 0.5) {
      status = "underused";
      termScore = ratio * 60; // 0-30 points
    } else if (ratio <= 1.5) {
      status = "optimal";
      termScore = 100 - Math.abs(1 - ratio) * 40; // 80-100 points
    } else {
      status = "overused";
      termScore = Math.max(40, 100 - (ratio - 1.5) * 30); // 40-70 points
    }

    totalScore += termScore;
    coverage.push({
      term: tw.term,
      count,
      recommended: tw.recommendedCount,
      ratio: Math.round(ratio * 100) / 100,
      status,
    });
  }

  const maxScore = tfidfTerms.length * 100;
  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const summary = {
    missing: coverage.filter((c) => c.status === "missing").length,
    underused: coverage.filter((c) => c.status === "underused").length,
    optimal: coverage.filter((c) => c.status === "optimal").length,
    overused: coverage.filter((c) => c.status === "overused").length,
  };

  return { coverage, score, summary };
}
