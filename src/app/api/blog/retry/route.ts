import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  runResearchChunk,
  runBriefChunk,
  runDraftChunk,
  runValidationChunk,
  buildPipelineOutputFromChunks,
  type ValidationChunkOutput,
} from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";
import { CHUNK_ORDER, type ChunkKind } from "@/lib/pipeline/jobs/types";
import { PIPELINE_VERSION } from "@/lib/pipeline/version";
import { sumCompletedChunkCosts, sumCompletedChunkDurations } from "@/lib/pipeline/cost";
import { createPipelineMetricsCollector, pushPipelineRunMetrics } from "@/lib/pipeline/metrics";
import type { PipelineProgressEvent } from "@/lib/pipeline/orchestrator";
import type { PipelineInput, TokenUsageRecord } from "@/lib/pipeline/types";
import type { Job } from "@/lib/pipeline/jobs/types";

export const maxDuration = 300;

const BUDGETS: Record<ChunkKind, number> = {
  research_serp: 30_000,
  research: 45_000,
  topic_extraction: 30_000,
  analysis: 90_000, // topic-extraction + gpt-brief; 60s left gpt-brief too little after extraction
  draft: 180_000,
  postprocess: 15_000,
};

function getPrerequisites(kind: ChunkKind): ChunkKind[] {
  const idx = CHUNK_ORDER.indexOf(kind);
  if (idx <= 0) return [];
  return CHUNK_ORDER.slice(0, idx);
}

function firstIncompleteOrFailedChunk(job: Job<unknown>): ChunkKind | undefined {
  const records = (job as Job<unknown>).chunkRecords;
  if (!records) return "research";
  for (const k of CHUNK_ORDER) {
    const rec = records[k];
    if (!rec || rec.status !== "completed") return k;
  }
  return undefined;
}

