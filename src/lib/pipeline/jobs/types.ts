/**
 * Job state management — types for chunked, resumable pipeline jobs.
 * Tracks per-chunk status, attempt count, error, and cost for retry and recovery.
 */

// -----------------------------------------------------------------------------
// Job lifecycle phase (overall status)
// -----------------------------------------------------------------------------

export type JobPhase =
  | "created"
  | "researching"
  | "analyzing"
  | "waiting_for_review"
  | "drafting"
  | "post_processing"
  | "completed"
  | "failed";

// -----------------------------------------------------------------------------
// Chunk kinds — each is one resumable unit
// -----------------------------------------------------------------------------

export type ChunkKind = "research_serp" | "research" | "topic_extraction" | "analysis" | "draft" | "postprocess";

/** Order for resume/retry (research → analysis → draft → postprocess). research_serp is persisted but not in resume order. */
export const CHUNK_ORDER: ChunkKind[] = ["research", "analysis", "draft", "postprocess"];

// Chunk output is arbitrary JSON; concrete types at use site
export type ChunkOutput = Record<string, unknown>;

// -----------------------------------------------------------------------------
// Chunk status and cost (for error recovery and cost tracking)
// -----------------------------------------------------------------------------

export type ChunkStatus = "pending" | "running" | "completed" | "failed";

export type ProviderUsage = {
  calls: number;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
};

export type ChunkCost = {
  providers: Record<string, ProviderUsage>;
  estimatedCostUsd?: number;
  durationMs?: number;
};

export type ChunkRecord = {
  status: ChunkStatus;
  attemptCount: number;
  errorMessage?: string | null;
  output?: ChunkOutput;
  completedAt?: string; // ISO
  cost?: ChunkCost;
};

// -----------------------------------------------------------------------------
// Completed chunk record (stored per chunk kind for resumability)
// -----------------------------------------------------------------------------

export type CompletedChunk = {
  kind: ChunkKind;
  output: ChunkOutput;
  completedAt: string; // ISO
};

// -----------------------------------------------------------------------------
// Job record (what the store persists)
// -----------------------------------------------------------------------------

export type Job<TInput = unknown> = {
  id: string;
  phase: JobPhase;
  input: TInput;
  createdAt: string;
  updatedAt: string;
  completedChunks: CompletedChunk[];
  errorMessage: string | null;
  /** Pipeline version at job creation; used to invalidate stale data on retry. */
  pipelineVersion: string;
  /** Per-chunk status, attempt, error, cost for retry and UI. */
  chunkRecords: Partial<Record<ChunkKind, ChunkRecord>>;
};

// -----------------------------------------------------------------------------
// Progress event for a single chunk (scoped to that chunk)
// -----------------------------------------------------------------------------

export type ChunkProgressEvent = {
  chunkKind: ChunkKind;
  status: "started" | "progress" | "completed" | "failed";
  message: string;
  elapsedMs: number;
  progress: number; // 0–100 within this chunk
};

// -----------------------------------------------------------------------------
// Job store interface (async for in-memory and DB implementations)
// -----------------------------------------------------------------------------

export type JobStore = {
  createJob<TInput>(id: string, input: TInput): Promise<Job<TInput>>;
  getJob<TInput>(id: string): Promise<Job<TInput> | undefined>;
  updatePhase(id: string, phase: JobPhase, errorMessage?: string | null): Promise<void>;
  saveChunkOutput(id: string, kind: ChunkKind, output: ChunkOutput, cost?: ChunkCost): Promise<void>;
  getChunkOutput(id: string, kind: ChunkKind): Promise<ChunkOutput | undefined>;
  getChunkRecord(id: string, kind: ChunkKind): Promise<ChunkRecord | undefined>;
  setChunkRunning(id: string, kind: ChunkKind): Promise<void>;
  setChunkFailed(id: string, kind: ChunkKind, errorMessage: string): Promise<void>;
  /** Remove jobs older than maxAgeMs. Call on each new job creation. */
  cleanup(maxAgeMs: number): Promise<void>;
};
