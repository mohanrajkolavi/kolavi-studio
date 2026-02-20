/**
 * Blog Generator Pipeline v3 — Orchestrator.
 * Coordinates all 7 steps across Serper, Jina, Gemini, OpenAI, Claude, and TypeScript audit:
 *   1. Search & fetch (Serper + Jina + Gemini grounding, parallel)
 *   2. Topic extraction (OpenAI) + URL validation (parallel)
 *   3. Strategic brief (GPT-4.1)
 *   4. Write draft (Claude)
 *   5. FAQ enforcement (TypeScript)
 *   6. SEO audit + schema (TypeScript)
 *   7. Fact check (TypeScript)
 */

import {
  type PipelineInput,
  type PipelineOutput,
  type BriefSummary,
  type OutlineDrift,
  type SerpResult,
  type CompetitorArticle,
  type CurrentData,
  type TopicExtractionResult,
  type ResearchBrief,
  type StepResult,
  type RetryConfig,
  type ValidatedSourceUrl,
  type SchemaMarkup,
  type TokenUsageRecord,
  getDefaultWordCountForIntent,
  RETRY_FAST,
  RETRY_STANDARD,
  RETRY_STANDARD_FAST,
  RETRY_EXPENSIVE,
  RETRY_CLAUDE_DRAFT,
} from "@/lib/pipeline/types";
import { searchCompetitorUrlsWithPaa } from "@/lib/serper/client";
import { fetchCompetitorContent } from "@/lib/jina/reader";
import { fetchCurrentData } from "@/lib/gemini/client";
import { extractTopicsAndStyle, buildResearchBrief } from "@/lib/openai/client";
import { writeDraft, fixHallucinationsInContent } from "@/lib/claude/client";
import {
  auditArticle,
  generateSchemaMarkup,
  enforceFaqCharacterLimit,
  extractH2sFromHtml,
  verifyFactsAgainstSource,
} from "@/lib/seo/article-audit";

export type { PipelineInput, PipelineOutput };

import { createPipelineMetricsCollector } from "@/lib/pipeline/metrics";

// ---------------------------------------------------------------------------
// Progress callback for SSE streaming
// ---------------------------------------------------------------------------

export type PipelineStep =
  | "serper"
  | "jina"
  | "gemini-grounding"
  | "topic-extraction"
  | "url-validation"
  | "gpt-brief"
  | "claude-draft"
  | "faq-enforcement"
  | "audit"
  | "fact-check"
  | "done";

export type PipelineProgressEvent = {
  step: PipelineStep;
  status: "started" | "completed" | "failed" | "skipped";
  message: string;
  elapsedMs: number;
  /** 0-100 estimated progress */
  progress: number;
};

export type ProgressCallback = (event: PipelineProgressEvent) => void;

/** Default number of competitor URLs to fetch (Serper + Jina). Callers can override. */
const DEFAULT_MAX_COMPETITOR_URLS = 3;

// ---------------------------------------------------------------------------
// Time-budget helper: caps per-step timeout so we never exceed route budget
// ---------------------------------------------------------------------------

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
  /** Return the lesser of requested timeout and remaining budget (minus 5s safety margin). */
  cap(requestedMs: number): number {
    const remaining = this.remaining();
    // If less than 10s left, don't allocate time (the 5s floor would violate the safety margin)
    if (remaining < 10_000) return Math.max(remaining - 2_000, 1_000);
    const capped = Math.min(requestedMs, remaining - 5_000);
    return Math.max(capped, 5_000); // floor at 5s so a step can at least try
  }
  isExhausted(): boolean {
    return this.remaining() <= 10_000; // <10s left = exhausted
  }
}

