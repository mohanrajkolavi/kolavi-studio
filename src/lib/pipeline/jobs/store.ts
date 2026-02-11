/**
 * In-memory job store. Implements JobStore for chunked, resumable pipeline jobs.
 * Tracks per-chunk status, attempt, error, cost; supports cleanup and pipeline version.
 */

import type { Job, JobPhase, ChunkKind, ChunkOutput, ChunkRecord, ChunkCost, JobStore } from "./types";
import { CHUNK_ORDER } from "./types";
import { PIPELINE_VERSION } from "../version";

const ONE_HOUR_MS = 60 * 60 * 1000;

function initialChunkRecords(): Partial<Record<ChunkKind, ChunkRecord>> {
  const out: Partial<Record<ChunkKind, ChunkRecord>> = {};
  for (const k of CHUNK_ORDER) {
    out[k] = { status: "pending", attemptCount: 0 };
  }
  return out;
}

export function createInMemoryJobStore(): JobStore {
  const jobs = new Map<string, Job<unknown>>();

  const now = () => new Date().toISOString();

  return {
    async createJob<TInput>(id: string, input: TInput): Promise<Job<TInput>> {
      await this.cleanup(ONE_HOUR_MS);
      const job: Job<TInput> = {
        id,
        phase: "created",
        input,
        createdAt: now(),
        updatedAt: now(),
        completedChunks: [],
        errorMessage: null,
        pipelineVersion: PIPELINE_VERSION,
        chunkRecords: initialChunkRecords(),
      };
      jobs.set(id, job as Job<unknown>);
      return job;
    },

    async getJob<TInput>(id: string): Promise<Job<TInput> | undefined> {
      return jobs.get(id) as Job<TInput> | undefined;
    },

    async updatePhase(id: string, phase: JobPhase, errorMessage?: string | null): Promise<void> {
      const job = jobs.get(id);
      if (!job) return;
      (job as Job<unknown>).phase = phase;
      (job as Job<unknown>).updatedAt = now();
      if (errorMessage !== undefined) {
        (job as Job<unknown>).errorMessage = errorMessage;
      }
    },

    async saveChunkOutput(
      id: string,
      kind: ChunkKind,
      output: ChunkOutput,
      cost?: ChunkCost
    ): Promise<void> {
      const job = jobs.get(id);
      if (!job) return;
      const completedAt = now();
      const completedChunks = [...job.completedChunks];
      const existing = completedChunks.findIndex((c) => c.kind === kind);
      const chunk = { kind, output, completedAt };
      if (existing >= 0) {
        completedChunks[existing] = chunk;
      } else {
        completedChunks.push(chunk);
      }
      const rec = (job as Job<unknown>).chunkRecords?.[kind] ?? { status: "pending", attemptCount: 0 };
      (job as Job<unknown>).chunkRecords = {
        ...(job as Job<unknown>).chunkRecords,
        [kind]: {
          status: "completed",
          attemptCount: rec.attemptCount + 1,
          errorMessage: null,
          output,
          completedAt,
          cost,
        },
      };
      (job as Job<unknown>).completedChunks = completedChunks;
      (job as Job<unknown>).updatedAt = now();
    },

    async getChunkOutput(id: string, kind: ChunkKind): Promise<ChunkOutput | undefined> {
      const job = jobs.get(id);
      if (!job) return undefined;
      const chunk = job.completedChunks.find((c) => c.kind === kind);
      return chunk?.output;
    },

    async getChunkRecord(id: string, kind: ChunkKind): Promise<ChunkRecord | undefined> {
      const job = jobs.get(id);
      if (!job) return undefined;
      return (job as Job<unknown>).chunkRecords?.[kind];
    },

    async setChunkRunning(id: string, kind: ChunkKind): Promise<void> {
      const job = jobs.get(id);
      if (!job) return;
      const rec = (job as Job<unknown>).chunkRecords?.[kind] ?? { status: "pending", attemptCount: 0 };
      (job as Job<unknown>).chunkRecords = {
        ...(job as Job<unknown>).chunkRecords,
        [kind]: { ...rec, status: "running" },
      };
      (job as Job<unknown>).updatedAt = now();
    },

    async setChunkFailed(id: string, kind: ChunkKind, errorMessage: string): Promise<void> {
      const job = jobs.get(id);
      if (!job) return;
      const rec = (job as Job<unknown>).chunkRecords?.[kind] ?? { status: "pending", attemptCount: 0 };
      (job as Job<unknown>).chunkRecords = {
        ...(job as Job<unknown>).chunkRecords,
        [kind]: {
          ...rec,
          status: "failed",
          attemptCount: rec.attemptCount + 1,
          errorMessage,
        },
      };
      (job as Job<unknown>).updatedAt = now();
      (job as Job<unknown>).errorMessage = errorMessage;
      (job as Job<unknown>).phase = "failed";
    },

    async cleanup(maxAgeMs: number): Promise<void> {
      const cutoff = Date.now() - maxAgeMs;
      for (const [id, job] of jobs.entries()) {
        const created = new Date((job as Job<unknown>).createdAt).getTime();
        if (created < cutoff) jobs.delete(id);
      }
    },
  };
}

/** In-memory store; use jobStore from index (uses DB when DATABASE_URL is set). */
