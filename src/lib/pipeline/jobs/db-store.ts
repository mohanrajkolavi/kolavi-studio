/**
 * Database-backed job store. Persists pipeline jobs so they survive restarts
 * and work across serverless instances. Use when DATABASE_URL is set.
 */

import sql from "@/lib/db/client";
import { optionalText, textArray } from "@/lib/db/params";
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

function parseJsonIfString(value: unknown): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return value;
    }
  }
  return value;
}

function rowToJob<TInput = unknown>(row: {
  id: string;
  phase: string;
  input: unknown;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  pipeline_version: string;
  chunk_records: unknown;
}): Job<TInput> {
  const rawChunkRecords = parseJsonIfString(row.chunk_records);
  const chunkRecords = (rawChunkRecords as Partial<Record<ChunkKind, ChunkRecord>>) ?? {};
  const completedChunks = (
    Object.entries(chunkRecords) as [ChunkKind, ChunkRecord][]
  )
    .filter(
      ([, rec]) =>
        rec?.status === "completed" &&
        rec?.output != null &&
        rec?.completedAt != null
    )
    .map(([kind, rec]) => ({
      kind,
      output: parseJsonIfString(rec!.output!) as Record<string, unknown>,
      completedAt: rec!.completedAt!,
    }));
  const input = parseJsonIfString(row.input);
  return {
    id: row.id,
    phase: row.phase as JobPhase,
    input: input as TInput,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    errorMessage: row.error_message,
    pipelineVersion: row.pipeline_version,
    chunkRecords,
    completedChunks,
  };
}

