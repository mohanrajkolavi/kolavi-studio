/**
 * Pipeline run metrics — timing, API calls, cost, and performance summary.
 * Observability only; no behavior changes.
 */

/** Single external API call (or LLM call) within a chunk. */
export type ApiCallRecord = {
  provider: string;
  endpoint?: string;
  durationMs: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheHit: boolean;
};

/** Status of a chunk at the end of the run. */
export type ChunkMetricsStatus = "completed" | "failed" | "skipped";

/** Per-chunk breakdown: duration, status, cache, and API calls. */
export type ChunkMetrics = {
  chunkName: string;
  durationMs: number;
  status: ChunkMetricsStatus;
  fromCache: boolean;
  apiCalls: ApiCallRecord[];
};

/** Human-readable performance summary included in pipeline result. */
export type PerformanceSummary = {
  totalSeconds: number;
  fastestChunk: { name: string; durationMs: number };
  slowestChunk: { name: string; durationMs: number };
  estimatedCostFormatted: string;
  cacheHitRatePercent: string;
};

/** Full metrics for one pipeline run. */
export type PipelineRunMetrics = {
  jobId: string;
  keyword: string;
  startedAt: string; // ISO
  endedAt: string;   // ISO
  totalDurationMs: number;
  chunks: ChunkMetrics[];
  totalCacheHits: number;
  totalCacheMisses: number;
  totalExternalApiCalls: number;
  estimatedCostUsd: number;
  targetWordCount?: number;
  actualWordCount?: number;
  auditScore?: number;
  hallucinationCount: number;
  performanceSummary: PerformanceSummary;
  /** Final run status: completed or failed (for aggregate stats). */
  status: "completed" | "failed";
  /** If failed, which chunk failed (for failure point stats). */
  failedChunk?: string;
};

/** Aggregate stats from last N runs (for metrics endpoint). */
export type PipelineMetricsAggregate = {
  runCount: number;
  averageTotalDurationMs: number;
  averageDurationPerChunk: Record<string, number>;
  cacheHitRate: number; // 0–1
  averageAuditScore: number;
  /** Chunk name -> count of runs where that chunk was the failure point. */
  failurePoints: Record<string, number>;
  /** Average estimated cost per run (USD). */
  averageCostUsd: number;
};
