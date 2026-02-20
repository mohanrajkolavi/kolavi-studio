/**
 * Blog Generator Pipeline v3 — Type definitions and Zod schemas.
 * All pipeline steps import from this file.
 */

import { z } from "zod";
import type { ArticleAuditResult } from "@/lib/seo/article-audit";
import type { PipelineRunMetrics, PerformanceSummary } from "@/lib/pipeline/metrics/types";

// =============================================================================
// 1. PipelineInput
// =============================================================================

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

/** Word count: "auto" = default by search intent; "custom" = wordCountCustom. */
export type WordCountPreset = "auto" | "custom";

/** Draft model for Claude writeDraft step. */
export type DraftModel = "opus-4.6" | "sonnet-4.6";

/**
 * Default word count by intent (single or combo). Key = single intent or sorted combo "a,b".
 * Single: Informational 2,500 | Commercial 1,750 | Transactional 1,000 | Navigational 600.
 * Combos: Inf+Comm 2,250 | Inf+Trans 1,750 | Comm+Trans 1,350 | Inf+Nav 1,250.
 */
export const INTENT_DEFAULT_WORD_COUNT: Record<string, number> = {
  informational: 2500,
  commercial: 1750,
  transactional: 1000,
  navigational: 600,
  "commercial,informational": 2250,
  "informational,transactional": 1750,
  "commercial,transactional": 1350,
  "informational,navigational": 1250,
};

export function getDefaultWordCountForIntent(intent: SearchIntent[] | undefined): number {
  if (!intent?.length) return INTENT_DEFAULT_WORD_COUNT.informational ?? 2500;
  const key = [...intent].sort().join(",");
  return INTENT_DEFAULT_WORD_COUNT[key] ?? INTENT_DEFAULT_WORD_COUNT.informational ?? 2500;
}

export type PipelineInput = {
  primaryKeyword: string;
  /** Max 2 secondary keywords. */
  secondaryKeywords?: string[];
  peopleAlsoSearchFor?: string[];
  intent?: SearchIntent | SearchIntent[];
  /** "auto" = default by intent; "custom" = wordCountCustom. */
  wordCountPreset?: WordCountPreset;
  /** Used only when wordCountPreset is "custom". */
  wordCountCustom?: number;
  /** Draft model: Opus 4.6 or Sonnet 4.6. */
  draftModel?: DraftModel;
  /** When true (default), auto-fix fact-check hallucinations via Claude. */
  autoFixHallucinations?: boolean;
};

/** Zod schema for validating job input (e.g. when loading from store). */
export const PipelineInputSchema = z.object({
  primaryKeyword: z.string().min(1, "primaryKeyword is required"),
  secondaryKeywords: z.array(z.string()).optional(),
  peopleAlsoSearchFor: z.array(z.string()).optional(),
  intent: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  wordCountPreset: z.string().optional(),
  wordCountCustom: z.number().optional(),
  draftModel: z.enum(["opus-4.6", "sonnet-4.6"]).optional(),
  autoFixHallucinations: z.boolean().optional(),
});

// =============================================================================
// 2. SerpResult
// =============================================================================

export type SerpResult = {
  url: string;
  title: string;
  position: number;
  snippet: string;
  isArticle: boolean;
};

// =============================================================================
// 3. CompetitorArticle
// =============================================================================

export type CompetitorArticle = {
  url: string;
  title: string;
  content: string;
  wordCount: number;
  fetchSuccess: boolean;
};

// =============================================================================
// 4. CurrentData (from Gemini Flash) — Zod validated
// =============================================================================

export const CurrentDataFactSchema = z.object({
  fact: z.string(),
  source: z.string(),
  date: z.string().optional(),
});

export const SourceUrlValidationSchema = z.object({
  total: z.number(),
  accessible: z.number(),
  inaccessible: z.array(z.string()),
});

export const CurrentDataSchema = z.object({
  facts: z.array(CurrentDataFactSchema),
  recentDevelopments: z.array(z.string()),
  lastUpdated: z.string(),
  groundingVerified: z.boolean(),
  sourceUrlValidation: SourceUrlValidationSchema.optional(),
});

export type CurrentData = z.infer<typeof CurrentDataSchema>;
export type CurrentDataFact = z.infer<typeof CurrentDataFactSchema>;

// =============================================================================
// 5. Topic
// =============================================================================

export type TopicImportance = "essential" | "recommended" | "differentiator";

export type Topic = {
  name: string;
  importance: TopicImportance;
  coverageCount: string;
  keyTerms: string[];
  exampleContent: string;
  recommendedDepth: string;
};

