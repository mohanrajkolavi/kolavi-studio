/**
 * Blog Generator Pipeline v3 — Orchestrator.
 * Coordinates all 8 steps across Serper, Jina, Gemini, OpenAI, Claude, and TypeScript audit.
 */

import {
  type PipelineInput,
  type PipelineOutput,
  type SerpResult,
  type CompetitorArticle,
  type CurrentData,
  type TopicExtractionResult,
  type ResearchBrief,
  type TopicScoreResult,
  type StepResult,
  type RetryConfig,
  type ValidatedSourceUrl,
  type SchemaMarkup,
  RETRY_FAST,
  RETRY_STANDARD,
  RETRY_EXPENSIVE,
} from "@/lib/pipeline/types";
import { searchCompetitorUrls } from "@/lib/serper/client";
import { fetchCompetitorContent } from "@/lib/jina/reader";
import { fetchCurrentData, extractTopicsAndStyle } from "@/lib/gemini/client";
import { buildResearchBrief, scoreTopicCoverage } from "@/lib/openai/client";
import { writeDraft, fillContentGaps, humanizeArticleContent } from "@/lib/claude/client";
import {
  auditArticle,
  generateSchemaMarkup,
  verifyContentIntegrity,
  restoreContentIntegrity,
  enforceFaqCharacterLimit,
  verifyFactsAgainstSource,
} from "@/lib/seo/article-audit";

