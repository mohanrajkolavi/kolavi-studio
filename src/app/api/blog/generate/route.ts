import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import type { PipelineInput, SearchIntent, WordCountPreset } from "@/lib/pipeline/types";
import type { PipelineProgressEvent } from "@/lib/pipeline/orchestrator";

/** Vercel/serverless: max execution time for this route (seconds). Pro: up to 300. */
export const maxDuration = 300;

const ALLOWED_INTENTS = new Set<SearchIntent>([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

const WORD_COUNT_PRESETS = new Set<WordCountPreset>([
  "auto",
  "concise",
  "standard",
  "in_depth",
  "custom",
]);
const WORD_COUNT_CUSTOM_MIN = 500;
const WORD_COUNT_CUSTOM_MAX = 6000;

/**
 * Pipeline time budget: keep comfortably under maxDuration.
 * The orchestrator will cap per-step timeouts and skip optional steps
 * if the budget is running low.
 */
const PIPELINE_BUDGET_MS = 295_000; // 4m55s — use most of maxDuration 300s so draft step has enough time

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const { keywords, peopleAlsoSearchFor, intent, wordCountPreset, wordCountCustom } = body;

    const keywordTokens =
      typeof keywords === "string"
        ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [];
    const primaryKeyword = keywordTokens[0] ?? "";
    if (!primaryKeyword) {
      return new Response(
        JSON.stringify({ error: "Primary keyword is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const secondaryParts = keywordTokens.slice(1, 6);
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
    const resolvedIntent = intentList?.length ? intentList : ("informational" as SearchIntent);

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

    const pipelineInput: PipelineInput = {
      primaryKeyword,
      secondaryKeywords: secondaryKeywords?.length ? secondaryKeywords : undefined,
      peopleAlsoSearchFor: pasf?.length ? pasf : undefined,
      intent: resolvedIntent,
      ...(resolvedPreset != null && { wordCountPreset: resolvedPreset }),
      ...(resolvedPreset === "custom" && resolvedCustom != null && { wordCountCustom: resolvedCustom }),
    };

    // ---- SSE streaming response ----
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: unknown) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // Controller may be closed if client disconnected
          }
        };

        const onProgress = (evt: PipelineProgressEvent) => {
          sendEvent("progress", evt);
        };

        try {
          const result = await runPipeline(pipelineInput, onProgress, PIPELINE_BUDGET_MS);
          sendEvent("result", result);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to run blog pipeline";
          console.error("Blog pipeline error:", error);
          sendEvent("error", { error: message });
        } finally {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable Nginx buffering
      },
    });
  } catch (error) {
    console.error("Blog pipeline route error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to run blog pipeline",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
