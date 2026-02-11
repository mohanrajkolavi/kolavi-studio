"use client";

import { CheckCircle2 } from "lucide-react";
import type { ChunkOutputsState } from "@/lib/blog/generation-types";

type ChunkName = "research" | "brief" | "draft" | "validate";

type ProgressInfo = {
  step: string;
  status: "started" | "completed" | "failed" | "skipped";
  message: string;
  progress: number;
  elapsedMs: number;
  chunk?: ChunkName;
};

type DemoStep =
  | "research"
  | "select_done"
  | "fetch"
  | "research_done"
  | "brief"
  | "brief_done"
  | "draft"
  | "validate"
  | "complete";

type DemoChunkOutputs = {
  research: unknown | null;
  researchSerp: unknown | null;
  brief: unknown | null;
};

type StepKey = "competitors" | "research_brief" | "draft_validation";

const STEPS: { key: StepKey; label: string }[] = [
  { key: "competitors", label: "Competitors" },
  { key: "research_brief", label: "Research & Brief" },
  { key: "draft_validation", label: "Draft & Validation" },
];

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export type GenerationLoadingOverlayProps = {
  /** Show overlay when generating or demo running */
  visible: boolean;
  /** Real generation progress (null when demo) */
  progress: ProgressInfo | null;
  /** When real generation started (ms epoch) */
  generationStartedAt: number | null;
  /** Chunk outputs from provider */
  chunkOutputs: ChunkOutputsState;
  /** Demo mode: is demo running */
  demoRunning: boolean;
  /** Demo mode: current step */
  demoStep: DemoStep;
  /** Demo mode: 0–100 progress */
  demoProgress: number;
  /** Demo mode: when demo started */
  demoStartedAt: number | null;
  /** Demo mode: elapsed seconds tick */
  demoElapsedTick: number;
  /** Demo mode: chunk outputs */
  demoChunkOutputs: DemoChunkOutputs;
};

export function GenerationLoadingOverlay({
  visible,
  progress,
  generationStartedAt,
  chunkOutputs,
  demoRunning,
  demoStep,
  demoProgress,
  demoStartedAt,
  demoElapsedTick,
  demoChunkOutputs,
}: GenerationLoadingOverlayProps) {
  if (!visible) return null;

  const isDemo = demoRunning;
  const message = isDemo
    ? (["research", "fetch", "brief", "draft", "validate"].includes(demoStep)
        ? demoStep === "research"
          ? "Searching competitors…"
          : demoStep === "fetch"
            ? "Fetching selected articles…"
            : demoStep === "brief"
              ? "Building research brief…"
              : demoStep === "draft"
                ? "Writing article draft…"
                : "Validating…"
        : "Starting…")
    : progress?.message ?? "Starting…";

  const elapsedSeconds = isDemo
    ? demoElapsedTick
    : generationStartedAt != null
      ? Math.round((Date.now() - generationStartedAt) / 1000)
      : progress
        ? Math.round((progress.elapsedMs || 0) / 1000)
        : 0;

  const progressPercent = isDemo ? demoProgress : progress?.progress ?? 0;

  const getStepState = (key: StepKey) => {
    const isCompetitors = key === "competitors";
    const isResearchBrief = key === "research_brief";
    const isDraftValidation = key === "draft_validation";

    const done = isDemo
      ? (isCompetitors &&
          (demoChunkOutputs.researchSerp != null ||
            demoChunkOutputs.research != null ||
            ["select_done", "fetch", "brief", "brief_done", "draft", "validate"].includes(demoStep))) ||
        (isResearchBrief &&
          (demoChunkOutputs.brief != null || ["draft", "validate"].includes(demoStep))) ||
        (isDraftValidation && demoStep === "validate")
      : (isCompetitors && (!!chunkOutputs.researchSerp || !!chunkOutputs.research)) ||
        (isResearchBrief && !!chunkOutputs.brief) ||
        (isDraftValidation && !!chunkOutputs.validation);

    const step = progress?.step ?? "";
    const isCompetitorsStep = step === "" || /serper|search/i.test(step);
    const current = isDemo
      ? (isCompetitors && (demoStep === "research" || demoStep === "fetch")) ||
        (isResearchBrief && demoStep === "brief") ||
        (isDraftValidation && (demoStep === "draft" || demoStep === "validate"))
      : (progress?.chunk === "research" &&
          (isCompetitors ? isCompetitorsStep : !isCompetitorsStep)) ||
        (progress?.chunk === "brief" && isResearchBrief) ||
        ((progress?.chunk === "draft" || progress?.chunk === "validate") && isDraftValidation);

    return { done, current };
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Content generation in progress"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-10 px-6 py-12 animate-in fade-in duration-300 bg-background/85 backdrop-blur-2xl"
    >
      {/* Status — centered, spacious */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="generation-loading-spinner shrink-0" aria-hidden />
          <p className="text-[17px] font-medium tracking-tight text-foreground">
            {message}
          </p>
        </div>
        <p className="text-[13px] font-medium tabular-nums text-muted-foreground">
          {elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : "—"} elapsed
          <span className="mx-2 text-muted-foreground/50">·</span>
          {Math.round(progressPercent)}%
        </p>
      </div>

      {/* One-line stepper: Competitors – Research – Analyze – Draft – Validation */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {STEPS.map(({ key, label }, i) => {
          const { done, current } = getStepState(key);
          const isLast = i === STEPS.length - 1;
          return (
            <span key={key} className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium transition-all duration-300 ${
                  current
                    ? "bg-orange-500 text-white shadow-sm"
                    : done
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground/60"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                ) : current ? (
                  <span className="generation-loading-spinner-sm generation-loading-spinner-on-orange h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : null}
                {label}
              </span>
              {!isLast && (
                <span className="text-muted-foreground/30 text-[10px] font-light" aria-hidden>
                  –
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Progress bar — full width, max constrained */}
      <div className="w-full max-w-[420px]">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-muted/30">
          <div
            className="generation-loading-bar h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, progressPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
