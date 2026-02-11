/**
 * Job state management for chunked, resumable pipeline.
 * Persists to DB when DATABASE_URL is set; otherwise in-memory.
 */

import type { JobStore } from "./types";

export type {
  JobPhase,
  ChunkKind,
  ChunkOutput,
  CompletedChunk,
  Job,
  ChunkProgressEvent,
  JobStore,
} from "./types";

export { createInMemoryJobStore } from "./store";
export { createDbJobStore } from "./db-store";

function getJobStore(): JobStore {
  if (process.env.DATABASE_URL?.trim()) {
    const { createDbJobStore } = require("./db-store");
    return createDbJobStore();
  }
  const { createInMemoryJobStore } = require("./store");
  return createInMemoryJobStore();
}

/** Persists to DB when DATABASE_URL is set; otherwise in-memory (lost on restart). */
export const jobStore = getJobStore();

export type {
  ChunkRunnerParams,
  ChunkRunner,
  RunChunkResult,
  RunChunkParams,
} from "./executor";
export { runChunk } from "./executor";
