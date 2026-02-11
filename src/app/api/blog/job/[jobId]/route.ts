import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { jobStore } from "@/lib/pipeline/jobs";
import type { ChunkKind } from "@/lib/pipeline/jobs/types";

export type JobStatusNextStep = "brief" | "draft" | "validate" | "completed" | null;

function getNextStep(completedKinds: ChunkKind[]): JobStatusNextStep {
  const has = (k: ChunkKind) => completedKinds.includes(k);
  if (!has("research")) return null;
  if (!has("analysis")) return "brief";
  if (!has("draft")) return "draft";
  if (!has("postprocess")) return "validate";
  return "completed";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { jobId } = await params;
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const job = await jobStore.getJob(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const completedChunks = job.completedChunks.map((c) => ({
    kind: c.kind,
    completedAt: c.completedAt,
  }));
  const nextStep = getNextStep(job.completedChunks.map((c) => c.kind));

  let validationSummary: { auditScore?: number; faqPassed?: boolean } | undefined;
  const postprocess = await jobStore.getChunkOutput(jobId, "postprocess");
  if (postprocess && typeof postprocess === "object" && "auditResult" in postprocess) {
    const ar = (postprocess as { auditResult?: { score?: number } }).auditResult;
    const faq = (postprocess as { faqEnforcement?: { passed?: boolean } }).faqEnforcement;
    validationSummary = {
      auditScore: ar?.score,
      faqPassed: faq?.passed,
    };
  }

  let serpResults: Array<{ position: number; title: string; url: string }> | undefined;
  if (job.phase === "waiting_for_review") {
    const serpOutput = await jobStore.getChunkOutput(jobId, "research_serp");
    if (serpOutput && typeof serpOutput === "object" && "results" in serpOutput && Array.isArray((serpOutput as { results: unknown }).results)) {
      serpResults = (serpOutput as { results: Array<{ position: number; title: string; url: string }> }).results;
    }
  }

  return new Response(
    JSON.stringify({
      jobId: job.id,
      phase: job.phase,
      input: job.input,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedChunks,
      nextStep,
      errorMessage: job.errorMessage,
      ...(validationSummary && { validationSummary }),
      ...(serpResults && { serpResults }),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