export type RetryErrorPayload = {
  jobId: string;
  error: string;
  failedChunk: ChunkKind | null;
  completedChunks: ChunkKind[];
  retryFromChunk: ChunkKind;
};

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jobId =
    typeof body === "object" && body !== null && "jobId" in body && typeof (body as { jobId: unknown }).jobId === "string"
      ? (body as { jobId: string }).jobId
      : undefined;
  const fromChunkParam =
    typeof body === "object" &&
    body !== null &&
    "fromChunk" in body &&
    CHUNK_ORDER.includes((body as { fromChunk: ChunkKind }).fromChunk)
      ? (body as { fromChunk: ChunkKind }).fromChunk
      : undefined;

  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const job = await jobStore.getJob<PipelineInput>(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pipelineVersion = (job as { pipelineVersion?: string }).pipelineVersion;
  if (!pipelineVersion || pipelineVersion !== PIPELINE_VERSION) {
    return new Response(
      JSON.stringify({
        error: "Job was created with an older pipeline version; please start a new generation instead of retrying.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const chunkRecords = (job as Job<unknown>).chunkRecords ?? {};
  let fromChunk: ChunkKind = fromChunkParam ?? firstIncompleteOrFailedChunk(job as Job<unknown>) ?? "research";

  const prereqs = getPrerequisites(fromChunk);
  for (const p of prereqs) {
    const rec = chunkRecords[p];
    if (!rec || rec.status !== "completed") {
      return new Response(
        JSON.stringify({
          error: `Cannot retry from "${fromChunk}": prerequisite chunk "${p}" is not completed.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  const completedBeforeRetry = CHUNK_ORDER.filter((k) => chunkRecords[k]?.status === "completed");
  const savingsUsd = sumCompletedChunkCosts(chunkRecords);
  const savingsMs = sumCompletedChunkDurations(chunkRecords);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // ignore
        }
      };

      const onProgress = (evt: PipelineProgressEvent) => sendEvent("progress", evt);

      const tokenUsage: TokenUsageRecord[] = [];
      const metrics = createPipelineMetricsCollector();
      metrics.startRun(jobId, (job.input as PipelineInput).primaryKeyword ?? "");

      sendEvent("retry_start", {
        jobId,
        fromChunk,
        completedChunks: completedBeforeRetry,
        estimatedSavingsUsd: savingsUsd,
        estimatedSavingsMs: savingsMs,
        message: `Retrying from ${fromChunk} saves approximately $${savingsUsd.toFixed(2)} and ${Math.round(savingsMs / 1000)} seconds versus a full restart.`,
      });

      const startIdx = CHUNK_ORDER.indexOf(fromChunk);
      const chunksToRun = CHUNK_ORDER.slice(startIdx);
      let resultSent = false;
      const retryStartMs = Date.now();

      try {
        for (const kind of chunksToRun) {
          const rec = await jobStore.getChunkRecord(jobId, kind);
          if (rec?.status === "completed") {
            metrics.startChunk(kind);
            metrics.endChunk(kind, "skipped");
            onProgress({
              step: kind === "research" ? "serper" : kind === "analysis" ? "gpt-brief" : kind === "draft" ? "claude-draft" : "fact-check",
              status: "skipped",
              message: `Chunk "${kind}" already completed; skipping.`,
              elapsedMs: 0,
              progress: 100,
            });
            continue;
          }

          const budgetMs = BUDGETS[kind];
          let tokenUsageStart = tokenUsage.length;
          metrics.startChunk(kind);
          if (kind === "research") {
            await runResearchChunk(job.input, jobId, jobStore, budgetMs, onProgress, tokenUsage, metrics);
          } else if (kind === "analysis") {
            await runBriefChunk(jobId, jobStore, budgetMs, onProgress, tokenUsage, metrics);
          } else if (kind === "draft") {
            await runDraftChunk(jobId, jobStore, undefined, budgetMs, onProgress, tokenUsage, metrics);
          } else {
            const validation = await runValidationChunk(jobId, jobStore, budgetMs);
            const generationTimeMs = Date.now() - retryStartMs;
            const result = await buildPipelineOutputFromChunks(jobId, jobStore, validation, generationTimeMs, tokenUsage);
            const brief = (await jobStore.getChunkOutput(jobId, "analysis")) as { wordCount?: { target?: number } } | undefined;
            const targetWords = brief?.wordCount?.target ?? 0;
            metrics.setTargetWordCount(targetWords);
            metrics.setActualWordCount(result.article.content.split(/\s+/).filter(Boolean).length);
            metrics.setAuditScore(result.auditResult?.score ?? 0);
            metrics.setHallucinationCount(result.factCheck?.hallucinations?.length ?? 0);
            const runMetrics = metrics.finishRun("completed");
            (result as Record<string, unknown>).metrics = runMetrics;
            (result as Record<string, unknown>).performanceSummary = runMetrics.performanceSummary;
            pushPipelineRunMetrics(runMetrics);
            sendEvent("result", result);
            resultSent = true;
          }
          if (!resultSent) metrics.endChunk(kind, "completed", tokenUsage.slice(tokenUsageStart));
        }

        if (!resultSent) {
          const validation = await jobStore.getChunkOutput(jobId, "postprocess");
          if (validation && typeof validation === "object") {
            const currentJob = (await jobStore.getJob(jobId)) as Job<unknown> | undefined;
            const generationTimeMs = sumCompletedChunkDurations(currentJob?.chunkRecords ?? {});
            const result = await buildPipelineOutputFromChunks(
              jobId,
              jobStore,
              validation as ValidationChunkOutput,
              generationTimeMs,
              tokenUsage
            );
            const brief = (await jobStore.getChunkOutput(jobId, "analysis")) as { wordCount?: { target?: number } } | undefined;
            metrics.setTargetWordCount(brief?.wordCount?.target ?? 0);
            metrics.setActualWordCount(result.article.content.split(/\s+/).filter(Boolean).length);
            metrics.setAuditScore(result.auditResult?.score ?? 0);
            metrics.setHallucinationCount(result.factCheck?.hallucinations?.length ?? 0);
            const runMetrics = metrics.finishRun("completed");
            (result as Record<string, unknown>).metrics = runMetrics;
            (result as Record<string, unknown>).performanceSummary = runMetrics.performanceSummary;
            pushPipelineRunMetrics(runMetrics);
            sendEvent("result", result);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pipeline failed";
        const records = await Promise.all(CHUNK_ORDER.map((k) => jobStore.getChunkRecord(jobId, k)));
        const failedRec = CHUNK_ORDER.map((k, i) => ({ k, rec: records[i] })).find(
          (x) => x.rec?.status === "failed"
        );
        const failedChunk: ChunkKind | null = failedRec ? failedRec.k : null;
        const completedChunks = CHUNK_ORDER.filter((_, i) => records[i]?.status === "completed");
        const jobForRetry = await jobStore.getJob(jobId);
        const retryFromChunk = failedChunk ?? (jobForRetry ? firstIncompleteOrFailedChunk(jobForRetry) : undefined) ?? "research";

        try {
          const runMetrics = metrics.finishRun("failed", failedChunk ?? undefined);
          pushPipelineRunMetrics(runMetrics);
        } catch {
          // ignore
        }
        const payload: RetryErrorPayload = {
          jobId,
          error: message,
          failedChunk,
          completedChunks,
          retryFromChunk,
        };
        sendEvent("error", payload);
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
