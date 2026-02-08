import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { runPipeline } from "@/lib/pipeline/orchestrator";
import type { PipelineInput, SearchIntent } from "@/lib/pipeline/types";

const ALLOWED_INTENTS = new Set<SearchIntent>([
  "informational",
  "navigational",
  "commercial",
  "transactional",
]);

/** Allow pipeline to complete (8 steps); return 504 if exceeded. */
const GENERATION_TIMEOUT_MS = 600_000; // 10 minutes

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { keywords, peopleAlsoSearchFor, intent, competitorUrls } = body;

    const keywordTokens =
      typeof keywords === "string"
        ? keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
        : [];
    const primaryKeyword = keywordTokens[0] ?? "";
    if (!primaryKeyword) {
      return NextResponse.json(
        { error: "Primary keyword is required" },
        { status: 400 }
      );
    }
    const secondaryParts = keywordTokens.slice(1, 6);
    const secondaryKeywords = secondaryParts.length > 0 ? secondaryParts : undefined;

    const pasf =
      peopleAlsoSearchFor != null
        ? (Array.isArray(peopleAlsoSearchFor)
            ? peopleAlsoSearchFor.slice(0, 5).map((p: unknown) => String(p).trim()).filter(Boolean)
            : String(peopleAlsoSearchFor)
                .split(/[,;\n]+/)
                .map((p: string) => p.trim())
                .filter(Boolean)
                .slice(0, 5))
        : undefined;

    const intentList = Array.isArray(intent)
      ? intent
          .map((i: unknown) => String(i).trim().toLowerCase())
          .filter((i): i is SearchIntent => Boolean(i && ALLOWED_INTENTS.has(i as SearchIntent)))
      : intent && typeof intent === "string"
      ? (() => {
          const v = intent.trim().toLowerCase();
          return v && ALLOWED_INTENTS.has(v as SearchIntent) ? [v as SearchIntent] : undefined;
        })()
      : undefined;
    const resolvedIntent = intentList?.length ? intentList : ("informational" as SearchIntent);

    const pipelineInput: PipelineInput = {
      primaryKeyword,
      secondaryKeywords: secondaryKeywords?.length ? secondaryKeywords : undefined,
      peopleAlsoSearchFor: pasf?.length ? pasf : undefined,
      intent: resolvedIntent,
    };

    const result = await Promise.race([
      runPipeline(pipelineInput),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("GENERATION_TIMEOUT")), GENERATION_TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "GENERATION_TIMEOUT") {
      return NextResponse.json(
        {
          error:
            "Generation took too long. Try again or use a narrower keyword. For long runs, consider background jobs.",
        },
        { status: 504 }
      );
    }
    console.error("Blog pipeline error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to run blog pipeline",
      },
      { status: 500 }
    );
  }
}