export type { PipelineInput, PipelineOutput };

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
 * Run the full 8-step blog generator pipeline.
 */
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const startTotal = Date.now();
  const primaryKeyword = input.primaryKeyword?.trim() || "";
  if (!primaryKeyword) {
    throw new Error("primaryKeyword is required");
  }

  // --- Step 1a: Serper ---
  const serperResult = await withRetry(
    async () => searchCompetitorUrls(primaryKeyword),
    RETRY_FAST,
    "serper"
  );
  const serpResults: SerpResult[] = serperResult.success && serperResult.data ? serperResult.data : [];
  const urls = serpResults.map((s) => s.url).slice(0, 5);

  // --- Step 1b + 1c: Jina and Gemini grounding in parallel (both only need keyword/URLs) ---
  const [jinaResult, groundingResult] = await Promise.all([
    withRetry(async () => fetchCompetitorContent(urls), RETRY_FAST, "jina"),
    withRetry(
      async () => fetchCurrentData(primaryKeyword, input.secondaryKeywords ?? []),
      RETRY_STANDARD,
      "gemini-grounding"
    ),
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

  // --- Step 2 and source URL validation in parallel (extraction needs competitors only; validation needs currentData) ---
  const extractionPromise = withRetry(
    async () => extractTopicsAndStyle(competitors),
    RETRY_STANDARD,
    "gemini-extraction"
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
    throw new Error(`Step 2 failed: ${extractionResult.error ?? "topic extraction failed"}`);
  }
  const topicExtraction: TopicExtractionResult = extractionResult.data;
  const aiLikelyCount = topicExtraction.competitorStrengths.filter(
    (c) => c.aiLikelihood === "likely_ai"
  ).length;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 2 complete: ${topicExtraction.topics.length} topics, ${topicExtraction.gaps.length} gaps, AI-competitor: ${aiLikelyCount}/5 likely AI`
    );
  }

  // --- Step 3: Strategic brief (long timeout + trimmed payload in client) ---
  const briefResult = await withRetry(
    async () => buildResearchBrief(topicExtraction, currentData, input),
    { ...RETRY_STANDARD, timeoutMs: 90000 },
    "gpt-brief"
  );
  if (!briefResult.success || !briefResult.data) {
    throw new Error(`Step 3 failed: ${briefResult.error ?? "research brief failed"}`);
  }
  const brief: ResearchBrief = briefResult.data;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 3 complete: brief with ${brief.outline.sections.length} sections, editorial style: ${brief.editorialStyleFallback ? "fallback" : "dynamic"}`
    );
  }

  // --- Step 4: Write draft (long timeout: full article generation; v4 prompts are larger) ---
  const draftResult = await withRetry(
    async () => writeDraft(brief),
    { ...RETRY_EXPENSIVE, timeoutMs: 240000 },
    "claude-draft"
  );
  if (!draftResult.success || !draftResult.data) {
    throw new Error(`Step 4 failed: ${draftResult.error ?? "draft failed"}`);
  }
  const draft = draftResult.data;
  const wordCount = draft.content.split(/\s+/).filter(Boolean).length;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 4 complete: draft ${wordCount} words, ${draft.titleMetaVariants.length} title/meta options`
    );
  }

  // --- Step 5: Topic score ---
  const scoreResult = await withRetry(
    async () => scoreTopicCoverage(draft.content, brief.topicChecklist),
    RETRY_STANDARD,
    "o3-scoring"
  );
  const topicScoreReport: TopicScoreResult =
    scoreResult.success && scoreResult.data
      ? scoreResult.data
      : {
          topicScores: [],
          overallScore: 75,
          gapTopics: [],
          decision: "SKIP_TO_HUMANIZE",
        };
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 5 complete: overall ${topicScoreReport.overallScore}/100, decision: ${topicScoreReport.decision}`
    );
  }

  // --- Step 6: Fill gaps (conditional) ---
  let contentAfterGaps = draft.content;
  if (topicScoreReport.decision === "FILL_GAPS" && topicScoreReport.gapTopics.length > 0) {
    const gapResult = await withRetry(
      async () =>
        fillContentGaps(
          contentAfterGaps,
          topicScoreReport.gapTopics,
          brief.currentData,
          brief.editorialStyle
        ),
      RETRY_EXPENSIVE,
      "claude-gaps"
    );
    if (gapResult.success && gapResult.data) {
      contentAfterGaps = gapResult.data;
      if (process.env.NODE_ENV !== "test") {
        console.log(`[pipeline] Step 6: filled ${topicScoreReport.gapTopics.length} gap topics`);
      }
    }
  } else if (process.env.NODE_ENV !== "test") {
    console.log("[pipeline] Step 6: skipped (no gaps or score OK)");
  }

  // --- Step 7: Humanize ---
  const preHumanizeHtml = contentAfterGaps;
  let humanizeResult = await withRetry(
    async () => humanizeArticleContent(preHumanizeHtml),
    RETRY_EXPENSIVE,
    "claude-humanize"
  );
  let finalContent =
    humanizeResult.success && humanizeResult.data ? humanizeResult.data : contentAfterGaps;

  // --- Step 7b: Content integrity check + surgical restore (no retry) ---
  let integrityCheck = verifyContentIntegrity(preHumanizeHtml, finalContent);
  let contentRestorations: string[] = [];
  let postRestorationIssues: string[] = [];
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 7b: Content integrity — ${integrityCheck.issues.length} issues, passed: ${integrityCheck.passed}`
    );
  }
  if (!integrityCheck.passed) {
    for (const issue of integrityCheck.issues) {
      if (process.env.NODE_ENV !== "test") console.warn(`[pipeline] Integrity: ${issue}`);
    }
    const { restoredHtml, restorations } = restoreContentIntegrity(
      preHumanizeHtml,
      finalContent,
      integrityCheck.issues
    );
    if (restorations.length > 0) {
      finalContent = restoredHtml;
      contentRestorations = restorations;
      const recheck = verifyContentIntegrity(preHumanizeHtml, finalContent);
      postRestorationIssues = recheck.issues;
      integrityCheck = recheck;
      if (process.env.NODE_ENV !== "test") {
        console.log(`[pipeline] Step 7b: Restored ${restorations.length} item(s); post-restoration issues: ${postRestorationIssues.length}`);
      }
    }
  }

  // --- Step 7c: FAQ character limit enforcement ---
  const faqEnforcement = enforceFaqCharacterLimit(finalContent, 300);
  if (!faqEnforcement.passed) {
    finalContent = faqEnforcement.fixedHtml;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[pipeline] Step 7c: FAQ enforcement — ${faqEnforcement.violations.length} answer(s) truncated to 300 chars`);
    }
  }

  if (process.env.NODE_ENV !== "test") {
    console.log("[pipeline] Step 7 complete: humanization applied");
  }

  // --- Step 8: Audit + schema ---
  const firstVariant = draft.titleMetaVariants[0];
  const titleForAudit = firstVariant?.title ?? primaryKeyword;
  const metaForAudit = firstVariant?.metaDescription ?? "";
  const auditResult = auditArticle(
    {
      title: titleForAudit,
      metaDescription: metaForAudit,
      content: finalContent,
      slug: draft.suggestedSlug,
      focusKeyword: primaryKeyword,
    },
    { topicScoreResult: topicScoreReport }
  );
  const schemaMarkup: SchemaMarkup =
    auditResult.schemaMarkup ??
    generateSchemaMarkup(
      finalContent,
      titleForAudit,
      metaForAudit,
      draft.suggestedSlug,
      primaryKeyword
    );

  // --- Step 8b: Hallucination check ---
  const factCheck = verifyFactsAgainstSource(finalContent, currentData);
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 8b: Fact check — ${factCheck.hallucinations.length} hallucinations, ${factCheck.issues.length} warnings`
    );
  }
  if (factCheck.hallucinations.length > 0) {
    for (const h of factCheck.hallucinations) {
      if (process.env.NODE_ENV !== "test") console.warn(`[pipeline] HALLUCINATION: ${h}`);
    }
  }

  const sourceUrls = [...new Set(currentData.facts.map((f) => f.source))];
  const totalMs = Date.now() - startTotal;
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[pipeline] Step 8 complete: audit ${auditResult.score}%, topic score ${topicScoreReport.overallScore}/100. Pipeline complete in ${(totalMs / 1000).toFixed(1)}s. Source URLs: ${currentData.sourceUrlValidation?.accessible ?? sourceUrls.length}/${currentData.sourceUrlValidation?.total ?? sourceUrls.length} valid`
    );
  }

  return {
    article: {
      content: finalContent,
      outline: draft.outline,
      suggestedSlug: draft.suggestedSlug,
      suggestedCategories: draft.suggestedCategories,
      suggestedTags: draft.suggestedTags,
    },
    titleMetaVariants: draft.titleMetaVariants,
    selectedTitleMeta: null,
    topicScoreReport,
    sourceUrls,
    auditResult,
    schemaMarkup,
    contentIntegrity: {
      passed: integrityCheck.passed,
      issues: integrityCheck.issues,
      restorations: contentRestorations,
      postRestorationIssues,
    },
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
  };
}
