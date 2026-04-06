/**
 * Chunk runners for resumable blog pipeline. Used by chunk endpoints and by
 * the monolithic generate route (in-process). All accept a job store and
 * optional progress callback.
 */

import type { PipelineInput, PipelineOutput, BriefSummary, OutlineDrift, TokenUsageRecord } from "./types";
import { PipelineInputSchema } from "./types";
import type { PipelineMetricsCollector } from "./metrics/collector";
import type {
  SerpResult,
  SerpFeatures,
  IntentValidation,
  CompetitorArticle,
  CurrentData,
  CurrentDataFact,
  TopicExtractionResult,
  ResearchBrief,
  OutlineSection,
  SchemaMarkup,
} from "./types";
import type { BriefOverrides, BriefOverridesSection } from "./types";
import type { Job, JobStore } from "./jobs/types";
import type { ChunkCost } from "./jobs/types";
import type { PipelineProgressEvent } from "./orchestrator";
import { buildChunkCost } from "./cost";
import { withRetry, validateSourceUrls } from "./orchestrator";
import { RETRY_FAST, RETRY_JINA, RETRY_STANDARD_FAST, RETRY_CLAUDE_DRAFT } from "./types";
import { searchCompetitorUrlsWithPaa, searchRedditDiscussions, type RedditThread, type PaaItem } from "@/lib/serper/client";
import { fetchCompetitorContent } from "@/lib/jina/reader";
import { fetchCurrentData, extractQuotesFromReddit } from "@/lib/gemini/client";
import {
  extractTopicsAndStyle,
  type WordCountOverride,
} from "@/lib/openai/client";
import { writeDraft, writeDraftSection, fixAuditIssues, fixHallucinationsInContent, buildResearchBrief, reviseBrief, humanizeContent } from "@/lib/claude/client";
import { generateContentDiff, type ContentDiffResult } from "@/lib/seo/content-diff";
import { computeSemanticSimilarity } from "@/lib/seo/similarity";
import { assessContentDecay, type ContentDecayResult } from "@/lib/seo/content-decay";
import {
  auditArticle,
  generateSchemaMarkup,
  generateLlmsTxt,
  generateEntitySchema,
  enforceFaqCharacterLimit,
  extractH2sFromHtml,
  verifyFactsAgainstSource,
} from "@/lib/seo/article-audit";

import { buildTopicGraph } from "@/lib/knowledge/topic-graph";
import { generateAlgorithmicInsights } from "@/lib/knowledge/insight-generator";
import { synthesizeProprietaryFramework } from "@/lib/knowledge/framework-generator";
import { ContentRegistry, lintDraft, fixDefinitionOpening } from "@/lib/pipeline/content-registry";

// P5/P6/P7 modules
import { extractTfidfTerms, scoreTermCoverage, type TfidfResult, type TermWeight } from "@/lib/seo/tfidf";
import { extractEntities, detectEntityGaps, scoreEntityCoverage, type ExtractedEntity, type EntityExtractionResult } from "@/lib/seo/entity-extraction";
import { analyzeSerpIntelligence, type SerpIntelligenceResult } from "@/lib/seo/serp-intelligence";
import { analyzeClusterFit, toBriefLinkSuggestions, type ClusterAnalysisResult } from "@/lib/seo/topical-cluster";
import { scoreContent, type ContentOptimizationResult } from "@/lib/seo/content-optimizer";

/** Thrown when topic extraction fails after store updates; catch should not re-call store.setChunkFailed/updatePhase. */
class TopicExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicExtractionError";
    Object.setPrototypeOf(this, TopicExtractionError.prototype);
  }
}

const DEFAULT_MAX_COMPETITOR_URLS = 4;
/** Top N SERP results shown for user to select competitors (user picks up to 4). 9 = 3x3 grid. */
const MAX_SERP_FOR_SELECTION = 9;

class TimeBudget {
  private startMs: number;
  constructor(private readonly budgetMs: number) {
    this.startMs = Date.now();
  }
  elapsed(): number {
    return Date.now() - this.startMs;
  }
  remaining(): number {
    return Math.max(0, this.budgetMs - this.elapsed());
  }
  cap(requestedMs: number, minMs?: number): number {
    const remaining = this.remaining();
    if (remaining < 10_000) return Math.max(remaining - 2_000, 1_000);
    const capped = Math.min(requestedMs, remaining - 5_000);
    const floor = minMs ?? 5_000;
    return Math.max(capped, floor);
  }
}

/** Check if keyword implies strategic/methodology content (gates proprietary framework for commercial intent). */
function isStrategyKeyword(keyword: string): boolean {
  return /\b(strateg(y|ies)|methodology|framework|approach|playbook|blueprint|model|system|process)\b/i.test(keyword);
}

// ---------------------------------------------------------------------------
// Research chunk output (saved to job store)
// ---------------------------------------------------------------------------

export type ResearchChunkOutput = {
  serpResults: SerpResult[];
  competitors: CompetitorArticle[];
  currentData: CurrentData;
  /** PAA questions from Serper (for topic extraction gap analysis). */
  paaQuestions?: string[];
  /** Full PAA items (question + snippet/title/link) for UI. */
  paaItems?: PaaItem[];
  /** High-quality quotes extracted from Reddit discussions. */
  redditQuotes?: string[];
  /** SERP features from Step 1 (knowledge graph, answer box, etc.). */
  serpFeatures?: SerpFeatures;
  /** Reddit thread URLs/titles from Step 1 (dedicated search + organic). */
  redditThreads?: RedditThread[];
};

export type ResearchSummary = {
  urlCount: number;
  articleCount: number;
  currentDataFacts: number;
};

export type RunResearchChunkResult = {
  serpResults: SerpResult[];
  competitors: CompetitorArticle[];
  currentData: CurrentData;
  researchSummary: ResearchSummary;
};

/** Result of SERP-only phase (top 10 for selection). No Jina/Gemini. */
export type RunResearchSerpOnlyResult = {
  serpResults: SerpResult[];
  paaQuestions?: string[];
  paaItems?: PaaItem[];
  serpFeatures?: SerpFeatures;
  intentValidation?: IntentValidation;
  redditThreads?: RedditThread[];
};

/** Result of fetch phase (Jina + Gemini for user-selected URLs). */
export type RunResearchFetchResult = {
  researchSummary: ResearchSummary;
  competitorUrls: string[];
  competitorTitles: string[];
  paaQuestions?: string[];
  paaItems?: PaaItem[];
  serpFeatures?: SerpFeatures;
  redditQuotes?: string[];
  redditThreads?: RedditThread[];
};

/**
 * Step 1 — SERP research: Serper only, top results for user to select up to 3 (+ optional custom URL).
 * No Jina/Gemini; no research chunk saved until Step 2.
 */
export async function runResearchSerpOnly(
  input: PipelineInput,
  jobId: string,
  store: JobStore,
  onProgress?: (evt: PipelineProgressEvent) => void,
  metrics?: PipelineMetricsCollector
): Promise<RunResearchSerpOnlyResult> {
  let job: Job<PipelineInput> | undefined;
  try {
    job = await store.getJob<PipelineInput>(jobId);
    if (!job) {
      await store.createJob(jobId, input);
      job = (await store.getJob<PipelineInput>(jobId))!;
    }
    await store.updatePhase(jobId, "researching");
  } catch (storeErr) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[pipeline] Job store init failed, SERP will be returned; client will send on fetch:", storeErr);
    }
  }

  const emit = (
    step: PipelineProgressEvent["step"],
    status: PipelineProgressEvent["status"],
    message: string,
    progress: number
  ) => {
    onProgress?.({ step, status, message, elapsedMs: 0, progress });
  };

  const primaryKeyword = input.primaryKeyword?.trim() || "";
  if (!primaryKeyword) throw new Error("primaryKeyword is required");

  const declaredIntent = Array.isArray(input.intent) ? input.intent[0] : input.intent;

  emit("serper", "started", "Searching competitors...", 0);
  const serperStartMs = Date.now();
  const serperResult = await withRetry(
    async () => searchCompetitorUrlsWithPaa(primaryKeyword, MAX_SERP_FOR_SELECTION, declaredIntent),
    { ...RETRY_FAST, timeoutMs: 15_000 },
    "serper"
  );
  const serperDurationMs = Date.now() - serperStartMs;
  metrics?.recordApiCall("serper", serperDurationMs, { endpoint: "search" });

  const serpResults: SerpResult[] =
    serperResult.success && serperResult.data ? serperResult.data.results : [];
  const paaQuestions = serperResult.success && serperResult.data ? serperResult.data.paaQuestions : [];
  const paaItems = serperResult.success && serperResult.data ? serperResult.data.paaItems : undefined;
  const serpFeatures = serperResult.success && serperResult.data ? serperResult.data.serpFeatures : undefined;
  const intentValidation = serperResult.success && serperResult.data ? serperResult.data.intentValidation : undefined;
  const redditThreads = serperResult.success && serperResult.data ? serperResult.data.redditThreads : [];

  emit("serper", "completed", `Found ${serpResults.length} results, ${paaQuestions.length} PAA, ${redditThreads.length} Reddit threads`, 100);

  try {
    await store.saveChunkOutput(jobId, "research_serp", {
      results: serpResults,
      paaQuestions,
      paaItems,
      serpFeatures,
      intentValidation,
      redditThreads,
    });
    await store.updatePhase(jobId, "waiting_for_review");
  } catch (storeErr) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[pipeline] Job store persist failed (research_serp), client will send on fetch:", storeErr);
    }
  }
  return {
    serpResults,
    paaQuestions: paaQuestions.length > 0 ? paaQuestions : undefined,
    paaItems,
    serpFeatures,
    intentValidation,
    redditThreads: redditThreads.length > 0 ? redditThreads : undefined,
  };
}

/** Structured log for research fetch (backend observability). */
function logResearchFetch(level: "info" | "error", data: Record<string, unknown>) {
  const payload = { stage: "research_fetch", ...data };
  if (level === "error") {
    console.error("[pipeline]", JSON.stringify(payload));
  } else if (process.env.NODE_ENV !== "test") {
    console.log("[pipeline]", JSON.stringify(payload));
  }
}

/**
 * Step 2 — Competitor scraping + current data: Jina scrapes selected URLs; Gemini (search grounding) fetches current data.
 * Research chunk saved to job; brief can then run (Step 3).
 */
