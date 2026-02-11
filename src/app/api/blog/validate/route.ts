import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runValidationChunk } from "@/lib/pipeline/chunks";
import { jobStore } from "@/lib/pipeline/jobs";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { jobId?: string };
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
  const draft = await jobStore.getChunkOutput(jobId, "draft");
  if (!draft || !draft.content) {
    return new Response(JSON.stringify({ error: "Draft not completed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed";
    console.error("Blog validate error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