// =============================================================================
// 6. EditorialStyle
// =============================================================================

export type PointOfView = "first" | "second" | "third" | "mixed";

export type EditorialStyle = {
  sentenceLength: {
    average: number;
    distribution: { short: number; medium: number; long: number; veryLong: number };
  };
  paragraphLength: {
    averageSentences: number;
    distribution: { single: number; standard: number; long: number; veryLong: number };
  };
  tone: string;
  readingLevel: string;
  contentMix: { prose: number; lists: number; tables: number };
  /** e.g. "data-heavy with stats in every section" — specific, not generic. */
  dataDensity: string;
  /** First, second, third person, or mixed across competitors. */
  pointOfView: PointOfView;
  /** How often competitors use real examples (names, case studies, numbers). */
  realExamplesFrequency: string;
  introStyle: string;
  ctaStyle: string;
};

// =============================================================================
// 7. TopicExtractionResult (from Gemini Pro) — Zod validated
// =============================================================================

/** Coerce AI output (string/number/undefined/null) to string so schema validation passes. */
const stringCoerce = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((v) => (v != null && v !== "" ? String(v) : ""));

/** Array of strings where AI may return mixed types; filter and coerce to string[]. */
const stringArrayCoerce = z
  .array(z.union([z.string(), z.number(), z.undefined(), z.null()]).transform((v) => (v != null && v !== "" ? String(v) : "")))
  .transform((arr) => arr.filter(Boolean) as string[])
  .default([]);

export const TopicSchema = z.object({
  name: stringCoerce,
  importance: z.enum(["essential", "recommended", "differentiator"]).catch("recommended"),
  coverageCount: stringCoerce,
  keyTerms: stringArrayCoerce,
  exampleContent: stringCoerce,
  recommendedDepth: stringCoerce,
});

