import { MetadataRoute } from "next";
import { SITE_URL, WP_GRAPHQL_URL } from "@/lib/constants";
import { request } from "@/lib/graphql/client";
import {
  getPosts,
  getAllCategorySlugs,
  getTagsFromPosts,
} from "@/lib/blog-data";
import { GET_ALL_POST_SLUGS, GET_ALL_CATEGORY_SLUGS, GET_ALL_TAG_SLUGS } from "@/lib/graphql/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    "",
    "/industries",
    "/medical-spas",
    "/services",
    "/portfolio",
    "/about",
    "/contact",
    "/blog",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  let postRoutes: MetadataRoute.Sitemap = [];
  let categoryRoutes: MetadataRoute.Sitemap = [];
  let tagRoutes: MetadataRoute.Sitemap = [];

  if (WP_GRAPHQL_URL?.trim()) {
    // WordPress connected: fetch from GraphQL
    try {
      const [postsData, categoriesData, tagsData] = await Promise.all([
        request<{ posts: { nodes: { slug: string; modified: string }[] } }>(GET_ALL_POST_SLUGS),
        request<{ categories: { nodes: { slug: string }[] } }>(GET_ALL_CATEGORY_SLUGS),
        request<{ tags: { nodes: { slug: string }[] } }>(GET_ALL_TAG_SLUGS),
      ]);
      postRoutes = (postsData.posts?.nodes ?? []).map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.modified),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
      categoryRoutes = (categoriesData.categories?.nodes ?? []).map((category) => ({
        url: `${SITE_URL}/blog/category/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
      tagRoutes = (tagsData.tags?.nodes ?? []).map((tag) => ({
        url: `${SITE_URL}/blog/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    } catch (error) {
      console.error("Error fetching slugs for sitemap:", error);
    }
  } else {
    // No WordPress: use blog-data (sample or fallback)
    try {
      const posts = await getPosts();
      const categories = await getAllCategorySlugs();
      const tags = getTagsFromPosts(posts);
      postRoutes = posts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.modified),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
      categoryRoutes = categories.map(({ slug }) => ({
        url: `${SITE_URL}/blog/category/${slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
      tagRoutes = tags.map(({ slug }) => ({
        url: `${SITE_URL}/blog/tag/${slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      }));
    } catch (error) {
      console.error("Error fetching slugs for sitemap:", error);
    }
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
