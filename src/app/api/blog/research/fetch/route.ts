import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { parseGenerateBody } from "@/lib/pipeline/parse-generate-body";
import { runResearchFetch } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
} as const;

export const maxDuration = 60;

function logResearchFetchApi(level: "info" | "error", data: Record<string, unknown>) {
  const payload = { stage: "research_fetch_api", ...data };
  if (level === "error") {
    console.error("[api]", JSON.stringify(payload));
  } else {
    console.log("[api]", JSON.stringify(payload));
  }
}

/** Phase 2: Fetch content for selected URLs (Jina) + current data (Gemini), save research chunk.
 * When job is not found (e.g. serverless in-memory store), accepts input + serpResults from client
 * to create the job on-the-fly for production compatibility. */
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

  const parsed = body as {
    jobId?: string;
    selectedUrls?: string[];
    input?: unknown;
    serpResults?: Array<{ position?: number; title?: string; url: string }>;
  };
  const jobId = parsed?.jobId;
  const selectedUrls = Array.isArray(parsed?.selectedUrls) ? parsed.selectedUrls : [];
  const clientInput = parsed?.input;
  const clientSerpResults = Array.isArray(parsed?.serpResults) ? parsed.serpResults : [];

  if (!jobId || typeof jobId !== "string") {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (selectedUrls.length === 0 || selectedUrls.length > 3) {
    return new Response(JSON.stringify({ error: "Select 1 to 3 URLs" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let job = await jobStore.getJob(jobId);

  // Fallback: job not found (e.g. in-memory store, different serverless instance).
  // Create job from client-provided input + serpResults.
  if (!job && clientInput && clientSerpResults.length > 0) {
    const parseResult = parseGenerateBody(clientInput);
    if ("error" in parseResult) {
      return new Response(JSON.stringify({ error: parseResult.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { pipelineInput } = parseResult;
    try {
      await jobStore.createJob(jobId, pipelineInput);
      await jobStore.saveChunkOutput(jobId, "research_serp", {
        results: clientSerpResults.map((s) => ({
          url: s.url,
          title: s.title ?? "",
          position: s.position ?? 0,
          snippet: "",
          isArticle: true,
        })),
      });
      await jobStore.updatePhase(jobId, "waiting_for_review");
      job = await jobStore.getJob(jobId);
      logResearchFetchApi("info", { event: "job_created_from_client", jobId });
    } catch (err) {
      logResearchFetchApi("error", { event: "job_create_failed", jobId, error: String(err) });
      return new Response(
        JSON.stringify({
          error:
            "Job not found. Ensure DATABASE_URL is set in production so jobs persist across requests.",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!job) {
    return new Response(
      JSON.stringify({
        error:
          "Job not found. If running in production, ensure DATABASE_URL is set in your deployment environment.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const serpOutput = await jobStore.getChunkOutput(jobId, "research_serp");
  const serpResults = (serpOutput as { results?: Array<{ url: string }> } | undefined)?.results ?? [];
  const allowedUrls = new Set(serpResults.map((r) => r.url));
  const invalid = selectedUrls.filter((u) => !allowedUrls.has(u));
  if (invalid.length > 0) {
    logResearchFetchApi("info", { event: "research_fetch_rejected", jobId, reason: "selected_urls_not_in_serp", invalidCount: invalid.length });
    return new Response(
      JSON.stringify({ error: "Selected URLs must be from the search results for this job" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
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

      const startMs = Date.now();
      logResearchFetchApi("info", { event: "research_fetch_start", jobId, selectedCount: selectedUrls.length });

      try {
        const result = await runResearchFetch(
          jobId,
          selectedUrls,
          jobStore,
          45_000,
          (evt) => sendEvent("progress", evt)
        );
        sendEvent("result", {
          jobId,
          researchSummary: result.researchSummary,
          competitorUrls: result.competitorUrls,
          competitorTitles: result.competitorTitles,
        });
        logResearchFetchApi("info", {
          event: "research_fetch_complete",
          jobId,
          articleCount: result.researchSummary.articleCount,
          currentDataFacts: result.researchSummary.currentDataFacts,
          durationMs: Date.now() - startMs,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research fetch failed";
        try {
          await jobStore.setChunkFailed(jobId, "research", message);
        } catch (storeErr) {
          // best effort
        }
        logResearchFetchApi("error", { event: "research_fetch_error", jobId, error: message, durationMs: Date.now() - startMs });
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
