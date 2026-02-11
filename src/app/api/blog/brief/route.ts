import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runBriefChunk } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export const maxDuration = 95;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { jobId?: string; revise?: boolean; wordCountTarget?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : undefined;
  const revise = body.revise === true;
  const wordCountTarget = typeof body.wordCountTarget === "number" ? body.wordCountTarget : undefined;
  if (revise && (wordCountTarget == null || wordCountTarget < 500 || wordCountTarget > 6000)) {
    return new Response(
      JSON.stringify({ error: "wordCountTarget (500–6000) is required when revise is true" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const job = await jobStore.getJob(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const research = await jobStore.getChunkOutput(jobId, "research");
  if (!research || !research.competitors) {
    return new Response(JSON.stringify({ error: "Research not completed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed
        }
      };

      try {
        const result = await runBriefChunk(
          jobId,
          jobStore,
          90_000,
          (evt) => sendEvent("progress", evt),
          undefined,
          undefined,
          revise ? { revise: true, wordCountTarget: wordCountTarget! } : undefined
        );
        sendEvent("result", {
          jobId,
          brief: result.brief,
          outline: result.outline,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Brief failed";
        console.error("Blog brief error:", error);
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

  return new Response(stream, { headers: SSE_HEADERS });
}
