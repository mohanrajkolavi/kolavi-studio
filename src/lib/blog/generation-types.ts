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

/** Best-version brief summary (strategy/differentiation). */
export type BriefSummary = {
  similaritySummary?: string;
  extraValueThemes?: string[];
  freshnessNote?: string;
};

/** Outline drift: draft H2s vs brief outline (non-blocking). */
export type OutlineDrift = {
  passed: boolean;
  expected: string[];
  actual: string[];
  missing: string[];
  extra: string[];
};

/**
 * Pipeline v3 output (from /api/blog/generate).
 * Feeds the complete audit system: SEO Audit (auditResult + schema),
 * Quality checks (faqEnforcement, factCheck). E-E-A-T runs separately via content_audit API.
 */
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
  sourceUrls?: string[];
  auditResult?: { items: unknown[]; score: number; summary: { pass: number; warn: number; fail: number }; publishable: boolean };
  schemaMarkup?: { article: object; faq: object | null; breadcrumb: object | null; faqSchemaNote?: string };
  faqEnforcement?: { passed: boolean; violations: { question: string; answer?: string; charCount: number }[] };
  factCheck?: { verified: boolean; hallucinations: string[]; issues: string[]; skippedRhetorical?: string[] };
  publishTracking?: { keyword: string };
  /** Total pipeline execution time in milliseconds. */
  generationTimeMs?: number;
  briefSummary?: BriefSummary;
  outlineDrift?: OutlineDrift;
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
  /** Word count guideline: "auto" | "concise" | "standard" | "in_depth" | "custom". */
  wordCountPreset?: "auto" | "concise" | "standard" | "in_depth" | "custom";
  /** Target words when wordCountPreset is "custom". */
  wordCountCustom?: number;
};
