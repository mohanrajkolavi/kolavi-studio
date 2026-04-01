/** Shared types for blog generation (dashboard + provider). */

export type GeneratedContent = {
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug?: string;
  suggestedCategories?: string[];
  suggestedTags?: string[];
  // --- Pipeline metadata (persisted to DB for analysis & reuse) ---
  schemaMarkup?: PipelineResult["schemaMarkup"];
  auditResult?: PipelineResult["auditResult"];
  eeatFeedback?: Record<string, unknown>;
  factCheck?: PipelineResult["factCheck"];
  sourceUrls?: string[];
  tokenUsage?: Record<string, unknown>[];
  briefSummary?: BriefSummary;
  readabilityScores?: Record<string, unknown>;
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
  /** Single title from OpenAI (no variants). */
  title: string;
  /** Single meta description from OpenAI (no variants). */
  metaDescription: string;
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
  /** Auto-fixes applied for fact-check hallucinations. */
  hallucinationFixes?: Array<{
    originalText: string;
    replacement: string;
    reason: string;
    replacedWithVerifiedFact: boolean;
  }>;
  contentDiff?: import("@/lib/seo/content-diff").ContentDiffResult;
  semanticSimilarity?: { highestSimilarity: number; mostSimilarUrl: string; isTooDerivative: boolean };
  contentDecayRisk?: import("@/lib/seo/content-decay").ContentDecayResult;
};

function humanizeSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .filter(Boolean)
    .join(" ");
}

export function pipelineToGenerated(result: PipelineResult): GeneratedContent {
  const title =
    result.title || humanizeSlug(result.article.suggestedSlug);
  return {
    title,
    metaDescription: result.metaDescription ?? "",
    outline: result.article.outline,
    content: result.article.content,
    suggestedSlug: result.article.suggestedSlug,
    suggestedCategories: result.article.suggestedCategories,
    suggestedTags: result.article.suggestedTags,
    // Pipeline metadata — persisted to DB for analysis & reuse
    schemaMarkup: result.schemaMarkup,
    auditResult: result.auditResult,
    factCheck: result.factCheck,
    sourceUrls: result.sourceUrls,
    briefSummary: result.briefSummary,
  };
}

export function isPipelineResult(r: unknown): r is PipelineResult {
  return (
    r !== null &&
    typeof r === "object" &&
    "article" in r &&
    "title" in r &&
    typeof (r as PipelineResult).title === "string"
  );
}

export type GenerationInput = {
  /** First = primary keyword, rest = secondary (max 2). */
  keywords: string[];
  /** Not surfaced in UI; PAA from Serper feeds gap analysis in pipeline. Optional for backward compat. */
  peopleAlsoSearchFor?: string[];
  intent: string[];
  competitorUrls: string[];
  /** Draft model: Opus 4.6 or Sonnet 4.6. */
  draftModel?: "opus-4.6" | "sonnet-4.6";
  /** Cluster position for topical authority. */
  clusterPosition?: "pillar" | "spoke" | "standalone";
  /** Broader topic when spoke position. */
  clusterTopic?: string;
};

// -----------------------------------------------------------------------------
// Chunked pipeline (step-by-step mode)
// -----------------------------------------------------------------------------

export type GenerationMode = "auto" | "step";

export type Phase =
  | "idle"
  | "researching"
  | "analyzing"
  | "reviewing"
  | "drafting"
  | "validating"
  | "completed"
  | "error";

export type ChunkName = "research" | "brief" | "draft" | "validate";

/** SERP features (from Step 1) for UI. */
export type SerpFeaturesForUI = {
  hasKnowledgeGraph: boolean;
  hasAnswerBox: boolean;
  hasFeaturedSnippet: boolean;
  hasVideoCarousel: boolean;
  hasTopStories: boolean;
  relatedSearches: string[];
};

/** Intent validation (from Step 1) for UI. */
export type IntentValidationForUI = {
  declaredIntent: string;
  detectedIntent: string;
  confidence: number;
  warning?: string;
};

/** Reddit thread for UI (from Step 1 or research chunk). */
export type RedditThreadForUI = {
  url: string;
  title: string;
  snippet?: string;
};

/** One People Also Ask item for UI (question + optional snippet/title/link). */
export type PaaItemForUI = {
  question: string;
  snippet?: string;
  title?: string;
  link?: string;
};

/** Research chunk result for UI (summary card). */
export type ResearchChunkResult = {
  urlCount: number;
  articleCount: number;
  currentDataFacts: number;
  competitorUrls: string[];
  /** Titles for each competitor (same order as competitorUrls), when available. */
  competitorTitles?: string[];
  /** People Also Ask questions (from Step 1, passed through research chunk). */
  paaQuestions?: string[];
  /** Full PAA items (question + snippet/title/link) for UI. */
  paaItems?: PaaItemForUI[];
  /** SERP features from Step 1. */
  serpFeatures?: SerpFeaturesForUI;
  /** Reddit quotes extracted in Step 2. */
  redditQuotes?: string[];
  /** Reddit thread URLs/titles from Step 1. */
  redditThreads?: RedditThreadForUI[];
};

/** One SERP result for competitor selection (position, title, URL — no snippet). */
export type ResearchSerpItem = {
  position: number;
  title: string;
  url: string;
};

