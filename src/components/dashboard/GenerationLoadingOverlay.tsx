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
  /** Callback to stop generation */
  onAbort?: () => void;
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
  onAbort,
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
      className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[380px] rounded-[28px] sm:rounded-[40px] bg-background border border-border/40 shadow-2xl overflow-hidden backdrop-blur-3xl animate-in slide-in-from-bottom-8 fade-in-0 zoom-in-95 duration-500"
    >
      <div className="flex flex-col items-center w-full px-4 pt-6 pb-4 gap-4 sm:px-6 sm:pt-8 sm:pb-6 sm:gap-6 relative">

        {/* Main Status Text */}
        <div className="flex flex-col items-center gap-2 text-center animate-reveal-hero w-full">
          <div className="generation-loading-spinner h-8 w-8 mb-2 shrink-0" aria-hidden />
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {message}
          </h2>
          {currentProcess && (
            <p className="text-sm text-muted-foreground/80">
              {currentProcess.description}
            </p>
          )}
        </div>

        {/* Minimalist Process List */}
        <div className="w-full space-y-3 px-2 animate-reveal" style={{ animationDelay: "150ms" }}>
          {PROCESSES.map(({ key, label }) => {
            const { done, current } = getProcessState(key);

            return (
              <div
                key={key}
                className={`flex items-center gap-4 transition-all duration-500 ease-out ${current
                  ? "opacity-100 scale-100"
                  : done
                    ? "opacity-60 scale-95"
                    : "opacity-30 scale-95"
                  }`}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
                  ) : current ? (
                    <span className="generation-loading-spinner-sm h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <p
                  className={`text-[14px] font-medium transition-colors duration-500 ${current
                    ? "text-foreground"
                    : done
                      ? "text-foreground/80"
                      : "text-muted-foreground"
                    }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Actions Row */}
        <div className="mt-2 flex w-full items-center justify-between animate-reveal" style={{ animationDelay: "300ms" }}>

          {/* Floating Metrics Pill */}
          <div className="flex items-center gap-2.5 rounded-full bg-muted/50 border border-border/40 px-3.5 py-1.5 text-[12px] font-medium tabular-nums text-muted-foreground shadow-sm">
            <span>{elapsedSeconds > 0 ? formatElapsed(elapsedSeconds) : "0s"}</span>
            <div className="h-3 w-[1px] bg-border" />
            <span className="text-foreground">{Math.round(progressPercent)}%</span>
          </div>

          {/* End Process Button */}
          {onAbort ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAbort();
              }}
              className="text-[12px] font-medium text-destructive hover:text-destructive/90 transition-colors px-3.5 py-1.5 rounded-full hover:bg-destructive/10 active:scale-95"
            >
              End Process
            </button>
          ) : (
            <div />
          )}

        </div>

        {/* Ultra-thin Progress Bar - Positioned at Bottom of Card */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-transparent overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100}>
          <div
            className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,100,0,0.4)]"
            style={{ width: `${Math.max(1, progressPercent)}%` }}
          />
        </div>

      </div>
    </div>
  );
}