/**
 * Generic retry wrapper with timeout. Returns StepResult<T>.
 * Timeout is enforced via Promise.race (clients may not support AbortSignal).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  stepName: string
): Promise<StepResult<T>> {
  const { maxRetries, retryDelayMs, timeoutMs, retryOn } = config;
  let lastError: unknown;
  let retryCount = 0;
  const start = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let timerId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timerId = setTimeout(() => reject(new Error(`Step ${stepName} timed out after ${timeoutMs}ms`)), timeoutMs);
      });
      const data = await Promise.race([fn(), timeoutPromise]);
      clearTimeout(timerId);
      return {
        success: true,
        data,
        error: null,
        durationMs: Date.now() - start,
        retryCount: attempt,
      };
    } catch (err) {
      clearTimeout(timerId);
      lastError = err;
      const isTimeout =
        err instanceof Error &&
        (err.name === "AbortError" || err.message?.includes("timeout") || err.message?.includes("timed out"));
      const is429 =
        err && typeof err === "object" && "status" in err && (err as { status: number }).status === 429;
      const is5xx =
        err && typeof err === "object" && "status" in err && (err as { status: number }).status >= 500;

      const shouldRetry =
        (isTimeout && retryOn.includes("timeout")) ||
        (is429 && retryOn.includes("rate_limit")) ||
        (is5xx && retryOn.includes("server_error"));

      if (shouldRetry && attempt < maxRetries) {
        retryCount = attempt + 1;
        const delay = is429 ? retryDelayMs * 2 : retryDelayMs;
        if (process.env.NODE_ENV !== "test") {
          console.warn(
            `[pipeline] Step ${stepName}: attempt ${attempt + 1}/${maxRetries + 1} failed, retrying in ${delay}ms`,
            err
          );
        }
        await new Promise((r) => setTimeout(r, delay));
      } else {
        break;
      }
    }
  }

  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  return {
    success: false,
    data: null,
    error: errorMessage,
    durationMs: Date.now() - start,
    retryCount,
  };
}

/**
 * Validate source URLs via HEAD. Returns ValidatedSourceUrl[].
 */
export async function validateSourceUrls(urls: string[]): Promise<ValidatedSourceUrl[]> {
  const unique = [...new Set(urls)].filter((u) => u.startsWith("http"));
  const results = await Promise.allSettled(
    unique.map(async (url): Promise<ValidatedSourceUrl> => {
      try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        const isAccessible = res.ok || (res.status >= 300 && res.status < 400);
        return {
          url,
          isAccessible,
          statusCode: res.status,
          checkedAt: new Date().toISOString(),
        };
      } catch {
        return {
          url,
          isAccessible: false,
          statusCode: null,
          checkedAt: new Date().toISOString(),
        };
      }
    })
  );
  const out: ValidatedSourceUrl[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") out.push(r.value);
  }
  const accessible = out.filter((v) => v.isAccessible).length;
  if (process.env.NODE_ENV !== "test") {
    console.log(`[pipeline] Source URLs validated: ${accessible}/${out.length} accessible`);
  }
  return out;
}

/**
 * Run the full 7-step blog generator pipeline.
 * @param onProgress – optional SSE progress callback
 * @param budgetMs  – total time budget for the pipeline (default 270s)
 */
