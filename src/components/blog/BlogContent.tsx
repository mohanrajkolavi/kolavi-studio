"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { WPPost } from "@/lib/graphql/types";
import { stripHtml, truncateToWords, calculateReadingTime } from "@/lib/blog/utils";
import { IMAGE_EAGER_COUNT, IMAGE_BLUR_PLACEHOLDER } from "@/lib/constants";

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
  const [visibleCount, setVisibleCount] = useState(9);

  const sortedAllPosts = useMemo(() => sortPostsByDateNewestFirst(posts), [posts]);

  // Category filter first, then search within that set
  const displayPosts = useMemo(() => {
    const byCategory =
      selectedCategory === null
        ? sortedAllPosts
        : sortPostsByDateNewestFirst(filterPostsByCategory(posts, selectedCategory));
    return filterPostsBySearch(byCategory, searchQuery);
  }, [posts, selectedCategory, sortedAllPosts, searchQuery]);

  const visiblePosts = displayPosts.slice(0, visibleCount);
  const hasMore = visibleCount < displayPosts.length;

  return (
    <>
      <section className="py-14 sm:py-20 bg-background relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1200px]">
            {/* Filter & Search Bar */}
            <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-reveal">
              {/* Category Pills (horizontally scrollable on mobile) */}
              <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 overflow-hidden">
                <div className="flex items-center gap-3 overflow-x-auto pb-4 sm:pb-0 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(null);
                      setVisibleCount(9);
                    }}
                    aria-pressed={selectedCategory === null}
                    className={`shrink-0 rounded-[48px] px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 ${
                      selectedCategory === null
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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
                          onClick={() => {
                            setSelectedCategory(cat.slug);
                            setVisibleCount(9);
                          }}
                          aria-pressed={isActive}
                          className={`shrink-0 rounded-[48px] px-5 py-2.5 text-[14px] font-semibold transition-all duration-300 ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-transparent border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative shrink-0 w-full lg:w-[320px]">
                <Search
                  className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(9);
                  }}
                  placeholder="Search articles..."
                  className="w-full rounded-full border border-border bg-background/50 backdrop-blur-sm py-3 pl-11 pr-10 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  aria-label="Search blog posts"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setVisibleCount(9);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Articles Grid */}
            {visiblePosts.length > 0 ? (
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePosts.map((post, index) => {
                  const isFeatured = index === 0 && selectedCategory === null && !searchQuery;
                  
                  return (
                    <Link 
                      key={post.id} 
                      href={`/blog/${post.slug}`} 
                      className={`group block animate-reveal ${
                        isFeatured ? "sm:col-span-2 lg:col-span-2" : "col-span-1"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <article className="flex flex-col h-full overflow-hidden rounded-[20px] border border-border bg-card hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 ease-out">
                        
                        {/* Image Container */}
                        <div className={`relative w-full shrink-0 overflow-hidden bg-muted/30 ${
                          isFeatured ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[16/10]"
                        }`}>
                          {post.featuredImage ? (
                            <Image
                              src={post.featuredImage.node.sourceUrl}
                              alt={post.featuredImage.node.altText || post.title}
                              fill
                              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transform-none"
                              sizes={isFeatured ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                              loading={index < IMAGE_EAGER_COUNT ? "eager" : "lazy"}
                              placeholder="blur"
                              blurDataURL={IMAGE_BLUR_PLACEHOLDER}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                          )}
                          
                          {/* Category Pill on Image */}
                          {post.categories?.nodes?.[0] && (
                            <div className="absolute left-4 top-4 z-10">
                              <span className="inline-flex items-center justify-center rounded-[48px] bg-background/95 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-foreground border border-border/50 shadow-sm">
                                {post.categories.nodes[0].name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content Container */}
                        <div className="flex flex-col flex-1 p-6 sm:p-8">
                          <div className="mb-3 flex items-center gap-2.5 text-[14px] text-muted-foreground font-medium">
                            <time dateTime={new Date(post.date).toISOString()}>
                              {new Date(post.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </time>
                            {post.content && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <span>{calculateReadingTime(post.content)} min read</span>
                              </>
                            )}
                          </div>
                          
                          <h3 className={`font-semibold text-foreground transition-colors group-hover:text-primary mb-3 ${
                            isFeatured ? "text-[28px] sm:text-[32px] leading-[1.2]" : "text-[22px] sm:text-[24px] leading-[1.3] line-clamp-2"
                          }`}>
                            {post.title}
                          </h3>
                          
                          <p className={`text-[16px] sm:text-[17px] leading-relaxed text-muted-foreground mb-6 flex-1 ${
                            isFeatured ? "line-clamp-3" : "line-clamp-2"
                          }`}>
                            {stripHtml(post.excerpt || "")}
                          </p>

                          <div className="mt-auto pt-2">
                            <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-primary transition-all group-hover:gap-3">
                              Read article
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="py-20 text-center animate-reveal">
                <div className="mx-auto max-w-md rounded-[24px] border border-dashed border-border bg-muted/30 p-10">
                  <p className="text-[16px] text-foreground font-medium mb-4">
                    {searchQuery.trim()
                      ? "No articles match your search."
                      : "No articles found in this category."}
                  </p>
                  {(searchQuery || selectedCategory) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory(null);
                        setVisibleCount(9);
                      }}
                      className="inline-flex items-center justify-center rounded-[48px] border border-border bg-background px-6 py-2.5 text-[14px] font-semibold text-foreground shadow-sm transition-all hover:bg-muted"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Load More Pagination */}
            {hasMore && (
              <div className="mt-16 text-center animate-reveal">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="inline-flex items-center justify-center rounded-[48px] border-2 border-border bg-transparent px-8 py-3.5 text-[15px] font-semibold text-foreground transition-all hover:bg-muted hover:border-foreground/10"
                >
                  Load More Articles
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

