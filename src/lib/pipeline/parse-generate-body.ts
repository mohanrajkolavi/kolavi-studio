/**
 * Shared request parsing for blog generate and research endpoints.
 * Returns PipelineInput or a single error string for 400 responses.
 */

import type { PipelineInput, SearchIntent, WordCountPreset, DraftModel } from "./types";

const ALLOWED_INTENTS = new Set<SearchIntent>([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

const WORD_COUNT_PRESETS = new Set<WordCountPreset>(["auto", "custom"]);
const DRAFT_MODELS = new Set<DraftModel>(["opus-4.6", "sonnet-4.6"]);
const WORD_COUNT_CUSTOM_MIN = 500;
const WORD_COUNT_CUSTOM_MAX = 6000;

export type ParseGenerateBodyResult =
  | { pipelineInput: PipelineInput }
  | { error: string };

export function parseGenerateBody(body: unknown): ParseGenerateBodyResult {
  if (body == null || typeof body !== "object") {
    return { error: "Request body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;
  const { keywords, peopleAlsoSearchFor, intent, wordCountPreset, wordCountCustom, draftModel, autoFixHallucinations } = b;

  const keywordTokens =
    typeof keywords === "string"
      ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
      : Array.isArray(keywords)
        ? keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
        : [];
  const primaryKeyword = keywordTokens[0] ?? "";
  if (!primaryKeyword) {
    return { error: "Primary keyword is required" };
  }
  /** Max 2 secondary keywords. */
  const secondaryParts = keywordTokens.slice(1, 3);
  const secondaryKeywords = secondaryParts.length > 0 ? secondaryParts : undefined;

  const pasf =
    peopleAlsoSearchFor != null
      ? (Array.isArray(peopleAlsoSearchFor)
          ? peopleAlsoSearchFor.slice(0, 5).map((p: unknown) => String(p).trim()).filter(Boolean)
          : String(peopleAlsoSearchFor)
              .split(/[,;\n]+/)
              .map((p: string) => p.trim())
              .filter(Boolean)
              .slice(0, 5))
      : undefined;

  const intentList = Array.isArray(intent)
    ? intent
        .map((i: unknown) => String(i).trim().toLowerCase())
        .filter((i): i is SearchIntent => Boolean(i && ALLOWED_INTENTS.has(i as SearchIntent)))
    : intent && typeof intent === "string"
    ? (() => {
        const v = intent.trim().toLowerCase();
        return v && ALLOWED_INTENTS.has(v as SearchIntent) ? [v as SearchIntent] : undefined;
      })()
    : undefined;
  const resolvedIntent: SearchIntent[] = intentList?.length ? intentList : ["informational" as SearchIntent];

  const presetRaw =
    wordCountPreset != null && typeof wordCountPreset === "string"
      ? wordCountPreset.trim().toLowerCase()
      : undefined;
  const resolvedPreset: WordCountPreset | undefined =
    presetRaw && WORD_COUNT_PRESETS.has(presetRaw as WordCountPreset)
      ? (presetRaw as WordCountPreset)
      : undefined;
  const customRaw =
    wordCountCustom != null
      ? typeof wordCountCustom === "number"
        ? wordCountCustom
        : Number(String(wordCountCustom).trim())
      : undefined;
  const resolvedCustom =
    resolvedPreset === "custom" &&
    typeof customRaw === "number" &&
    Number.isFinite(customRaw) &&
    customRaw >= WORD_COUNT_CUSTOM_MIN &&
    customRaw <= WORD_COUNT_CUSTOM_MAX
      ? Math.round(customRaw)
      : undefined;

  const resolvedAutoFix =
    autoFixHallucinations === undefined || autoFixHallucinations === null
      ? true
      : Boolean(autoFixHallucinations);

  const draftModelRaw =
    draftModel != null && typeof draftModel === "string"
      ? draftModel.trim().toLowerCase()
      : undefined;
  const resolvedDraftModel: DraftModel | undefined =
    draftModelRaw && DRAFT_MODELS.has(draftModelRaw as DraftModel)
      ? (draftModelRaw as DraftModel)
      : undefined;

  const pipelineInput: PipelineInput = {
    primaryKeyword,
    secondaryKeywords: secondaryKeywords?.length ? secondaryKeywords : undefined,
    peopleAlsoSearchFor: pasf?.length ? pasf : undefined,
    intent: resolvedIntent,
    ...(resolvedPreset != null && { wordCountPreset: resolvedPreset }),
    ...(resolvedPreset === "custom" && resolvedCustom != null && { wordCountCustom: resolvedCustom }),
    ...(resolvedDraftModel != null && { draftModel: resolvedDraftModel }),
    autoFixHallucinations: resolvedAutoFix,
  };

  return { pipelineInput };
}
