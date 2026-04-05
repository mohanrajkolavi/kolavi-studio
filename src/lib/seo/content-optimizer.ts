/**
 * Content Optimizer — Post-draft content score 0-100 (P7B)
 *
 * Scores article content against competitor benchmarks across multiple
 * dimensions: TF-IDF term coverage, entity coverage, readability,
 * structure quality, and SEO signals.
 *
 * Inspired by Surfer SEO's content scoring methodology:
 * - Term coverage vs top-ranking competitors
 * - Entity density and coverage
 * - Structural signals (headings, paragraphs, lists)
 * - Readability metrics
 * - Word count alignment
 */

import {
  type TfidfResult,
  type TermCoverageResult,
  scoreTermCoverage,
} from "./tfidf";
import {
  type ExtractedEntity,
  scoreEntityCoverage,
} from "./entity-extraction";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContentDimension = {
  /** Dimension name. */
  name: string;
  /** Score 0-100. */
  score: number;
  /** Weight in overall score (0-1, all weights sum to 1). */
  weight: number;
  /** Weighted contribution to final score. */
  weighted: number;
  /** Human-readable explanation. */
  detail: string;
  /** Actionable suggestions for improvement. */
  suggestions: string[];
};

export type ContentOptimizationResult = {
  /** Overall content score 0-100. */
  score: number;
  /** Letter grade (A+, A, B+, B, C+, C, D, F). */
  grade: string;
  /** Per-dimension breakdown. */
  dimensions: ContentDimension[];
  /** Term coverage details (from TF-IDF). */
  termCoverage?: TermCoverageResult;
  /** Top missing terms to add. */
  missingTerms: string[];
  /** Top overused terms to reduce. */
  overusedTerms: string[];
  /** Entity gaps. */
  entityGaps: string[];
  /** Summary for the UI. */
  summary: string;
};

// ---------------------------------------------------------------------------
// Readability scoring
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

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "")
    .match(/[aeiouy]{1,2}/g)?.length ?? 1;
  return Math.max(1, count);
}

function computeFleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0 || words.length === 0) return 50;

  const totalSyllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  return 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
}