export async function runPipeline(
  input: PipelineInput,
  onProgress?: ProgressCallback,
  budgetMs = 270_000,
): Promise<PipelineOutput> {
  const startTotal = Date.now();
  const tokenUsage: TokenUsageRecord[] = [];
  const metrics = createPipelineMetricsCollector();
  const runId = `orch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  metrics.startRun(runId, input.primaryKeyword?.trim() ?? "");
  const budget = new TimeBudget(budgetMs);
  const emit = (
    step: PipelineStep,
    status: PipelineProgressEvent["status"],
    message: string,
    progress: number,
  ) => {
    onProgress?.({ step, status, message, elapsedMs: budget.elapsed(), progress });
  };

  const primaryKeyword = input.primaryKeyword?.trim() || "";
  if (!primaryKeyword) {
    throw new Error("primaryKeyword is required");
  }

  // --- Step 1: SERP research (Serper + PAA for gap analysis) ---
  metrics.startChunk("serper");
  emit("serper", "started", "Searching competitors...", 0);
  const serperStartMs = Date.now();
  const serperResult = await withRetry(
    async () => searchCompetitorUrlsWithPaa(primaryKeyword, DEFAULT_MAX_COMPETITOR_URLS),
    { ...RETRY_FAST, timeoutMs: budget.cap(RETRY_FAST.timeoutMs) },
    "serper"
  );
  metrics.recordApiCall("serper", Date.now() - serperStartMs, { endpoint: "search" });
  metrics.endChunk("serper", "completed");
  const serpResults: SerpResult[] =
    serperResult.success && serperResult.data ? serperResult.data.results : [];
  const paaQuestions: string[] =
    serperResult.success && serperResult.data ? serperResult.data.paaQuestions : [];
  const urls = serpResults.map((s) => s.url).slice(0, DEFAULT_MAX_COMPETITOR_URLS);
  emit("serper", "completed", `Found ${urls.length} URLs, ${paaQuestions.length} PAA questions`, 5);

  // --- Step 2: Jina (scrape) + Gemini (current data with search grounding) in parallel ---
  emit("jina", "started", "Fetching competitor articles...", 5);
  emit("gemini-grounding", "started", "Gathering current data...", 5);
  let jinaDurationMs = 0;
  let geminiDurationMs = 0;
  const [jinaResult, groundingResult] = await Promise.all([
    (async () => {
      metrics.startChunk("jina");
      const t0 = Date.now();
      const r = await withRetry(
        async () => fetchCompetitorContent(urls, DEFAULT_MAX_COMPETITOR_URLS),
        { ...RETRY_FAST, timeoutMs: budget.cap(RETRY_FAST.timeoutMs) },
        "jina"
      );
      jinaDurationMs = Date.now() - t0;
      metrics.recordApiCall("jina", jinaDurationMs, { endpoint: "fetch" });
      metrics.endChunk("jina", "completed");
      return r;
    })(),
    (async () => {
      metrics.startChunk("gemini-grounding");
      const t0 = Date.now();
      const r = await withRetry(
        async () => fetchCurrentData(primaryKeyword, input.secondaryKeywords ?? []),
        { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(RETRY_STANDARD_FAST.timeoutMs) },
        "gemini-grounding"
      );
      geminiDurationMs = Date.now() - t0;
      metrics.recordApiCall("gemini", geminiDurationMs, { endpoint: "grounding" });
      metrics.endChunk("gemini-grounding", "completed");
      return r;
    })(),
  ]);

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

  emit("jina", jinaResult.success ? "completed" : "failed",
    `${competitors.filter((c) => c.fetchSuccess).length} articles fetched`, 15);
  emit("gemini-grounding", groundingResult.success ? "completed" : "failed",
    `${currentData.facts.length} current data facts`, 15);

  // --- Step 2 continued: topic extraction (GPT-4.1) + source URL validation in parallel ---
  metrics.startChunk("topic-extraction");
  let topicExtractionTokenStart = tokenUsage.length;
  emit("topic-extraction", "started", "Analyzing competitor topics & style...", 20);
  const extractionPromise = withRetry(
    async () => extractTopicsAndStyle(competitors, { tokenUsage, paaQuestions }),
    { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(60000) },
    "topic-extraction"
  );
  const validationPromise =
    currentData.facts.length > 0
      ? validateSourceUrls(currentData.facts.map((f) => f.source))
      : Promise.resolve([] as ValidatedSourceUrl[]);

  const [extractionResult, validated] = await Promise.all([extractionPromise, validationPromise]);

  // Merge validation into currentData (filter facts to accessible URLs only)
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

  if (!currentData.groundingVerified && process.env.NODE_ENV !== "test") {
    console.warn("[pipeline] Gemini grounding may not be active — data may be from training data.");
  }

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 1 complete: ${competitors.filter((c) => c.fetchSuccess).length} competitors, ${currentData.facts.length} current data facts`
    );
  }

  if (!extractionResult.success || !extractionResult.data) {
    metrics.endChunk("topic-extraction", "failed");
    emit("topic-extraction", "failed", extractionResult.error ?? "topic extraction failed", 25);
    throw new Error(`Step 2 failed: ${extractionResult.error ?? "topic extraction failed"}`);
  }
  metrics.endChunk("topic-extraction", "completed", tokenUsage.slice(topicExtractionTokenStart));
  const topicExtraction: TopicExtractionResult = extractionResult.data;
  const aiLikelyCount = topicExtraction.competitorStrengths.filter(
    (c) => c.aiLikelihood === "likely_ai"
  ).length;
  emit("topic-extraction", "completed",
    `${topicExtraction.topics.length} topics, ${topicExtraction.gaps.length} gaps`, 30);
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 2 complete: ${topicExtraction.topics.length} topics, ${topicExtraction.gaps.length} gaps, AI-competitor: ${aiLikelyCount}/5 likely AI`
    );
  }

  // --- Step 3: Brief (GPT-4.1) — outline, H2/H3, word count from intent, keyword rules ---
  const wordCountOverride = (() => {
    const preset = input.wordCountPreset;
    if (preset === "custom") {
      const n = input.wordCountCustom;
      if (n == null || n < 500 || n > 6000) return undefined;
      return {
        target: Math.round(n),
        note: "STRICT: target must be met within ±5%.",
      };
    }
    // "auto" or unspecified: use intent-based default word count
    const intentList = Array.isArray(input.intent) ? input.intent : input.intent ? [input.intent] : undefined;
    const target = getDefaultWordCountForIntent(intentList);
    return {
      target,
      note: "STRICT: target must be met within ±5%.",
    };
  })();

  metrics.startChunk("gpt-brief");
  const gptBriefTokenStart = tokenUsage.length;
  emit("gpt-brief", "started", "Building strategic research brief...", 30);
  const briefResult = await withRetry(
    async () => buildResearchBrief(topicExtraction, currentData, input, wordCountOverride, tokenUsage),
    { ...RETRY_STANDARD_FAST, timeoutMs: budget.cap(60000) },
    "gpt-brief"
  );
  if (!briefResult.success || !briefResult.data) {
    metrics.endChunk("gpt-brief", "failed");
    emit("gpt-brief", "failed", briefResult.error ?? "research brief failed", 40);
    throw new Error(`Step 3 failed: ${briefResult.error ?? "research brief failed"}`);
  }
  metrics.endChunk("gpt-brief", "completed", tokenUsage.slice(gptBriefTokenStart));
  const brief: ResearchBrief = briefResult.data;
  emit("gpt-brief", "completed",
    `Brief: ${brief.outline.sections.length} sections, ${brief.editorialStyleFallback ? "fallback" : "dynamic"} style`, 40);
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 3 complete: brief with ${brief.outline.sections.length} sections, editorial style: ${brief.editorialStyleFallback ? "fallback" : "dynamic"}`
    );
  }

  // Placeholder title/meta/slug — draft is written first; user generates meta from content via "Generate meta" button
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

  // --- Step 4: Draft (Claude Sonnet 4.6 or Opus 4.6) — full article from brief ---
  metrics.startChunk("claude-draft");
  const claudeDraftTokenStart = tokenUsage.length;
  emit("claude-draft", "started", "Writing article draft (this is the longest step)...", 45);
  const draftModel = input.draftModel ?? "sonnet-4.6";
  const draftResult = await withRetry(
    async () => writeDraft(brief, titleMetaSlug, tokenUsage, draftModel),
    { ...RETRY_CLAUDE_DRAFT, timeoutMs: budget.cap(RETRY_CLAUDE_DRAFT.timeoutMs) },
    "claude-draft"
  );
  if (!draftResult.success || !draftResult.data) {
    metrics.endChunk("claude-draft", "failed");
    emit("claude-draft", "failed", draftResult.error ?? "draft failed", 75);
    throw new Error(`Step 4 failed: ${draftResult.error ?? "draft failed"}`);
  }
  metrics.endChunk("claude-draft", "completed", tokenUsage.slice(claudeDraftTokenStart));
  const draft = draftResult.data;
  const wordCount = draft.content.split(/\s+/).filter(Boolean).length;
  emit("claude-draft", "completed", `Draft: ${wordCount} words`, 75);
  if (process.env.NODE_ENV !== "test") {
    console.log(`[pipeline] Step 4 complete: draft ${wordCount} words`);
  }

  // --- Step 5: Validate — FAQ enforcement, SEO audit, fact check, schema ---
  metrics.startChunk("faq-enforcement");
  emit("faq-enforcement", "started", "Enforcing FAQ character limits...", 82);
  let finalContent = draft.content;
  const faqEnforcement = enforceFaqCharacterLimit(finalContent, 300);
  if (!faqEnforcement.passed) {
    finalContent = faqEnforcement.fixedHtml;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[pipeline] Step 5: FAQ enforcement — ${faqEnforcement.violations.length} answer(s) truncated to 300 chars`);
    }
  }
  metrics.endChunk("faq-enforcement", "completed");
  emit("faq-enforcement", "completed", "FAQ enforcement complete", 92);

  if (process.env.NODE_ENV !== "test") {
    console.log("[pipeline] Step 5: FAQ enforcement complete");
  }

  // --- Outline drift (draft vs brief) — non-blocking ---
  const expectedH2s = brief.outline.sections.filter((s) => s.level === "h2").map((s) => s.heading.trim());
  const actualH2s = extractH2sFromHtml(draft.content);
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

  // --- Step 6: Audit + schema ---
  metrics.startChunk("audit");
  emit("audit", "started", "Running SEO audit and generating schema...", 92);
  const auditResult = auditArticle({
    title: titleMetaSlug.title,
    metaDescription: titleMetaSlug.metaDescription,
    content: finalContent,
    slug: titleMetaSlug.suggestedSlug,
    focusKeyword: primaryKeyword,
    extraValueThemes: brief.extraValueThemes?.length ? brief.extraValueThemes : undefined,
  });
  const schemaMarkup: SchemaMarkup =
    auditResult.schemaMarkup ??
    generateSchemaMarkup(
      finalContent,
      titleMetaSlug.title,
      titleMetaSlug.metaDescription,
      titleMetaSlug.suggestedSlug,
      primaryKeyword
    );
  metrics.endChunk("audit", "completed");
  emit("audit", "completed", `Audit score: ${auditResult.score}%`, 96);

  // --- Step 7: Hallucination check ---
  metrics.startChunk("fact-check");
  const factCheckTokenStart = tokenUsage.length;
  emit("fact-check", "started", "Verifying facts against sources...", 96);
  let factCheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 7: Fact check — ${factCheck.hallucinations.length} hallucinations, ${factCheck.issues.length} warnings`
    );
  }
  if (factCheck.hallucinations.length > 0) {
    for (const h of factCheck.hallucinations) {
      if (process.env.NODE_ENV !== "test") console.warn(`[pipeline] HALLUCINATION: ${h}`);
    }
  }

  // --- Optional: auto-fix hallucinations via Claude (surgical rewrite) ---
  let hallucinationFixes: PipelineOutput["hallucinationFixes"] = undefined;
  const autoFixEnabled = input.autoFixHallucinations !== false;
  if (factCheck.hallucinations.length > 0 && autoFixEnabled) {
    emit("fact-check", "started", "Auto-fixing hallucinations...", 97);
    try {
      const { fixedHtml, fixes } = await fixHallucinationsInContent(
        finalContent,
        factCheck.hallucinations,
        currentData,
        tokenUsage
      );
      if (fixes.length > 0 || fixedHtml !== finalContent) {
        finalContent = fixedHtml;
        hallucinationFixes = fixes;
        const recheck = verifyFactsAgainstSource(finalContent, currentData, primaryKeyword);
        if (recheck.hallucinations.length > 0 && process.env.NODE_ENV !== "test") {
          console.warn(
            `[pipeline] After auto-fix, fact-check still found ${recheck.hallucinations.length} hallucination(s); proceeding with fixed content`
          );
        }
        factCheck = recheck;
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("[pipeline] Auto-fix hallucinations failed, using original content:", err);
      }
    }
    emit("fact-check", "completed",
      `${factCheck.hallucinations.length} hallucinations after fix`, 98);
  }
  metrics.endChunk("fact-check", "completed", tokenUsage.slice(factCheckTokenStart));

  // Hallucinations are now non-blocking (downgraded to warning).
  if (factCheck.hallucinations.length > 0 && process.env.NODE_ENV !== "test") {
    console.warn(
      `[pipeline] ${factCheck.hallucinations.length} potential hallucination(s) detected (non-blocking; review recommended)`
    );
  }

  const sourceUrls = [...new Set(currentData.facts.map((f) => f.source))];
  const totalMs = Date.now() - startTotal;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Audit ${auditResult.score}%. Pipeline complete in ${(totalMs / 1000).toFixed(1)}s. Source URLs: ${currentData.sourceUrlValidation?.accessible ?? sourceUrls.length}/${currentData.sourceUrlValidation?.total ?? sourceUrls.length} valid`
    );
  }

  emit("done", "completed", `Pipeline complete in ${(totalMs / 1000).toFixed(1)}s`, 100);

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

  const targetWords = brief.wordCount?.target ?? 0;
  const actualWords = finalContent.split(/\s+/).filter(Boolean).length;
  metrics.setTargetWordCount(targetWords);
  metrics.setActualWordCount(actualWords);
  metrics.setAuditScore(auditResult.score ?? 0);
  metrics.setHallucinationCount(factCheck.hallucinations.length);
  const runMetrics = metrics.finishRun("completed");

  return {
    article: {
      content: finalContent,
      outline: actualH2s,
      suggestedSlug: titleMetaSlug.suggestedSlug,
      suggestedCategories: draft.suggestedCategories,
      suggestedTags: draft.suggestedTags,
    },
    title: titleMetaSlug.title,
    metaDescription: titleMetaSlug.metaDescription,
    sourceUrls,
    auditResult,
    schemaMarkup,
    faqEnforcement: {
      passed: faqEnforcement.passed,
      violations: faqEnforcement.violations,
    },
    factCheck: {
      verified: factCheck.verified,
      hallucinations: factCheck.hallucinations,
      issues: factCheck.issues,
      skippedRhetorical: factCheck.skippedRhetorical,
    },
    publishTracking: { keyword: primaryKeyword },
    generationTimeMs: totalMs,
    briefSummary: briefSummary ?? undefined,
    outlineDrift,
    hallucinationFixes,
    ...(tokenUsage.length > 0 ? { tokenUsage } : {}),
    metrics: runMetrics,
    performanceSummary: runMetrics.performanceSummary,
  };
}
