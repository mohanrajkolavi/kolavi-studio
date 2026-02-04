"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { WPPost } from "@/lib/graphql/types";
import { stripHtml, truncateToWords, calculateReadingTime } from "@/lib/blog/utils";

function getCategoryPostCount(posts: WPPost[], slug: string): number {
  return posts.filter((post) =>
    post.categories?.nodes?.some((c) => c.slug === slug)
  ).length;
}

function filterPostsByCategory(posts: WPPost[], slug: string | null): WPPost[] {
  if (!slug) return posts;
  return posts.filter((post) =>
    post.categories?.nodes?.some((c) => c.slug === slug)
  );
}

function filterPostsBySearch(posts: WPPost[], query: string): WPPost[] {
  if (!query.trim()) return posts;
  const q = query.trim().toLowerCase();
  return posts.filter((post) => {
    const title = (post.title || "").toLowerCase();
    const excerpt = stripHtml(post.excerpt || "").toLowerCase();
    const categoryNames = (post.categories?.nodes ?? [])
      .map((c) => c.name.toLowerCase())
      .join(" ");
    return title.includes(q) || excerpt.includes(q) || categoryNames.includes(q);
  });
}

export interface BlogCategory {
  slug: string;
  name: string;
}

interface BlogContentProps {
  posts: WPPost[];
  /** Categories derived from posts (e.g. getCategoriesFromPosts). Used for filter tabs. */
  categories: BlogCategory[];
}

/** Sort posts newest first so featured = latest. */
function sortPostsByDateNewestFirst(posts: WPPost[]): WPPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function BlogContent({ posts, categories }: BlogContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const sortedAllPosts = useMemo(() => sortPostsByDateNewestFirst(posts), [posts]);
  // Category filter first, then search within that set
  const displayPosts = useMemo(() => {
    const byCategory =
      selectedCategory === null
        ? sortedAllPosts
        : sortPostsByDateNewestFirst(filterPostsByCategory(posts, selectedCategory));
    return filterPostsBySearch(byCategory, searchQuery);
  }, [posts, selectedCategory, sortedAllPosts, searchQuery]);
  const isAllPosts = selectedCategory === null;
  // Featured = always the latest post from ALL posts; independent of tab selection.
  const featuredPost = sortedAllPosts.length > 0 ? sortedAllPosts[0] : null;
  // Grid = posts for the selected tab only (All posts or category); no connection to Featured.
  const gridPosts = displayPosts;

  return (
    <>
      {/* Featured */}
      {featuredPost && (
        <section className="border-b border-border bg-muted/30 py-14 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                    Featured
                  </span>
                  <span className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-orange-400/60 to-transparent" aria-hidden />
                </div>
              </div>

              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:border-orange-200/60 dark:hover:border-orange-800"
              >
                <article className="grid grid-cols-1 gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-stretch">
                  {featuredPost.featuredImage && (
                    <div className="relative min-w-0 h-56 w-full overflow-hidden bg-muted md:h-full md:min-h-[18rem]">
                      <Image
                        src={featuredPost.featuredImage.node.sourceUrl}
                        alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 bg-card">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {featuredPost.categories?.nodes?.[0] && (
                        <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-600">
                          {featuredPost.categories.nodes[0].name}
                        </span>
                      )}
                      <time>
                        {new Date(featuredPost.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      {featuredPost.content && (
                        <>
                          <span className="text-muted-foreground/60">·</span>
                          <span>{calculateReadingTime(featuredPost.content)} min read</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400 sm:text-3xl lg:text-4xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
                      {truncateToWords(stripHtml(featuredPost.excerpt || ""), 20)}
                    </p>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-all group-hover:gap-4">
                      Read article
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Category + Articles - only when we have posts */}
      {displayPosts.length > 0 && (
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Category tabs + Search */}
            <div className="mb-10 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <nav
                className="flex flex-wrap items-center gap-3"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  aria-pressed={selectedCategory === null}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  All posts
                </button>
                {[...categories]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((cat) => {
                  const count = getCategoryPostCount(posts, cat.slug);
                  if (count === 0) return null;
                  const isActive = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      aria-pressed={isActive}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </nav>
              {/* Search */}
              <div className="relative flex-shrink-0 sm:min-w-[200px]">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts…"
                  className={`w-full rounded-full border border-border bg-background py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${searchQuery ? "pr-12" : "pr-4"}`}
                  aria-label="Search blog posts"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Articles - card grid */}
            {gridPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <article className="h-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800">
                      {post.featuredImage && (
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={index < 6 ? "eager" : "lazy"}
                          />
                          <div className="absolute left-3 top-3">
                            {post.categories?.nodes?.[0] && (
                              <span className="rounded-md bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border">
                                {post.categories.nodes[0].name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        {!post.featuredImage && post.categories?.nodes?.[0] && (
                          <span className="text-xs font-semibold text-orange-600">
                            {post.categories.nodes[0].name}
                          </span>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <time>
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                          {post.content && (
                            <span>· {calculateReadingTime(post.content)} min</span>
                          )}
                        </div>
                        <h3 className="mt-3 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {truncateToWords(stripHtml(post.excerpt || ""), 20)}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 opacity-0 transition-opacity group-hover:opacity-100">
                          Read article
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            ) : featuredPost ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No other articles in this category
              </p>
            ) : null}
          </div>
        </div>
      </section>
      )}

      {/* Empty state when filtered or no search results */}
      {displayPosts.length === 0 && (
        <section className="border-b border-border bg-background py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border bg-muted/50 py-16 text-center">
              <p className="text-lg font-medium text-foreground">
                {searchQuery.trim()
                  ? "No posts match your search."
                  : "No articles in this category yet"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    Clear search
                  </button>
                )}
                {selectedCategory !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    View all posts
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
