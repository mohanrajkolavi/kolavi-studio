/**
 * Collects timing and API call metrics during a pipeline run.
 * Observability only; no behavior changes.
 */

import type { TokenUsageRecord } from "@/lib/pipeline/types";
import type {
  ApiCallRecord,
  ChunkMetrics,
  ChunkMetricsStatus,
  PerformanceSummary,
  PipelineRunMetrics,
} from "./types";
import { getPipelineCostRates, getRateKeyForModel, estimateApiCallCostUsd } from "./rates";

function tokenUsageToApiCall(r: TokenUsageRecord): ApiCallRecord {
  const provider = r.model?.toLowerCase().includes("claude") ? "anthropic" : "openai";
  return {
    provider,
    endpoint: r.callName,
    durationMs: r.durationMs,
    inputTokens: r.promptTokens,
    outputTokens: r.completionTokens,
    cacheHit: false,
  };
}

function formatCost(usd: number): string {
  if (usd < 0.01 && usd > 0) return "<$0.01";
  return `$${usd.toFixed(2)}`;
}

function computeCostFromApiCalls(apiCalls: ApiCallRecord[]): number {
  const rates = getPipelineCostRates();
  let total = 0;
  for (const c of apiCalls) {
    if (c.cacheHit) continue;
    if (c.provider === "serper") total += estimateApiCallCostUsd("serper", c.endpoint, undefined, undefined, 1);
    else if (c.provider === "jina") total += estimateApiCallCostUsd("jina", c.endpoint, undefined, undefined, 1);
    else if (c.provider === "gemini") total += estimateApiCallCostUsd("gemini", c.endpoint, c.inputTokens, c.outputTokens);
    else if (c.provider === "openai") total += estimateApiCallCostUsd("openai", c.endpoint, c.inputTokens, c.outputTokens);
    else if (c.provider === "anthropic") total += estimateApiCallCostUsd("anthropic", c.endpoint, c.inputTokens, c.outputTokens);
  }
  return Math.round(total * 1e6) / 1e6;
}

export type PipelineMetricsCollector = {
  startRun(jobId: string, keyword: string): void;
  startChunk(name: string): void;
  endChunk(name: string, status: ChunkMetricsStatus, tokenUsageSinceChunk?: TokenUsageRecord[]): void;
  recordApiCall(provider: string, durationMs: number, opts?: { endpoint?: string; inputTokens?: number; outputTokens?: number; cacheHit?: boolean }): void;
  setTargetWordCount(n: number): void;
  setActualWordCount(n: number): void;
  setAuditScore(n: number): void;
  setHallucinationCount(n: number): void;
  finishRun(status: "completed" | "failed", failedChunk?: string): PipelineRunMetrics;
};

export function createPipelineMetricsCollector(): PipelineMetricsCollector {
  let jobId = "";
  let keyword = "";
  let startedAt = "";
  let endedAt = "";
  let targetWordCount: number | undefined;
  let actualWordCount: number | undefined;
  let auditScore: number | undefined;
  let hallucinationCount = 0;

  const chunks: ChunkMetrics[] = [];
  let currentChunkName: string | null = null;
  let currentChunkStartMs = 0;
  let currentChunkApiCalls: ApiCallRecord[] = [];

  return {
    startRun(id: string, kw: string) {
      jobId = id;
      keyword = kw;
      startedAt = new Date().toISOString();
    },

    startChunk(name: string) {
      currentChunkName = name;
      currentChunkStartMs = Date.now();
      currentChunkApiCalls = [];
    },

    endChunk(name: string, status: ChunkMetricsStatus, tokenUsageSinceChunk?: TokenUsageRecord[]) {
      const durationMs = Math.max(0, Date.now() - currentChunkStartMs);
      const apiCalls = [...currentChunkApiCalls];
      if (tokenUsageSinceChunk?.length) {
        for (const r of tokenUsageSinceChunk) {
          apiCalls.push(tokenUsageToApiCall(r));
        }
      }
      chunks.push({
        chunkName: name,
        durationMs,
        status,
        fromCache: false,
        apiCalls,
      });
      currentChunkName = null;
      currentChunkApiCalls = [];
    },

    recordApiCall(provider: string, durationMs: number, opts?: { endpoint?: string; inputTokens?: number; outputTokens?: number; cacheHit?: boolean }) {
      currentChunkApiCalls.push({
        provider,
        endpoint: opts?.endpoint,
        durationMs,
        inputTokens: opts?.inputTokens,
        outputTokens: opts?.outputTokens,
        cacheHit: opts?.cacheHit ?? false,
      });
    },

    setTargetWordCount(n: number) {
      targetWordCount = n;
    },
    setActualWordCount(n: number) {
      actualWordCount = n;
    },
    setAuditScore(n: number) {
      auditScore = n;
    },
    setHallucinationCount(n: number) {
      hallucinationCount = n;
    },

    finishRun(status: "completed" | "failed", failedChunk?: string): PipelineRunMetrics {
      if (currentChunkName !== null) {
        chunks.push({
          chunkName: currentChunkName,
          durationMs: Math.max(0, Date.now() - currentChunkStartMs),
          status: status === "failed" ? "failed" : "completed",
          fromCache: false,
          apiCalls: [...currentChunkApiCalls],
        });
        currentChunkName = null;
        currentChunkApiCalls = [];
      }
      endedAt = new Date().toISOString();
      const totalDurationMs = startedAt && endedAt ? new Date(endedAt).getTime() - new Date(startedAt).getTime() : 0;

      let totalCacheHits = 0;
      let totalCacheMisses = 0;
      let totalExternalApiCalls = 0;
      let estimatedCostUsd = 0;
      for (const ch of chunks) {
        for (const c of ch.apiCalls) {
          totalExternalApiCalls += 1;
          if (c.cacheHit) totalCacheHits += 1;
          else totalCacheMisses += 1;
        }
        estimatedCostUsd += computeCostFromApiCalls(ch.apiCalls);
      }
      estimatedCostUsd = Math.round(estimatedCostUsd * 1e6) / 1e6;

      const completedChunks = chunks.filter((c) => c.status === "completed" && c.durationMs >= 0);
      const fastest = completedChunks.length
        ? completedChunks.reduce((a, b) => (a.durationMs <= b.durationMs ? a : b))
        : { chunkName: "—", durationMs: 0 };
      const slowest = completedChunks.length
        ? completedChunks.reduce((a, b) => (a.durationMs >= b.durationMs ? a : b))
        : { chunkName: "—", durationMs: 0 };
      const totalCalls = totalCacheHits + totalCacheMisses || 1;
      const cacheHitRatePercent = totalCacheHits / totalCalls;

      const performanceSummary: PerformanceSummary = {
        totalSeconds: Math.round(totalDurationMs / 1000 * 10) / 10,
        fastestChunk: { name: fastest.chunkName, durationMs: fastest.durationMs },
        slowestChunk: { name: slowest.chunkName, durationMs: slowest.durationMs },
        estimatedCostFormatted: formatCost(estimatedCostUsd),
        cacheHitRatePercent: `${Math.round(cacheHitRatePercent * 100)}%`,
      };

      return {
        jobId,
        keyword,
        startedAt,
        endedAt,
        totalDurationMs,
        chunks,
        totalCacheHits,
        totalCacheMisses,
        totalExternalApiCalls,
        estimatedCostUsd,
        targetWordCount,
        actualWordCount,
        auditScore,
        hallucinationCount,
        performanceSummary,
        status,
        failedChunk,
      };
    },
  };
}
