import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runDraftChunk } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";
import type { BriefOverrides } from "@/lib/pipeline/types";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { jobId?: string; briefOverrides?: BriefOverrides };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : undefined;
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
  const analysis = await jobStore.getChunkOutput(jobId, "analysis");
  if (!analysis) {
    return new Response(JSON.stringify({ error: "Brief not completed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const briefOverrides = body.briefOverrides ?? undefined;

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
        const result = await runDraftChunk(
          jobId,
          jobStore,
          briefOverrides,
          180_000,
          (evt) => sendEvent("progress", evt)
        );
        sendEvent("result", {
          jobId,
          wordCount: result.wordCount,
          draftSummary: `Draft: ${result.wordCount} words`,
          draft: result.draft,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Draft failed";
        console.error("Blog draft error:", error);
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
