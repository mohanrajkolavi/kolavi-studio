import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { parseGenerateBody } from "@/lib/pipeline/parse-generate-body";
import { runResearchSerpOnly } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";
import { prewarmClient as prewarmClaude } from "@/lib/claude/client";
import { prewarmClient as prewarmOpenAI } from "@/lib/openai/client";
import { prewarmClient as prewarmGemini } from "@/lib/gemini/client";
import { handleCorsPreflightIfNeeded, withCors } from "@/lib/api/middleware";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
  ...withCors({}),
} as const;

export const maxDuration = 300;

/** CORS preflight handler. */
export async function OPTIONS(request: NextRequest) {
  const preflight = handleCorsPreflightIfNeeded(request);
  if (preflight) return preflight;
  return new Response(null, { status: 200 });
}

/** Phase 1: Serper only. Returns top 10 results (position, title, url) for user to select up to 3.
 * Uses job store when available (DATABASE_URL set); if store fails, still returns SERP results
 * so the client can send them to research/fetch for serverless compatibility. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }

  // Fire and forget prewarming to remove lazy-init penalty for later steps
  Promise.allSettled([
    (async () => prewarmClaude())(),
    (async () => prewarmOpenAI())(),
    (async () => prewarmGemini())()
  ]).catch((err) => {
    console.warn("[pipeline] Client prewarming failed:", err instanceof Error ? err.message : String(err));
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }

  const parsed = parseGenerateBody(body);
  if ("error" in parsed) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: 400,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }
  const { pipelineInput } = parsed;

  const jobId = crypto.randomUUID();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          console.warn("[pipeline/sse] Failed to enqueue event:", event, err instanceof Error ? err.message : String(err));
        }
      };

      const keepAlive = setInterval(() => {
        try {
          // SSE comment heartbeat to keep connection alive
          controller.enqueue(encoder.encode(":\n\n"));
        } catch { }
      }, 10_000);

      try {
        const result = await runResearchSerpOnly(
          pipelineInput,
          jobId,
          jobStore,
          (evt) => sendEvent("progress", evt)
        );
        sendEvent("result", {
          jobId,
          serpResults: result.serpResults.map((s) => ({
            position: s.position,
            title: s.title,
            url: s.url,
          })),
          paaQuestions: result.paaQuestions ?? [],
          paaItems: result.paaItems ?? [],
          serpFeatures: result.serpFeatures,
          intentValidation: result.intentValidation,
          redditThreads: result.redditThreads ?? [],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research failed";
        console.error("Blog research error:", error);
        sendEvent("error", { error: message });
      } finally {
        clearInterval(keepAlive);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
