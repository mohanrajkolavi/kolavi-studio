import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAuthenticated } from "@/lib/auth";
import { createWordPressPost, type WordPressPostInput } from "@/lib/wordpress/client";

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      status,
      slug,
      categories,
      tags,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const input: WordPressPostInput = {
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim(),
      status: status || "draft",
      slug: slug?.trim(),
      categories: categories,
      tags: tags,
    };

    const result = await createWordPressPost(input);

    // Revalidate blog cache in-process (no dependency on NEXT_PUBLIC_SITE_URL or /api/revalidate)
    try {
      revalidateTag("blog");
      revalidatePath("/blog", "layout");
    } catch (revalidateError) {
      console.error("Failed to revalidate cache:", revalidateError);
      // Don't fail the whole request if revalidation fails
    }

    return NextResponse.json({
      success: true,
      post: result,
    });
  } catch (error) {
    console.error("Blog publish error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish blog post",
      },
      { status: 500 }
    );
  }
}
