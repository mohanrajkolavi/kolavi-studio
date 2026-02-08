/** Shared types for blog generation (dashboard + provider). */

export type GeneratedContent = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
};

/** Pipeline v3 output (from /api/blog/generate). */
export type PipelineResult = {
  article: {
    content: string;
    outline: string[];
    suggestedSlug: string;
    suggestedCategories: string[];
    suggestedTags: string[];
  };
  titleMetaVariants: Array<{ title: string; metaDescription: string; approach: string }>;
  selectedTitleMeta: { title: string; metaDescription: string; approach: string } | null;
  topicScoreReport?: {
    topicScores: Array<{ topic: string; score: number; status: string; notes: string }>;
    overallScore: number;
    gapTopics: Array<{ topic: string; score: number; recommendedAction: string }>;
    decision: string;
  };
  sourceUrls?: string[];
  auditResult?: { items: unknown[]; score: number; summary: { pass: number; warn: number; fail: number }; publishable: boolean };
  schemaMarkup?: { article: object; faq: object | null; breadcrumb: object | null; faqSchemaNote?: string };
  contentIntegrity?: { passed: boolean; issues: string[]; restorations: string[]; postRestorationIssues: string[] };
  faqEnforcement?: { passed: boolean; violations: { question: string; answer?: string; charCount: number }[] };
  factCheck?: { verified: boolean; hallucinations: string[]; issues: string[]; skippedRhetorical?: string[] };
  publishTracking?: { keyword: string };
};

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ");
}

export function pipelineToGenerated(result: PipelineResult, selectedIndex: number): GeneratedContent {
  const variant = result.titleMetaVariants[selectedIndex] ?? result.titleMetaVariants[0];
  const title =
    variant?.title ??
    result.titleMetaVariants?.[0]?.title ??
    humanizeSlug(result.article.suggestedSlug);
  return {
    title,
    metaDescription: variant?.metaDescription ?? "",
    outline: result.article.outline,
    content: result.article.content,
    suggestedSlug: result.article.suggestedSlug,
    suggestedCategories: result.article.suggestedCategories,
    suggestedTags: result.article.suggestedTags,
  };
}

export function isPipelineResult(r: unknown): r is PipelineResult {
  return (
    r !== null &&
    typeof r === "object" &&
    "article" in r &&
    "titleMetaVariants" in r &&
    Array.isArray((r as PipelineResult).titleMetaVariants)
  );
}

export type GenerationInput = {
  keywords: string[];
  peopleAlsoSearchFor: string[];
  intent: string[];
  competitorUrls: string[];
};
