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
  title: "Blog & Resources - Digital Marketing Insights",
  description: "Discover the latest news, guides and tutorials from Kolavi Studio. Learn about digital marketing, SEO, web design and business growth best practices.",
  path: "/blog",
});

async function getPosts() {
  // Use sample posts directly for now
  // TODO: Re-enable WordPress integration when backend is configured
  return SAMPLE_POSTS;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPosts = posts.slice(0, 3);
  const latestPosts = posts.slice(3);

  return (
    <>
      {/* Hero Section - Flair style */}
      <section className="border-b border-neutral-200 bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
              Kolavi Studio{" "}
              <span className="text-orange-500">Blog</span>
              {" "}& Resources
            </h1>
            <p className="mt-6 text-lg leading-8 text-neutral-600">
              Discover the latest news, guides and tutorials from Kolavi Studio. You&apos;ll learn about digital marketing, SEO, web design and business growth best practices.
            </p>
            <div className="mt-10">
              <BlogSubscribe />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredPosts.length > 0 && (
        <section className="border-b border-neutral-200 bg-neutral-50/50 py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-10 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Featured
              </h2>
              <div className={`grid grid-cols-1 gap-6 ${featuredPosts.length > 1 ? "lg:grid-cols-3" : ""}`}>
                {/* Large featured card */}
                <Link
                  href={`/blog/${featuredPosts[0].slug}`}
                  className={`group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md ${featuredPosts.length > 1 ? "lg:col-span-2 lg:row-span-2" : ""}`}
                >
                  <div className={`grid h-full ${featuredPosts[0].featuredImage ? "grid-cols-1 md:grid-cols-2" : ""}`}>
                    {featuredPosts[0].featuredImage ? (
                      <div className="relative h-64 min-h-[280px] md:h-full">
                        <Image
                          src={featuredPosts[0].featuredImage.node.sourceUrl}
                          alt={featuredPosts[0].featuredImage.node.altText || featuredPosts[0].title}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="h-64 min-h-[280px] bg-neutral-100 md:h-full" />
                    )}
                    <div className="flex flex-col justify-center p-8">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {featuredPosts[0].categories?.nodes?.[0]?.name || "Blog"}
                        {" · "}
                        {new Date(featuredPosts[0].date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="mt-3 text-2xl font-bold text-neutral-900 group-hover:text-neutral-700 sm:text-3xl">
                        {featuredPosts[0].title}
                      </h3>
                      <p className="mt-4 line-clamp-3 text-neutral-600">
                        {stripHtml(featuredPosts[0].excerpt)}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Smaller featured cards - when we have 2+ posts */}
                {featuredPosts.slice(1, 3).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {post.featuredImage ? (
                      <div className="relative h-40">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-neutral-100" />
                    )}
                    <div className="p-6">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {post.categories?.nodes?.[0]?.name || "Blog"}
                        {" · "}
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-lg font-bold text-neutral-900 group-hover:text-neutral-700">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                        {stripHtml(post.excerpt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Latest
            </h2>
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 py-20 text-center">
                <p className="text-neutral-500">
                  No posts yet. Check back soon for insights on digital marketing, SEO, and business growth.
                </p>
              </div>
            ) : latestPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {post.featuredImage ? (
                      <div className="relative h-48">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-[1.02]"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-neutral-100" />
                    )}
                    <div className="p-6">
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {post.categories?.nodes?.[0]?.name || "Blog"}
                        {" · "}
                        {new Date(post.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="mt-3 line-clamp-2 text-lg font-bold text-neutral-900 group-hover:text-neutral-700">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-neutral-600">
                        {stripHtml(post.excerpt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
