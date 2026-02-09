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
  type GeneratedContent,
  type GenerationInput,
  type PipelineResult,
  isPipelineResult,
  pipelineToGenerated,
} from "@/lib/blog/generation-types";

type Status = "idle" | "generating" | "success" | "error";

export type ProgressInfo = {
  step: string;
  status: "started" | "completed" | "failed" | "skipped";
  message: string;
  progress: number;
  elapsedMs: number;
};

type ResultState = {
  pipelineResult: PipelineResult | null;
  fallbackGenerated: GeneratedContent | null;
  selectedTitleIndex: number;
  input: GenerationInput;
};

type BlogGenerationContextValue = {
  status: Status;
  generating: boolean;
  result: ResultState | null;
  generated: GeneratedContent | null;
  error: string | null;
  progress: ProgressInfo | null;
  startGeneration: (input: GenerationInput) => void;
  clearResult: () => void;
  clearError: () => void;
  setSelectedTitleIndex: (index: number) => void;
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

export function BlogGenerationProvider({ children }: BlogGenerationProviderProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const generated: GeneratedContent | null = result
    ? result.pipelineResult
      ? pipelineToGenerated(result.pipelineResult, result.selectedTitleIndex)
      : result.fallbackGenerated
    : null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const startGeneration = useCallback(async (input: GenerationInput) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    setStatus("generating");
    setError(null);
    setProgress(null);

    const guarded = {
      setStatus: (s: Status) => {
        if (!signal.aborted && mountedRef.current) setStatus(s);
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
    };

    try {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: input.keywords.join(", "),
          peopleAlsoSearchFor: input.peopleAlsoSearchFor.join(", "),
          intent: input.intent.length > 0 ? input.intent : ["informational"],
          competitorUrls: input.competitorUrls,
          ...(input.wordCountPreset != null && { wordCountPreset: input.wordCountPreset }),
          ...(input.wordCountPreset === "custom" && input.wordCountCustom != null && { wordCountCustom: input.wordCountCustom }),
        }),
        signal,
      });

      if (signal.aborted || !mountedRef.current) return;

      // Check if response is SSE stream
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        // Process SSE stream
        await processSSEStream(response, signal, guarded, input);
        return;
      }

      // Fallback: non-streaming response (e.g. error responses)
      if (!response.ok) {
        let errorMessage = "Failed to generate blog post";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const apiResult = await response.json();
      if (signal.aborted || !mountedRef.current) return;

      if (isPipelineResult(apiResult)) {
        guarded.setResult({
          pipelineResult: apiResult,
          fallbackGenerated: null,
          selectedTitleIndex: 0,
          input,
        });
      } else {
        guarded.setResult({
          pipelineResult: null,
          fallbackGenerated: apiResult,
          selectedTitleIndex: 0,
          input,
        });
      }
      guarded.setStatus("success");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      guarded.setError(err instanceof Error ? err.message : "Failed to generate blog post");
      guarded.setStatus("error");
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress(null);
    setStatus("idle");
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setSelectedTitleIndex = useCallback((index: number) => {
    setResult((prev) =>
      prev ? { ...prev, selectedTitleIndex: index } : null
    );
  }, []);

  const value: BlogGenerationContextValue = {
    status,
    generating: status === "generating",
    result,
    generated,
    error,
    progress,
    startGeneration,
    clearResult,
    clearError,
    setSelectedTitleIndex,
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

type GuardedSetters = {
  setStatus: (s: Status) => void;
  setResult: (r: ResultState | null) => void;
  setError: (e: string | null) => void;
  setProgress: (p: ProgressInfo | null) => void;
};

async function processSSEStream(
  response: Response,
  signal: AbortSignal,
  guarded: GuardedSetters,
  input: GenerationInput
) {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal.aborted) return;

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events from buffer
      const events = buffer.split("\n\n");
      // Keep incomplete last chunk in buffer
      buffer = events.pop() ?? "";

      for (const eventBlock of events) {
        if (signal.aborted) return;
        if (!eventBlock.trim()) continue;

        const lines = eventBlock.split("\n");
        let eventType = "";
        let eventData = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7);
          } else if (line.startsWith("data: ")) {
            eventData = line.slice(6);
          }
        }

        if (!eventType || !eventData) continue;

        try {
          const parsed = JSON.parse(eventData);

          switch (eventType) {
            case "progress": {
              const stepLabel = STEP_LABELS[parsed.step] ?? parsed.step;
              guarded.setProgress({
                step: parsed.step,
                status: parsed.status,
                message: parsed.message || stepLabel,
                progress: parsed.progress ?? 0,
                elapsedMs: parsed.elapsedMs ?? 0,
              });
              break;
            }

            case "result": {
              if (isPipelineResult(parsed)) {
                guarded.setResult({
                  pipelineResult: parsed,
                  fallbackGenerated: null,
                  selectedTitleIndex: 0,
                  input,
                });
              } else {
                guarded.setResult({
                  pipelineResult: null,
                  fallbackGenerated: parsed,
                  selectedTitleIndex: 0,
                  input,
                });
              }
              guarded.setProgress({
                step: "done",
                status: "completed",
                message: "Generation complete!",
                progress: 100,
                elapsedMs: 0,
              });
              guarded.setStatus("success");
              break;
            }

            case "error": {
              throw new Error(parsed.error || "Pipeline failed");
            }
          }
        } catch (parseErr) {
          if (parseErr instanceof SyntaxError) {
            // JSON parse error — only re-throw when the event itself is an error
            if (eventType === "error") throw parseErr;
            // Otherwise silently skip this malformed event
          } else {
            // Pipeline error (from the "error" case) or any other
            // unexpected error — always re-throw
            throw parseErr;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
