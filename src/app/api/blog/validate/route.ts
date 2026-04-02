import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runValidationChunk } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";
import { handleCorsPreflightIfNeeded, parseJsonBodyWithLimit, withCors } from "@/lib/api/middleware";

export const maxDuration = 300;

/** CORS preflight handler. */
export async function OPTIONS(request: NextRequest) {
  const preflight = handleCorsPreflightIfNeeded(request);
  if (preflight) return preflight;
  return new Response(null, { status: 200 });
}

/** Step 5 — Validate: FAQ enforcement, SEO audit, fact check vs current data, schema.
 * Returns finalContent + audit report (faqEnforcement, auditResult, factCheck, schemaMarkup) for UI. */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }

  const parsed = await parseJsonBodyWithLimit(request);
  if ("error" in parsed) {
    return new Response(JSON.stringify({ error: parsed.error }), {
      status: parsed.status,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }
  const body = parsed.data as { jobId?: string };

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : undefined;
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }

  const job = await jobStore.getJob(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 400,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }
  const draft = await jobStore.getChunkOutput(jobId, "draft");
  if (!draft || !draft.content) {
    return new Response(JSON.stringify({ error: "Draft not completed" }), {
      status: 400,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }

  try {
    const result = await runValidationChunk(jobId, jobStore, 15_000);
    return new Response(
      JSON.stringify({
        jobId,
        faqEnforcement: result.faqEnforcement,
        auditResult: result.auditResult,
        factCheck: result.factCheck,
        schemaMarkup: result.schemaMarkup,
        finalContent: result.finalContent,
      }),
      {
        status: 200,
        headers: withCors({ "Content-Type": "application/json" }),
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    console.error("Blog validate error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: withCors({ "Content-Type": "application/json" }),
    });
  }
}