/** Coerce string or number or undefined to number (AI often returns "20", "20%", or undefined). */
const numeric = z
  .union([
    z.number(),
    z.string(),
    z.undefined(),
    z.null(),
  ])
  .transform((v) => {
    if (v == null) return 0;
    const n = typeof v === "number" ? v : Number(String(v).replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  });

export const SentenceLengthDistributionSchema = z.object({
  short: numeric,
  medium: numeric,
  long: numeric,
  veryLong: numeric,
});

export const ParagraphLengthDistributionSchema = z.object({
  single: numeric,
  standard: numeric,
  long: numeric,
  veryLong: numeric,
});

export const EditorialStyleSchema = z.object({
  sentenceLength: z.object({
    average: numeric,
    distribution: SentenceLengthDistributionSchema,
  }),
  paragraphLength: z.object({
    averageSentences: numeric,
    distribution: ParagraphLengthDistributionSchema,
  }),
  tone: stringCoerce,
  readingLevel: stringCoerce,
  contentMix: z.object({
    prose: numeric,
    lists: numeric,
    tables: z.optional(numeric).default(0),
  }),
  dataDensity: stringCoerce,
  pointOfView: z.enum(["first", "second", "third", "mixed"]).catch("third"),
  realExamplesFrequency: stringCoerce.optional().default(""),
  introStyle: stringCoerce,
  ctaStyle: stringCoerce,
});

export const CompetitorHeadingsSchema = z.object({
  url: stringCoerce,
  h2s: stringArrayCoerce,
  h3s: stringArrayCoerce,
});

/** A gap qualifies only with real reader demand, missing from most competitors, and a concrete actionable angle. */
export const GapSchema = z.object({
  topic: stringCoerce,
  opportunity: stringCoerce,
  recommendedApproach: stringCoerce,
  /** Specific evidence: where competitors fall short (e.g. "URL X only mentions Y in one sentence; URL Z omits it"). No vague gaps. */
  evidence: stringArrayCoerce.optional().default([]),
  /** Why there is real reader demand (e.g. search volume, PAA question, intent). */
  readerDemand: stringCoerce.optional().default(""),
  /** Concrete angle we can take (actionable, not vague). */
  actionableAngle: stringCoerce.optional().default(""),
});

/** Coerce string or array to string (AI may return strengths/weaknesses as bullet arrays). */
const stringOrArray = z.union([
  z.string(),
  z.array(z.string()).transform((arr) => arr.join(". ")),
]);

export const CompetitorStrengthsSchema = z.object({
  url: stringCoerce,
  strengths: stringOrArray,
  weaknesses: stringOrArray,
  aiLikelihood: z.enum(["likely_human", "uncertain", "likely_ai"]).catch("uncertain"),
});

export const WordCountNoteSchema = z.object({
  competitorAverage: numeric,
  recommended: numeric,
  note: stringCoerce,
});

/** Per–PAA question: did competitors answer it and is it a gap candidate? */
export const PaaAnalysisItemSchema = z.object({
  question: stringCoerce,
  answeredBy: stringArrayCoerce,
  quality: z.enum(["full", "partial", "missing"]).catch("partial"),
  gapCandidate: z.boolean().catch(false),
  note: stringCoerce.optional(),
});

export const TopicExtractionResultSchema = z.object({
  topics: z.array(TopicSchema),
  competitorHeadings: z.array(CompetitorHeadingsSchema),
  gaps: z.array(GapSchema),
  competitorStrengths: z.array(CompetitorStrengthsSchema),
  editorialStyle: EditorialStyleSchema,
  wordCount: WordCountNoteSchema,
  paaAnalysis: z.array(PaaAnalysisItemSchema).optional().default([]),
});

export type PaaAnalysisItem = z.infer<typeof PaaAnalysisItemSchema>;

export type TopicExtractionResult = z.infer<typeof TopicExtractionResultSchema>;

// =============================================================================
// 8. OutlineSection & ResearchBrief (from GPT-4.1) — Zod validated
// =============================================================================

export type OutlineSection = {
  heading: string;
  level: "h2" | "h3";
  reason: string;
  topics: string[];
  targetWords: number;
  geoNote?: string;
  subsections?: OutlineSection[];
};

const OutlineSectionSchemaInner: z.ZodType<OutlineSection> = z.lazy(() =>
  z.object({
    heading: z.string(),
    level: z.enum(["h2", "h3"]),
    reason: z.string(),
    topics: z.array(z.string()),
    targetWords: z.number(),
    geoNote: z.string().optional(),
    subsections: z.array(OutlineSectionSchemaInner).optional(),
  })
);

export const OutlineSectionSchema = OutlineSectionSchemaInner;

// ResearchBrief schema (nested objects)
export const ResearchBriefOutlineSchema = z.object({
  sections: z.array(OutlineSectionSchema),
  totalSections: z.number(),
  estimatedWordCount: z.number(),
});

export const GeoRequirementsSchema = z.object({
  directAnswer: z.string(),
  statDensity: z.string(),
  entities: z.string(),
  qaBlocks: z.string(),
  faqStrategy: z.string().optional(),
});

export const SeoRequirementsSchema = z.object({
  keywordInTitle: z.string(),
  keywordInFirst10Percent: z.boolean(),
  keywordInSubheadings: z.boolean(),
  maxParagraphWords: z.number(),
  faqCount: z.string(),
});

export const ResearchBriefWordCountSchema = z.object({
  target: z.number(),
  note: z.string(),
});

export const ResearchBriefSchema = z.object({
  keyword: z.object({
    primary: z.string(),
    secondary: z.array(z.string()),
    pasf: z.array(z.string()),
  }),
  currentData: CurrentDataSchema,
  outline: ResearchBriefOutlineSchema,
  gaps: z.array(z.string()),
  editorialStyle: EditorialStyleSchema,
  editorialStyleFallback: z.boolean(),
  geoRequirements: GeoRequirementsSchema,
  seoRequirements: SeoRequirementsSchema,
  wordCount: ResearchBriefWordCountSchema,
  // Optional "best version" fields for step 6 → step 7 handoff
  similaritySummary: z.string().optional(),
  extraValueThemes: z.array(z.string()).optional(),
  freshnessNote: z.string().optional(),
  /** Patterns to avoid (from likely_ai competitors); passed to Step 4 as writing constraints. */
  competitorDifferentiation: z.string().optional(),
});

/** Used when GPT returns brief without currentData (merged server-side). */
export const ResearchBriefWithoutCurrentDataSchema = ResearchBriefSchema.omit({ currentData: true });

export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;

// =============================================================================
// 9. TitleMetaVariant
// =============================================================================

export type TitleMetaVariant = {
  title: string;
  metaDescription: string;
  approach: string;
};

export const TitleMetaVariantSchema = z.object({
  // Don't enforce max length in Zod — a 61-char title would fail the entire
  // safeParse and drop all structural validation. Truncation is handled
  // post-validation in the Claude client, and the SEO audit enforces limits.
  title: z.string().min(1),
  metaDescription: z.string().min(1),
  approach: z.string(),
});

// Claude draft output (writeDraft response) — content only. Title, meta, slug come from OpenAI generateTitleMetaSlugFromContent (called from result page).
export const ClaudeDraftOutputSchema = z.object({
  content: z.string().min(1),
  suggestedCategories: z.array(z.string()),
  suggestedTags: z.array(z.string()),
});

export type ClaudeDraftOutput = z.infer<typeof ClaudeDraftOutputSchema>;

// =============================================================================
// 10. SchemaMarkup
// =============================================================================

export type SchemaMarkup = {
  article: object;
  faq: object | null;
  breadcrumb: object | null;
  faqSchemaNote: string;
};

// =============================================================================
// 11. PipelineOutput
// =============================================================================

/** Best-version brief summary for UI and debugging (no full brief in output). */
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

/** Record of one auto-fix applied for a fact-check hallucination. */
export type HallucinationFix = {
  originalText: string;
  replacement: string;
  reason: string;
  replacedWithVerifiedFact: boolean;
};

/** Token usage for one LLM call; used for cost tracking and metrics. */
export type TokenUsageRecord = {
  /** Call identifier (e.g. "extractTopicsAndStyle", "writeDraft"). */
  callName: string;
  /** Model name (e.g. "gpt-4.1", "gemini-3-flash-preview", "claude-sonnet-4-6", "claude-opus-4-6"). */
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Call duration in milliseconds. */
  durationMs: number;
};

export type PipelineOutput = {
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
  sourceUrls: string[];
  auditResult: ArticleAuditResult;
  schemaMarkup: SchemaMarkup;
  faqEnforcement: {
    passed: boolean;
    violations: { question: string; answer?: string; charCount: number }[];
  };
  factCheck: {
    verified: boolean;
    hallucinations: string[];
    issues: string[];
    skippedRhetorical: string[];
  };
  publishTracking: {
    keyword: string;
    publishedUrl?: string;
    publishDate?: string;
  };
  /** Total pipeline execution time in milliseconds. */
  generationTimeMs?: number;
  /** Strategy/differentiation from brief (for dashboard). */
  briefSummary?: BriefSummary;
  /** Non-blocking: draft outline vs brief outline. */
  outlineDrift?: OutlineDrift;
  /** Auto-fixes applied for fact-check hallucinations (when autoFixHallucinations enabled). */
  hallucinationFixes?: HallucinationFix[];
  /** Per-call token usage for cost estimation and metrics. */
  tokenUsage?: TokenUsageRecord[];
  /** Full timing and performance metrics for this run (observability). */
  metrics?: PipelineRunMetrics;
  /** Human-readable performance summary (observability). */
  performanceSummary?: PerformanceSummary;
};

// =============================================================================
// 12. Utility types (v3)
// =============================================================================

export type StepResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  durationMs: number;
  retryCount: number;
};

