"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type BriefChunkResult,
  type BriefOverridesForDraft,
  type ChunkName,
  type ChunkOutputsState,
  type DraftChunkResult,
  type GeneratedContent,
  type GenerationInput,
  type Phase,
  type PipelineResult,
  type ResearchChunkResult,
  type ValidationChunkResult,
  buildPipelineResultFromChunks,
  pipelineToGenerated,
} from "@/lib/blog/generation-types";

type Status = "idle" | "generating" | "success" | "error";

export type ProgressInfo = {
  step: string;
  status: "started" | "completed" | "failed" | "skipped";
  message: string;
  progress: number;
  elapsedMs: number;
  /** Step mode: which chunk is running. */
  chunk?: ChunkName;
};

type ResultState = {
  pipelineResult: PipelineResult | null;
  fallbackGenerated: GeneratedContent | null;
  input: GenerationInput;
};

type BlogGenerationContextValue = {
  status: Status;
  generating: boolean;
  result: ResultState | null;
  generated: GeneratedContent | null;
  error: string | null;
  progress: ProgressInfo | null;
  /** When the current run started (ms since epoch). Used to show total elapsed. */
  generationStartedAt: number | null;
  startGeneration: (input: GenerationInput) => void;
  clearResult: () => void;
  clearError: () => void;
  phase: Phase;
  jobId: string | null;
  chunkOutputs: ChunkOutputsState;
  errorChunk: ChunkName | null;
  startResearchFetch: (jobId: string, selectedUrls: string[]) => void;
  startBrief: (jobId: string) => void;
  startReviseBrief: (jobId: string, wordCountTarget: number) => void;
  startDraft: (jobId: string, briefOverrides?: BriefOverridesForDraft) => void;
  startValidate: (jobId: string) => void;
  retryFromChunk: (chunk: ChunkName) => void;
};

const BlogGenerationContext = createContext<BlogGenerationContextValue | null>(
  null
);

function useBlogGenerationContext() {
  const ctx = useContext(BlogGenerationContext);
  if (!ctx) {
    throw new Error(
      "useBlogGeneration must be used within BlogGenerationProvider"
    );
  }
  return ctx;
}

/** Hook for components that need blog generation state. */
export function useBlogGeneration() {
  return useBlogGenerationContext();
}

/** Hook that returns null if outside provider (for optional usage e.g. nav strip). */
export function useBlogGenerationOptional() {
  return useContext(BlogGenerationContext);
}

type BlogGenerationProviderProps = { children: ReactNode };

// Step labels for human-readable progress messages
const STEP_LABELS: Record<string, string> = {
  serper: "Searching competitors",
  jina: "Fetching competitor articles",
  "gemini-grounding": "Gathering current data",
  "topic-extraction": "Extracting topics & style",
  "url-validation": "Validating source URLs",
  "gpt-brief": "Building research brief",
  "claude-draft": "Writing article draft",
  "faq-enforcement": "Enforcing FAQ limits",
  audit: "Running SEO audit",
  "fact-check": "Verifying facts",
  done: "Complete",
};

function buildGenerateBody(input: GenerationInput): Record<string, unknown> {
  return {
    keywords: input.keywords.join(", "),
    peopleAlsoSearchFor: input.peopleAlsoSearchFor.join(", "),
    intent: input.intent.length > 0 ? input.intent : ["informational"],
    competitorUrls: input.competitorUrls,
    ...(input.wordCountPreset != null && { wordCountPreset: input.wordCountPreset }),
    ...(input.wordCountPreset === "custom" && input.wordCountCustom != null && { wordCountCustom: input.wordCountCustom }),
  };
}