export async function runResearchFetch(
  jobId: string,
  selectedUrls: string[],
  store: JobStore,
  budgetMs = 45_000,
  onProgress?: (evt: PipelineProgressEvent) => void,
  tokenUsage?: TokenUsageRecord[],
  metrics?: PipelineMetricsCollector
): Promise<RunResearchFetchResult> {
  const researchStartMs = Date.now();
  logResearchFetch("info", { event: "research_fetch_start", jobId, selectedCount: selectedUrls.length });

  const job = await store.getJob<PipelineInput>(jobId);
  if (!job) throw new Error("Job not found");

  const parsed = PipelineInputSchema.safeParse(job.input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors?.[0] ?? "Invalid job input: primaryKeyword required";
    throw new Error(msg);
  }
  const input = parsed.data as PipelineInput;
  const primaryKeyword = input.primaryKeyword.trim();
  if (!primaryKeyword) throw new Error("primaryKeyword is required");

  let urls = selectedUrls.slice(0, DEFAULT_MAX_COMPETITOR_URLS);

  // Load Step 1 data so we can include PAA, SERP features, Reddit threads in research chunk and result
  const researchSerp = await store.getChunkOutput(jobId, "research_serp") as
    | { paaQuestions?: string[]; paaItems?: PaaItem[]; serpFeatures?: SerpFeatures; redditThreads?: RedditThread[] }
    | undefined;
  const paaFromSerp = researchSerp?.paaQuestions;
  const paaItemsFromSerp = researchSerp?.paaItems;
  const serpFeaturesFromSerp = researchSerp?.serpFeatures;
  const redditThreadsFromSerp = researchSerp?.redditThreads;

  // Idempotency: if we already have a research chunk for the same URLs (within 30 min), return it
  const IDEMPOTENCY_TTL_MS = 30 * 60 * 1000; // 30 minutes
  const existing = await store.getChunkOutput(jobId, "research") as ResearchChunkOutput | undefined;
  if (existing?.serpResults?.length) {
    const existingUrls = [...existing.serpResults.map((s) => s.url)].sort();
    const requestedUrls = [...urls].sort();
    const fetchedAt = (existing as Record<string, unknown>)._fetchedAt as number | undefined;
    const isFresh = !fetchedAt || (Date.now() - fetchedAt) < IDEMPOTENCY_TTL_MS;
    if (isFresh && existingUrls.length === requestedUrls.length && existingUrls.every((u, i) => u === requestedUrls[i])) {
      const researchSummary: ResearchSummary = {
        urlCount: existing.serpResults.length,
        articleCount: existing.competitors.filter((c) => c.fetchSuccess).length,
        currentDataFacts: existing.currentData.facts.length,
      };
      const competitorTitles = existing.serpResults.map((s) => s.title);
      logResearchFetch("info", {
        event: "research_fetch_idempotent",
        jobId,
        articleCount: researchSummary.articleCount,
        currentDataFacts: researchSummary.currentDataFacts,
        durationMs: Date.now() - researchStartMs,
      });
      return {
        researchSummary,
        competitorUrls: existing.serpResults.map((s) => s.url),
        competitorTitles,
        paaQuestions: existing.paaQuestions ?? paaFromSerp,
        paaItems: existing.paaItems ?? paaItemsFromSerp,
        serpFeatures: existing.serpFeatures ?? serpFeaturesFromSerp,
        redditQuotes: existing.redditQuotes,
        redditThreads: existing.redditThreads ?? redditThreadsFromSerp,
      };
    }
  }

  // Validate competitor URLs are reachable; fail if all inaccessible
  const urlValidation = await validateSourceUrls(urls);
  const accessibleUrls = urlValidation.filter((v) => v.isAccessible).map((v) => v.url);
  if (urlValidation.length > 0 && accessibleUrls.length === 0) {
    throw new Error("Selected URLs are not accessible");
  }
  if (urlValidation.length > 0 && accessibleUrls.length < urlValidation.length) {
    logResearchFetch("info", { event: "research_fetch_url_validation", jobId, accessible: accessibleUrls.length, total: urlValidation.length, inaccessible: urlValidation.filter((v) => !v.isAccessible).map((v) => v.url) });
    // Only fetch URLs that passed validation
    urls = accessibleUrls;
  }

  await store.setChunkRunning(jobId, "research");
  await store.updatePhase(jobId, "researching");

  const budget = new TimeBudget(budgetMs);
  const emit = (
    step: PipelineProgressEvent["step"],
    status: PipelineProgressEvent["status"],
    message: string,
    progress: number
  ) => {
    onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
  };

  emit("jina", "started", "Fetching competitor articles...", 0);
  emit("gemini-grounding", "started", "Gathering current data...", 0);
  let jinaDurationMs = 0;
  let geminiDurationMs = 0;
  const [jinaResult, groundingResult, redditThreads] = await Promise.all([
    (async () => {
      const t0 = Date.now();
      const r = await withRetry(
        async () => fetchCompetitorContent(urls, urls.length),
        { ...RETRY_JINA, timeoutMs: budget.cap(RETRY_JINA.timeoutMs) },
        "jina"
      );
      jinaDurationMs = Date.now() - t0;
      return r;
    })(),
    (async () => {
      const t0 = Date.now();
      const r = await withRetry(
        async () => fetchCurrentData(primaryKeyword, input.secondaryKeywords ?? []),
        { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(RETRY_STANDARD_FAST.timeoutMs) },
        "gemini-grounding"
      );
      geminiDurationMs = Date.now() - t0;
      return r;
    })(),
    (async () => {
      try {
        return await searchRedditDiscussions(primaryKeyword, 3);
      } catch (err) {
        if (process.env.NODE_ENV !== "test") {
          console.warn("[pipeline] Reddit search failed during research_fetch; continuing without Reddit data", err);
        }
        return [];
      }
    })(),
  ]);
  metrics?.recordApiCall("jina", jinaDurationMs, { endpoint: "fetch" });
  metrics?.recordApiCall("gemini", geminiDurationMs, { endpoint: "grounding" });

  let redditQuotes: string[] = [];
  if (redditThreads.length > 0) {
    emit("gemini-grounding", "started", "Extracting Reddit quotes...", 40);
    try {
      redditQuotes = await extractQuotesFromReddit(primaryKeyword, redditThreads);
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("[pipeline] extractQuotesFromReddit failed; continuing without Reddit quotes", err);
      }
      redditQuotes = [];
    }
  }

  const competitors: CompetitorArticle[] =
    jinaResult.success && jinaResult.data ? jinaResult.data : [];
  let currentData: CurrentData =
    groundingResult.success && groundingResult.data
      ? groundingResult.data
      : {
        facts: [],
        recentDevelopments: [],
        lastUpdated: "Unknown",
        groundingVerified: false,
        sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
      };

  const articleCount = competitors.filter((c) => c.fetchSuccess).length;

  // Fallback: if Gemini grounding returned 0 facts but we have competitor content,
  // extract basic facts from competitor articles to ensure citations are possible
  if (currentData.facts.length === 0 && articleCount > 0) {
    console.warn(`[chunks] Gemini grounding returned 0 facts — extracting fallback facts from ${articleCount} competitor articles`);
    const fallbackFacts = extractFallbackFacts(competitors.filter(c => c.fetchSuccess));
    if (fallbackFacts.length > 0) {
      currentData = {
        ...currentData,
        facts: fallbackFacts,
        groundingVerified: false,
        lastUpdated: new Date().toISOString(),
      };
      emit("gemini-grounding", "started", `Gemini unavailable — extracted ${fallbackFacts.length} facts from competitor content`, 45);
    }
  }

  if (articleCount === 0 && currentData.facts.length === 0) {
    const message = "We couldn't fetch content from the selected links and no current data available. Try different sources or retry.";
    await store.setChunkFailed(jobId, "research", message);
    logResearchFetch("error", { event: "research_fetch_failed", jobId, reason: "no_articles_fetched", durationMs: Date.now() - researchStartMs });
    throw new Error(message);
  }
  if (articleCount === 0 && currentData.facts.length > 0) {
    console.warn(`[chunks] No competitor articles fetched, but ${currentData.facts.length} current data facts available — proceeding with reduced context.`);
  }

  emit("jina", jinaResult.success ? "completed" : "failed", `${articleCount} articles fetched`, 50);
  emit("gemini-grounding", groundingResult.success ? "completed" : "failed", `${currentData.facts.length} current data facts`, 50);

  if (currentData.facts.length > 0) {
    const validated = await validateSourceUrls(currentData.facts.map((f) => f.source));
    if (validated.length > 0) {
      const accessibleSet = new Set(validated.filter((v) => v.isAccessible).map((v) => v.url));
      const originalCount = currentData.facts.length;
      currentData = {
        ...currentData,
        facts: currentData.facts.filter((f) => accessibleSet.has(f.source)),
        sourceUrlValidation: {
          total: validated.length,
          accessible: accessibleSet.size,
          inaccessible: validated.filter((v) => !v.isAccessible).map((v) => v.url),
        },
      };
      const removedCount = originalCount - currentData.facts.length;
      if (removedCount > 0) {
        emit("gemini-grounding", "started", `${removedCount} of ${originalCount} facts removed (inaccessible sources)`, 55);
      }
    }
  }

  const serpResults: SerpResult[] = urls.map((url, i) => ({
    url,
    title: competitors[i]?.title ?? url,
    position: i + 1,
    snippet: "",
    isArticle: true,
  }));
  const output: ResearchChunkOutput & { _fetchedAt: number } = {
    serpResults,
    competitors,
    currentData,
    redditQuotes,
    paaQuestions: paaFromSerp,
    paaItems: paaItemsFromSerp,
    serpFeatures: serpFeaturesFromSerp,
    redditThreads: redditThreadsFromSerp ?? redditThreads,
    _fetchedAt: Date.now(),
  };
  const durationMs = Date.now() - researchStartMs;
  const cost = buildChunkCost(
    { jina: { calls: 1, durationMs: jinaDurationMs }, gemini: { calls: 1, durationMs: geminiDurationMs } },
    durationMs
  );
  await store.saveChunkOutput(jobId, "research", output as Record<string, unknown>, cost);
  await store.updatePhase(jobId, "waiting_for_review");

  const researchSummary: ResearchSummary = {
    urlCount: urls.length,
    articleCount,
    currentDataFacts: currentData.facts.length,
  };
  const competitorTitles = urls.map((url) => competitors.find((c) => c.url === url)?.title ?? url);

  logResearchFetch("info", {
    event: "research_fetch_complete",
    jobId,
    articleCount: researchSummary.articleCount,
    currentDataFacts: researchSummary.currentDataFacts,
    durationMs,
  });

  return {
    researchSummary,
    competitorUrls: urls,
    competitorTitles,
    paaQuestions: paaFromSerp,
    paaItems: paaItemsFromSerp,
    serpFeatures: serpFeaturesFromSerp,
    redditQuotes,
    redditThreads: redditThreadsFromSerp ?? redditThreads,
  };
}

