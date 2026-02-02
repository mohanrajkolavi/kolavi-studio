/**
 * Blog data layer: single place for post/category/tag access.
 * Uses WPGraphQL when NEXT_PUBLIC_WP_GRAPHQL_URL is set; otherwise falls back
 * to sample data so the site works before WordPress is connected.
 */

import type {
  WPPost,
  WPCategory,
  WPTag,
  PostsResponse,
  PostBySlugResponse,
} from "@/lib/graphql/types";
import { request } from "@/lib/graphql/client";
import { GET_POSTS, GET_POST_BY_SLUG } from "@/lib/graphql/queries";
import { SAMPLE_POSTS } from "@/lib/sample-posts";
import { SITE_NAME, SITE_URL, WP_GRAPHQL_URL } from "@/lib/constants";

export async function getPosts(): Promise<WPPost[]> {
  if (!WP_GRAPHQL_URL?.trim()) return SAMPLE_POSTS;
  try {
    const data = await request<PostsResponse>(GET_POSTS, { first: 100 });
    return data.posts?.nodes ?? [];
  } catch (error) {
    console.error("getPosts (WPGraphQL):", error);
    return SAMPLE_POSTS;
  }
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  if (!WP_GRAPHQL_URL?.trim()) {
    return SAMPLE_POSTS.find((p) => p.slug === slug) ?? null;
  }
  try {
    const data = await request<PostBySlugResponse>(GET_POST_BY_SLUG, { slug });
    return data.post ?? null;
  } catch (error) {
    console.error("getPostBySlug (WPGraphQL):", error);
    return SAMPLE_POSTS.find((p) => p.slug === slug) ?? null;
  }
}

/** All unique categories derived from posts. With WP headless, can instead query categories list from GraphQL. */
export function getCategoriesFromPosts(posts: WPPost[]): { slug: string; name: string }[] {
  const seen = new Map<string, { slug: string; name: string }>();
  posts.forEach((post) => {
    post.categories?.nodes?.forEach((cat: WPCategory) => {
      if (!seen.has(cat.slug)) seen.set(cat.slug, { slug: cat.slug, name: cat.name });
    });
  });
  return Array.from(seen.values());
}

/** All unique tags derived from posts. With WP headless, can instead query tags list from GraphQL. */
export function getTagsFromPosts(posts: WPPost[]): { slug: string; name: string }[] {
  const seen = new Map<string, { slug: string; name: string }>();
  posts.forEach((post) => {
    post.tags?.nodes?.forEach((tag: WPTag) => {
      if (!seen.has(tag.slug)) seen.set(tag.slug, { slug: tag.slug, name: tag.name });
    });
  });
  return Array.from(seen.values());
}

/** Author display name for SEO and schema; WordPress headless can pass post.author.node.name. */
export function getPostAuthorName(post: WPPost): string {
  return post.author?.node?.name ?? SITE_NAME;
}

/** Author URL for schema (e.g. /blog/author/slug); fallback to site URL. */
export function getPostAuthorUrl(post: WPPost): string {
  const url = post.author?.node?.url;
  if (url) return url;
  const slug = post.author?.node?.slug;
  if (slug) return `${SITE_URL}/blog/author/${slug}`;
  return SITE_URL;
}
