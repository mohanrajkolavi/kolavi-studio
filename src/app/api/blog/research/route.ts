import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { parseGenerateBody } from "@/lib/pipeline/parse-generate-body";
import { runResearchSerpOnly } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export const maxDuration = 60;

/** Phase 1: Serper only. Returns top 10 results (position, title, url) for user to select up to 3. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = parseGenerateBody(body);
  if ("error" in parsed) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
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
        } catch {
          // Controller may be closed
        }
      };

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
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research failed";
        console.error("Blog research error:", error);
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
