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

/** Each pipeline process shown clearly to the user. */
type ProcessKey = "competitors" | "fetch_articles" | "brief" | "draft" | "validate";

const PROCESSES: { key: ProcessKey; label: string; description: string }[] = [
  { key: "competitors", label: "Finding competitors", description: "Searching for top results for your keyword" },
  { key: "fetch_articles", label: "Fetching articles", description: "Reading content from selected competitor URLs" },
  { key: "brief", label: "Building brief", description: "Creating research brief and outline" },
  { key: "draft", label: "Writing draft", description: "Generating the article draft" },
  { key: "validate", label: "Validating", description: "Running SEO and quality checks" },
];

const DEMO_MESSAGES: Partial<Record<DemoStep, string>> = {
  research: "Searching competitors…",
  fetch: "Fetching selected articles…",
  brief: "Building research brief…",
  draft: "Writing article draft…",
  validate: "Validating…",
};

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
  const message =
    isDemo
      ? DEMO_MESSAGES[demoStep] ?? "Starting…"
      : progress?.message ?? "Starting…";

  const elapsedSeconds = isDemo
    ? demoElapsedTick
    : generationStartedAt != null
      ? Math.round((Date.now() - generationStartedAt) / 1000)
      : progress
        ? Math.round((progress.elapsedMs || 0) / 1000)
        : 0;

  const progressPercent = isDemo ? demoProgress : progress?.progress ?? 0;

  /** Map process key to done/current for both real and demo. */
  const getProcessState = (key: ProcessKey) => {
    const hasSerp = isDemo ? demoChunkOutputs.researchSerp != null : !!chunkOutputs.researchSerp;
    const hasResearch = isDemo ? demoChunkOutputs.research != null : !!chunkOutputs.research;
    const hasBrief = isDemo ? demoChunkOutputs.brief != null : !!chunkOutputs.brief;

    const done = isDemo
      ? key === "competitors"
        ? hasSerp || ["fetch", "brief", "brief_done", "draft", "validate", "complete"].includes(demoStep)
        : key === "fetch_articles"
          ? hasResearch || ["brief", "brief_done", "draft", "validate", "complete"].includes(demoStep)
          : key === "brief"
            ? hasBrief || ["draft", "validate", "complete"].includes(demoStep)
            : key === "draft"
              ? ["validate", "complete"].includes(demoStep)
              : demoStep === "complete"
      : key === "competitors"
        ? hasSerp
        : key === "fetch_articles"
          ? hasResearch
          : key === "brief"
            ? hasBrief
            : key === "draft"
              ? !!chunkOutputs.draft
              : !!chunkOutputs.validation;

    const chunk = progress?.chunk;
    const current = isDemo
      ? (key === "competitors" && demoStep === "research") ||
        (key === "fetch_articles" && demoStep === "fetch") ||
        (key === "brief" && demoStep === "brief") ||
        (key === "draft" && demoStep === "draft") ||
        (key === "validate" && demoStep === "validate")
      : (key === "competitors" && chunk === "research" && !hasSerp) ||
        (key === "fetch_articles" && chunk === "research" && hasSerp && !hasResearch) ||
        (key === "brief" && chunk === "brief") ||
        (key === "draft" && chunk === "draft") ||
        (key === "validate" && chunk === "validate");

    return { done, current };
  };

  /** Which process is active (for description). */
  const currentProcess = PROCESSES.find(({ key }) => getProcessState(key).current);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Content generation in progress"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-6 py-10 animate-in fade-in duration-300 bg-background/90 backdrop-blur-2xl border border-border/40"
    >
      {/* Current step: message + elapsed + % */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <div className="generation-loading-spinner shrink-0" aria-hidden />
          <p className="text-[17px] font-semibold tracking-tight text-foreground">
            {message}
          </p>
        </div>
        {currentProcess && (
          <p className="text-[13px] text-muted-foreground max-w-[320px]">
            {currentProcess.description}
          </p>
        )}
        <p className="text-[12px] font-medium tabular-nums text-muted-foreground/90 rounded-full bg-muted/50 px-3 py-1">
          {elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : "—"} elapsed
          <span className="mx-2 text-muted-foreground/60">·</span>
          {Math.round(progressPercent)}%
        </p>
      </div>

      {/* Process list: each step clearly labeled */}
      <div className="w-full max-w-[520px] space-y-2">
        {PROCESSES.map(({ key, label, description }, i) => {
          const { done, current } = getProcessState(key);
          const stepNum = i + 1;
          return (
            <div
              key={key}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all duration-300 ${
                current
                  ? "border-orange-500/60 bg-orange-500/10"
                  : done
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10"
                    : "border-border/50 bg-muted/20"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors ${
                  done ? "" : current ? "" : "bg-muted/50 text-muted-foreground"
                }`}
                aria-hidden
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                ) : current ? (
                  <span className="generation-loading-spinner-sm generation-loading-spinner-on-orange h-4 w-4" aria-hidden />
                ) : (
                  stepNum
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] font-medium ${
                    current ? "text-foreground" : done ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"
                  }`}
                >
                  {label}
                </p>
                {current && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[420px]" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100} aria-label="Overall progress">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-muted/30">
          <div
            className="generation-loading-bar h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(2, progressPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