export function createDbJobStore(): JobStore {
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
      // Ensure we never pass undefined to SQL (causes "could not determine data type of parameter $N")
      const inputJson = JSON.stringify(job.input ?? {});
      const chunkRecordsJson = JSON.stringify(job.chunkRecords ?? {});
      const errorMsg = job.errorMessage ?? null;
      const errorFragment = errorMsg !== null ? sql`${errorMsg}` : sql`NULL`;
      // Cast JSON strings to jsonb so stored columns contain proper JSONB objects
      try {
        await sql`
          INSERT INTO pipeline_jobs (id, phase, input, created_at, updated_at, error_message, pipeline_version, chunk_records)
          VALUES (
            ${id},
            ${job.phase},
            ${inputJson}::jsonb,
            ${job.createdAt},
            ${job.updatedAt},
            ${errorFragment},
            ${job.pipelineVersion},
            ${chunkRecordsJson}::jsonb
          )
          ON CONFLICT (id) DO NOTHING
        `;
      } catch (err) {
        console.error("[pipeline/db-store] createJob failed", { jobId: id, error: err instanceof Error ? err.message : String(err) });
        throw err;
      }
      return job;
    },

    async getJob<TInput>(id: string): Promise<Job<TInput> | undefined> {
      const rows = await sql`
        SELECT id, phase, input, created_at, updated_at, error_message, pipeline_version, chunk_records
        FROM pipeline_jobs WHERE id = ${id}
      `;
      const row = rows[0];
      if (!row) return undefined;
      return rowToJob<TInput>(row as Parameters<typeof rowToJob>[0]);
    },

    async updatePhase(id: string, phase: JobPhase, errorMessage?: string | null): Promise<void> {
      const updatedAt = now();
      if (errorMessage !== undefined) {
        const errorFragment = optionalText(errorMessage);
        await sql`
          UPDATE pipeline_jobs SET phase = ${phase}, updated_at = ${updatedAt}, error_message = ${errorFragment}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE pipeline_jobs SET phase = ${phase}, updated_at = ${updatedAt} WHERE id = ${id}
        `;
      }
    },

    async saveChunkOutput(
      id: string,
      kind: ChunkKind,
      output: ChunkOutput,
      cost?: ChunkCost
    ): Promise<void> {
      const completedAt = now();
      const outputJson = JSON.stringify(output ?? {});
      const completedAtJson = JSON.stringify(completedAt);
      const costJson = cost != null ? JSON.stringify(cost) : "null";
      const path = [kind] as string[];
      try {
        await sql`
          UPDATE pipeline_jobs
          SET
            chunk_records = jsonb_set(
              CASE WHEN chunk_records IS NOT NULL AND jsonb_typeof(chunk_records) = 'object' THEN chunk_records ELSE '{}'::jsonb END,
              ${textArray(path)},
              jsonb_build_object(
                'status', 'completed',
                'attemptCount', COALESCE((chunk_records->${kind}->>'attemptCount')::int, 0) + 1,
                'errorMessage', null,
                'output', ${outputJson}::jsonb,
                'completedAt', ${completedAtJson}::jsonb,
                'cost', ${costJson}::jsonb
              )
            ),
            updated_at = ${completedAt},
            phase = CASE WHEN ${kind} = 'postprocess' THEN 'completed' ELSE phase END
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error("[pipeline/db-store] saveChunkOutput failed", { jobId: id, kind, error: err instanceof Error ? err.message : String(err) });
        throw err;
      }
    },

    async getChunkOutput(id: string, kind: ChunkKind): Promise<ChunkOutput | undefined> {
      const job = await this.getJob(id);
      if (!job) return undefined;
      const chunk = job.completedChunks.find((c) => c.kind === kind);
      return chunk?.output;
    },

    async getChunkRecord(id: string, kind: ChunkKind): Promise<ChunkRecord | undefined> {
      const job = await this.getJob(id);
      if (!job) return undefined;
      return job.chunkRecords?.[kind];
    },

    async setChunkRunning(id: string, kind: ChunkKind): Promise<void> {
      const updatedAt = now();
      const path = [kind ?? "unknown"] as string[];
      try {
        await sql`
          UPDATE pipeline_jobs
          SET
            chunk_records = jsonb_set(
              CASE WHEN chunk_records IS NOT NULL AND jsonb_typeof(chunk_records) = 'object' THEN chunk_records ELSE '{}'::jsonb END,
              ${textArray(path)},
              jsonb_build_object(
                'status', 'running',
                'attemptCount', COALESCE((chunk_records->${kind}->>'attemptCount')::int, 0)
              )
            ),
            updated_at = ${updatedAt}
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error("[pipeline/db-store] setChunkRunning failed", { jobId: id, kind, error: err instanceof Error ? err.message : String(err) });
        throw err;
      }
    },

    async setChunkFailed(id: string, kind: ChunkKind, errorMessage: string): Promise<void> {
      const updatedAt = now();
      const path = [kind ?? "unknown"] as string[];
      // Ensure we never pass undefined; coerce to string so Postgres can infer parameter type
      const errorStr = typeof errorMessage === "string" ? errorMessage : String(errorMessage ?? "");
      const errorFragment = optionalText(errorStr);
      // to_jsonb($N::text) so Postgres infers param type for jsonb_build_object (avoids "parameter $3")
      try {
        await sql`
          UPDATE pipeline_jobs
          SET
            chunk_records = jsonb_set(
              CASE WHEN chunk_records IS NOT NULL AND jsonb_typeof(chunk_records) = 'object' THEN chunk_records ELSE '{}'::jsonb END,
              ${textArray(path)},
              jsonb_build_object(
                'status', 'failed',
                'attemptCount', COALESCE((chunk_records->${kind}->>'attemptCount')::int, 0) + 1,
                'errorMessage', to_jsonb(${errorStr}::text)
              )
            ),
            updated_at = ${updatedAt},
            error_message = ${errorFragment},
            phase = 'failed'
          WHERE id = ${id}
        `;
      } catch (err) {
        console.error("[pipeline/db-store] setChunkFailed failed", { jobId: id, kind, error: err instanceof Error ? err.message : String(err) });
        throw err;
      }
    },

    async cleanup(maxAgeMs: number): Promise<void> {
      const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
      await sql`DELETE FROM pipeline_jobs WHERE created_at < ${cutoff}`;
    },
  };
}