export type RetryOnCondition = "timeout" | "rate_limit" | "server_error";

export type RetryConfig = {
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  retryOn: RetryOnCondition[];
};

export type ValidatedSourceUrl = {
  url: string;
  isAccessible: boolean;
  statusCode: number | null;
  checkedAt: string;
};

// =============================================================================
// RetryConfig presets
// =============================================================================

export const RETRY_FAST: RetryConfig = {
  maxRetries: 1,
  retryDelayMs: 500,
  timeoutMs: 10000,
  retryOn: ["timeout", "server_error"],
};

export const RETRY_STANDARD: RetryConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
  timeoutMs: 30000,
  retryOn: ["timeout", "rate_limit", "server_error"],
};

export const RETRY_EXPENSIVE: RetryConfig = {
  maxRetries: 1,
  retryDelayMs: 3000,
  timeoutMs: 60000,
  retryOn: ["timeout", "rate_limit"],
};

export const RETRY_STANDARD_FAST: RetryConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
  timeoutMs: 40000,
  retryOn: ["timeout", "rate_limit", "server_error"],
};

export const RETRY_CLAUDE_DRAFT: RetryConfig = {
  maxRetries: 1,
  retryDelayMs: 2000,
  timeoutMs: 180000,
  retryOn: ["timeout", "rate_limit"],
};

// -----------------------------------------------------------------------------
// BriefOverrides — draft endpoint: edit/reorder/remove outline sections
// -----------------------------------------------------------------------------

export type BriefOverridesSection = {
  heading?: string;
  level?: "h2" | "h3";
  targetWords?: number;
  topics?: string[];
  geoNote?: string;
  subsections?: BriefOverridesSection[];
};

export type BriefOverrides = {
  sections?: BriefOverridesSection[];
  reorderedSectionIndexes?: number[];
  removedSectionIndexes?: number[];
  /** User-added sections (appended after existing outline). Does not change research. */
  addedSections?: BriefOverridesSection[];
};
