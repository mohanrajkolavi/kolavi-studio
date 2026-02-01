import Link from "next/link";
import Image from "next/image";
import { getPageMetadata } from "@/lib/seo/metadata";
import { request } from "@/lib/graphql/client";
import { GET_POSTS } from "@/lib/graphql/queries";
import { PostsResponse } from "@/lib/graphql/types";
import { SAMPLE_POSTS } from "@/lib/sample-posts";
import { BlogSubscribe } from "./BlogSubscribe";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata = getPageMetadata({
  title: "Digital Marketing Blog & Resources - Expert Insights | Kolavi Studio",
  description: "Stay ahead with expert insights on SEO, digital marketing, web design, and business growth. Discover proven strategies, guides, and case studies from Kolavi Studio's marketing experts.",
  path: "/blog",
  keywords: "digital marketing blog, SEO tips, web design guides, marketing strategies, business growth, medical spa marketing, local SEO, conversion optimization",
});

async function getPosts() {
  // Use sample posts directly for now
  // TODO: Re-enable WordPress integration when backend is configured
  return SAMPLE_POSTS;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = stripHtml(content).split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Get all unique categories from posts
function getAllCategories() {
  const categoriesSet = new Set<{ slug: string; name: string }>();
  SAMPLE_POSTS.forEach((post) => {
    post.categories.nodes.forEach((cat) => {
      categoriesSet.add(cat);
    });
  });
  return Array.from(categoriesSet);
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 7);
  const allCategories = getAllCategories();

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-4 text-sm text-neutral-600">
            <Link href="/" className="hover:text-orange-500 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-medium">Blog</span>
          </div>
        </div>
      </nav>

      {/* Hero Section with Category Filter */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Digital Marketing{" "}
              <span className="text-orange-500">Insights</span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-neutral-600 max-w-3xl">
              Expert strategies, proven tactics, and actionable insights to help your business grow online.
            </p>

            {/* Category Filter Pills */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-neutral-700">Browse by topic:</span>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                All Posts
              </Link>
              {allCategories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/blog/category/${category.slug}`}
                  className="inline-flex items-center rounded-full bg-white border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  {category.name}
                </Link>
              ))}
            </div>

            {/* Social Follow Section */}
            <div className="mt-10 flex items-center gap-4 pt-6 border-t border-neutral-200">
              <span className="text-sm font-medium text-neutral-700">Follow us:</span>
              <div className="flex gap-3">
                <a
                  href="https://twitter.com/kolavistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-500 hover:text-white transition-colors"
                  aria-label="Follow us on Twitter"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/kolavi-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-500 hover:text-white transition-colors"
                  aria-label="Follow us on LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="/blog/rss.xml"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-orange-500 hover:text-white transition-colors"
                  aria-label="Subscribe to RSS feed"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article - Hero Style */}
      {featuredPost && (
        <section className="border-b border-neutral-200 bg-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {featuredPost.featuredImage && (
                    <div className="relative h-64 lg:h-full min-h-[400px]">
                      <Image
                        src={featuredPost.featuredImage.node.sourceUrl}
                        alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:hidden" />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="flex items-center gap-3 text-sm">
                      {featuredPost.categories?.nodes?.[0] && (
                        <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                          {featuredPost.categories.nodes[0].name}
                        </span>
                      )}
                      <span className="text-neutral-500">
                        {new Date(featuredPost.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {featuredPost.content && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span className="text-neutral-500">
                            {calculateReadingTime(featuredPost.content)} min read
                          </span>
                        </>
                      )}
                    </div>
                    <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 group-hover:text-orange-500 transition-colors sm:text-4xl lg:text-5xl">
                      {featuredPost.title}
                    </h2>
                    <p className="mt-4 text-lg leading-relaxed text-neutral-600 line-clamp-3">
                      {stripHtml(featuredPost.excerpt)}
                    </p>
                    <div className="mt-6 inline-flex items-center gap-2 text-orange-500 font-semibold group-hover:gap-3 transition-all">
                      Read article
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All the Latest - List Style */}
      <section className="bg-neutral-50/50 py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 mb-8">
              All the Latest
            </h2>
            
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white py-20 text-center">
                <p className="text-neutral-500">
                  No posts yet. Check back soon for insights on digital marketing, SEO, and business growth.
                </p>
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="space-y-6">
                {recentPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group rounded-2xl border border-neutral-200 bg-white p-6 hover:border-orange-500 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row gap-6">
                      {post.featuredImage && (
                        <Link
                          href={`/blog/${post.slug}`}
                          className="flex-shrink-0"
                        >
                          <div className="relative h-48 w-full sm:h-32 sm:w-48 rounded-xl overflow-hidden">
                            <Image
                              src={post.featuredImage.node.sourceUrl}
                              alt={post.featuredImage.node.altText || post.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 text-sm mb-3">
                          <time className="text-neutral-500 font-medium">
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                          <span className="text-neutral-300">·</span>
                          {post.categories?.nodes?.[0] && (
                            <span className="text-orange-500 font-medium">
                              {post.categories.nodes[0].name}
                            </span>
                          )}
                          {post.content && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="text-neutral-500">
                                {calculateReadingTime(post.content)} min read
                              </span>
                            </>
                          )}
                        </div>
                        <Link href={`/blog/${post.slug}`}>
                          <h3 className="text-xl font-bold text-neutral-900 group-hover:text-orange-500 transition-colors line-clamp-2 mb-2">
                            {post.title}
                          </h3>
                        </Link>
                        <p className="text-neutral-600 line-clamp-2 text-sm">
                          {stripHtml(post.excerpt)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            {/* Newsletter Subscription CTA */}
            <div className="mt-12 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-8 text-center">
              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Never Miss an Update
              </h3>
              <p className="text-neutral-600 mb-6 max-w-2xl mx-auto">
                Get the latest digital marketing insights, SEO tips, and growth strategies delivered straight to your inbox.
              </p>
              <BlogSubscribe />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
