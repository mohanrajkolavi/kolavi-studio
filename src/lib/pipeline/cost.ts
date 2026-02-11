/**
 * Rough cost estimation per provider (USD). Used for retry UI ("Retrying from X saves ~$0.03").
 * Token rates are approximate; duration is used as a fallback when tokens unknown.
 */

import type { ChunkCost, ProviderUsage } from "./jobs/types";

// Rough $ per 1K tokens (input / output) — adjust as needed
const RATES: Record<string, { inputPer1k: number; outputPer1k: number; callCost?: number }> = {
  serper: { inputPer1k: 0, outputPer1k: 0, callCost: 0.001 },
  jina: { inputPer1k: 0, outputPer1k: 0, callCost: 0.002 },
  gemini: { inputPer1k: 0.00025, outputPer1k: 0.001 },
  openai: { inputPer1k: 0.01, outputPer1k: 0.03 },
  anthropic: { inputPer1k: 0.003, outputPer1k: 0.015 },
};

export function estimateChunkCostUsd(cost: ChunkCost): number {
  let usd = 0;
  for (const [provider, usage] of Object.entries(cost.providers)) {
    const rate = RATES[provider];
    if (!rate) continue;
    if (rate.callCost !== undefined && usage.calls > 0) {
      usd += rate.callCost * usage.calls;
    }
    const inK = ((usage.inputTokens ?? 0) / 1000) * (rate.inputPer1k ?? 0);
    const outK = ((usage.outputTokens ?? 0) / 1000) * (rate.outputPer1k ?? 0);
    usd += inK + outK;
  }
  return Math.round(usd * 1e5) / 1e5;
}

export function buildChunkCost(
  providers: Record<string, ProviderUsage>,
  durationMs?: number
): ChunkCost {
  const cost: ChunkCost = { providers };
  if (durationMs !== undefined) cost.durationMs = durationMs;
  cost.estimatedCostUsd = estimateChunkCostUsd(cost);
  return cost;
}

/** Sum estimated cost for completed chunks (for "savings" on retry). */
export function sumCompletedChunkCosts(
  chunkRecords: Partial<Record<string, { cost?: ChunkCost }>>
): number {
  let total = 0;
  for (const rec of Object.values(chunkRecords)) {
    if (rec?.cost?.estimatedCostUsd != null) total += rec.cost.estimatedCostUsd;
  }
  return Math.round(total * 1e5) / 1e5;
}

/** Sum duration (ms) for completed chunks (for "saves X seconds" on retry). */
export function sumCompletedChunkDurations(
  chunkRecords: Partial<Record<string, { cost?: ChunkCost }>>
): number {
  let total = 0;
  for (const rec of Object.values(chunkRecords)) {
    if (rec?.cost?.durationMs != null) total += rec.cost.durationMs;
  }
  return total;
}
