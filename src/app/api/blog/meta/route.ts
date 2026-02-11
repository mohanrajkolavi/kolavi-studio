import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { auditArticle } from "@/lib/seo/article-audit";
import { generateTitleMetaSlugFromContent } from "@/lib/openai/client";
import type { TitleMetaSlugOption } from "@/lib/openai/client";

/** Normalize intent for meta generation (Google: match search intent). */
function normalizeIntent(intent: string): string {
  const i = intent.toLowerCase().trim();
  if (!i) return "informational";
  if (i.includes("transactional") || i.includes("commercial") || i.includes("buy")) return "transactional";
  if (i.includes("navigational")) return "navigational";
  if (i.includes("informational") || i.includes("learn") || i.includes("how")) return "informational";
  return intent || "informational";
}

export type MetaOptionWithAudit = TitleMetaSlugOption & {
  audit: { score: number; publishable: boolean };
};

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { content?: string; primaryKeyword?: string; intent?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const primaryKeyword = typeof body.primaryKeyword === "string" ? body.primaryKeyword.trim() : "";
  const intent = typeof body.intent === "string" ? body.intent : "informational";

  if (!content) {
    return new Response(JSON.stringify({ error: "content is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!primaryKeyword) {
    return new Response(JSON.stringify({ error: "primaryKeyword is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const intentNormalized = normalizeIntent(intent);
    const result = await generateTitleMetaSlugFromContent(primaryKeyword, intentNormalized, content);

    const optionsWithAudit: MetaOptionWithAudit[] = result.options.map((opt) => {
      const auditResult = auditArticle({
        title: opt.title,
        metaDescription: opt.metaDescription,
        content,
        slug: opt.suggestedSlug,
        focusKeyword: primaryKeyword,
      });
      return {
        ...opt,
        audit: { score: auditResult.score, publishable: auditResult.publishable },
      };
    });

    // Sort by audit score descending so the best option appears first
    optionsWithAudit.sort((a, b) => (b.audit.score ?? 0) - (a.audit.score ?? 0));

    return new Response(
      JSON.stringify({
        options: optionsWithAudit,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta generation failed";
    console.error("Blog meta generation error:", error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
