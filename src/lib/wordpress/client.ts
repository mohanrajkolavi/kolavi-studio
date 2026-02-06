export type WordPressPostInput = {
  title: string;
  content: string;
  excerpt?: string;
  status?: "draft" | "publish" | "pending";
  slug?: string;
  /** WordPress REST API expects numeric term IDs. Pass IDs from WP; slugs will be ignored. */
  categories?: number[] | string[];
  /** WordPress REST API expects numeric term IDs. Pass IDs from WP; slugs will be ignored. */
  tags?: number[] | string[];
};

/** Normalize term IDs for WP REST: only numeric IDs are accepted; strings are parsed or dropped. */
function toNumericTermIds(ids: number[] | string[] | undefined): number[] | undefined {
  if (!ids?.length) return undefined;
  const nums = ids
    .map((v) => (typeof v === "number" ? v : parseInt(String(v), 10)))
    .filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n > 0);
  return nums.length > 0 ? nums : undefined;
}

export type WordPressPostResponse = {
  id: number;
  slug: string;
  link: string;
  status: string;
};

/**
 * Create a WordPress post via REST API
 */
export async function createWordPressPost(
  input: WordPressPostInput
): Promise<WordPressPostResponse> {
  const siteUrl = process.env.WP_SITE_URL?.replace(/\/$/, "");
  const username = process.env.WP_USERNAME;
  const appPassword = process.env.WP_APP_PASSWORD;

  if (!siteUrl) {
    throw new Error("WP_SITE_URL environment variable is not set");
  }
  if (!username || !appPassword) {
    throw new Error("WP_USERNAME and WP_APP_PASSWORD environment variables are required");
  }

  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  const payload: Record<string, unknown> = {
    title: input.title,
    content: input.content,
    status: input.status || "draft",
  };

  if (input.excerpt) {
    payload.excerpt = input.excerpt;
  }

  if (input.slug) {
    payload.slug = input.slug;
  }

  const categoryIds = toNumericTermIds(input.categories);
  if (categoryIds?.length) {
    payload.categories = categoryIds;
  }

  const tagIds = toNumericTermIds(input.tags);
  if (tagIds?.length) {
    payload.tags = tagIds;
  }

  try {
    const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WordPress API error:", errorText);
      throw new Error(
        `WordPress API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    return {
      id: data.id,
      slug: data.slug,
      link: data.link,
      status: data.status,
    };
  } catch (error) {
    console.error("Error creating WordPress post:", error);
    throw new Error(
      error instanceof Error
        ? `Failed to create WordPress post: ${error.message}`
        : "Failed to create WordPress post"
    );
  }
}
