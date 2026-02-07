import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { humanizeArticleContent } from "@/lib/claude/client";

const HUMANIZE_TIMEOUT_MS = 90_000;

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json(
        { error: "content (HTML string) is required" },
        { status: 400 }
      );
    }

    const result = await Promise.race([
      humanizeArticleContent(content),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("HUMANIZE_TIMEOUT")), HUMANIZE_TIMEOUT_MS)
      ),
    ]);

    return NextResponse.json({ content: result });
  } catch (error) {
    if (error instanceof Error && error.message === "HUMANIZE_TIMEOUT") {
      return NextResponse.json(
        { error: "Humanization took too long. Try again." },
        { status: 504 }
      );
    }
    console.error("Blog humanize error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to humanize content",
      },
      { status: 500 }
    );
  }
}
