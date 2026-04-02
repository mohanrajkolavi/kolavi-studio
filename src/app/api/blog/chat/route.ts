import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { jobStore } from "@/lib/pipeline/jobs";
import { regenerateSection } from "@/lib/claude/client";
import {
  auditArticle,
  verifyFactsAgainstSource,
} from "@/lib/seo/article-audit";
import type { ResearchBrief, TokenUsageRecord } from "@/lib/pipeline/types";

export const maxDuration = 120;

/**
 * POST /api/blog/chat — Section-level regeneration chatbot.
 * After article generation, user can feed real data or instructions
 * to regenerate a specific section without rerunning the full pipeline.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { jobId?: string; sectionHeading?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const jobId = typeof body.jobId === "string" ? body.jobId.trim() : undefined;
  const sectionHeading = typeof body.sectionHeading === "string" ? body.sectionHeading.trim() : undefined;
  const message = typeof body.message === "string" ? body.message.trim() : undefined;

  if (!jobId || !sectionHeading || !message) {
    return new Response(
      JSON.stringify({ error: "jobId, sectionHeading, and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load job
  const job = await jobStore.getJob(jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get brief from analysis chunk
  const analysisOutput = await jobStore.getChunkOutput(jobId, "analysis");
  if (!analysisOutput) {
    return new Response(JSON.stringify({ error: "Brief not found — analysis chunk incomplete" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const brief = analysisOutput as unknown as ResearchBrief;

  // Get current article HTML — prefer postprocess (final), fall back to draft
  const postprocessOutput = await jobStore.getChunkOutput(jobId, "postprocess");
  const draftOutput = await jobStore.getChunkOutput(jobId, "draft");

  const currentHtml =
    (postprocessOutput as Record<string, unknown>)?.finalContent as string
    ?? (draftOutput as Record<string, unknown>)?.content as string
    ?? undefined;

  if (!currentHtml) {
    return new Response(JSON.stringify({ error: "No article content found for this job" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tokenUsage: TokenUsageRecord[] = [];

  try {
    // Regenerate the section
    const { updatedHtml, sectionHtml } = await regenerateSection(
      currentHtml,
      sectionHeading,
      message,
      brief,
      tokenUsage
    );

    // Run audit on updated content
    const primaryKeyword = brief.keyword?.primary ?? "";
    const title =
      (draftOutput as Record<string, unknown>)?.title as string ?? "";
    const slug =
      (draftOutput as Record<string, unknown>)?.suggestedSlug as string ?? "";

    const [auditResult, factCheck] = await Promise.all([
      Promise.resolve(
        auditArticle({
          title,
          content: updatedHtml,
          slug,
          focusKeyword: primaryKeyword,
        })
      ),
      verifyFactsAgainstSource(updatedHtml, brief.currentData, primaryKeyword),
    ]);

    // Save updated content back to the postprocess chunk
    if (postprocessOutput) {
      const updated = { ...postprocessOutput, finalContent: updatedHtml };
      await jobStore.saveChunkOutput(jobId, "postprocess", updated);
    } else if (draftOutput) {
      const updated = { ...draftOutput, content: updatedHtml };
      await jobStore.saveChunkOutput(jobId, "draft", updated);
    }

    return new Response(
      JSON.stringify({
        updatedContent: updatedHtml,
        sectionContent: sectionHtml,
        auditDelta: {
          score: auditResult.score,
          publishable: auditResult.publishable,
          level1Failures: auditResult.items
            .filter((i) => i.level === 1 && i.severity === "fail")
            .map((i) => i.label),
        },
        factCheck: {
          verified: factCheck.verified,
          hallucinations: factCheck.hallucinations,
          issues: factCheck.issues.length,
        },
        tokenUsage,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Section regeneration failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
