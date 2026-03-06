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
import { RETRY_FAST, RETRY_STANDARD_FAST, RETRY_CLAUDE_DRAFT } from "./types";
import { searchCompetitorUrlsWithPaa, searchRedditDiscussions, type RedditThread, type PaaItem } from "@/lib/serper/client";
import { fetchCompetitorContent } from "@/lib/jina/reader";
import { fetchCurrentData, extractQuotesFromReddit } from "@/lib/gemini/client";
import {
  extractTopicsAndStyle,
  buildResearchBrief,
  type WordCountOverride,
} from "@/lib/openai/client";
import { writeDraft, writeDraftSection, humanizeContent, fixAuditIssues, fixHallucinationsInContent } from "@/lib/claude/client";
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
  cap(requestedMs: number): number {
    const remaining = this.remaining();
    if (remaining < 10_000) return Math.max(remaining - 2_000, 1_000);
    const capped = Math.min(requestedMs, remaining - 5_000);
    return Math.max(capped, 5_000);
  }
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

  const urls = selectedUrls.slice(0, DEFAULT_MAX_COMPETITOR_URLS);

  // Load Step 1 data so we can include PAA, SERP features, Reddit threads in research chunk and result
  const researchSerp = await store.getChunkOutput(jobId, "research_serp") as
    | { paaQuestions?: string[]; paaItems?: PaaItem[]; serpFeatures?: SerpFeatures; redditThreads?: RedditThread[] }
    | undefined;
  const paaFromSerp = researchSerp?.paaQuestions;
  const paaItemsFromSerp = researchSerp?.paaItems;
  const serpFeaturesFromSerp = researchSerp?.serpFeatures;
  const redditThreadsFromSerp = researchSerp?.redditThreads;

  // Idempotency: if we already have a research chunk for the same URLs, return it
  const existing = await store.getChunkOutput(jobId, "research") as ResearchChunkOutput | undefined;
  if (existing?.serpResults?.length) {
    const existingUrls = [...existing.serpResults.map((s) => s.url)].sort();
    const requestedUrls = [...urls].sort();
    if (existingUrls.length === requestedUrls.length && existingUrls.every((u, i) => u === requestedUrls[i])) {
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
  const accessibleCount = urlValidation.filter((v) => v.isAccessible).length;
  if (urlValidation.length > 0 && accessibleCount === 0) {
    throw new Error("Selected URLs are not accessible");
  }
  if (urlValidation.length > 0 && accessibleCount < urlValidation.length) {
    logResearchFetch("info", { event: "research_fetch_url_validation", jobId, accessible: accessibleCount, total: urlValidation.length });
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
        { ...RETRY_FAST, timeoutMs: budget.cap(RETRY_FAST.timeoutMs) },
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
      return await searchRedditDiscussions(primaryKeyword, 3);
    })(),
  ]);
  metrics?.recordApiCall("jina", jinaDurationMs, { endpoint: "fetch" });
  metrics?.recordApiCall("gemini", geminiDurationMs, { endpoint: "grounding" });

  let redditQuotes: string[] = [];
  if (redditThreads.length > 0) {
    emit("gemini-grounding", "started", "Extracting Reddit quotes...", 40);
    redditQuotes = await extractQuotesFromReddit(primaryKeyword, redditThreads);
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
  if (articleCount === 0) {
    const message = "We couldn't fetch content from the selected links. Try different sources or retry.";
    await store.setChunkFailed(jobId, "research", message);
    logResearchFetch("error", { event: "research_fetch_failed", jobId, reason: "no_articles_fetched", durationMs: Date.now() - researchStartMs });
    throw new Error(message);
  }

  emit("jina", jinaResult.success ? "completed" : "failed", `${articleCount} articles fetched`, 50);
  emit("gemini-grounding", groundingResult.success ? "completed" : "failed", `${currentData.facts.length} current data facts`, 50);

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

  const serpResults: SerpResult[] = urls.map((url, i) => ({
    url,
    title: competitors[i]?.title ?? url,
    position: i + 1,
    snippet: "",
    isArticle: true,
  }));
  const output: ResearchChunkOutput = {
    serpResults,
    competitors,
    currentData,
    redditQuotes,
    paaQuestions: paaFromSerp,
    paaItems: paaItemsFromSerp,
    serpFeatures: serpFeaturesFromSerp,
    redditThreads: redditThreadsFromSerp ?? redditThreads,
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
          { ...RETRY_FAST, timeoutMs: budget.cap(RETRY_FAST.timeoutMs) },
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

    emit(
      "jina",
      jinaResult.success ? "completed" : "failed",
      `${competitors.filter((c) => c.fetchSuccess).length} articles fetched`,
      15
    );
    emit(
      "gemini-grounding",
      groundingResult.success ? "completed" : "failed",
      `${currentData.facts.length} current data facts`,
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

    const output: ResearchChunkOutput = { serpResults, competitors, currentData, paaQuestions };
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

export type BriefChunkOptions = {
  /** When true, use wordCountTarget instead of job input for word count override. */
  revise?: boolean;
  /** New target word count (500–6000). Required when revise is true. */
  wordCountTarget?: number;
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
    | { competitorUrlHash?: string; extraction?: TopicExtractionResult }
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
      await store.saveChunkOutput(jobId, "topic_extraction", {
        competitorUrlHash,
        extraction: topicExtraction,
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

  try {

    const wordCountOverride =
      options?.revise && typeof options?.wordCountTarget === "number" && options.wordCountTarget >= 500 && options.wordCountTarget <= 6000
        ? {
          target: Math.round(options.wordCountTarget),
          note: "Guideline only. Strong value: provide more value than competitors; length is secondary.",
        }
        : undefined;
    // Step 3 — Brief: GPT-4.1 builds outline, H2/H3; word count from extraction (user can change in brief section)
    emit("gpt-brief", "started", options?.revise ? "Revising brief with new word count..." : "Building strategic research brief...", 30);
    const briefResult = await withRetry(
      async () => buildResearchBrief(topicExtraction, currentData, input, wordCountOverride, tokenUsage),
      { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(60000) },
      "gpt-brief"
    );
    if (!briefResult.success || !briefResult.data) {
      emit("gpt-brief", "failed", briefResult.error ?? "research brief failed", 40);
      throw new Error(`Research brief failed: ${briefResult.error ?? "unknown"}`);
    }
    const brief: ResearchBrief = briefResult.data;
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
  const redditQuotes = research?.redditQuotes;

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
    const draftModel = (job.input as PipelineInput).draftModel ?? "opus-4.6";
    const fieldNotes = (job.input as PipelineInput).fieldNotes;
    const toneExamples = (job.input as PipelineInput).toneExamples;

    emit("claude-draft", "started", "Writing article draft section by section...", 0);

    let assembledHtml = "";
    let totalWordCount = 0;

    for (let i = 0; i < brief.outline.sections.length; i++) {
      const section = brief.outline.sections[i];
      const progressPct = Math.round((i / brief.outline.sections.length) * 80);
      emit("claude-draft", "started", `Writing section ${i + 1}/${brief.outline.sections.length}: ${section.heading}`, progressPct);

      const draftResult = await withRetry(
        async () => writeDraftSection(
          brief,
          section,
          assembledHtml,
          tokenUsage,
          draftModel,
          fieldNotes,
          toneExamples,
          redditQuotes,
          i === 0,
          primaryKeyword
        ),
        { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
        "claude-draft-section"
      );

      if (!draftResult.success || typeof draftResult.data !== "string") {
        emit("claude-draft", "failed", draftResult.error ?? `Draft failed on section: ${section.heading}`, progressPct);
        throw new Error(`Draft failed on section: ${section.heading}: ${draftResult.error ?? "unknown"}`);
      }

      const sectionContent = draftResult.data;
      const sectionWordCount = sectionContent.split(/\s+/).filter(Boolean).length;
      totalWordCount += sectionWordCount;

      // Inject the H2 heading and the content
      const slug = section.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      assembledHtml += `\n<h2 id="${slug}">${section.heading}</h2>\n${sectionContent}\n`;
    }

    emit("claude-draft", "started", "Humanizing content for natural flow...", 85);
    const humanizeResult = await withRetry(
      async () => humanizeContent(assembledHtml, toneExamples, tokenUsage),
      { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
      "claude-humanize"
    );

    if (humanizeResult.success && typeof humanizeResult.data === "string") {
      assembledHtml = humanizeResult.data;
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
    const cost = buildChunkCost({ anthropic: { calls: brief.outline.sections.length + 1, durationMs }, openai: { calls: 1 } }, durationMs);
    await store.saveChunkOutput(jobId, "draft", draftOutput as unknown as Record<string, unknown>, cost);
    await store.updatePhase(jobId, "post_processing");
    return {
      draft: draftOutput,
      wordCount: totalWordCount,
    };
  } catch (err) {
    await store.setChunkFailed(jobId, "draft", err instanceof Error ? err.message : "Draft failed");
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Validation chunk
// ---------------------------------------------------------------------------

export type ValidationChunkOutput = {
  faqEnforcement: { passed: boolean; violations: { question: string; answer?: string; charCount: number }[] };
  auditResult: import("@/lib/seo/article-audit").ArticleAuditResult;
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
};

/** Step 5 — Validate: FAQ enforcement, SEO audit, fact check against current data, schema.
 * Final article (finalContent) and audit report returned for UI. */
export async function runValidationChunk(
  jobId: string,
  store: JobStore,
  budgetMs = 45_000 // Increased budget for possible auto-fix
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

    let finalContent = draft.content;

    // Regex Nuke for Textbook Definitions (Claude habit)
    finalContent = finalContent
      .replace(/Local SEO is the process of optimizing your business'?s? online presence/gi, "If you want to dominate your neighborhood market, you have to master local search.")
      .replace(new RegExp(`(?:<p>)?(?:<strong>)?${primaryKeyword}(?:<\\/strong>)?\\s+is the process of\\s+[^<]+(?:<\\/p>)?`, 'gi'), "");

    const faqEnforcement = enforceFaqCharacterLimit(finalContent, 300);
    if (!faqEnforcement.passed) finalContent = faqEnforcement.fixedHtml;

    // Optional fact-check auto-fix (if input specifies)
    let factCheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);
    if ((job.input as PipelineInput).autoFixHallucinations && factCheck.hallucinations.length > 0) {
      const fixResult = await fixHallucinationsInContent(finalContent, factCheck.hallucinations, currentData);
      finalContent = fixResult.fixedHtml;
      // Re-run fact check after fixes
      factCheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);
    }

    // Run audit
    let auditResult = auditArticle({
      title: draft.title ?? primaryKeyword,
      metaDescription: draft.metaDescription ?? "",
      content: finalContent,
      slug: draft.suggestedSlug,
      focusKeyword: primaryKeyword,
      extraValueThemes: brief?.extraValueThemes?.length ? brief.extraValueThemes : undefined,
    });

    // Auto-fix loop for editorial/SEO failures
    let autoFixAttempts = 0;
    const MAX_FIX_ATTEMPTS = 2;

    while (autoFixAttempts < MAX_FIX_ATTEMPTS && auditResult.summary.fail > 0) {
      const fixableFailures = auditResult.items
        .filter(item => item.severity === "fail" && item.level !== 3)
        .map(item => item.message);

      if (fixableFailures.length === 0) break;

      autoFixAttempts++;
      // Provide tokenUsage tracking if we had it in scope (passing undefined for now since runValidationChunk signature doesn't take it)
      finalContent = await fixAuditIssues(finalContent, fixableFailures);

      // Re-audit
      auditResult = auditArticle({
        title: draft.title ?? primaryKeyword,
        metaDescription: draft.metaDescription ?? "",
        content: finalContent,
        slug: draft.suggestedSlug,
        focusKeyword: primaryKeyword,
        extraValueThemes: brief?.extraValueThemes?.length ? brief.extraValueThemes : undefined,
      });
    }

    const schemaMarkup: SchemaMarkup =
      auditResult.schemaMarkup ??
      generateSchemaMarkup(
        finalContent,
        draft.title ?? primaryKeyword,
        draft.metaDescription ?? "",
        draft.suggestedSlug,
        primaryKeyword
      );

    // Compute semantic competitor diff
    const competitors = (research?.competitors as { url: string; content: string }[]) ?? [];
    const extractedTopics = brief?.outline?.sections?.flatMap(s => s.topics) ?? [];
    let contentDiff: ContentDiffResult | undefined;
    let semanticSimilarity: { highestSimilarity: number; mostSimilarUrl: string; isTooDerivative: boolean } | undefined;

    if (competitors.length > 0) {
      contentDiff = generateContentDiff(finalContent, competitors, extractedTopics);
      semanticSimilarity = computeSemanticSimilarity(finalContent, competitors);
    }

    // Assess content decay risk based on the primary keyword (simulating topic category)
    const contentDecayRisk = assessContentDecay(new Date().toISOString(), primaryKeyword);

    const output: ValidationChunkOutput = {
      faqEnforcement: {
        passed: faqEnforcement.passed,
        violations: faqEnforcement.violations,
      },
      auditResult,
      factCheck: {
        verified: factCheck.verified,
        hallucinations: factCheck.hallucinations,
        issues: factCheck.issues,
        skippedRhetorical: factCheck.skippedRhetorical,
      },
      schemaMarkup,
      finalContent,
      autoFixAttempts,
      contentDiff,
      semanticSimilarity,
      contentDecayRisk,
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
  };
}