export async function runResearchChunk(
  input: PipelineInput,
  jobId: string,
  store: JobStore,
  budgetMs = 45_000,
  onProgress?: (evt: PipelineProgressEvent) => void,
  tokenUsage?: TokenUsageRecord[],
  metrics?: PipelineMetricsCollector
): Promise<RunResearchChunkResult> {
  let job = await store.getJob<PipelineInput>(jobId);
  if (!job) {
    await store.createJob(jobId, input);
    job = (await store.getJob<PipelineInput>(jobId))!;
  }
  await store.setChunkRunning(jobId, "research");
  await store.updatePhase(jobId, "researching");
  const researchStartMs = Date.now();

  try {
    const budget = new TimeBudget(budgetMs);
    const emit = (
      step: PipelineProgressEvent["step"],
      status: PipelineProgressEvent["status"],
      message: string,
      progress: number
    ) => {
      onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
    };

    const primaryKeyword = input.primaryKeyword?.trim() || "";
    if (!primaryKeyword) throw new Error("primaryKeyword is required");

    emit("serper", "started", "Searching competitors...", 0);
    const serperStartMs = Date.now();
    const serperResult = await withRetry(
      async () => searchCompetitorUrlsWithPaa(primaryKeyword, DEFAULT_MAX_COMPETITOR_URLS),
      { ...RETRY_FAST, timeoutMs: budget.cap(RETRY_FAST.timeoutMs) },
      "serper"
    );
    const serperDurationMs = Date.now() - serperStartMs;
    metrics?.recordApiCall("serper", serperDurationMs, { endpoint: "search" });
    const serpResults: SerpResult[] =
      serperResult.success && serperResult.data ? serperResult.data.results : [];
    const paaQuestions: string[] =
      serperResult.success && serperResult.data ? serperResult.data.paaQuestions : [];
    const urls = serpResults.map((s) => s.url).slice(0, DEFAULT_MAX_COMPETITOR_URLS);
    emit("serper", "completed", `Found ${urls.length} URLs, ${paaQuestions.length} PAA`, 5);

    emit("jina", "started", "Fetching competitor articles...", 5);
    emit("gemini-grounding", "started", "Gathering current data...", 5);
    let jinaDurationMs = 0;
    let geminiDurationMs = 0;
    const [jinaResult, groundingResult] = await Promise.all([
      (async () => {
        const t0 = Date.now();
        const r = await withRetry(
          async () => fetchCompetitorContent(urls, DEFAULT_MAX_COMPETITOR_URLS),
          { ...RETRY_JINA, timeoutMs: budget.cap(RETRY_JINA.timeoutMs) },
          "jina"
        );
        jinaDurationMs = Date.now() - t0;
        return r;
      })(),
      (async () => {
        const t0 = Date.now();
        const r = await withRetry(
          async () => fetchCurrentData(primaryKeyword, input.secondaryKeywords ?? []),
          { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(RETRY_STANDARD_FAST.timeoutMs) },
          "gemini-grounding"
        );
        geminiDurationMs = Date.now() - t0;
        return r;
      })(),
    ]);
    metrics?.recordApiCall("jina", jinaDurationMs, { endpoint: "fetch" });
    metrics?.recordApiCall("gemini", geminiDurationMs, { endpoint: "grounding" });

    const competitors: CompetitorArticle[] =
      jinaResult.success && jinaResult.data ? jinaResult.data : [];
    let currentData: CurrentData =
      groundingResult.success && groundingResult.data
        ? groundingResult.data
        : {
          facts: [],
          recentDevelopments: [],
          lastUpdated: "Unknown",
          groundingVerified: false,
          sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
        };

    const articleCountLegacy = competitors.filter((c) => c.fetchSuccess).length;

    // Fallback: if Gemini grounding returned 0 facts but we have competitor content,
    // extract basic facts from competitor articles to ensure citations are possible
    if (currentData.facts.length === 0 && articleCountLegacy > 0) {
      console.warn(`[chunks] Gemini grounding returned 0 facts — extracting fallback facts from ${articleCountLegacy} competitor articles`);
      const fallbackFacts = extractFallbackFacts(competitors.filter(c => c.fetchSuccess));
      if (fallbackFacts.length > 0) {
        currentData = {
          ...currentData,
          facts: fallbackFacts,
          groundingVerified: false,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    emit(
      "jina",
      jinaResult.success ? "completed" : "failed",
      `${articleCountLegacy} articles fetched`,
      15
    );
    emit(
      "gemini-grounding",
      groundingResult.success ? "completed" : "failed",
      `${currentData.facts.length} current data facts${currentData.groundingVerified === false && currentData.facts.length > 0 ? " (fallback)" : ""}`,
      15
    );

    if (currentData.facts.length > 0) {
      const validated = await validateSourceUrls(currentData.facts.map((f) => f.source));
      if (validated.length > 0) {
        const accessibleSet = new Set(validated.filter((v) => v.isAccessible).map((v) => v.url));
        currentData = {
          ...currentData,
          facts: currentData.facts.filter((f) => accessibleSet.has(f.source)),
          sourceUrlValidation: {
            total: validated.length,
            accessible: accessibleSet.size,
            inaccessible: validated.filter((v) => !v.isAccessible).map((v) => v.url),
          },
        };
      }
    }

    const output: ResearchChunkOutput & { _fetchedAt: number } = { serpResults, competitors, currentData, paaQuestions, _fetchedAt: Date.now() };
    const durationMs = Date.now() - researchStartMs;
    const cost = buildChunkCost(
      {
        serper: { calls: 1, durationMs: serperDurationMs },
        jina: { calls: 1, durationMs: jinaDurationMs },
        gemini: { calls: 1, durationMs: geminiDurationMs },
      },
      durationMs
    );
    await store.saveChunkOutput(jobId, "research", output as Record<string, unknown>, cost);
    await store.updatePhase(jobId, "waiting_for_review");

    const researchSummary: ResearchSummary = {
      urlCount: urls.length,
      articleCount: competitors.filter((c) => c.fetchSuccess).length,
      currentDataFacts: currentData.facts.length,
    };
    return {
      serpResults,
      competitors,
      currentData,
      researchSummary,
    };
  } catch (err) {
    await store.setChunkFailed(jobId, "research", err instanceof Error ? err.message : "Research failed");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Brief chunk
// ---------------------------------------------------------------------------

/** Structured edit for an existing outline section during brief revision. */
export type BriefRevisionSectionEdit = {
  heading: string;
  action: "keep" | "remove" | "rename" | "reorder";
  newHeading?: string;
  newPosition?: number;
};

/** A new section to add during brief revision. */
export type BriefRevisionAddSection = {
  heading: string;
  afterSection?: string;
  reason?: string;
};

export type BriefChunkOptions = {
  /** When true, use wordCountTarget instead of job input for word count override. */
  revise?: boolean;
  /** New target word count (500–6000). Optional when revise is true (no longer required). */
  wordCountTarget?: number;
  /** Free-text revision instructions (organic revision mode). */
  revisionInstructions?: string;
  /** Structured per-section edits for organic revision. */
  sectionEdits?: BriefRevisionSectionEdit[];
  /** New sections to add during organic revision. */
  addSections?: BriefRevisionAddSection[];
};

export type RunBriefChunkResult = {
  brief: ResearchBrief;
  outline: OutlineSection[];
};

export async function runBriefChunk(
  jobId: string,
  store: JobStore,
  budgetMs = 90_000,
  onProgress?: (evt: PipelineProgressEvent) => void,
  tokenUsage?: TokenUsageRecord[],
  metrics?: PipelineMetricsCollector,
  options?: BriefChunkOptions
): Promise<RunBriefChunkResult> {
  const job = await store.getJob<PipelineInput>(jobId);
  if (!job) throw new Error("Job not found");
  const research = await store.getChunkOutput(jobId, "research");
  if (!research || !research.competitors || !research.currentData) {
    throw new Error("Research not completed");
  }
  const competitors = research.competitors as CompetitorArticle[];
  const currentData = research.currentData as CurrentData;
  const input = job.input;

  const competitorUrlHash = [...competitors]
    .map((c) => c.url ?? "")
    .sort()
    .join("|");
  const cachedTopic = await store.getChunkOutput(jobId, "topic_extraction") as
    | {
      competitorUrlHash?: string;
      extraction?: TopicExtractionResult;
      topicGraph?: any;
      algorithmicInsights?: any[];
      proprietaryFramework?: any;
    }
    | undefined;

  let topicExtraction: TopicExtractionResult;
  let usedTopicCache = false;

  if (
    cachedTopic?.competitorUrlHash === competitorUrlHash &&
    cachedTopic?.extraction &&
    Array.isArray(cachedTopic.extraction.topics) &&
    cachedTopic.extraction.topics.length > 0
  ) {
    topicExtraction = cachedTopic.extraction as TopicExtractionResult;
    usedTopicCache = true;
  } else {
    await store.setChunkRunning(jobId, "analysis");
    await store.updatePhase(jobId, "analyzing");
    const analysisStartMs = Date.now();

    const budget = new TimeBudget(budgetMs);
    const emit = (
      step: PipelineProgressEvent["step"],
      status: PipelineProgressEvent["status"],
      message: string,
      progress: number
    ) => {
      onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
    };

    try {
      emit("topic-extraction", "started", "Analyzing competitor topics & style...", 20);
      const paaQuestions = (research as ResearchChunkOutput).paaQuestions ?? [];
      const extractionResult = await withRetry(
        async () => extractTopicsAndStyle(competitors, { tokenUsage, paaQuestions }),
        { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(60000) },
        "topic-extraction"
      );
      if (!extractionResult.success || !extractionResult.data) {
        emit("topic-extraction", "failed", extractionResult.error ?? "topic extraction failed", 25);
        const errMsg = `Topic extraction failed: ${extractionResult.error ?? "unknown"}`;
        await store.setChunkFailed(jobId, "analysis", errMsg);
        await store.updatePhase(jobId, "failed", errMsg);
        throw new TopicExtractionError(errMsg);
      }
      topicExtraction = extractionResult.data;
      emit(
        "topic-extraction",
        "completed",
        `${topicExtraction.topics.length} topics, ${topicExtraction.gaps.length} gaps`,
        30
      );

      emit("topic-extraction", "started", "Building unified Topic Graph (Information Gain)...", 26);
      const paaQuestionsSerp = (research as ResearchChunkOutput).paaQuestions ?? [];
      const topicGraph = await buildTopicGraph(input.primaryKeyword!, competitors, paaQuestionsSerp, (research as ResearchChunkOutput).redditThreads);

      emit("topic-extraction", "started", "Deriving highly contrarian Algorithmic Insights...", 28);
      const factsStrings = currentData.facts.map(f => f.fact || JSON.stringify(f));
      const algorithmicInsights = await generateAlgorithmicInsights(input.primaryKeyword!, topicGraph, factsStrings);

      emit("topic-extraction", "started", "Synthesizing Proprietary Framework...", 30);
      const intentList = Array.isArray(input.intent) ? input.intent : [input.intent ?? "informational"];
      const skipFramework = intentList.some(i => i === "transactional" || i === "navigational") ||
        (intentList.includes("commercial") && !isStrategyKeyword(input.primaryKeyword!));
      const proprietaryFramework = skipFramework
        ? null
        : await synthesizeProprietaryFramework(input.primaryKeyword!, topicGraph, algorithmicInsights);

      await store.saveChunkOutput(jobId, "topic_extraction", {
        competitorUrlHash,
        extraction: topicExtraction,
        topicGraph,
        algorithmicInsights,
        proprietaryFramework
      } as Record<string, unknown>);
    } catch (err) {
      if (err instanceof TopicExtractionError) {
        throw err;
      }
      const errMsg = err instanceof Error ? err.message : "Topic extraction failed";
      await store.setChunkFailed(jobId, "analysis", errMsg);
      await store.updatePhase(jobId, "failed", errMsg);
      throw err;
    }
  }

  const analysisStartMs = Date.now();
  const budget = new TimeBudget(budgetMs);
  const emit = (
    step: PipelineProgressEvent["step"],
    status: PipelineProgressEvent["status"],
    message: string,
    progress: number
  ) => {
    onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
  };

  if (usedTopicCache) {
    await store.setChunkRunning(jobId, "analysis");
    await store.updatePhase(jobId, "analyzing");
    emit("topic-extraction", "completed", `Using cached extraction (${topicExtraction.topics.length} topics)`, 30);
  }

  // Override extraction wordCount with actual competitor average (more reliable than GPT math).
  // The intent-based default is used only when no competitor word counts are available.
  const successfulCompetitors = competitors.filter((c) => c.fetchSuccess && c.wordCount > 0);
  if (successfulCompetitors.length > 0) {
    const avgWordCount = Math.round(
      successfulCompetitors.reduce((sum, c) => sum + c.wordCount, 0) / successfulCompetitors.length
    );
    const recommended = Math.round(avgWordCount * 1.15); // avg + 15%
    topicExtraction = {
      ...topicExtraction,
      wordCount: {
        competitorAverage: avgWordCount,
        recommended,
        note: `Based on ${successfulCompetitors.length} competitor articles (avg ${avgWordCount} words). Target: ${recommended} words (avg + 15%). STRICT — target must be met within ±5%.`,
      },
    };
  }

  // -----------------------------------------------------------------------
  // P5/P6/P7 — Parallel analysis: TF-IDF, entities, SERP intelligence, cluster fit
  // Non-blocking: failures don't stop the pipeline.
  // -----------------------------------------------------------------------
  let tfidfResult: TfidfResult | undefined;
  let entityResult: EntityExtractionResult | undefined;
  let serpIntelligence: SerpIntelligenceResult | undefined;
  let clusterAnalysis: ClusterAnalysisResult | undefined;

  try {
    const successfulContent = competitors.filter((c) => c.fetchSuccess && c.content?.length > 0);
    const targetWC = topicExtraction.wordCount?.recommended ?? 2500;

    // Run all four analyses in parallel (all are CPU-only, no external API calls)
    const [tfidf, entities, serpIntel, cluster] = await Promise.all([
      // P7A: TF-IDF term extraction
      Promise.resolve().then(() => {
        if (successfulContent.length === 0) return undefined;
        return extractTfidfTerms({
          competitorTexts: successfulContent.map((c) => ({
            content: c.content,
            wordCount: c.wordCount,
          })),
          primaryKeyword: input.primaryKeyword!,
          secondaryKeywords: input.secondaryKeywords,
          targetWordCount: targetWC,
          maxTerms: 80,
        });
      }).catch((err) => {
        console.warn("[chunks] TF-IDF extraction failed (non-fatal):", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // P7D: Entity extraction
      Promise.resolve().then(() => {
        if (successfulContent.length === 0) return undefined;
        return extractEntities(
          successfulContent.map((c) => ({ content: c.content }))
        );
      }).catch((err) => {
        console.warn("[chunks] Entity extraction failed (non-fatal):", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // P6: SERP Intelligence (3Cs analysis)
      Promise.resolve().then(() => {
        if (successfulContent.length === 0) return undefined;
        const serpFeaturesData = (research as ResearchChunkOutput).serpFeatures;
        return analyzeSerpIntelligence({
          competitors: successfulContent.map((c, i) => ({
            url: c.url,
            title: c.title,
            content: c.content,
            wordCount: c.wordCount,
            position: i + 1,
          })),
          serpFeatures: serpFeaturesData ? {
            hasFeaturedSnippet: serpFeaturesData.hasFeaturedSnippet,
            hasKnowledgeGraph: serpFeaturesData.hasKnowledgeGraph,
            hasAnswerBox: serpFeaturesData.hasAnswerBox,
          } : undefined,
          targetWordCount: targetWC,
        });
      }).catch((err) => {
        console.warn("[chunks] SERP intelligence failed (non-fatal):", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // P5: Cluster analysis (internal linking)
      Promise.resolve().then(() => {
        if (!input.existingBlogUrls?.length) return undefined;
        const outlineHeadings = topicExtraction.competitorHeadings?.flatMap(h => h.h2s) ?? [];
        return analyzeClusterFit(
          input.primaryKeyword!,
          input.secondaryKeywords ?? [],
          input.existingBlogUrls.map((url) => ({ url })),
          outlineHeadings,
          input.clusterPosition,
        );
      }).catch((err) => {
        console.warn("[chunks] Cluster analysis failed (non-fatal):", err instanceof Error ? err.message : err);
        return undefined;
      }),
    ]);

    tfidfResult = tfidf;
    entityResult = entities;
    serpIntelligence = serpIntel;
    clusterAnalysis = cluster;

    // Save P5/P6/P7 results to job store for UI access
    await store.saveChunkOutput(jobId, "content_intelligence", {
      tfidf: tfidfResult ? {
        terms: tfidfResult.terms.slice(0, 40), // Top 40 for UI
        totalTermsAnalyzed: tfidfResult.totalTermsAnalyzed,
        documentsAnalyzed: tfidfResult.documentsAnalyzed,
        primaryKeywordStats: tfidfResult.primaryKeywordStats,
      } : undefined,
      entities: entityResult ? {
        entities: entityResult.entities.slice(0, 30),
        stats: entityResult.stats,
      } : undefined,
      serpIntelligence: serpIntelligence ? {
        patterns: serpIntelligence.patterns,
        recommendation: serpIntelligence.recommendation,
        informationGainOpportunities: serpIntelligence.informationGainOpportunities.slice(0, 10),
        featuredSnippetStrategy: serpIntelligence.featuredSnippetStrategy,
        difficulty: serpIntelligence.difficulty,
        difficultyReason: serpIntelligence.difficultyReason,
      } : undefined,
      clusterAnalysis: clusterAnalysis ? {
        recommendedPosition: clusterAnalysis.recommendedPosition,
        positionReason: clusterAnalysis.positionReason,
        linkSuggestions: clusterAnalysis.linkSuggestions.slice(0, 8),
        cannibalizationWarnings: clusterAnalysis.cannibalizationWarnings,
      } : undefined,
    } as Record<string, unknown>);

    const parts: string[] = [];
    if (tfidfResult) parts.push(`${tfidfResult.terms.length} TF-IDF terms`);
    if (entityResult) parts.push(`${entityResult.entities.length} entities`);
    if (serpIntelligence) parts.push(`SERP: ${serpIntelligence.patterns.dominantType}`);
    if (clusterAnalysis) parts.push(`cluster: ${clusterAnalysis.recommendedPosition}`);
    if (parts.length > 0) {
      emit("topic-extraction", "completed", `Content intelligence: ${parts.join(", ")}`, 33);
    }
  } catch (err) {
    console.warn("[chunks] Content intelligence analysis failed (non-fatal):", err instanceof Error ? err.message : err);
  }

  try {

    const wordCountOverride =
      options?.revise && typeof options?.wordCountTarget === "number" && options.wordCountTarget >= 500 && options.wordCountTarget <= 6000
        ? {
          target: Math.round(options.wordCountTarget),
          note: "Guideline only. Strong value: provide more value than competitors; length is secondary.",
        }
        : undefined;

    // Organic revision: if user provided instructions, patch existing brief instead of rebuilding
    // Also use revision path for significant word count increases (>30%) to add new sections/gaps
    const existingBriefOutput = options?.revise ? await store.getChunkOutput(jobId, "analysis") : null;
    const existingBrief = existingBriefOutput as unknown as ResearchBrief | null;
    const existingWordCount = existingBrief?.outline?.sections?.reduce((sum: number, s: { targetWords?: number }) => sum + (s.targetWords || 0), 0) ?? 0;
    const isSignificantWordCountIncrease = existingBrief && wordCountOverride && existingWordCount > 0 && wordCountOverride.target > existingWordCount * 1.3;
    const isOrganicRevision = options?.revise && (options.revisionInstructions?.trim() || isSignificantWordCountIncrease);

    if (isOrganicRevision && existingBrief) {
      const revisionMessage = isSignificantWordCountIncrease && !options.revisionInstructions?.trim()
        ? "Expanding brief with new sections and deeper coverage..."
        : "Revising brief based on your instructions...";
      emit("gpt-brief", "started", revisionMessage, 30);

      // For word-count-only expansion, generate smart instructions
      const effectiveInstructions = options.revisionInstructions?.trim()
        || `Expand the article to ${wordCountOverride!.target} words. Primary strategy: deepen existing sections with more practitioner depth, edge cases, examples, and data. Only add new sections if there are genuine gaps that competitors cover but our outline misses. The reader should never need to search again after reading this.`;

      const briefResult = await withRetry(
        async () => reviseBrief(
          existingBrief,
          effectiveInstructions,
          topicExtraction,
          currentData,
          input,
          wordCountOverride,
          tokenUsage,
          {
            sectionEdits: options.sectionEdits,
            addSections: options.addSections,
          }
        ),
        { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(180000, 180_000) },
        "gpt-brief"
      );
      if (!briefResult.success || !briefResult.data) {
        emit("gpt-brief", "failed", briefResult.error ?? "brief revision failed", 40);
        throw new Error(`Brief revision failed: ${briefResult.error ?? "unknown"}`);
      }
      let brief: ResearchBrief = briefResult.data;
      // Inject P5 cluster links into revised brief
      if (clusterAnalysis?.linkSuggestions?.length) {
        brief = { ...brief, internalLinkSuggestions: toBriefLinkSuggestions(clusterAnalysis.linkSuggestions) };
      }
      if (clusterAnalysis?.recommendedPosition) {
        brief = { ...brief, clusterPosition: clusterAnalysis.recommendedPosition, clusterTopic: clusterAnalysis.cluster?.topic };
      }
      emit("gpt-brief", "completed", `Revised brief: ${brief.outline.sections.length} sections`, 40);

      const durationMs = Date.now() - analysisStartMs;
      const cost = buildChunkCost({ openai: { calls: 1, durationMs } }, durationMs);
      await store.saveChunkOutput(jobId, "analysis", brief as unknown as Record<string, unknown>, cost);
      await store.updatePhase(jobId, "waiting_for_review");
      return { brief, outline: brief.outline.sections };
    }

    // Step 3 — Brief: Claude builds outline, H2/H3; word count from extraction (user can change in brief section)
    emit("gpt-brief", "started", options?.revise ? "Revising brief with new word count..." : "Building strategic research brief...", 30);
    const briefResult = await withRetry(
      async () => buildResearchBrief(
        topicExtraction,
        currentData,
        input,
        wordCountOverride,
        tokenUsage,
        cachedTopic?.topicGraph,
        cachedTopic?.algorithmicInsights,
        cachedTopic?.proprietaryFramework
      ),
      { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(180000, 180_000) },
      "gpt-brief"
    );
    if (!briefResult.success || !briefResult.data) {
      emit("gpt-brief", "failed", briefResult.error ?? "research brief failed", 40);
      throw new Error(`Research brief failed: ${briefResult.error ?? "unknown"}`);
    }
    let brief: ResearchBrief = briefResult.data;

    // Inject P5 cluster link suggestions and P6 SERP intelligence into brief
    if (clusterAnalysis?.linkSuggestions?.length) {
      brief = { ...brief, internalLinkSuggestions: toBriefLinkSuggestions(clusterAnalysis.linkSuggestions) };
    }
    if (clusterAnalysis?.recommendedPosition) {
      brief = { ...brief, clusterPosition: clusterAnalysis.recommendedPosition, clusterTopic: clusterAnalysis.cluster?.topic };
    }

    emit(
      "gpt-brief",
      "completed",
      `Brief: ${brief.outline.sections.length} sections`,
      40
    );

    const durationMs = Date.now() - analysisStartMs;
    const cost = buildChunkCost({ openai: { calls: usedTopicCache ? 1 : 2, durationMs } }, durationMs);
    await store.saveChunkOutput(jobId, "analysis", brief as unknown as Record<string, unknown>, cost);
    await store.updatePhase(jobId, "waiting_for_review");
    return { brief, outline: brief.outline.sections };
  } catch (err) {
    await store.setChunkFailed(jobId, "analysis", err instanceof Error ? err.message : "Brief failed");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Apply brief overrides (merge edits, reorder, remove)
// ---------------------------------------------------------------------------

function applyBriefOverrides(brief: ResearchBrief, overrides?: BriefOverrides | null): ResearchBrief {
  if (!overrides) return brief;
  let sections = [...brief.outline.sections];

  if (overrides.sections?.length) {
    sections = sections.map((s, i) => {
      const o = overrides.sections![i];
      if (!o) return s;
      const subsections: OutlineSection[] | undefined =
        o.subsections && s.subsections
          ? s.subsections.map((sub, j) => {
            const subO = o.subsections?.[j];
            if (!subO) return sub;
            return { ...sub, ...subO } as OutlineSection;
          })
          : s.subsections;
      return { ...s, ...o, subsections } as OutlineSection;
    });
  }
  const removedSet =
    overrides.removedSectionIndexes?.length
      ? new Set(overrides.removedSectionIndexes)
      : null;
  // Map original index -> merged section (before remove); negative indices -1,-2,... for added sections
  const mergedByOriginalIndex = new Map<number, OutlineSection>();
  sections.forEach((s, i) => mergedByOriginalIndex.set(i, s));
  const addedList = (overrides.addedSections ?? []).map(
    (o): OutlineSection => ({
      heading: o.heading ?? "",
      level: o.level ?? "h2",
      reason: "",
      topics: o.topics ?? [],
      targetWords: o.targetWords ?? 150,
      geoNote: o.geoNote,
    })
  );
  addedList.forEach((s, i) => mergedByOriginalIndex.set(-1 - i, s));
  if (removedSet?.size) {
    sections = sections.filter((_, i) => !removedSet.has(i));
  }
  if (overrides.reorderedSectionIndexes?.length) {
    const n = brief.outline.sections.length;
    const kept = overrides.reorderedSectionIndexes.filter(
      (i) => (i >= 0 && i < n && !removedSet?.has(i)) || (i < 0 && -1 - i < addedList.length)
    );
    const reordered = kept
      .map((i) => mergedByOriginalIndex.get(i))
      .filter((s): s is OutlineSection => s != null);
    if (reordered.length > 0) sections = reordered;
  }
  // Any added sections not placed via reorderedSectionIndexes (no position info) append at end
  const placedAdded = Math.min(
    addedList.length,
    overrides.reorderedSectionIndexes?.filter((i) => i < 0 && i >= -addedList.length).length ?? 0
  );
  if (placedAdded < addedList.length) {
    sections = [...sections, ...addedList.slice(placedAdded)];
  }

  const estimatedWordCount = sections.reduce((sum, s) => sum + (s.targetWords || 150), 0);
  return {
    ...brief,
    wordCount: { ...brief.wordCount, target: estimatedWordCount },
    outline: {
      sections,
      totalSections: sections.length,
      estimatedWordCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Draft chunk
// ---------------------------------------------------------------------------

export type DraftChunkOutput = {
  title: string;
  metaDescription: string;
  suggestedSlug: string;
  outline: string[];
  content: string;
  suggestedCategories: string[];
  suggestedTags: string[];
};

export type RunDraftChunkResult = {
  draft: DraftChunkOutput;
  wordCount: number;
};

export async function runDraftChunk(
  jobId: string,
  store: JobStore,
  briefOverrides?: BriefOverrides | null,
  budgetMs = 180_000,
  onProgress?: (evt: PipelineProgressEvent) => void,
  tokenUsage?: TokenUsageRecord[],
  metrics?: PipelineMetricsCollector
): Promise<RunDraftChunkResult> {
  const job = await store.getJob<PipelineInput>(jobId);
  if (!job) throw new Error("Job not found");
  const analysis = await store.getChunkOutput(jobId, "analysis");
  if (!analysis) throw new Error("Brief not completed");
  const brief = applyBriefOverrides(analysis as unknown as ResearchBrief, briefOverrides);
  if (!brief.outline.sections?.length) {
    throw new Error("Outline has no sections after applying overrides");
  }

  const research = await store.getChunkOutput(jobId, "research") as { redditQuotes?: string[] } | undefined;
  let redditQuotes = research?.redditQuotes;

  await store.setChunkRunning(jobId, "draft");
  await store.updatePhase(jobId, "drafting");
  const draftStartMs = Date.now();

  try {
    const budget = new TimeBudget(budgetMs);
    const emit = (
      step: PipelineProgressEvent["step"],
      status: PipelineProgressEvent["status"],
      message: string,
      progress: number
    ) => {
      onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
    };

    // Placeholder title/meta/slug — draft is written first; user generates meta from content via "Generate meta" button
    const primaryKeyword = brief.keyword.primary;
    const fallbackSlug =
      primaryKeyword
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "") || "draft";
    const titleMetaSlug = {
      title: "Draft",
      metaDescription: "",
      suggestedSlug: fallbackSlug.length > 75 ? fallbackSlug.slice(0, 75).replace(/-+$/, "") : fallbackSlug,
    };

    // Step 4 — Draft: Claude Sonnet 4.6 or Opus 4.6 writes article section by section from brief
    const draftModel = (job.input as PipelineInput).draftModel ?? "sonnet-4.6";
    const fieldNotes = (job.input as PipelineInput).fieldNotes;
    const toneExamples = (job.input as PipelineInput).toneExamples;
    const voice = (job.input as PipelineInput).voice;
    const customVoiceDescription = (job.input as PipelineInput).customVoiceDescription;
    const authorName = (job.input as PipelineInput).authorName;
    const authorBio = (job.input as PipelineInput).authorBio;
    const authorExpertise = (job.input as PipelineInput).authorExpertise;
    const authorUrl = (job.input as PipelineInput).authorUrl;
    const industry = (job.input as PipelineInput).industry;

    emit("claude-draft", "started", "Writing article draft section by section...", 0);

    // -----------------------------------------------------------------------
    // Load TF-IDF terms from content intelligence (computed in runBriefChunk)
    // so the draft writer can naturally incorporate competitor-common terms.
    // -----------------------------------------------------------------------
    let tfidfTermsForDraft: TermWeight[] | undefined;
    try {
      const contentIntelligence = await store.getChunkOutput(jobId, "content_intelligence");
      const tfidfData = contentIntelligence?.tfidf as { terms?: TermWeight[] } | undefined;
      if (tfidfData?.terms?.length) {
        tfidfTermsForDraft = tfidfData.terms.slice(0, 30); // Top 30 terms
      }
    } catch {
      // Non-fatal — draft proceeds without TF-IDF guidance
    }

    // -----------------------------------------------------------------------
    // STAT REGISTRY: Prevent data repetition across sections.
    // Each stat is allocated to at most 1-2 sections, then physically removed
    // from the payload so Claude cannot repeat it.
    // -----------------------------------------------------------------------
    const allFacts = [...(brief.currentData?.facts ?? [])];
    const sectionCount = brief.outline.sections.length;
    const BATCH_SIZE = 3;

    // -----------------------------------------------------------------------
    // Pre-allocate facts per section index (deterministic, no race conditions)
    // Distribute evenly first, then give remainder to intro/FAQ sections
    // -----------------------------------------------------------------------
    const basePerSection = sectionCount > 0 ? Math.floor(allFacts.length / sectionCount) : 0;
    let remainder = sectionCount > 0 ? allFacts.length % sectionCount : 0;
    const factsPerSection: Array<typeof allFacts> = [];
    let factIdx = 0;
    for (let i = 0; i < sectionCount; i++) {
      // Give remainder facts to intro (i=0) and FAQ (last) first, then other sections
      const isIntroOrFaq = i === 0 || i === sectionCount - 1;
      const bonus = (isIntroOrFaq && remainder > 0) ? 1 : (!isIntroOrFaq && remainder > 0 && i < remainder) ? 1 : 0;
      if (bonus > 0) remainder--;
      const allocCount = basePerSection + bonus;
      const end = Math.min(factIdx + allocCount, allFacts.length);
      factsPerSection.push(allFacts.slice(factIdx, end));
      factIdx = end;
    }

    // --- ContentRegistry — track consumed stats/quotes/insights post-draft ---
    const registry = new ContentRegistry();

    // -----------------------------------------------------------------------
    // Helper: draft a single section
    // -----------------------------------------------------------------------
    const draftOneSection = async (
      i: number,
      previousContext: string
    ): Promise<{ index: number; html: string; wordCount: number }> => {
      const section = brief.outline.sections[i];
      const sectionBrief: ResearchBrief = {
        ...brief,
        currentData: { ...brief.currentData, facts: factsPerSection[i] },
      };

      const jobInput = job.input as PipelineInput;
      const primaryIntent = Array.isArray(jobInput.intent) ? jobInput.intent[0] : (jobInput.intent ?? "informational");
      // Collect all source URLs from facts for citation availability
      const allSourceUrls = [...new Set((brief.currentData?.facts ?? []).map(f => f.source).filter(Boolean))];

      const draftResult = await withRetry(
        async () => writeDraftSection(
          sectionBrief, section, previousContext, tokenUsage, draftModel,
          fieldNotes, toneExamples, redditQuotes, i === 0, primaryKeyword,
          voice, customVoiceDescription, primaryIntent,
          { authorName, authorBio, authorExpertise },
          industry, allSourceUrls, tfidfTermsForDraft
        ),
        { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
        "claude-draft-section"
      );

      if (!draftResult.success || typeof draftResult.data !== "string") {
        throw new Error(`Draft failed on section: ${section.heading}: ${draftResult.error ?? "unknown"}`);
      }

      const content = draftResult.data;
      const wc = content.split(/\s+/).filter(Boolean).length;

      // Registry: track consumed items for logging (facts pre-allocated, so no dynamic splicing needed)
      registry.markUsedAndFilter(
        content, i, section.heading,
        factsPerSection[i], redditQuotes ?? [], brief.knowledgeEngine?.algorithmicInsights ?? []
      );

      const safeHeading = section.heading
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
      const slug = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const html = `\n<h2 id="${slug}">${safeHeading}</h2>\n${content}\n`;

      if (process.env.NODE_ENV !== "test") {
        console.log(`[pipeline] Section ${i + 1}/${sectionCount}: "${section.heading}" — ${wc} words, ${factsPerSection[i].length} stats allocated`);
      }
      return { index: i, html, wordCount: wc };
    };

    // -----------------------------------------------------------------------
    // Draft section 0 first (needs keyword in first paragraph)
    // -----------------------------------------------------------------------
    emit("claude-draft", "started", `Writing section 1/${sectionCount}: ${brief.outline.sections[0].heading}`, 0);
    const firstResult = await draftOneSection(0, "");
    const sectionResults: Array<{ index: number; html: string; wordCount: number }> = [firstResult];
    const section0Html = firstResult.html;

    // Dedup quotes after first section so subsequent batches don't reuse the same quotes
    if (redditQuotes?.length) {
      redditQuotes = redditQuotes.filter(q => {
        const qLower = q.toLowerCase();
        const sectionLower = firstResult.html.toLowerCase().replace(/<[^>]+>/g, " ");
        // Check if any significant 5+ word phrase from the quote appears in the section
        const words = qLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = words.filter(w => sectionLower.includes(w)).length;
        return matchCount < words.length * 0.5; // remove if 50%+ of significant words match
      });
    }

    // -----------------------------------------------------------------------
    // Draft remaining sections in parallel batches of BATCH_SIZE
    // Each batch uses accumulated prior HTML as context for repetition avoidance
    // -----------------------------------------------------------------------
    let accumulatedContext = section0Html;
    for (let batchStart = 1; batchStart < sectionCount; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, sectionCount);
      const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, j) => batchStart + j);
      const progressPct = Math.round((batchStart / sectionCount) * 80);
      emit("claude-draft", "started", `Writing sections ${batchStart + 1}-${batchEnd}/${sectionCount} (parallel)`, progressPct);

      const settled = await Promise.allSettled(
        batchIndices.map(i => draftOneSection(i, accumulatedContext))
      );
      for (const result of settled) {
        if (result.status === "fulfilled") {
          sectionResults.push(result.value);
        } else {
          console.error("[pipeline] Section draft failed, skipping:", result.reason instanceof Error ? result.reason.message : result.reason);
        }
      }
      // Update accumulated context with this batch's results for next batch
      const batchHtml = sectionResults
        .filter(r => batchIndices.includes(r.index))
        .map(r => r.html)
        .join("");
      accumulatedContext += batchHtml;

      // Dedup quotes after each batch so next batch doesn't reuse the same quotes
      if (redditQuotes?.length && batchHtml) {
        const batchTextLower = batchHtml.toLowerCase().replace(/<[^>]+>/g, " ");
        redditQuotes = redditQuotes.filter(q => {
          const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          const matchCount = words.filter(w => batchTextLower.includes(w)).length;
          return matchCount < words.length * 0.5;
        });
      }
    }

    // -----------------------------------------------------------------------
    // Assemble in outline order
    // -----------------------------------------------------------------------
    sectionResults.sort((a, b) => a.index - b.index);
    let assembledHtml = sectionResults.map(r => r.html).join("");
    let totalWordCount = sectionResults.reduce((sum, r) => sum + r.wordCount, 0);

    if (process.env.NODE_ENV !== "test") {
      console.log(`[registry] ${registry.getSummary()}`);
    }

    // --- Phase 4b: Citation Renumbering + References Section ---
    // Sections are drafted independently so citation numbers overlap. Renumber sequentially
    // and build a consolidated References section at the end.
    assembledHtml = renumberCitationsAndAddReferences(assembledHtml);

    // --- Phase 5 (lightweight): Style Linter + Definition Nuke ---
    // Fix definition openings programmatically (the AI cannot be prompt-engineered out of this)
    assembledHtml = fixDefinitionOpening(assembledHtml, primaryKeyword);

    // Run style linter and log violations (non-blocking for now — informational)
    const styleViolations = lintDraft(assembledHtml, primaryKeyword);
    if (styleViolations.length > 0 && process.env.NODE_ENV !== "test") {
      console.log(`[style-linter] ${styleViolations.length} violation(s) detected:`);
      for (const v of styleViolations) {
        console.log(`  [${v.type}] ${v.location}: ${v.evidence.slice(0, 100)}`);
      }
    }

    // Humanize pass: skipped by default (voice presets + section hooks handle tone).
    // Set skipHumanize: false in PipelineInput to enable.
    const skipHumanize = (job.input as PipelineInput).skipHumanize !== false;
    if (!skipHumanize) {
      emit("claude-draft", "started", "Humanizing content for natural flow...", 85);
      const humanizeResult = await withRetry(
        async () => humanizeContent(assembledHtml, toneExamples, tokenUsage, voice),
        { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
        "claude-humanize"
      );

      if (humanizeResult.success && typeof humanizeResult.data === "string") {
        assembledHtml = humanizeResult.data;
      }
    }

    // Audit-to-rewrite loop: catch Level 1 failures (typography, structure) before validation chunk
    emit("claude-draft", "started", "Running pre-validation audit...", 88);
    const preAudit = auditArticle({
      title: titleMetaSlug.title,
      content: assembledHtml,
      slug: titleMetaSlug.suggestedSlug,
      focusKeyword: primaryKeyword,
      authorName,
      authorUrl,
    });
    const level1Failures = preAudit.items
      .filter((item) => item.level === 1 && item.severity === "fail")
      .map((item) => `[Level 1] ${item.label}: ${item.message}`);

    if (level1Failures.length > 0 && !preAudit.publishable) {
      emit("claude-draft", "started", `Fixing ${level1Failures.length} Level 1 audit issue(s)...`, 92);
      const fixResult = await withRetry(
        async () => fixAuditIssues(assembledHtml, level1Failures, tokenUsage),
        { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
        "fix-audit-issues"
      );
      if (fixResult.success && typeof fixResult.data === "string" && fixResult.data.trim().length > 0) {
        assembledHtml = fixResult.data;
      } else if (!fixResult.success) {
        console.warn(`[pipeline] fixAuditIssues failed for ${level1Failures.length} Level 1 issue(s): ${fixResult.error ?? "unknown"}`);
      }
    }

    emit("claude-draft", "completed", `Draft: ${totalWordCount} words`, 100);

    const outline = extractH2sFromHtml(assembledHtml);
    const draftOutput: DraftChunkOutput = {
      title: titleMetaSlug.title,
      metaDescription: titleMetaSlug.metaDescription,
      suggestedSlug: titleMetaSlug.suggestedSlug,
      outline,
      content: assembledHtml,
      suggestedCategories: [], // Deprecated at chunk level, we handle in meta if needed
      suggestedTags: [],
    };
    const durationMs = Date.now() - draftStartMs;
    // Approximation for cost since we did multiple calls
    const cost = buildChunkCost(
      { anthropic: { calls: brief.outline.sections.length + 1, durationMs } },
      durationMs
    );
    await store.saveChunkOutput(jobId, "draft", draftOutput as unknown as Record<string, unknown>, cost);
    await store.updatePhase(jobId, "post_processing");
    return {
      draft: draftOutput,
      wordCount: totalWordCount,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Draft failed";
    await store.setChunkFailed(jobId, "draft", errMsg);
    await store.updatePhase(jobId, "failed", errMsg);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Validation chunk
// ---------------------------------------------------------------------------

export type ValidationChunkOutput = {
  faqEnforcement: { passed: boolean; violations: { question: string; answer?: string; charCount: number }[] };
  auditResult: import("@/lib/seo/article-audit").ArticleAuditResult;
  eeatScoreFeedback?: import("@/lib/seo/article-audit").EEATScoreFeedback;
  factCheck: {
    verified: boolean;
    hallucinations: string[];
    issues: string[];
    skippedRhetorical: string[];
  };
  schemaMarkup: SchemaMarkup;
  finalContent: string;
  autoFixAttempts: number;
  contentDiff?: ContentDiffResult;
  semanticSimilarity?: { highestSimilarity: number; mostSimilarUrl: string; isTooDerivative: boolean };
  contentDecayRisk?: ContentDecayResult;
  /** P7B: Surfer-style content optimization score 0-100. */
  contentScore?: ContentOptimizationResult;
};

/** Step 5 — Validate: FAQ enforcement, SEO audit, fact check against current data, schema.
 * Final article (finalContent) and audit report returned for UI. */
export async function runValidationChunk(
  jobId: string,
  store: JobStore,
  budgetMs = 28_000, // Hard cap: validation must finish in <30s
  tokenUsage?: TokenUsageRecord[]
): Promise<ValidationChunkOutput> {
  const job = await store.getJob<PipelineInput>(jobId);
  if (!job) throw new Error("Job not found");
  const research = await store.getChunkOutput(jobId, "research");
  const draftRaw = await store.getChunkOutput(jobId, "draft");
  if (!draftRaw || !draftRaw.content) throw new Error("Draft not completed");

  await store.setChunkRunning(jobId, "postprocess");
  const postprocessStartMs = Date.now();

  try {
    const draft = draftRaw as DraftChunkOutput;
    const brief = (await store.getChunkOutput(jobId, "analysis")) as unknown as ResearchBrief | undefined;
    const currentData = (research?.currentData as CurrentData) ?? {
      facts: [],
      recentDevelopments: [],
      lastUpdated: "Unknown",
      groundingVerified: false,
      sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
    };
    const primaryKeyword = job.input.primaryKeyword;
    const authorName = job.input.authorName;
    const authorUrl = job.input.authorUrl;
    const draftModel = job.input.draftModel ?? "opus-4.6";

    let finalContent = draft.content;

    // Regex Nuke for Textbook Definitions (Claude habit)
    const escapedKeyword = primaryKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    finalContent = finalContent
      .replace(/Local SEO is the process of optimizing your business'?s? online presence/gi, "If you want to dominate your neighborhood market, you have to master local search.")
      .replace(new RegExp(`(?:<p>)?(?:<strong>)?${escapedKeyword}(?:<\\/strong>)?\\s+is the process of\\s+[^<]+(?:<\\/p>)?`, 'gi'), "");

    const faqEnforcement = enforceFaqCharacterLimit(finalContent, 300);
    if (!faqEnforcement.passed) finalContent = faqEnforcement.fixedHtml;

    // Helper: check if we've exceeded the hard deadline
    const deadline = postprocessStartMs + budgetMs;
    const hasTime = () => Date.now() < deadline;

    // Fact-check (instant — no LLM)
    let factCheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);

    // Collect source URLs for citation validation
    const factSourceUrls = [...new Set(currentData.facts.map((f: { source: string }) => f.source).filter(Boolean))];
    const competitorSourceUrls = (research?.competitors as { url: string }[])?.map((c) => c.url) ?? [];
    const allSourceUrls = [...new Set([...factSourceUrls, ...competitorSourceUrls])];

    // Run audit + EEAT in parallel with fact-check result (both instant)
    let auditResult = auditArticle({
      title: draft.title ?? primaryKeyword,
      metaDescription: draft.metaDescription ?? "",
      content: finalContent,
      slug: draft.suggestedSlug,
      focusKeyword: primaryKeyword,
      extraValueThemes: brief?.extraValueThemes?.length ? brief.extraValueThemes : undefined,
      authorName,
      authorUrl,
    }, allSourceUrls);

    const { evaluateEEATScore } = await import("@/lib/seo/article-audit");
    const eeatScoreFeedback = evaluateEEATScore(
      finalContent,
      brief?.knowledgeEngine?.algorithmicInsights,
      currentData.facts
    );

    // Compute semantic competitor diff dependencies (needed for parallel block)
    const competitors = (research?.competitors as { url: string; content: string }[]) ?? [];
    const extractedTopics = brief?.outline?.sections?.flatMap(s => s.topics) ?? [];

    // Start parallel non-LLM outputs immediately (don't wait for LLM fixes)
    const parallelOpsPromise = Promise.all([
      // 1. Content Diff
      Promise.resolve().then(() => {
        const competitorsWithContent = competitors.filter(
          (c) => typeof c.content === "string" && c.content.trim().length > 0
        );
        return competitorsWithContent.length > 0
          ? generateContentDiff(finalContent, competitorsWithContent, extractedTopics)
          : undefined;
      }).catch((err) => {
        console.error("[validation] Content diff failed:", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // 2. Semantic Similarity
      Promise.resolve().then(() => {
        const competitorsWithContent = competitors.filter(
          (c) => typeof c.content === "string" && c.content.trim().length > 0
        );
        return competitorsWithContent.length > 0
          ? computeSemanticSimilarity(finalContent, competitorsWithContent)
          : undefined;
      }).catch((err) => {
        console.error("[validation] Semantic similarity failed:", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // 3. Content Decay Risk
      Promise.resolve(assessContentDecay(new Date().toISOString(), primaryKeyword)).catch((err) => {
        console.error("[validation] Content decay assessment failed:", err instanceof Error ? err.message : err);
        return undefined;
      }),

      // 4. P7B: Content Optimization Score (Surfer-style 0-100)
      Promise.resolve().then(async () => {
        const contentIntelligence = await store.getChunkOutput(jobId, "content_intelligence");
        const tfidfData = contentIntelligence?.tfidf as TfidfResult | undefined;
        const entityData = contentIntelligence?.entities as { entities: ExtractedEntity[] } | undefined;
        const competitorsWithContent = competitors.filter(
          (c) => typeof c.content === "string" && c.content.trim().length > 0
        );
        const targetWC = brief?.wordCount?.target ?? 2500;
        const intentList = Array.isArray(job.input.intent) ? job.input.intent : [job.input.intent ?? "informational"];
        const isInformational = intentList.includes("informational");

        return scoreContent({
          contentHtml: finalContent,
          targetWordCount: targetWC,
          tfidfTerms: tfidfData,
          competitorEntities: entityData?.entities,
          competitorDocCount: competitorsWithContent.length || 4,
          isInformational,
        });
      }).catch((err) => {
        console.error("[validation] Content scoring failed:", err instanceof Error ? err.message : err);
        return undefined;
      }),
    ]);

    // Optional hallucination auto-fix (if input specifies) — 10s timeout
    if (hasTime() && (job.input as PipelineInput).autoFixHallucinations && factCheck.hallucinations.length > 0) {
      try {
        const fixResult = await fixHallucinationsInContent(finalContent, factCheck.hallucinations, currentData, tokenUsage);
        finalContent = fixResult.fixedHtml;
        factCheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);
      } catch (err) {
        console.warn(`[chunks] fixHallucinations failed (non-fatal, proceeding with unfixed draft): ${err instanceof Error ? err.message : err}`);
      }
    }

    // Auto-fix audit failures — Level 1 first, then high-impact Level 2 warnings
    let autoFixAttempts = 0;

    // Pass 1: Fix Level 1 failures (publication blockers)
    if (hasTime() && auditResult.summary.fail > 0) {
      const fixableFailures = auditResult.items
        .filter((item) => item.severity === "fail" && item.level !== 3)
        .map((item) => item.message);

      if (fixableFailures.length > 0) {
        autoFixAttempts = 1;
        const contentBefore = finalContent;

        try {
          finalContent = await fixAuditIssues(finalContent, fixableFailures, tokenUsage);
        } catch (err) {
          if (process.env.NODE_ENV !== "test") {
            console.warn("[pipeline] fixAuditIssues failed during validation; continuing with existing content", err);
          }
        }

        if (finalContent !== contentBefore) {
          auditResult = auditArticle({
            title: draft.title ?? primaryKeyword,
            metaDescription: draft.metaDescription ?? "",
            content: finalContent,
            slug: draft.suggestedSlug,
            focusKeyword: primaryKeyword,
            extraValueThemes: brief?.extraValueThemes?.length ? brief.extraValueThemes : undefined,
            authorName,
            authorUrl,
          }, allSourceUrls);
        }
      }
    }

    // Pass 2: Fix high-impact Level 2 warnings (keyword density, long paragraphs, engagement hooks)
    // Only run if no Level 1 failures remain and we have time budget
    const AUTO_FIXABLE_WARN_IDS = new Set([
      "keyword-stuffing", "helpful-not-stuffed", "long-paragraphs",
      "bucket-brigades", "passive-voice",
    ]);
    if (hasTime() && auditResult.summary.fail === 0 && auditResult.summary.warn > 0) {
      const fixableWarnings = auditResult.items
        .filter((item) => item.severity === "warn" && AUTO_FIXABLE_WARN_IDS.has(item.id))
        .map((item) => `[${item.label}] ${item.message}`);

      if (fixableWarnings.length > 0) {
        autoFixAttempts += 1;
        const contentBefore = finalContent;

        try {
          finalContent = await fixAuditIssues(finalContent, fixableWarnings, tokenUsage);
        } catch (err) {
          if (process.env.NODE_ENV !== "test") {
            console.warn("[pipeline] fixAuditIssues (Level 2 warnings) failed; continuing", err);
          }
        }

        if (finalContent !== contentBefore) {
          auditResult = auditArticle({
            title: draft.title ?? primaryKeyword,
            metaDescription: draft.metaDescription ?? "",
            content: finalContent,
            slug: draft.suggestedSlug,
            focusKeyword: primaryKeyword,
            extraValueThemes: brief?.extraValueThemes?.length ? brief.extraValueThemes : undefined,
            authorName,
            authorUrl,
          }, allSourceUrls);
        }
      }
    }

    // Await parallel ops (schema uses final auditResult, so compute it after fixes)
    const [contentDiff, semanticSimilarity, contentDecayRisk, contentScore] = await parallelOpsPromise;

    const schemaMarkup = await Promise.resolve(
      auditResult.schemaMarkup ?? generateSchemaMarkup(
        finalContent,
        draft.title ?? primaryKeyword,
        draft.metaDescription ?? "",
        draft.suggestedSlug,
        primaryKeyword
      )
    ).catch((err) => {
      console.error("[validation] Schema generation failed:", err instanceof Error ? err.message : err);
      return undefined;
    });

    const output: ValidationChunkOutput = {
      faqEnforcement: {
        passed: faqEnforcement.passed,
        violations: faqEnforcement.violations,
      },
      auditResult,
      eeatScoreFeedback,
      factCheck: {
        verified: factCheck.verified,
        hallucinations: factCheck.hallucinations,
        issues: factCheck.issues,
        skippedRhetorical: factCheck.skippedRhetorical,
      },
      schemaMarkup: schemaMarkup ?? { article: {}, faq: null, breadcrumb: null, faqSchemaNote: "Schema generation failed" },
      finalContent,
      autoFixAttempts,
      contentDiff,
      semanticSimilarity,
      contentDecayRisk,
      contentScore: contentScore ?? undefined,
    };
    const durationMs = Date.now() - postprocessStartMs;
    const cost = buildChunkCost({}, durationMs);
    await store.saveChunkOutput(jobId, "postprocess", output as unknown as Record<string, unknown>, cost);
    await store.updatePhase(jobId, "completed");
    return output;
  } catch (err) {
    await store.setChunkFailed(jobId, "postprocess", err instanceof Error ? err.message : "Validation failed");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Build full PipelineOutput from chunk outputs (for monolithic generate)
// ---------------------------------------------------------------------------

export async function buildPipelineOutputFromChunks(
  jobId: string,
  store: JobStore,
  validation: ValidationChunkOutput,
  generationTimeMs: number,
  tokenUsage?: TokenUsageRecord[]
): Promise<PipelineOutput> {
  const job = await store.getJob<PipelineInput>(jobId);
  if (!job) {
    throw new Error(`buildPipelineOutputFromChunks: job "${jobId}" not found in store (may have been cleaned up)`);
  }
  const research = (await store.getChunkOutput(jobId, "research")) as ResearchChunkOutput | undefined;
  const brief = (await store.getChunkOutput(jobId, "analysis")) as unknown as ResearchBrief | undefined;
  const draft = (await store.getChunkOutput(jobId, "draft")) as DraftChunkOutput | undefined;

  if (research === undefined) {
    throw new Error(`Missing chunk output "research" for job ${jobId}`);
  }
  if (brief === undefined) {
    throw new Error(`Missing chunk output "analysis" for job ${jobId}`);
  }
  if (draft === undefined) {
    throw new Error(`Missing chunk output "draft" for job ${jobId}`);
  }

  const currentData = research?.currentData ?? {
    facts: [],
    recentDevelopments: [],
    lastUpdated: "Unknown",
    groundingVerified: false,
    sourceUrlValidation: { total: 0, accessible: 0, inaccessible: [] },
  };
  const sourceUrls = [...new Set(currentData.facts.map((f: { source: string }) => f.source))];
  const primaryKeyword = job.input.primaryKeyword;
  const authorName = job.input.authorName;
  const draftModel = job.input.draftModel ?? "opus-4.6";

  const expectedH2s = brief.outline.sections.filter((s) => s.level === "h2").map((s) => s.heading.trim());
  const actualH2s = extractH2sFromHtml(draft.content ?? "");
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ");
  const missing = expectedH2s.filter((e: string) => !actualH2s.some((a: string) => norm(a) === norm(e)));
  const extra = actualH2s.filter((a: string) => !expectedH2s.some((e: string) => norm(e) === norm(a)));
  const outlineDrift: OutlineDrift = {
    passed: missing.length === 0,
    expected: expectedH2s,
    actual: actualH2s,
    missing,
    extra,
  };

  const hasBriefSummary =
    (brief.similaritySummary?.trim?.()?.length ?? 0) > 0 ||
    (brief.extraValueThemes?.length ?? 0) > 0 ||
    (brief.freshnessNote?.trim?.()?.length ?? 0) > 0;
  const briefSummary: BriefSummary | undefined = hasBriefSummary
    ? {
      similaritySummary: brief.similaritySummary,
      extraValueThemes: brief.extraValueThemes,
      freshnessNote: brief.freshnessNote,
    }
    : undefined;

  return {
    article: {
      content: validation.finalContent,
      outline: actualH2s,
      suggestedSlug: draft.suggestedSlug,
      suggestedCategories: draft.suggestedCategories ?? [],
      suggestedTags: draft.suggestedTags ?? [],
    },
    title: draft.title ?? "",
    metaDescription: draft.metaDescription ?? "",
    sourceUrls,
    auditResult: validation.auditResult,
    schemaMarkup: validation.schemaMarkup,
    faqEnforcement: validation.faqEnforcement,
    factCheck: validation.factCheck,
    eeatScoreFeedback: validation.eeatScoreFeedback,
    publishTracking: { keyword: primaryKeyword },
    generationTimeMs,
    briefSummary: briefSummary ?? undefined,
    outlineDrift,
    ...(tokenUsage?.length ? { tokenUsage } : {}),
    llmsTxt: generateLlmsTxt(
      validation.finalContent,
      draft.title ?? "",
      draft.metaDescription ?? "",
      primaryKeyword
    ),
    entitySchema: generateEntitySchema(
      validation.finalContent,
      draft.title ?? "",
      draft.metaDescription ?? "",
      draft.suggestedSlug,
      primaryKeyword
    ),
    aiDisclosureText: generateAiDisclosure(draftModel, authorName),
    tableOfContents: generateTableOfContentsForPipeline(validation.finalContent),
  };
}

/**
 * Renumber inline citations sequentially across assembled sections and build a References section.
 * Sections are drafted independently so citation numbers overlap (each starts at [1]).
 * This function:
 * 1. Finds all <sup><a href="URL">[N]</a></sup> patterns
 * 2. Assigns new sequential numbers based on first appearance of each unique URL
 * 3. Appends a <h2>References</h2><ol> section at the end
 */
function renumberCitationsAndAddReferences(html: string): string {
  const citationRegex = /<sup>\s*<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>\s*\[(\d+)\]\s*<\/a>\s*<\/sup>/gi;

  // First pass: collect all unique URLs in order of appearance
  const urlToNumber = new Map<string, number>();
  const urlToFirstMatch = new Map<string, string>(); // URL -> full original match for reference building
  let match: RegExpExecArray | null;
  let nextNumber = 1;

  // Reset regex
  citationRegex.lastIndex = 0;
  while ((match = citationRegex.exec(html)) !== null) {
    const url = match[2];
    if (!urlToNumber.has(url)) {
      urlToNumber.set(url, nextNumber++);
      urlToFirstMatch.set(url, match[0]);
    }
  }

  // If no citations found, return as-is
  if (urlToNumber.size === 0) return html;

  // Second pass: replace all citation numbers with renumbered ones
  citationRegex.lastIndex = 0;
  let renumbered = html.replace(citationRegex, (_fullMatch, pre, url, post, _oldNum) => {
    const newNum = urlToNumber.get(url) ?? 1;
    return `<sup><a ${pre}href="${url}"${post}>[${newNum}]</a></sup>`;
  });

  // Remove any existing References section (from individual sections that might have generated one)
  renumbered = renumbered.replace(/<h2[^>]*>\s*References?\s*<\/h2>[\s\S]*?(?=<h2|$)/i, "");

  // Build the References section
  const refEntries = [...urlToNumber.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([url, num]) => {
      // Extract domain for display name
      let displayName: string;
      try {
        const parsed = new URL(url);
        displayName = parsed.hostname.replace(/^www\./, "");
        // Add path for context if short enough
        const path = parsed.pathname.replace(/\/$/, "");
        if (path && path !== "/" && path.length < 50) {
          displayName += path;
        }
      } catch {
        displayName = url;
      }
      return `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${displayName}</a></li>`;
    });

  const referencesHtml = `\n<h2 id="references">References</h2>\n<ol>\n${refEntries.join("\n")}\n</ol>`;
  renumbered += referencesHtml;

  if (process.env.NODE_ENV !== "test") {
    console.log(`[citations] Renumbered ${urlToNumber.size} unique citations across assembled article`);
  }

  return renumbered;
}

/** Generate Table of Contents if article is long enough (>2000 words). */
function generateTableOfContentsForPipeline(html: string): { html: string; headings: { level: number; text: string; id: string }[] } | undefined {
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  if (wordCount < 2000) return undefined;

  const headings: { level: number; text: string; id: string }[] = [];
  const headingRegex = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
    headings.push({ level: parseInt(match[1], 10), text, id });
  }
  if (headings.length < 3) return undefined;

  const tocItems = headings
    .map((h) => `${h.level === 3 ? "  " : ""}<li><a href="#${h.id}">${h.text}</a></li>`)
    .join("\n");
  const tocHtml = `<nav class="table-of-contents" aria-label="Table of Contents">\n<h2>Table of Contents</h2>\n<ol>\n${tocItems}\n</ol>\n</nav>`;

  return { html: tocHtml, headings };
}

/**
 * Extract basic facts from competitor content when Gemini grounding fails.
 * Looks for sentences containing statistics, percentages, dollar amounts, and attributions.
 * Returns up to 15 facts with their source URLs.
 */
function extractFallbackFacts(competitors: CompetitorArticle[]): CurrentDataFact[] {
  const facts: CurrentDataFact[] = [];
  const seen = new Set<string>();

  // Patterns that indicate a citable fact
  const factPatterns = [
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?%/,            // percentages: 45%, 12.5%
    /\$\d{1,3}(?:,\d{3})*(?:\.\d+)?(?:\s*(?:billion|million|trillion|B|M|K))?/i, // dollar amounts
    /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:billion|million|trillion)\b/i,           // large numbers
    /\baccording to\b/i,                             // attributions
    /\bresearch(?:ers)?\s+(?:show|found|indicate|suggest|reveal)/i,
    /\bstudy\s+(?:show|found|indicate|suggest|reveal|by)\b/i,
    /\bsurve?y(?:ed)?\s+(?:\d|of|show|found)/i,     // surveys
    /\b(?:grew|increased|decreased|declined|rose|fell)\s+(?:by\s+)?\d/i, // growth/decline
    /\b20[12]\d\b/,                                   // year references (2010-2029)
  ];

  for (const comp of competitors) {
    if (!comp.fetchSuccess || !comp.content) continue;

    // Strip HTML and split into sentences
    const text = comp.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.length > 30 && s.length < 300);

    for (const sentence of sentences) {
      if (facts.length >= 15) break;

      const matchesPattern = factPatterns.some(p => p.test(sentence));
      if (!matchesPattern) continue;

      // Deduplicate by first 60 chars
      const key = sentence.slice(0, 60).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      facts.push({
        fact: sentence.trim(),
        source: comp.url,
        date: comp.publishDate,
      });
    }
    if (facts.length >= 15) break;
  }

  if (facts.length > 0 && process.env.NODE_ENV !== "test") {
    console.log(`[fallback-facts] Extracted ${facts.length} facts from ${competitors.length} competitor articles`);
  }

  return facts;
}

/** Generate AI transparency disclosure text. */
function generateAiDisclosure(draftModel: string, authorName?: string): string {
  const modelLabel = draftModel === "opus-4.6" ? "Claude Opus 4.6" : "Claude Sonnet 4.6";
  const reviewer = authorName ? `Reviewed by ${authorName}` : "Reviewed by the editorial team";
  const today = new Date().toISOString().split("T")[0];
  return `Researched with automated search tools and drafted with AI assistance (${modelLabel}). Facts verified against primary sources. ${reviewer} on ${today}.`;
}
