/**
 * Shared request parsing for blog generate and research endpoints.
 * Returns PipelineInput or a single error string for 400 responses.
 */

import type { PipelineInput, SearchIntent, DraftModel } from "./types";
import type { VoicePresetId } from "@/lib/constants/voices";

const ALLOWED_INTENTS = new Set<SearchIntent>([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

const DRAFT_MODELS = new Set<DraftModel>(["opus-4.6", "sonnet-4.6"]);

const ALLOWED_VOICES = new Set<VoicePresetId>([
  "conversational-expert",
  "authoritative-practitioner",
  "friendly-guide",
  "newsletter-editorial",
  "custom",
]);

export type ParseGenerateBodyResult =
  | { pipelineInput: PipelineInput }
  | { error: string };

export function parseGenerateBody(body: unknown): ParseGenerateBodyResult {
  if (body == null || typeof body !== "object") {
    return { error: "Request body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;
  const { keywords, peopleAlsoSearchFor, intent, draftModel, autoFixHallucinations, voice, customVoiceDescription, fieldNotes, toneExamples } = b;

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
  /** Max 4 secondary keywords. */
  const secondaryParts = keywordTokens.slice(1, 5);
  const secondaryKeywords = secondaryParts.length > 0 ? secondaryParts : undefined;

  const pasf =
    peopleAlsoSearchFor != null
      ? (Array.isArray(peopleAlsoSearchFor)
        ? peopleAlsoSearchFor
          .map((p: unknown) => String(p).trim())
          .filter(Boolean)
          .slice(0, 5)
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

  // Voice preset
  const voiceRaw = voice != null && typeof voice === "string" ? voice.trim().toLowerCase() : undefined;
  const resolvedVoice: VoicePresetId | undefined =
    voiceRaw && ALLOWED_VOICES.has(voiceRaw as VoicePresetId)
      ? (voiceRaw as VoicePresetId)
      : undefined;

  // Custom voice description (only when voice === "custom")
  const resolvedCustomVoice =
    resolvedVoice === "custom" && typeof customVoiceDescription === "string" && customVoiceDescription.trim()
      ? customVoiceDescription.trim().slice(0, 3000)
      : undefined;

  // Field notes (E-E-A-T author experience)
  const resolvedFieldNotes =
    typeof fieldNotes === "string" && fieldNotes.trim()
      ? fieldNotes.trim().slice(0, 3000)
      : undefined;

  // Tone examples (sample writing for voice matching)
  const resolvedToneExamples =
    typeof toneExamples === "string" && toneExamples.trim()
      ? toneExamples.trim().slice(0, 3000)
      : undefined;

  const pipelineInput: PipelineInput = {
    primaryKeyword,
    secondaryKeywords: secondaryKeywords?.length ? secondaryKeywords : undefined,
    peopleAlsoSearchFor: pasf?.length ? pasf : undefined,
    intent: resolvedIntent,
    ...(resolvedDraftModel != null && { draftModel: resolvedDraftModel }),
    autoFixHallucinations: resolvedAutoFix,
    ...(resolvedVoice != null && { voice: resolvedVoice }),
    ...(resolvedCustomVoice != null && { customVoiceDescription: resolvedCustomVoice }),
    ...(resolvedFieldNotes != null && { fieldNotes: resolvedFieldNotes }),
    ...(resolvedToneExamples != null && { toneExamples: resolvedToneExamples }),
  };

  return { pipelineInput };
}
