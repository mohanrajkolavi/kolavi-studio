import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { generateBlogPost, humanizeArticleContent, type BlogGenerationInput } from "@/lib/claude/client";
import { fetchCompetitorUrls } from "@/lib/jina/reader";

const ALLOWED_INTENTS = new Set(["informational", "navigational", "commercial", "transactional"]);

/** Allow long posts to complete (generation + humanize pass); return 504 if exceeded. */
const GENERATION_TIMEOUT_MS = 210_000;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { keywords, peopleAlsoSearchFor, intent, competitorUrls } = body;

    if (!keywords || typeof keywords !== "string" || keywords.trim().length === 0) {
      return NextResponse.json(
        { error: "Keywords (1.1) are required" },
        { status: 400 }
      );
    }

    // Validate that keywords contain actual content after splitting (max 6)
    const keywordParts = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    if (keywordParts.length === 0) {
      return NextResponse.json(
        { error: "Keywords must contain at least one valid keyword" },
        { status: 400 }
      );
    }
    if (keywordParts.length > 6) {
      return NextResponse.json(
        { error: "Keywords: max 6 allowed" },
        { status: 400 }
      );
    }

    // Validate and normalize competitor URLs
    const competitorList = competitorUrls
      ? (typeof competitorUrls === "string"
          ? competitorUrls.split(/\n|,/).map((u: string) => u.trim()).filter(Boolean)
          : Array.isArray(competitorUrls)
          ? competitorUrls.slice(0, 2).map((u: string) => String(u).trim()).filter(Boolean)
          : [])
          .filter((url) => {
            // Basic URL validation - must start with http:// or https:// or be a valid domain
            const trimmed = url.trim();
            return (
              trimmed.length > 0 &&
              (trimmed.startsWith("http://") ||
                trimmed.startsWith("https://") ||
                /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}/.test(trimmed))
            );
          })
      : [];

    // Normalize "people also search for" (max 3 phrases to avoid prompt bloat)
    const peopleAlsoRaw = peopleAlsoSearchFor != null
      ? (Array.isArray(peopleAlsoSearchFor)
          ? peopleAlsoSearchFor.slice(0, 3).map((p) => String(p).trim()).filter(Boolean)
          : String(peopleAlsoSearchFor)
              .split(/[,;\n]+/)
              .map((p) => p.trim())
              .filter(Boolean)
              .slice(0, 3))
      : [];
    const peopleAlsoStr = peopleAlsoRaw.length > 0 ? peopleAlsoRaw.join(", ") : undefined;

    // Validate and normalize intents
    const intentList = Array.isArray(intent)
      ? intent
          .map((i) => String(i).trim().toLowerCase())
          .filter((i) => i && ALLOWED_INTENTS.has(i))
      : intent && typeof intent === "string"
      ? (() => {
          const v = intent.trim().toLowerCase();
          return v && ALLOWED_INTENTS.has(v) ? [v] : ["informational"];
        })()
      : ["informational"];

    // If all intents were invalid, warn but proceed with default
    if (Array.isArray(intent) && intent.length > 0 && intentList.length === 0) {
      console.warn(
        `All provided intents were invalid: ${JSON.stringify(intent)}. Defaulting to informational.`
      );
    }

    const runGeneration = async () => {
      let competitorContent: { url: string; content: string; success: boolean }[] = [];
      if (competitorList.length > 0) {
        const results = await fetchCompetitorUrls(competitorList);
        competitorContent = results.map((r) => ({
          url: r.url,
          content: r.content,
          success: r.success,
        }));
      }
      const input: BlogGenerationInput = {
        keywords: keywords.trim(),
        peopleAlsoSearchFor: peopleAlsoStr,
        intent: intentList.length > 0 ? intentList : ["informational"],
        competitorContent: competitorContent.length > 0 ? competitorContent : undefined,
      };
      const result = await generateBlogPost(input);
      const humanizedContent = await humanizeArticleContent(result.content);
      return { ...result, content: humanizedContent };
    };

    const result = await Promise.race([
      runGeneration(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("GENERATION_TIMEOUT")),
          GENERATION_TIMEOUT_MS
        )
      ),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "GENERATION_TIMEOUT") {
      return NextResponse.json(
        {
          error:
            "Generation took too long. Try again with fewer keywords, or try again later. For very long posts, consider background jobs.",
        },
        { status: 504 }
      );
    }
    console.error("Blog generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate blog post",
      },
      { status: 500 }
    );
  }
}
