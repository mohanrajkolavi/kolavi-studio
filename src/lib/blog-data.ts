/**
 * Blog data layer: single place for post/category/tag access.
 * Currently uses sample data; swap to WPGraphQL (or REST) by replacing
 * the implementations below. All consumers use WPPost/WPCategory/WPTag types
 * so no component changes are needed when switching to WordPress headless.
 */

import type { WPPost, WPCategory, WPTag } from "@/lib/graphql/types";
import { SAMPLE_POSTS } from "@/lib/sample-posts";
import { SITE_NAME, SITE_URL } from "@/lib/constants";

export async function getPosts(): Promise<WPPost[]> {
  // TODO: When using WordPress headless, replace with:
  // const res = await fetch(GraphQL endpoint, { query: POSTS_QUERY });
  // return res.posts.nodes;
  return SAMPLE_POSTS;
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  // TODO: When using WordPress headless, replace with:
  // const res = await fetch(GraphQL endpoint, { query: POST_BY_SLUG_QUERY, variables: { slug } });
  // return res.post ?? null;
  return SAMPLE_POSTS.find((p) => p.slug === slug) ?? null;
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
