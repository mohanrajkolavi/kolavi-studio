/**
 * Generic chunk executor for job-based pipeline. Runs a single chunk with its own
 * time budget, updates job phase, saves output on success, sets error on failure,
 * and emits progress events scoped to that chunk.
 */

import type {
  JobStore,
  JobPhase,
  ChunkKind,
  ChunkOutput,
  ChunkProgressEvent,
} from "./types";

// Phase that represents "this chunk is running"
const CHUNK_TO_PHASE: Record<ChunkKind, JobPhase> = {
  research_serp: "researching",
  research: "researching",
  topic_extraction: "analyzing",
  analysis: "analyzing",
  draft: "drafting",
  postprocess: "post_processing",
};

export type ChunkRunnerParams<TInput, TOutput> = {
  jobId: string;
  input: TInput;
  getChunkOutput: (kind: ChunkKind) => Promise<ChunkOutput | undefined>;
  signal?: AbortSignal;
  onProgress?: (event: ChunkProgressEvent) => void;
};

export type ChunkRunner<TInput, TOutput> = (
  params: ChunkRunnerParams<TInput, TOutput>
) => Promise<TOutput>;

export type RunChunkResult<TOutput> =
  | { success: true; output: TOutput }
  | { success: false; error: string };

export type RunChunkParams<TInput, TOutput> = {
  store: JobStore;
  jobId: string;
  chunkKind: ChunkKind;
  run: ChunkRunner<TInput, TOutput>;
  timeBudgetMs: number;
  onProgress?: (event: ChunkProgressEvent) => void;
};

/**
 * Run a single chunk: update job phase, execute with per-chunk time budget,
 * save output on success, set failed + error on failure. Progress events
 * are scoped to this chunk (elapsedMs and progress 0–100 within chunk).
 */
export async function runChunk<TInput, TOutput>({
  store,
  jobId,
  chunkKind,
  run,
  timeBudgetMs,
  onProgress,
}: RunChunkParams<TInput, TOutput>): Promise<RunChunkResult<TOutput>> {
  const job = await store.getJob<TInput>(jobId);
  if (!job) {
    return { success: false, error: `Job not found: ${jobId}` };
  }

  const phase = CHUNK_TO_PHASE[chunkKind];
  await store.updatePhase(jobId, phase);

  const chunkStartMs = Date.now();
  const emit = (status: ChunkProgressEvent["status"], message: string, progress: number) => {
    onProgress?.({
      chunkKind,
      status,
      message,
      elapsedMs: Date.now() - chunkStartMs,
      progress,
    });
  };

  emit("started", `Chunk ${chunkKind} started`, 0);

  const getChunkOutput = (kind: ChunkKind) => store.getChunkOutput(jobId, kind);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeBudgetMs);

  try {
    const output = await Promise.race([
      run({
        jobId,
        input: job.input,
        getChunkOutput,
        signal: controller.signal,
        onProgress: (ev) => {
          onProgress?.({
            ...ev,
            elapsedMs: Date.now() - chunkStartMs,
          });
        },
      }),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener(
          "abort",
          () => reject(new Error(`Chunk ${chunkKind} timed out after ${timeBudgetMs}ms`)),
          { once: true }
        );
      }),
    ]);

    clearTimeout(timeoutId);
    await store.saveChunkOutput(jobId, chunkKind, output as ChunkOutput);
    emit("completed", `Chunk ${chunkKind} completed`, 100);
    return { success: true, output: output as TOutput };
  } catch (err) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : String(err);
    await store.updatePhase(jobId, "failed", errorMessage);
    emit("failed", errorMessage, 0);
    return { success: false, error: errorMessage };
  }
}