export function BlogGenerationProvider({ children }: BlogGenerationProviderProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [jobId, setJobIdState] = useState<string | null>(null);
  const [chunkOutputs, setChunkOutputs] = useState<ChunkOutputsState>({
    research: null,
    researchSerp: null,
    brief: null,
    draft: null,
    validation: null,
  });
  const [errorChunk, setErrorChunk] = useState<ChunkName | null>(null);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const lastInputRef = useRef<GenerationInput | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<Status>(status);
  statusRef.current = status;

  const generated: GeneratedContent | null = result
    ? result.pipelineResult
      ? pipelineToGenerated(result.pipelineResult)
      : result.fallbackGenerated
    : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Restore SERP from job on load (e.g. after refresh) when job is waiting for competitor selection
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem("blog-job-id");
    } catch {
      // ignore
    }
    if (!stored?.trim()) return;
    (async () => {
      try {
        const res = await fetch(`/api/blog/job/${encodeURIComponent(stored!)}`);
        if (!res.ok || !mountedRef.current) return;
        const job = (await res.json()) as {
          phase?: string;
          serpResults?: Array<{ position: number; title: string; url: string }>;
        };
        if (job.phase !== "waiting_for_review" || !Array.isArray(job.serpResults) || job.serpResults.length === 0) return;
        if (!mountedRef.current) return;
        setJobIdState(stored);
        setChunkOutputs((prev) => ({
          ...prev,
          researchSerp: { results: job.serpResults! },
          research: null,
        }));
        setPhase("reviewing");
        setStatus("idle");
      } catch {
        // ignore restore errors
      }
    })();
  }, []);

  const startGeneration = useCallback(async (input: GenerationInput) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;
    lastInputRef.current = input;

    setStatus("generating");
    setPhase("researching");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress(null);
    setChunkOutputs({ research: null, researchSerp: null, brief: null, draft: null, validation: null });
    setJobIdState(null);

    const guarded = {
      setStatus: (s: Status) => {
        if (!signal.aborted && mountedRef.current) setStatus(s);
      },
      setPhase: (p: Phase) => {
        if (!signal.aborted && mountedRef.current) setPhase(p);
      },
      setResult: (r: ResultState | null) => {
        if (!signal.aborted && mountedRef.current) setResult(r);
      },
      setError: (e: string | null) => {
        if (!signal.aborted && mountedRef.current) setError(e);
      },
      setProgress: (p: ProgressInfo | null) => {
        if (!signal.aborted && mountedRef.current) setProgress(p);
      },
      setJobId: (id: string | null) => {
        if (!signal.aborted && mountedRef.current) {
          setJobIdState(id);
          try {
            if (id) sessionStorage.setItem("blog-job-id", id);
            else sessionStorage.removeItem("blog-job-id");
          } catch (e) {
            // sessionStorage can throw in restricted/private browsing; swallow so state still updates
            if (typeof console !== "undefined" && console.warn) console.warn("[BlogGenerationProvider] sessionStorage failed:", e);
          }
        }
      },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => {
        if (!signal.aborted && mountedRef.current) setChunkOutputs(updater);
      },
      setErrorChunk: (c: ChunkName | null) => {
        if (!signal.aborted && mountedRef.current) setErrorChunk(c);
      },
      setGenerationStartedAt: (v: number | null) => {
        if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v);
      },
    };

    try {
      const response = await fetch("/api/blog/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildGenerateBody(input)),
        credentials: "include",
        signal,
      });
      if (signal.aborted || !mountedRef.current) return;
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? "Research failed");
        }
        throw new Error("Expected SSE stream");
      }
      await processResearchSSE(response, signal, guarded, input);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setGenerationStartedAt(null);
      const msg = err instanceof Error ? err.message : "Research failed";
      if (msg.includes("Job not found")) setJobIdState(null);
      guarded.setError(msg);
      guarded.setPhase("error");
      guarded.setStatus("error");
      guarded.setErrorChunk("research");
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
    setStatus("idle");
    setPhase("idle");
    setGenerationStartedAt(null);
    setJobIdState(null);
    try {
      sessionStorage.removeItem("blog-job-id");
    } catch {
      // ignore
    }
    setChunkOutputs({ research: null, researchSerp: null, brief: null, draft: null, validation: null });
    setErrorChunk(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const startBriefRef = useRef<(jid: string) => void>(() => {});

  const startResearchFetch = useCallback((jid: string, selectedUrls: string[]) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    setStatus("generating");
    setPhase("researching");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress({ step: "jina", status: "started", message: "Fetching selected articles...", progress: 0, elapsedMs: 0, chunk: "research" });
    const guarded = {
      setStatus: (s: Status) => { if (!signal.aborted && mountedRef.current) setStatus(s); },
      setPhase: (p: Phase) => { if (!signal.aborted && mountedRef.current) setPhase(p); },
      setError: (e: string | null) => { if (!signal.aborted && mountedRef.current) setError(e); },
      setProgress: (p: ProgressInfo | null) => { if (!signal.aborted && mountedRef.current) setProgress(p); },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => { if (!signal.aborted && mountedRef.current) setChunkOutputs(updater); },
      setErrorChunk: (c: ChunkName | null) => { if (!signal.aborted && mountedRef.current) setErrorChunk(c); },
      setGenerationStartedAt: (v: number | null) => { if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v); },
    };
    const input = lastInputRef.current;
    const serp = chunkOutputs.researchSerp?.results ?? [];
    const body: Record<string, unknown> = { jobId: jid, selectedUrls };
    if (input && serp.length > 0) {
      body.input = buildGenerateBody(input);
      body.serpResults = serp;
    }
    (async () => {
      try {
        const response = await fetch("/api/blog/research/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
          signal,
        });
        if (signal.aborted || !mountedRef.current) return;
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/event-stream")) {
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error((data as { error?: string }).error ?? "Research fetch failed");
          }
          throw new Error("Expected SSE stream");
        }
        await processResearchFetchSSE(response, signal, guarded);
        if (!signal.aborted && mountedRef.current) startBriefRef.current(jid);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setGenerationStartedAt(null);
        const msg = err instanceof Error ? err.message : "Research fetch failed";
        if (msg.includes("Job not found")) setJobIdState(null);
        guarded.setError(msg);
        guarded.setPhase("error");
        guarded.setStatus("error");
        guarded.setErrorChunk("research");
      }
    })();
  }, [chunkOutputs.researchSerp]);

  const startBrief = useCallback((jid: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    setStatus("generating");
    setPhase("analyzing");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress({ step: "gpt-brief", status: "started", message: "Building research brief...", progress: 0, elapsedMs: 0, chunk: "brief" });
    const guarded = {
      setStatus: (s: Status) => { if (!signal.aborted && mountedRef.current) setStatus(s); },
      setPhase: (p: Phase) => { if (!signal.aborted && mountedRef.current) setPhase(p); },
      setError: (e: string | null) => { if (!signal.aborted && mountedRef.current) setError(e); },
      setProgress: (p: ProgressInfo | null) => { if (!signal.aborted && mountedRef.current) setProgress(p); },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => { if (!signal.aborted && mountedRef.current) setChunkOutputs(updater); },
      setErrorChunk: (c: ChunkName | null) => { if (!signal.aborted && mountedRef.current) setErrorChunk(c); },
      setGenerationStartedAt: (v: number | null) => { if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v); },
    };
    (async () => {
      try {
        await processBriefSSE(jid, signal, guarded);
        if (!signal.aborted && mountedRef.current) setPhase("reviewing");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setGenerationStartedAt(null);
        const msg = err instanceof Error ? err.message : "Brief failed";
        if (msg.includes("Job not found")) setJobIdState(null);
        guarded.setError(msg);
        guarded.setPhase("error");
        guarded.setStatus("error");
        guarded.setErrorChunk("brief");
      }
    })();
  }, [mountedRef]);

  useEffect(() => {
    startBriefRef.current = startBrief;
  }, [startBrief]);

  const startReviseBrief = useCallback((jid: string, wordCountTarget: number) => {
    if (statusRef.current === "generating") return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    setStatus("generating");
    setPhase("analyzing");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress({ step: "gpt-brief", status: "started", message: "Revising brief with new word count...", progress: 0, elapsedMs: 0, chunk: "brief" });
    const guarded = {
      setStatus: (s: Status) => { if (!signal.aborted && mountedRef.current) setStatus(s); },
      setPhase: (p: Phase) => { if (!signal.aborted && mountedRef.current) setPhase(p); },
      setError: (e: string | null) => { if (!signal.aborted && mountedRef.current) setError(e); },
      setProgress: (p: ProgressInfo | null) => { if (!signal.aborted && mountedRef.current) setProgress(p); },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => { if (!signal.aborted && mountedRef.current) setChunkOutputs(updater); },
      setErrorChunk: (c: ChunkName | null) => { if (!signal.aborted && mountedRef.current) setErrorChunk(c); },
      setGenerationStartedAt: (v: number | null) => { if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v); },
    };
    (async () => {
      try {
        await processBriefSSE(jid, signal, guarded, { revise: true, wordCountTarget });
        if (!signal.aborted && mountedRef.current) setPhase("reviewing");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setGenerationStartedAt(null);
        const msg = err instanceof Error ? err.message : "Revise brief failed";
        if (msg.includes("Job not found")) setJobIdState(null);
        guarded.setError(msg);
        guarded.setPhase("error");
        guarded.setStatus("error");
        guarded.setErrorChunk("brief");
      }
    })();
  }, [mountedRef]);

  const startDraft = useCallback((jid: string, briefOverrides?: BriefOverridesForDraft) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    setStatus("generating");
    setPhase("drafting");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress({ step: "claude-draft", status: "started", message: "Writing article draft...", progress: 0, elapsedMs: 0, chunk: "draft" });
    const input = lastInputRef.current;
    const guarded = {
      setPhase: (p: Phase) => { if (!signal.aborted && mountedRef.current) setPhase(p); },
      setStatus: (s: Status) => { if (!signal.aborted && mountedRef.current) setStatus(s); },
      setResult: (r: ResultState | null) => { if (!signal.aborted && mountedRef.current) setResult(r); },
      setError: (e: string | null) => { if (!signal.aborted && mountedRef.current) setError(e); },
      setProgress: (p: ProgressInfo | null) => { if (!signal.aborted && mountedRef.current) setProgress(p); },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => { if (!signal.aborted && mountedRef.current) setChunkOutputs(updater); },
      setErrorChunk: (c: ChunkName | null) => { if (!signal.aborted && mountedRef.current) setErrorChunk(c); },
      setGenerationStartedAt: (v: number | null) => { if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v); },
    };
    (async () => {
      let draftFromSSE: DraftChunkResult | null = null;
      try {
        draftFromSSE = await processDraftSSE(jid, briefOverrides, signal, guarded);
        if (!signal.aborted && mountedRef.current && input) {
          setPhase("validating");
          await processValidateRequest(jid, signal, guarded, input, draftFromSSE ?? undefined);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setGenerationStartedAt(null);
        const msg = err instanceof Error ? err.message : "Draft or validation failed";
        if (msg.includes("Job not found")) setJobIdState(null);
        guarded.setError(msg);
        guarded.setPhase("error");
        guarded.setStatus("error");
        guarded.setErrorChunk(draftFromSSE != null ? "validate" : "draft");
      }
    })();
  }, []);

  const startValidate = useCallback((jid: string) => {
    const input = lastInputRef.current;
    if (!input) return;
    setStatus("generating");
    setPhase("validating");
    setGenerationStartedAt(Date.now());
    setError(null);
    setErrorChunk(null);
    setProgress({ step: "validate", status: "started", message: "Validating...", progress: 0, elapsedMs: 0, chunk: "validate" });
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const signal = controller.signal;
    const guarded = {
      setPhase: (p: Phase) => { if (!signal.aborted && mountedRef.current) setPhase(p); },
      setStatus: (s: Status) => { if (!signal.aborted && mountedRef.current) setStatus(s); },
      setResult: (r: ResultState | null) => { if (!signal.aborted && mountedRef.current) setResult(r); },
      setError: (e: string | null) => { if (!signal.aborted && mountedRef.current) setError(e); },
      setProgress: (p: ProgressInfo | null) => { if (!signal.aborted && mountedRef.current) setProgress(p); },
      setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => { if (!signal.aborted && mountedRef.current) setChunkOutputs(updater); },
      setErrorChunk: (c: ChunkName | null) => { if (!signal.aborted && mountedRef.current) setErrorChunk(c); },
      setGenerationStartedAt: (v: number | null) => { if (!signal.aborted && mountedRef.current) setGenerationStartedAt(v); },
    };
    (async () => {
      try {
        await processValidateRequest(jid, signal, guarded, input);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setGenerationStartedAt(null);
        const msg = err instanceof Error ? err.message : "Validation failed";
        if (msg.includes("Job not found")) setJobIdState(null);
        guarded.setError(msg);
        guarded.setPhase("error");
        guarded.setStatus("error");
        guarded.setErrorChunk("validate");
      }
    })();
  }, []);

  const retryFromChunk = useCallback((chunk: ChunkName) => {
    const jid = jobId;
    const input = lastInputRef.current;
    if (!input) return;
    setError(null);
    setErrorChunk(null);
    // Job expired (e.g. server restart / different instance): start a new run from research
    if (!jid) {
      startGeneration(input);
      return;
    }
    if (chunk === "research") {
      startGeneration(input);
      return;
    }
    if (chunk === "brief") {
      setChunkOutputs((p) => ({ ...p, brief: null, draft: null, validation: null }));
      startBrief(jid);
      return;
    }
    if (chunk === "draft") {
      setChunkOutputs((p) => ({ ...p, draft: null, validation: null }));
      startDraft(jid);
      return;
    }
    if (chunk === "validate") {
      setChunkOutputs((p) => ({ ...p, validation: null }));
      startValidate(jid);
    }
  }, [jobId, startGeneration, startBrief, startDraft, startValidate]);

  const value: BlogGenerationContextValue = {
    status,
    generating: status === "generating",
    result,
    generated,
    error,
    progress,
    generationStartedAt,
    startGeneration,
    clearResult,
    clearError,
    phase,
    jobId,
    chunkOutputs,
    errorChunk,
    startResearchFetch,
    startBrief,
    startReviseBrief,
    startDraft,
    startValidate,
    retryFromChunk,
  };

  return (
    <BlogGenerationContext.Provider value={value}>
      {children}
    </BlogGenerationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// SSE stream processing
// ---------------------------------------------------------------------------

type StepGuarded = {
  setStatus?: (s: Status) => void;
  setPhase: (p: Phase) => void;
  setResult?: (r: ResultState | null) => void;
  setError: (e: string | null) => void;
  setProgress: (p: ProgressInfo | null) => void;
  setJobId?: (id: string | null) => void;
  setChunkOutputs: (updater: (prev: ChunkOutputsState) => ChunkOutputsState) => void;
  setErrorChunk: (c: ChunkName | null) => void;
  setGenerationStartedAt?: (v: number | null) => void;
};

async function readSSE(
  response: Response,
  signal: AbortSignal,
  onEvent: (eventType: string, parsed: unknown) => void
) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const eventBlock of events) {
        if (signal.aborted) return;
        if (!eventBlock.trim()) continue;
        const lines = eventBlock.split("\n");
        let eventType = "";
        let eventData = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7);
          else if (line.startsWith("data: ")) eventData = line.slice(6);
        }
        if (!eventType || !eventData) continue;
        try {
          const parsed = JSON.parse(eventData);
          onEvent(eventType, parsed);
        } catch {
          if (eventType === "error") {
            const fallback = typeof eventData === "string" ? eventData : "Unknown error";
            let message = fallback;
            if (typeof fallback === "string" && fallback.trim().startsWith("{")) {
              try {
                const o = JSON.parse(fallback) as { error?: string };
                if (typeof o?.error === "string") message = o.error;
              } catch {
                /* keep message as fallback */
              }
            }
            throw new Error(message);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function processResearchSSE(
  response: Response,
  signal: AbortSignal,
  guarded: StepGuarded,
  _input: GenerationInput
) {
  await readSSE(response, signal, (eventType, parsed) => {
    if (eventType === "progress") {
      const p = parsed as { step?: string; status?: string; message?: string; progress?: number; elapsedMs?: number };
      guarded.setProgress({
        step: p.step ?? "research",
        status: (p.status as ProgressInfo["status"]) ?? "started",
        message: p.message ?? "Researching...",
        progress: p.progress ?? 0,
        elapsedMs: p.elapsedMs ?? 0,
        chunk: "research",
      });
    }
    if (eventType === "result") {
      const r = parsed as { jobId?: string; serpResults?: Array<{ position: number; title: string; url: string }> };
      const jid = r.jobId ?? null;
      const serpResults = r.serpResults ?? [];
      if (serpResults.length === 0) {
        guarded.setError("No search results found for this keyword. Try a different keyword or check your SERPER_API_KEY.");
        guarded.setPhase("error");
        guarded.setStatus?.("error");
        guarded.setErrorChunk("research");
        guarded.setGenerationStartedAt?.(null);
        return;
      }
      guarded.setJobId?.(jid);
      guarded.setChunkOutputs((prev) => ({
        ...prev,
        researchSerp: { results: serpResults },
        research: null,
      }));
      guarded.setPhase("reviewing");
      guarded.setGenerationStartedAt?.(null);
      guarded.setProgress?.({
        step: "research",
        status: "completed",
        message: "Select up to 3 competitors",
        progress: 100,
        elapsedMs: 0,
        chunk: "research",
      });
    }
    if (eventType === "error") {
      throw new Error((parsed as { error?: string }).error ?? "Research failed");
    }
  });
}

async function processResearchFetchSSE(
  response: Response,
  signal: AbortSignal,
  guarded: StepGuarded
) {
  await readSSE(response, signal, (eventType, parsed) => {
    if (eventType === "progress") {
      const p = parsed as { step?: string; status?: string; message?: string; progress?: number; elapsedMs?: number };
      guarded.setProgress?.({
        step: p.step ?? "research",
        status: (p.status as ProgressInfo["status"]) ?? "started",
        message: p.message ?? "Fetching...",
        progress: p.progress ?? 0,
        elapsedMs: p.elapsedMs ?? 0,
        chunk: "research",
      });
    }
    if (eventType === "result") {
      const r = parsed as {
        jobId?: string;
        researchSummary?: { urlCount?: number; articleCount?: number; currentDataFacts?: number };
        competitorUrls?: string[];
        competitorTitles?: string[];
      };
      const summary = r.researchSummary;
      const competitorUrls = r.competitorUrls ?? [];
      const competitorTitles = r.competitorTitles ?? [];
      guarded.setChunkOutputs((prev) => ({
        ...prev,
        research: summary
          ? {
              urlCount: summary.urlCount ?? 0,
              articleCount: summary.articleCount ?? 0,
              currentDataFacts: summary.currentDataFacts ?? 0,
              competitorUrls,
              competitorTitles: competitorTitles.length > 0 ? competitorTitles : undefined,
            }
          : null,
        // Keep researchSerp so "Back to previous section" from research summary can show competitors again
      }));
      guarded.setPhase("reviewing");
      guarded.setGenerationStartedAt?.(null);
      guarded.setProgress?.({
        step: "research",
        status: "completed",
        message: "Research complete",
        progress: 100,
        elapsedMs: 0,
        chunk: "research",
      });
    }
    if (eventType === "error") {
      const msg =
        typeof parsed === "string"
          ? (() => {
              try {
                const o = JSON.parse(parsed) as { error?: string };
                return o?.error;
              } catch {
                return parsed;
              }
            })()
          : (parsed as { error?: string }).error;
      throw new Error(msg ?? "Research fetch failed");
    }
  });
}

async function processBriefSSE(
  jobId: string,
  signal: AbortSignal,
  guarded: StepGuarded,
  options?: { revise?: boolean; wordCountTarget?: number }
) {
  const body: Record<string, unknown> = { jobId };
  if (options?.revise && typeof options?.wordCountTarget === "number") {
    body.revise = true;
    body.wordCountTarget = options.wordCountTarget;
  }
  const response = await fetch("/api/blog/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Brief request failed");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) throw new Error("Expected SSE stream");
  await readSSE(response, signal, (eventType, parsed) => {
    if (eventType === "progress") {
      const p = parsed as { step?: string; status?: string; message?: string; progress?: number; elapsedMs?: number };
      guarded.setProgress({
        step: p.step ?? "gpt-brief",
        status: (p.status as ProgressInfo["status"]) ?? "started",
        message: p.message ?? "Building brief...",
        progress: p.progress ?? 0,
        elapsedMs: p.elapsedMs ?? 0,
        chunk: "brief",
      });
    }
    if (eventType === "result") {
      const r = parsed as { outline?: OutlineSectionForEditor[]; brief?: { similaritySummary?: string; extraValueThemes?: string[]; freshnessNote?: string } };
      const outline = r.outline ?? [];
      const briefSummary = r.brief
        ? {
            similaritySummary: r.brief.similaritySummary,
            extraValueThemes: r.brief.extraValueThemes,
            freshnessNote: r.brief.freshnessNote,
          }
        : undefined;
      guarded.setChunkOutputs((prev) => ({
        ...prev,
        brief: { outline, briefSummary },
      }));
      guarded.setGenerationStartedAt?.(null);
      guarded.setProgress?.({
        step: "gpt-brief",
        status: "completed",
        message: "Brief complete",
        progress: 100,
        elapsedMs: 0,
        chunk: "brief",
      });
    }
    if (eventType === "error") {
      throw new Error((parsed as { error?: string }).error ?? "Brief failed");
    }
  });
}

type OutlineSectionForEditor = import("@/lib/blog/generation-types").OutlineSectionForEditor;

async function processDraftSSE(
  jobId: string,
  briefOverrides: BriefOverridesForDraft | undefined,
  signal: AbortSignal,
  guarded: StepGuarded
): Promise<DraftChunkResult | null> {
  const response = await fetch("/api/blog/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId, briefOverrides }),
    signal,
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Draft request failed");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) throw new Error("Expected SSE stream");
  let draftResult: DraftChunkResult | null = null;
  await readSSE(response, signal, (eventType, parsed) => {
    if (eventType === "progress") {
      const p = parsed as { step?: string; status?: string; message?: string; progress?: number; elapsedMs?: number };
      guarded.setProgress({
        step: p.step ?? "claude-draft",
        status: (p.status as ProgressInfo["status"]) ?? "started",
        message: p.message ?? "Writing draft...",
        progress: p.progress ?? 0,
        elapsedMs: p.elapsedMs ?? 0,
        chunk: "draft",
      });
    }
    if (eventType === "result") {
      const r = parsed as {
        jobId?: string;
        wordCount?: number;
        draft?: {
          title?: string;
          metaDescription?: string;
          outline?: string[];
          content?: string;
          suggestedSlug?: string;
          suggestedCategories?: string[];
          suggestedTags?: string[];
        };
      };
      const d = r.draft;
      if (d) {
        draftResult = {
          wordCount: r.wordCount ?? 0,
          title: d.title ?? "",
          metaDescription: d.metaDescription ?? "",
          outline: d.outline ?? [],
          content: d.content ?? "",
          suggestedSlug: d.suggestedSlug ?? "",
          suggestedCategories: d.suggestedCategories ?? [],
          suggestedTags: d.suggestedTags ?? [],
        };
        guarded.setChunkOutputs((prev) => ({ ...prev, draft: draftResult! }));
      }
      guarded.setProgress?.({
        step: "claude-draft",
        status: "completed",
        message: "Draft complete",
        progress: 100,
        elapsedMs: 0,
        chunk: "draft",
      });
    }
    if (eventType === "error") {
      throw new Error((parsed as { error?: string }).error ?? "Draft failed");
    }
  });
  return draftResult;
}

async function processValidateRequest(
  jobId: string,
  signal: AbortSignal,
  guarded: StepGuarded,
  input: GenerationInput,
  draftOverride?: DraftChunkResult | null
) {
  guarded.setProgress?.({
    step: "validate",
    status: "started",
    message: "Validating...",
    progress: 0,
    elapsedMs: 0,
    chunk: "validate",
  });
  const response = await fetch("/api/blog/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
    signal,
  });
  if (signal.aborted) return;
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "Validation failed");
  }
  const data = (await response.json()) as {
    faqEnforcement?: ValidationChunkResult["faqEnforcement"];
    auditResult?: ValidationChunkResult["auditResult"];
    factCheck?: ValidationChunkResult["factCheck"];
    schemaMarkup?: ValidationChunkResult["schemaMarkup"];
    finalContent?: string;
  };
  guarded.setProgress?.({
    step: "validate",
    status: "completed",
    message: "Validation complete",
    progress: 100,
    elapsedMs: 0,
    chunk: "validate",
  });
  guarded.setPhase("completed");
  guarded.setGenerationStartedAt?.(null);
  guarded.setStatus?.("success");
  const validation: ValidationChunkResult = {
    faqEnforcement: data.faqEnforcement ?? { passed: true, violations: [] },
    auditResult: data.auditResult,
    factCheck: data.factCheck ?? { verified: true, hallucinations: [], issues: [], skippedRhetorical: [] },
    schemaMarkup: data.schemaMarkup ?? { article: {}, faq: null, breadcrumb: null },
    finalContent: data.finalContent ?? "",
  };
  guarded.setChunkOutputs((prev) => {
    const next: ChunkOutputsState = {
      ...prev,
      validation,
      draft: draftOverride ?? prev.draft,
    };
    const sourceUrls = next.research?.competitorUrls ?? [];
    const pipelineResult = buildPipelineResultFromChunks(next, sourceUrls);
    guarded.setResult?.({
      pipelineResult,
      fallbackGenerated: null,
      input,
    });
    return next;
  });
}