function computeSentenceLengthVariance(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  if (sentences.length < 3) return 0;

  const lengths = sentences.map((s) => s.trim().split(/\s+/).filter(Boolean).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((s, l) => s + (l - mean) ** 2, 0) / lengths.length;
  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Structure analysis
// ---------------------------------------------------------------------------

function analyzeStructure(html: string): {
  h2Count: number;
  h3Count: number;
  listCount: number;
  paragraphCount: number;
  avgParagraphWords: number;
  hasTableOfContents: boolean;
  hasFaq: boolean;
  boldCount: number;
} {
  const h2Count = (html.match(/<h2[^>]*>/gi) ?? []).length;
  const h3Count = (html.match(/<h3[^>]*>/gi) ?? []).length;
  const listCount = (html.match(/<(?:ul|ol)[^>]*>/gi) ?? []).length;
  const boldCount = (html.match(/<(?:strong|b)[^>]*>/gi) ?? []).length;

  const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) ?? [];
  const paragraphCount = paragraphs.length;
  const totalParagraphWords = paragraphs.reduce((s, p) => {
    return s + stripHtml(p).split(/\s+/).filter(Boolean).length;
  }, 0);
  const avgParagraphWords = paragraphCount > 0 ? totalParagraphWords / paragraphCount : 0;

  const lowerHtml = html.toLowerCase();
  const hasTableOfContents = lowerHtml.includes("table of contents") ||
    lowerHtml.includes("in this article") ||
    lowerHtml.includes('id="toc"');
  const hasFaq = /<h2[^>]*>[^<]*(?:faq|frequently asked|common questions)/i.test(html);

  return {
    h2Count,
    h3Count,
    listCount,
    paragraphCount,
    avgParagraphWords,
    hasTableOfContents,
    hasFaq,
    boldCount,
  };
}

// ---------------------------------------------------------------------------
// Word count scoring
// ---------------------------------------------------------------------------

function scoreWordCount(actual: number, target: number): { score: number; detail: string } {
  const ratio = actual / target;
  if (ratio >= 0.95 && ratio <= 1.05) {
    return { score: 100, detail: `Word count ${actual} is within 5% of target ${target}` };
  } else if (ratio >= 0.85 && ratio <= 1.15) {
    return { score: 80, detail: `Word count ${actual} is within 15% of target ${target}` };
  } else if (ratio >= 0.7 && ratio <= 1.3) {
    return { score: 60, detail: `Word count ${actual} deviates from target ${target} by ${Math.round(Math.abs(1 - ratio) * 100)}%` };
  } else {
    return { score: 30, detail: `Word count ${actual} is far from target ${target} (${Math.round(Math.abs(1 - ratio) * 100)}% off)` };
  }
}

// ---------------------------------------------------------------------------
// Grade calculation
// ---------------------------------------------------------------------------

function scoreToGrade(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "C+";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export type ContentOptimizerInput = {
  /** Article HTML content. */
  contentHtml: string;
  /** Target word count. */
  targetWordCount: number;
  /** TF-IDF terms from competitor analysis. */
  tfidfTerms?: TfidfResult;
  /** Entities from competitor analysis. */
  competitorEntities?: ExtractedEntity[];
  /** Number of competitor documents analyzed. */
  competitorDocCount?: number;
  /** Competitor average word count. */
  competitorAvgWordCount?: number;
  /** Whether this is informational content (expects FAQ). */
  isInformational?: boolean;
};

/**
 * Score content quality 0-100 with per-dimension breakdown.
 * Modeled after Surfer SEO's content scoring approach.
 */
export function scoreContent(input: ContentOptimizerInput): ContentOptimizationResult {
  const {
    contentHtml,
    targetWordCount,
    tfidfTerms,
    competitorEntities,
    competitorDocCount = 4,
    isInformational = true,
  } = input;

  const plainText = stripHtml(contentHtml);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const structure = analyzeStructure(contentHtml);
  const dimensions: ContentDimension[] = [];

  // -----------------------------------------------------------------------
  // 1. Term Coverage (30% weight — most important for SEO)
  // -----------------------------------------------------------------------
  let termCoverage: TermCoverageResult | undefined;
  let missingTerms: string[] = [];
  let overusedTerms: string[] = [];

  if (tfidfTerms && tfidfTerms.terms.length > 0) {
    termCoverage = scoreTermCoverage(contentHtml, tfidfTerms.terms);
    missingTerms = termCoverage.coverage
      .filter((c) => c.status === "missing")
      .sort((a, b) => b.recommended - a.recommended)
      .slice(0, 15)
      .map((c) => c.term);
    overusedTerms = termCoverage.coverage
      .filter((c) => c.status === "overused")
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10)
      .map((c) => c.term);

    const suggestions: string[] = [];
    if (missingTerms.length > 0) {
      suggestions.push(`Add missing terms: ${missingTerms.slice(0, 5).join(", ")}`);
    }
    if (overusedTerms.length > 0) {
      suggestions.push(`Reduce overused terms: ${overusedTerms.slice(0, 3).join(", ")}`);
    }
    if (termCoverage.summary.optimal < termCoverage.coverage.length * 0.5) {
      suggestions.push("Less than 50% of important terms are at optimal levels");
    }

    dimensions.push({
      name: "Term Coverage",
      score: termCoverage.score,
      weight: 0.30,
      weighted: termCoverage.score * 0.30,
      detail: `${termCoverage.summary.optimal} optimal, ${termCoverage.summary.missing} missing, ${termCoverage.summary.underused} underused out of ${termCoverage.coverage.length} tracked terms`,
      suggestions,
    });
  } else {
    dimensions.push({
      name: "Term Coverage",
      score: 50,
      weight: 0.30,
      weighted: 15,
      detail: "No TF-IDF data available — competitor analysis required",
      suggestions: ["Run competitor analysis to generate term targets"],
    });
  }

  // -----------------------------------------------------------------------
  // 2. Entity Coverage (15% weight)
  // -----------------------------------------------------------------------
  let entityGaps: string[] = [];

  if (competitorEntities && competitorEntities.length > 0) {
    const entityScore = scoreEntityCoverage(competitorEntities, contentHtml, competitorDocCount);
    const significant = competitorEntities.filter((e) => e.docFrequency >= 2);
    const ourText = plainText.toLowerCase();
    entityGaps = significant
      .filter((e) => {
        const escaped = e.normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return !new RegExp(`\\b${escaped}\\b`, "i").test(ourText);
      })
      .slice(0, 10)
      .map((e) => e.name);

    const suggestions: string[] = [];
    if (entityGaps.length > 0) {
      suggestions.push(`Missing entities: ${entityGaps.slice(0, 5).join(", ")}`);
    }
    if (entityScore < 60) {
      suggestions.push("Entity density is low — mention more specific tools, brands, and metrics by name");
    }

    dimensions.push({
      name: "Entity Coverage",
      score: entityScore,
      weight: 0.15,
      weighted: entityScore * 0.15,
      detail: `${entityScore}% of competitor entities covered. ${entityGaps.length} gaps detected.`,
      suggestions,
    });
  } else {
    dimensions.push({
      name: "Entity Coverage",
      score: 50,
      weight: 0.15,
      weighted: 7.5,
      detail: "No entity data available",
      suggestions: ["Run entity extraction to identify entity targets"],
    });
  }

  // -----------------------------------------------------------------------
  // 3. Readability (15% weight)
  // -----------------------------------------------------------------------
  const fleschScore = computeFleschReadingEase(plainText);
  const sentenceVariance = computeSentenceLengthVariance(plainText);

  // Target: Flesch 50-65, sentence SD >= 4.5
  let readabilityScore = 0;
  const readSuggestions: string[] = [];

  // Flesch component (0-60 points)
  if (fleschScore >= 50 && fleschScore <= 65) {
    readabilityScore += 60;
  } else if (fleschScore >= 40 && fleschScore <= 75) {
    readabilityScore += 45;
  } else if (fleschScore >= 30 && fleschScore <= 85) {
    readabilityScore += 30;
    if (fleschScore < 40) readSuggestions.push("Content is too complex — simplify sentence structure");
    if (fleschScore > 75) readSuggestions.push("Content may be too simple — add technical depth");
  } else {
    readabilityScore += 15;
    readSuggestions.push(`Flesch Reading Ease is ${Math.round(fleschScore)} (target: 50-65)`);
  }

  // Sentence variance component (0-40 points)
  if (sentenceVariance >= 4.5) {
    readabilityScore += 40;
  } else if (sentenceVariance >= 3.5) {
    readabilityScore += 30;
    readSuggestions.push("Sentence length variance is borderline — mix more short/long sentences");
  } else {
    readabilityScore += 15;
    readSuggestions.push(`Sentence length SD is ${sentenceVariance.toFixed(1)} (target: >= 4.5). Mix short and long sentences.`);
  }

  dimensions.push({
    name: "Readability",
    score: readabilityScore,
    weight: 0.15,
    weighted: readabilityScore * 0.15,
    detail: `Flesch: ${Math.round(fleschScore)}, Sentence length SD: ${sentenceVariance.toFixed(1)}`,
    suggestions: readSuggestions,
  });

  // -----------------------------------------------------------------------
  // 4. Structure Quality (15% weight)
  // -----------------------------------------------------------------------
  let structureScore = 0;
  const structSuggestions: string[] = [];

  // H2 count (0-25 points): aim for 4-10 H2s per 2000 words
  const expectedH2 = Math.max(3, Math.round(wordCount / 400));
  if (structure.h2Count >= expectedH2 * 0.7 && structure.h2Count <= expectedH2 * 1.5) {
    structureScore += 25;
  } else if (structure.h2Count >= 2) {
    structureScore += 15;
    structSuggestions.push(`${structure.h2Count} H2s found; competitors average ~${expectedH2}`);
  } else {
    structureScore += 5;
    structSuggestions.push("Too few H2 headings — add more section breaks");
  }

  // Lists (0-20 points): at least 1 per 1000 words
  const expectedLists = Math.max(2, Math.round(wordCount / 800));
  if (structure.listCount >= expectedLists) {
    structureScore += 20;
  } else if (structure.listCount >= 1) {
    structureScore += 12;
    structSuggestions.push(`Only ${structure.listCount} lists — add more bulleted/numbered lists`);
  } else {
    structureScore += 3;
    structSuggestions.push("No lists found — add bulleted data lists for scannability");
  }

  // Paragraph length (0-20 points): avg should be < 120 words
  if (structure.avgParagraphWords <= 100) {
    structureScore += 20;
  } else if (structure.avgParagraphWords <= 120) {
    structureScore += 15;
  } else {
    structureScore += 5;
    structSuggestions.push(`Paragraphs average ${Math.round(structure.avgParagraphWords)} words — break them up (target: < 100)`);
  }

  // Bold usage (0-15 points): 2-4 per H2
  const expectedBold = structure.h2Count * 3;
  if (structure.boldCount >= expectedBold * 0.5) {
    structureScore += 15;
  } else {
    structureScore += 5;
    structSuggestions.push("Add more bold key phrases for scannability (2-4 per section)");
  }

  // FAQ section (0-10 points for informational)
  if (!isInformational || structure.hasFaq) {
    structureScore += 10;
  } else {
    structSuggestions.push("Add an FAQ section for informational content");
  }

  // H3 subheadings (0-10 points)
  if (structure.h3Count >= structure.h2Count * 0.5) {
    structureScore += 10;
  } else if (structure.h3Count >= 1) {
    structureScore += 5;
  } else {
    structSuggestions.push("Add H3 subheadings within H2 sections for depth");
  }

  dimensions.push({
    name: "Structure Quality",
    score: structureScore,
    weight: 0.15,
    weighted: structureScore * 0.15,
    detail: `${structure.h2Count} H2s, ${structure.h3Count} H3s, ${structure.listCount} lists, avg ${Math.round(structure.avgParagraphWords)} words/paragraph`,
    suggestions: structSuggestions,
  });

  // -----------------------------------------------------------------------
  // 5. Word Count Alignment (10% weight)
  // -----------------------------------------------------------------------
  const wcResult = scoreWordCount(wordCount, targetWordCount);

  dimensions.push({
    name: "Word Count",
    score: wcResult.score,
    weight: 0.10,
    weighted: wcResult.score * 0.10,
    detail: wcResult.detail,
    suggestions: wcResult.score < 80
      ? [`Adjust content length to match target of ${targetWordCount} words`]
      : [],
  });

  // -----------------------------------------------------------------------
  // 6. SEO Signals (15% weight)
  // -----------------------------------------------------------------------
  let seoScore = 0;
  const seoSuggestions: string[] = [];

  // Citation count
  const citationCount = (contentHtml.match(/<sup>/gi) ?? []).length;
  const expectedCitations = Math.max(5, Math.round(wordCount / 250));
  if (citationCount >= expectedCitations) {
    seoScore += 30;
  } else if (citationCount >= expectedCitations * 0.5) {
    seoScore += 20;
    seoSuggestions.push(`${citationCount} citations found; target is ${expectedCitations}+`);
  } else {
    seoScore += 5;
    seoSuggestions.push(`Only ${citationCount} inline citations — add more sourced claims`);
  }

  // Internal/external link density
  const linkCount = (contentHtml.match(/<a\s/gi) ?? []).length;
  const expectedLinks = Math.max(5, Math.round(wordCount / 300));
  if (linkCount >= expectedLinks) {
    seoScore += 25;
  } else if (linkCount >= 3) {
    seoScore += 15;
  } else {
    seoScore += 5;
    seoSuggestions.push("Add more internal and external links");
  }

  // References section
  const hasReferences = /references|sources|bibliography/i.test(contentHtml);
  if (hasReferences) {
    seoScore += 20;
  } else {
    seoScore += 5;
    seoSuggestions.push("Add a References section at the end of the article");
  }

  // Schema-friendly structure (heading hierarchy)
  const h1Count = (contentHtml.match(/<h1[^>]*>/gi) ?? []).length;
  if (h1Count <= 1 && structure.h2Count >= 3) {
    seoScore += 25;
  } else if (structure.h2Count >= 2) {
    seoScore += 15;
  } else {
    seoScore += 5;
    seoSuggestions.push("Improve heading hierarchy for structured data eligibility");
  }

  dimensions.push({
    name: "SEO Signals",
    score: seoScore,
    weight: 0.15,
    weighted: seoScore * 0.15,
    detail: `${citationCount} citations, ${linkCount} links, ${hasReferences ? "has" : "no"} references section`,
    suggestions: seoSuggestions,
  });

  // -----------------------------------------------------------------------
  // Final score
  // -----------------------------------------------------------------------
  const totalScore = Math.round(dimensions.reduce((s, d) => s + d.weighted, 0));
  const grade = scoreToGrade(totalScore);

  // Summary
  const weakest = [...dimensions].sort((a, b) => a.score - b.score);
  const summaryParts: string[] = [`Content score: ${totalScore}/100 (${grade})`];
  if (weakest[0].score < 60) {
    summaryParts.push(`Weakest area: ${weakest[0].name} (${weakest[0].score}/100)`);
  }
  if (missingTerms.length > 5) {
    summaryParts.push(`${missingTerms.length} important terms missing`);
  }
  if (entityGaps.length > 3) {
    summaryParts.push(`${entityGaps.length} entity gaps vs competitors`);
  }

  return {
    score: totalScore,
    grade,
    dimensions,
    termCoverage,
    missingTerms,
    overusedTerms,
    entityGaps,
    summary: summaryParts.join(". ") + ".",
  };
}
