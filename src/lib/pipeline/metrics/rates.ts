/**
 * Configurable per-unit cost rates for pipeline cost estimation.
 * All USD. Used by metrics collector to compute estimatedCostUsd per run.
 */

export type ProviderRate = {
  /** Cost per call (e.g. per search, per URL). */
  callCost?: number;
  /** Cost per 1K input tokens. */
  inputPer1k?: number;
  /** Cost per 1K output tokens. */
  outputPer1k?: number;
};

/** Default rates — override via PIPELINE_COST_RATES env (JSON) if needed. */
export const DEFAULT_PIPELINE_COST_RATES: Record<string, ProviderRate> = {
  serper: { callCost: 0.001 },
  jina: { callCost: 0.002 },
  gemini: { inputPer1k: 0.00025, outputPer1k: 0.001 },
  "openai-gpt-4.1": { inputPer1k: 0.01, outputPer1k: 0.03 },
  "openai-gpt-4.1-mini": { inputPer1k: 0.002, outputPer1k: 0.008 },
  "anthropic-claude-sonnet": { inputPer1k: 0.003, outputPer1k: 0.015 },
};

let _rates: Record<string, ProviderRate> = { ...DEFAULT_PIPELINE_COST_RATES };

/** Get current rates (can be overridden by env). */
export function getPipelineCostRates(): Record<string, ProviderRate> {
  return { ..._rates };
}

/** Override rates (e.g. from env PIPELINE_COST_RATES JSON). */
export function setPipelineCostRates(rates: Record<string, ProviderRate>): void {
  _rates = { ...rates };
}

/** Initialize from env; call once at app start if desired. */
export function initPipelineCostRatesFromEnv(): void {
  const raw = process.env.PIPELINE_COST_RATES;
  if (raw && typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, ProviderRate>;
      if (parsed && typeof parsed === "object") {
        setPipelineCostRates({ ...DEFAULT_PIPELINE_COST_RATES, ...parsed });
      }
    } catch {
      // ignore invalid JSON
    }
  }
}

/** Resolve provider key for token-based calls: model name -> rate key. */
export function getRateKeyForModel(model: string): string {
  const m = model?.toLowerCase() ?? "";
  if (m.includes("gpt-4.1-mini")) return "openai-gpt-4.1-mini";
  if (m.includes("gpt-4.1") || m.includes("gpt-4")) return "openai-gpt-4.1";
  if (m.includes("claude-sonnet") || m.includes("claude-3-5-sonnet")) return "anthropic-claude-sonnet";
  if (m.includes("claude")) return "anthropic-claude-sonnet";
  return "openai-gpt-4.1"; // fallback
}

/** Estimate cost in USD for one API call record. */
export function estimateApiCallCostUsd(
  provider: string,
  endpoint: string | undefined,
  inputTokens?: number,
  outputTokens?: number,
  callCost?: number
): number {
  const rates = getPipelineCostRates();
  let rate: ProviderRate | undefined = rates[provider];
  if (!rate && (provider === "openai" || endpoint?.includes("extract") || endpoint?.includes("brief"))) {
    rate = rates["openai-gpt-4.1"];
  }
  if (!rate && (provider === "anthropic" || endpoint?.includes("Draft") || endpoint?.includes("writeDraft"))) {
    rate = rates["anthropic-claude-sonnet"];
  }
  if (!rate) return 0;
  let usd = 0;
  if (rate.callCost != null && (callCost !== undefined ? callCost > 0 : true)) usd += rate.callCost * (callCost ?? 1);
  const inK = ((inputTokens ?? 0) / 1000) * (rate.inputPer1k ?? 0);
  const outK = ((outputTokens ?? 0) / 1000) * (rate.outputPer1k ?? 0);
  usd += inK + outK;
  return Math.round(usd * 1e6) / 1e6;
}
