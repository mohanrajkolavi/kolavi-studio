/**
 * Blog Generator Pipeline v3 — Type definitions and Zod schemas.
 * All pipeline steps import from this file.
 */

import { z } from "zod";
import type { ArticleAuditResult } from "@/lib/seo/article-audit";

// =============================================================================
// 1. PipelineInput
// =============================================================================

export type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

/** Word count guideline preset. "auto" = use competitor-derived target; custom uses wordCountCustom. */
export type WordCountPreset = "auto" | "concise" | "standard" | "in_depth" | "custom";

export type PipelineInput = {
  primaryKeyword: string;
  secondaryKeywords?: string[];
  peopleAlsoSearchFor?: string[];
  intent?: SearchIntent | SearchIntent[];
  /** When set and not "auto", overrides competitor-derived word count. */
  wordCountPreset?: WordCountPreset;
  /** Used only when wordCountPreset is "custom". */
  wordCountCustom?: number;
};

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
  dataDensity: string;
  introStyle: string;
  ctaStyle: string;
};

// =============================================================================
// 7. TopicExtractionResult (from Gemini Pro) — Zod validated
// =============================================================================

export const TopicSchema = z.object({
  name: z.string(),
  importance: z.enum(["essential", "recommended", "differentiator"]),
  coverageCount: z.string(),
  keyTerms: z.array(z.string()),
  exampleContent: z.string(),
  recommendedDepth: z.string(),
});

/** Coerce string or number to number (AI often returns "20" or "20%"). */
const numeric = z.union([
  z.number(),
  z.string().transform((s) => {
    const n = Number(String(s).replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }),
]);

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
  tone: z.string(),
  readingLevel: z.string(),
  contentMix: z.object({
    prose: numeric,
    lists: numeric,
    tables: numeric,
  }),
  dataDensity: z.string(),
  introStyle: z.string(),
  ctaStyle: z.string(),
});

export const CompetitorHeadingsSchema = z.object({
  url: z.string(),
  h2s: z.array(z.string()),
  h3s: z.array(z.string()),
});

export const GapSchema = z.object({
  topic: z.string(),
  opportunity: z.string(),
  recommendedApproach: z.string(),
});

/** Coerce string or array to string (AI may return strengths/weaknesses as bullet arrays). */
const stringOrArray = z.union([
  z.string(),
  z.array(z.string()).transform((arr) => arr.join(". ")),
]);

export const CompetitorStrengthsSchema = z.object({
  url: z.string(),
  strengths: stringOrArray,
  weaknesses: stringOrArray,
  aiLikelihood: z.enum(["likely_human", "uncertain", "likely_ai"]),
});

export const WordCountNoteSchema = z.object({
  competitorAverage: numeric,
  recommended: numeric,
  note: z.string(),
});

export const TopicExtractionResultSchema = z.object({
  topics: z.array(TopicSchema),
  competitorHeadings: z.array(CompetitorHeadingsSchema),
  gaps: z.array(GapSchema),
  competitorStrengths: z.array(CompetitorStrengthsSchema),
  editorialStyle: EditorialStyleSchema,
  wordCount: WordCountNoteSchema,
});

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

// Claude draft output (writeDraft response) — Zod validated
export const ClaudeDraftOutputSchema = z.object({
  titleMetaVariants: z.array(TitleMetaVariantSchema).min(2).max(4),
  outline: z.array(z.string()),
  content: z.string().min(1),
  suggestedSlug: z.string(),
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

export type PipelineOutput = {
  article: {
    content: string;
    outline: string[];
    suggestedSlug: string;
    suggestedCategories: string[];
    suggestedTags: string[];
  };
  titleMetaVariants: TitleMetaVariant[];
  selectedTitleMeta: TitleMetaVariant | null;
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