/** Research SERP-only result (top 10 for user to select up to 3). */
export type ResearchSerpResult = {
  results: ResearchSerpItem[];
  /** People Also Ask questions from Serper. */
  paaQuestions?: string[];
  /** Full PAA items (question + snippet/title/link) for UI. */
  paaItems?: PaaItemForUI[];
  /** SERP features (knowledge graph, answer box, etc.). */
  serpFeatures?: SerpFeaturesForUI;
  /** Intent validation (declared vs detected). */
  intentValidation?: IntentValidationForUI;
  /** Reddit discussion threads (dedicated search + organic from SERP). */
  redditThreads?: RedditThreadForUI[];
};

/** Outline section for brief/editor (matches pipeline OutlineSection). */
export type OutlineSectionForEditor = {
  heading: string;
  level: "h2" | "h3";
  reason: string;
  topics: string[];
  targetWords: number;
  geoNote?: string;
  subsections?: OutlineSectionForEditor[];
};

/** Brief chunk result for UI (outline editor). */
export type BriefChunkResult = {
  outline: OutlineSectionForEditor[];
  briefSummary?: BriefSummary;
};

/** Draft chunk result for UI (full draft from SSE or job). */
export type DraftChunkResult = {
  wordCount: number;
  title: string;
  metaDescription: string;
  outline: string[];
  content: string;
  suggestedSlug: string;
  suggestedCategories: string[];
  suggestedTags: string[];
};

/** Validation chunk result (from POST /validate). */
export type ValidationChunkResult = {
  faqEnforcement: { passed: boolean; violations: { question: string; answer?: string; charCount: number }[] };
  auditResult: PipelineResult["auditResult"];
  factCheck: PipelineResult["factCheck"];
  schemaMarkup: NonNullable<PipelineResult["schemaMarkup"]>;
  /** FAQ-enforced HTML (used as article.content in PipelineResult). */
  finalContent: string;
  autoFixAttempts?: number;
  contentDiff?: import("@/lib/seo/content-diff").ContentDiffResult;
  semanticSimilarity?: { highestSimilarity: number; mostSimilarUrl: string; isTooDerivative: boolean };
  contentDecayRisk?: import("@/lib/seo/content-decay").ContentDecayResult;
};

/** Brief overrides for draft endpoint (edited outline). */
export type BriefOverridesForDraft = {
  sections?: Array<{
    heading?: string;
    level?: "h2" | "h3";
    targetWords?: number;
    topics?: string[];
    geoNote?: string;
    subsections?: BriefOverridesForDraft["sections"];
  }>;
  reorderedSectionIndexes?: number[];
  removedSectionIndexes?: number[];
  /** User-added sections (appended after existing outline). */
  addedSections?: Array<{
    heading?: string;
    level?: "h2" | "h3";
    targetWords?: number;
    topics?: string[];
    geoNote?: string;
  }>;
};

/** Chunk outputs from step-by-step mode (for building PipelineResult). */
export type ChunkOutputsState = {
  research: ResearchChunkResult | null;
  /** Top 10 SERP results for competitor selection (before research chunk is complete). */
  researchSerp: ResearchSerpResult | null;
  brief: BriefChunkResult | null;
  draft: DraftChunkResult | null;
  validation: ValidationChunkResult | null;
};

/** Build PipelineResult from chunk outputs (step mode completion). */
export function buildPipelineResultFromChunks(
  chunkOutputs: ChunkOutputsState,
  sourceUrls: string[] = []
): PipelineResult {
  const draft = chunkOutputs.draft;
  const validation = chunkOutputs.validation;
  if (!draft || !validation) {
    throw new Error(
      "buildPipelineResultFromChunks requires chunkOutputs.draft and chunkOutputs.validation to be set; " +
      `got draft=${Boolean(draft)}, validation=${Boolean(validation)}`
    );
  }
  const brief = chunkOutputs.brief;

  const expectedH2s =
    brief?.outline?.filter((s) => s.level === "h2").map((s) => s.heading.trim()) ?? [];
  const actualH2s = (draft.outline ?? []).map((h) => (typeof h === "string" ? h : "").trim()).filter(Boolean);
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
  const missing = expectedH2s.filter((e) => !actualH2s.some((a) => norm(a) === norm(e)));
  const extra = actualH2s.filter((a) => !expectedH2s.some((e) => norm(e) === norm(a)));
  const outlineDrift: OutlineDrift = {
    passed: missing.length === 0,
    expected: expectedH2s,
    actual: actualH2s,
    missing,
    extra,
  };

  return {
    article: {
      content: validation.finalContent,
      outline: draft.outline ?? [],
      suggestedSlug: draft.suggestedSlug,
      suggestedCategories: draft.suggestedCategories ?? [],
      suggestedTags: draft.suggestedTags ?? [],
    },
    title: draft.title ?? "",
    metaDescription: draft.metaDescription ?? "",
    sourceUrls: sourceUrls.length > 0 ? sourceUrls : undefined,
    auditResult: validation.auditResult,
    schemaMarkup: validation.schemaMarkup,
    faqEnforcement: validation.faqEnforcement,
    factCheck: validation.factCheck,
    briefSummary: brief?.briefSummary,
    outlineDrift,
    contentDiff: validation.contentDiff,
    semanticSimilarity: validation.semanticSimilarity,
    contentDecayRisk: validation.contentDecayRisk,
  };
}
