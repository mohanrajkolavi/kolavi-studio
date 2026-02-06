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
        <section className="border-b border-border bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              <p className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Featured
              </p>

              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 hover:bg-muted/20"
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
                        <span className="rounded-md border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-foreground">
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
                    <h3 className="mt-4 text-2xl font-bold text-foreground transition-colors group-hover:text-foreground sm:text-3xl lg:text-4xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground lg:text-lg">
                      {truncateToWords(stripHtml(featuredPost.excerpt || ""), 20)}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all group-hover:gap-3">
                      Read article
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* Category + Articles */}
      {displayPosts.length > 0 && (
      <section className="border-b border-border bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Category tabs + Search - aligned with Blog Maker / dashboard */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <nav
                className="flex flex-wrap items-center gap-2"
                aria-label="Filter by category"
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  aria-pressed={selectedCategory === null}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50"
                  }`}
                >
                  All
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
                      className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50"
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </nav>
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
                  aria-label="Search blog posts"
                />
              </div>
            </div>

            {/* Articles - card grid */}
            {gridPosts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {gridPosts.map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <article className="h-full overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 hover:bg-muted/20">
                      {post.featuredImage && (
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={index < 6 ? "eager" : "lazy"}
                          />
                          <div className="absolute left-3 top-3">
                            {post.categories?.nodes?.[0] && (
                              <span className="rounded-md border border-border bg-card/90 px-2.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
                                {post.categories.nodes[0].name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        {!post.featuredImage && post.categories?.nodes?.[0] && (
                          <span className="text-xs font-medium text-muted-foreground">
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
                        <h3 className="mt-3 line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-foreground">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {truncateToWords(stripHtml(post.excerpt || ""), 20)}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-all group-hover:gap-2">
                          Read article
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
        <section className="border-b border-border bg-background py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <p className="text-sm text-foreground">
                {searchQuery.trim()
                  ? "No posts match your search."
                  : "No articles in this category yet"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50"
                  >
                    Clear search
                  </button>
                )}
                {selectedCategory !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-lg border border-foreground bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
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
