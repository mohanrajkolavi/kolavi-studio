import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runBriefChunk, runResearchFetch } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";
import { parseGenerateBody } from "@/lib/pipeline/parse-generate-body";
import { ERROR_CODE_RESEARCH_INCOMPLETE } from "@/lib/blog/errors";

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

  let body: {
    jobId?: string;
    revise?: boolean;
    wordCountTarget?: number;
    revisionInstructions?: string;
    sectionEdits?: Array<{ heading: string; action: string; newHeading?: string; newPosition?: number }>;
    addSections?: Array<{ heading: string; afterSection?: string; reason?: string }>;
    input?: unknown;
    serpResults?: Array<{ url: string; title?: string; position?: number }>;
    selectedUrls?: string[];
  };
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
  const clientInput = body.input;
  const clientSerpResults = Array.isArray(body.serpResults) ? body.serpResults : [];
  const selectedUrls = Array.isArray(body.selectedUrls) ? body.selectedUrls : [];
  const revisionInstructions = typeof body.revisionInstructions === "string" ? body.revisionInstructions.trim() : undefined;
  const validActions = new Set(["keep", "remove", "rename", "reorder"]);
  const sectionEdits = Array.isArray(body.sectionEdits)
    ? body.sectionEdits.filter(
      (e): e is { heading: string; action: "keep" | "remove" | "rename" | "reorder"; newHeading?: string; newPosition?: number } =>
        typeof e?.heading === "string" && typeof e?.action === "string" && validActions.has(e.action)
    )
    : undefined;
  const addSections = Array.isArray(body.addSections) ? body.addSections : undefined;
  const hasOrganicRevision = revise && !!revisionInstructions;

  // wordCountTarget is required for legacy revise (no instructions), optional for organic revision
  if (revise && !hasOrganicRevision && (wordCountTarget == null || wordCountTarget < 500 || wordCountTarget > 6000)) {
    return new Response(
      JSON.stringify({ error: "wordCountTarget (500–6000) is required when revise is true without revisionInstructions" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  // Validate wordCountTarget range if provided (even in organic revision)
  if (wordCountTarget != null && (wordCountTarget < 500 || wordCountTarget > 6000)) {
    return new Response(
      JSON.stringify({ error: "wordCountTarget must be between 500 and 6000" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let job = await jobStore.getJob(jobId);
  const research = await jobStore.getChunkOutput(jobId, "research");
  const hasResearch = research && (research as { competitors?: unknown[] }).competitors?.length;

  if (!hasResearch) {
    const canRecover =
      clientInput &&
      clientSerpResults.length > 0 &&
      selectedUrls.length >= 1 &&
      selectedUrls.length <= 4;
    if (!canRecover) {
      return new Response(
        JSON.stringify({
          error:
            "Research not completed. Go back to Select competitors, pick 1–4 URLs, and click Continue.",
          code: ERROR_CODE_RESEARCH_INCOMPLETE,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const parseResult = parseGenerateBody(clientInput);
    if ("error" in parseResult) {
      return new Response(JSON.stringify({ error: parseResult.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const allowedUrls = new Set(clientSerpResults.map((r) => r.url));
    const invalid = selectedUrls.filter((u) => !allowedUrls.has(u));
    if (invalid.length > 0) {
      return new Response(
        JSON.stringify({ error: "Selected URLs must be from the search results for this job" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!job) {
      try {
        await jobStore.createJob(jobId, parseResult.pipelineInput);
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
      } catch (err) {
        console.error("Brief fallback: job create failed", err);
        return new Response(
          JSON.stringify({
            error:
              "Job not found. Ensure DATABASE_URL is set in production so jobs persist across requests.",
          }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    try {
      await runResearchFetch(jobId, selectedUrls, jobStore, 75_000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Research fetch failed";
      console.error("Brief fallback: research fetch failed", err);
      return new Response(
        JSON.stringify({
          error: msg,
          code: ERROR_CODE_RESEARCH_INCOMPLETE,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!job) {
    job = await jobStore.getJob(jobId);
  }
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
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

      const keepAlive = setInterval(() => {
        try {
          // SSE comment heartbeat to keep connection alive
          controller.enqueue(encoder.encode(":\n\n"));
        } catch { }
      }, 10_000);

      try {
        const briefTokenUsage: import("@/lib/pipeline/types").TokenUsageRecord[] = [];
        const result = await runBriefChunk(
          jobId,
          jobStore,
          90_000,
          (evt) => sendEvent("progress", evt),
          briefTokenUsage,
          undefined,
          revise
            ? {
              revise: true,
              ...(wordCountTarget != null && { wordCountTarget }),
              ...(revisionInstructions && { revisionInstructions }),
              ...(sectionEdits && { sectionEdits }),
              ...(addSections && { addSections }),
            }
            : undefined
        );
        // Load content intelligence data (P5/P6/P7) saved during brief generation
        let contentIntelligence = null;
        try {
          contentIntelligence = await jobStore.getChunkOutput(jobId, "content_intelligence");
        } catch { /* non-fatal */ }

        sendEvent("result", {
          jobId,
          brief: result.brief,
          outline: result.outline,
          contentIntelligence,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Brief failed";
        const code =
          error instanceof Error &&
            message.startsWith("Research not completed")
            ? ERROR_CODE_RESEARCH_INCOMPLETE
            : undefined;
        console.error("Blog brief error:", error);
        sendEvent("error", { error: message, ...(code && { code }) });
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
