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

export function BlogGenerationProvider({ children }: BlogGenerationProviderProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
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
        }),
        signal,
      });

      if (signal.aborted || !mountedRef.current) return;

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
