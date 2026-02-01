import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { request } from "@/lib/graphql/client";
import { GET_ALL_POST_SLUGS, GET_ALL_CATEGORY_SLUGS, GET_ALL_TAG_SLUGS } from "@/lib/graphql/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    "",
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

  // Dynamic blog post routes
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const postsData = await request<{
      posts: { nodes: { slug: string; modified: string }[] };
    }>(GET_ALL_POST_SLUGS);
    postRoutes = postsData.posts.nodes.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.modified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Error fetching post slugs for sitemap:", error);
  }

  // Dynamic category routes
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categoriesData = await request<{
      categories: { nodes: { slug: string }[] };
    }>(GET_ALL_CATEGORY_SLUGS);
    categoryRoutes = categoriesData.categories.nodes.map((category) => ({
      url: `${SITE_URL}/blog/category/${category.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Error fetching category slugs for sitemap:", error);
  }

  // Dynamic tag routes
  let tagRoutes: MetadataRoute.Sitemap = [];
  try {
    const tagsData = await request<{ tags: { nodes: { slug: string }[] } }>(
      GET_ALL_TAG_SLUGS
    );
    tagRoutes = tagsData.tags.nodes.map((tag) => ({
      url: `${SITE_URL}/blog/tag/${tag.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error("Error fetching tag slugs for sitemap:", error);
  }

  return [...staticRoutes, ...postRoutes, ...categoryRoutes, ...tagRoutes];
}
