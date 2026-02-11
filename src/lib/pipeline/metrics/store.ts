/**
 * In-memory store of last N pipeline run metrics for aggregate stats.
 * Observability only.
 */

import type { PipelineRunMetrics, PipelineMetricsAggregate } from "./types";

const MAX_RUNS = 50;
const runs: PipelineRunMetrics[] = [];

export function pushPipelineRunMetrics(metrics: PipelineRunMetrics): void {
  runs.unshift(metrics);
  if (runs.length > MAX_RUNS) runs.length = MAX_RUNS;
}

export function getPipelineRunMetrics(): PipelineRunMetrics[] {
  return [...runs];
}

export function getPipelineMetricsAggregate(): PipelineMetricsAggregate {
  const count = runs.length;
  if (count === 0) {
    return {
      runCount: 0,
      averageTotalDurationMs: 0,
      averageDurationPerChunk: {},
      cacheHitRate: 0,
      averageAuditScore: 0,
      failurePoints: {},
      averageCostUsd: 0,
    };
  }

  let totalDurationMs = 0;
  const chunkDurations: Record<string, number[]> = {};
  let totalCacheHits = 0;
  let totalCacheMisses = 0;
  let auditScoreSum = 0;
  let auditScoreCount = 0;
  const failureCount: Record<string, number> = {};
  let costSum = 0;

  for (const r of runs) {
    totalDurationMs += r.totalDurationMs;
    totalCacheHits += r.totalCacheHits;
    totalCacheMisses += r.totalCacheMisses;
    costSum += r.estimatedCostUsd;
    if (r.auditScore != null) {
      auditScoreSum += r.auditScore;
      auditScoreCount += 1;
    }
    if (r.status === "failed" && r.failedChunk) {
      failureCount[r.failedChunk] = (failureCount[r.failedChunk] ?? 0) + 1;
    }
    for (const ch of r.chunks) {
      if (!chunkDurations[ch.chunkName]) chunkDurations[ch.chunkName] = [];
      chunkDurations[ch.chunkName].push(ch.durationMs);
    }
  }

  const averageDurationPerChunk: Record<string, number> = {};
  for (const [name, arr] of Object.entries(chunkDurations)) {
    const sum = arr.reduce((a, b) => a + b, 0);
    averageDurationPerChunk[name] = Math.round(sum / arr.length);
  }

  const totalCacheCalls = totalCacheHits + totalCacheMisses || 1;
  const cacheHitRate = totalCacheHits / totalCacheCalls;

  return {
    runCount: count,
    averageTotalDurationMs: Math.round(totalDurationMs / count),
    averageDurationPerChunk,
    cacheHitRate,
    averageAuditScore: auditScoreCount > 0 ? Math.round((auditScoreSum / auditScoreCount) * 10) / 10 : 0,
    failurePoints: failureCount,
    averageCostUsd: Math.round((costSum / count) * 1e6) / 1e6,
  };
}
