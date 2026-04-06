import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { jobStore } from "@/lib/pipeline/jobs";
import { regenerateSection, editFullArticle, type ChatInternalLink } from "@/lib/claude/client";
import {
  auditArticle,
  verifyFactsAgainstSource,
} from "@/lib/seo/article-audit";
import type { ResearchBrief, TokenUsageRecord } from "@/lib/pipeline/types";

export const maxDuration = 120;

/**
 * POST /api/blog/chat — Section or full-article regeneration chatbot.
 * After article generation, user can feed real data or instructions
 * to regenerate a specific section or the full article without rerunning the full pipeline.
 * Use sectionHeading="__full_article__" for full-article editing.
 */
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    jobId?: string;
    sectionHeading?: string;
    message?: string;
    internalLinks?: ChatInternalLink[];
    issues?: {
      auditIssues?: Array<{ id: string; severity: string; label: string; message: string }>;
      contentScoreIssues?: { score: number; grade: string; missingTerms: string[]; overusedTerms: string[]; entityGaps: string[]; summary: string };
      integrityIssues?: Array<{ type: string; description: string }>;
      eeatIssues?: Array<{ check: string; summary: string; detail: string | null }>;
    };
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

  const isFullArticle = sectionHeading === "__full_article__";

  try {
    // Validate and pass internal links if provided
    const internalLinks: ChatInternalLink[] = Array.isArray(body.internalLinks)
      ? body.internalLinks.filter((l): l is ChatInternalLink =>
        typeof l === "object" && l !== null && typeof l.url === "string" && l.url.trim().length > 0
      ).map((l) => ({ url: l.url.trim(), ...(l.anchorText && { anchorText: l.anchorText.trim() }) }))
      : [];

    let updatedHtml: string;
    let sectionHtml: string | undefined;

    if (isFullArticle) {
      // Full-article editing with all panel issues as context
      const result = await editFullArticle(
        currentHtml,
        message,
        brief,
        tokenUsage,
        internalLinks.length > 0 ? internalLinks : undefined,
        body.issues
      );
      updatedHtml = result.updatedHtml;
    } else {
      // Section-level editing
      const result = await regenerateSection(
        currentHtml,
        sectionHeading,
        message,
        brief,
        tokenUsage,
        internalLinks.length > 0 ? internalLinks : undefined
      );
      updatedHtml = result.updatedHtml;
      sectionHtml = result.sectionHtml;
    }

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
        ...(sectionHtml && { sectionContent: sectionHtml }),
        fullArticle: isFullArticle,
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
