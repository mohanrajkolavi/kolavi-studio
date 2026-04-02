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

// ---------------------------------------------------------------------------
// Global cost aggregation + budget warnings
// ---------------------------------------------------------------------------

/** Default budget limit per pipeline run (USD). Override via PIPELINE_BUDGET_USD env var. */
const DEFAULT_BUDGET_USD = 2.0;

/** Get the budget limit from env or default. */
export function getPipelineBudgetUsd(): number {
  const env = process.env.PIPELINE_BUDGET_USD;
  if (env) {
    const parsed = parseFloat(env);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_BUDGET_USD;
}

/**
 * Aggregate total cost from token usage records across all LLM calls in a pipeline run.
 * Returns estimated USD spend.
 */
export function aggregateTokenUsageCost(
  tokenUsage: { callName: string; model: string; promptTokens: number; completionTokens: number }[]
): number {
  let total = 0;
  for (const record of tokenUsage) {
    const model = record.model.toLowerCase();
    let rate: { inputPer1k: number; outputPer1k: number };
    if (model.includes("claude") || model.includes("anthropic")) {
      rate = RATES.anthropic;
    } else if (model.includes("gpt") || model.includes("openai")) {
      rate = RATES.openai;
    } else if (model.includes("gemini")) {
      rate = RATES.gemini;
    } else {
      rate = { inputPer1k: 0.01, outputPer1k: 0.03 }; // conservative default
    }
    total += (record.promptTokens / 1000) * rate.inputPer1k;
    total += (record.completionTokens / 1000) * rate.outputPer1k;
  }
  return Math.round(total * 1e5) / 1e5;
}

/**
 * Check if accumulated cost exceeds budget. Logs a warning at 80% and returns
 * { overBudget: true } when the limit is exceeded.
 */
export function checkBudget(
  currentCostUsd: number,
  label = "pipeline"
): { overBudget: boolean; budgetUsd: number; usedUsd: number; pct: number } {
  const budgetUsd = getPipelineBudgetUsd();
  const pct = Math.round((currentCostUsd / budgetUsd) * 100);
  if (pct >= 80 && pct < 100) {
    console.warn(`[${label}] Cost warning: $${currentCostUsd.toFixed(4)} of $${budgetUsd} budget used (${pct}%)`);
  }
  if (currentCostUsd >= budgetUsd) {
    console.error(`[${label}] BUDGET EXCEEDED: $${currentCostUsd.toFixed(4)} >= $${budgetUsd} limit`);
    return { overBudget: true, budgetUsd, usedUsd: currentCostUsd, pct };
  }
  return { overBudget: false, budgetUsd, usedUsd: currentCostUsd, pct };
}
