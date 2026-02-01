import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { request } from "@/lib/graphql/client";
import { GET_POST_BY_SLUG, GET_ALL_POST_SLUGS, GET_POSTS } from "@/lib/graphql/queries";
import { PostBySlugResponse, PostsResponse } from "@/lib/graphql/types";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getSamplePostBySlug, SAMPLE_POSTS } from "@/lib/sample-posts";
import { processContentForToc } from "@/lib/blog-utils";
import { BlogPostTOC } from "@/components/blog/BlogPostTOC";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { BlogSubscribe } from "../BlogSubscribe";
import { SITE_URL } from "@/lib/constants";
import type { WPPost } from "@/lib/graphql/types";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  // Use sample posts directly for now
  // TODO: Re-enable WordPress integration when backend is configured
  return getSamplePostBySlug(slug);
}

async function getRelatedPosts(currentSlug: string, limit = 3): Promise<WPPost[]> {
  // Use sample posts directly for now
  // TODO: Re-enable WordPress integration when backend is configured
  return SAMPLE_POSTS.filter((p) => p.slug !== currentSlug).slice(0, limit);
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {};
  }

  return getPageMetadata({
    title: post.title,
    description: post.excerpt.replace(/<[^>]*>/g, "").substring(0, 160),
    path: `/blog/${slug}`,
    image: post.featuredImage?.node.sourceUrl,
  });
}

export async function generateStaticParams() {
  // Use sample posts directly for now
  // TODO: Re-enable WordPress integration when backend is configured
  return SAMPLE_POSTS.map((p) => ({ slug: p.slug }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, relatedPosts] = await Promise.all([
    getPost(slug),
    getRelatedPosts(slug),
  ]);

  if (!post) {
    notFound();
  }

  const { headings, content } = processContentForToc(post.content);
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const firstCategory = post.categories?.nodes?.[0];

  const articleSchema = getArticleSchema({
    headline: post.title,
    description: post.excerpt.replace(/<[^>]*>/g, ""),
    datePublished: post.date,
    dateModified: post.modified,
    image: post.featuredImage?.node.sourceUrl,
    url: `/blog/${slug}`,
  });

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${slug}` },
  ]);

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="border-b border-neutral-200 bg-white py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Breadcrumb - Google blog style */}
            <nav
              aria-label="Breadcrumb"
              className="mb-8 text-sm text-neutral-500"
            >
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <li>
                  <Link
                    href="/"
                    className="transition-colors hover:text-neutral-900"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    href="/blog"
                    className="transition-colors hover:text-neutral-900"
                  >
                    Blog
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  {firstCategory ? (
                    <Link
                      href={`/blog/category/${firstCategory.slug}`}
                      className="transition-colors hover:text-neutral-900"
                    >
                      {firstCategory.name}
                    </Link>
                  ) : (
                    <span className="text-neutral-900">Article</span>
                  )}
                </li>
              </ol>
            </nav>

            {/* Title + Meta row - Google blog inspired */}
            <header>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-[2.75rem]">
                {post.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <time dateTime={post.date} className="text-neutral-500">
                  {formattedDate}
                </time>
                {post.categories?.nodes?.length > 0 && (
                  <>
                    <span className="text-neutral-300" aria-hidden>
                      ·
                    </span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {post.categories?.nodes?.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/blog/category/${category.slug}`}
                          className="text-neutral-600 transition-colors hover:text-neutral-900"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                <span className="text-neutral-300" aria-hidden>
                  ·
                </span>
                <ShareButtons url={postUrl} title={post.title} />
              </div>
            </header>

            {/* Author block - Google blog style */}
            <div className="mt-8 flex items-center gap-4 border-y border-neutral-200 py-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-600">
                K
              </div>
              <div>
                <p className="font-medium text-neutral-900">Kolavi Studio</p>
                <p className="text-sm text-neutral-500">
                  Digital marketing insights for service businesses
                </p>
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative mt-8 aspect-[2/1] w-full overflow-hidden rounded-2xl">
                <Image
                  src={post.featuredImage.node.sourceUrl}
                  alt={post.featuredImage.node.altText || post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </div>
            )}

            {/* Table of contents - mobile (before content) */}
            {headings.length > 0 && (
              <div className="mt-8 lg:hidden">
                <BlogPostTOC headings={headings} />
              </div>
            )}

            {/* Content + TOC layout */}
            <div className="mt-12 flex flex-col gap-12 lg:flex-row lg:gap-16">
              {/* Main content */}
              <div className="min-w-0 flex-1">
                <div
                  className="prose prose-lg prose-neutral max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:text-neutral-900 prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Tags */}
                {post.tags?.nodes?.length > 0 && (
                  <div className="mt-12 border-t border-neutral-200 pt-8">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                      Tags
                    </h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.tags?.nodes?.map((tag) => (
                        <Link
                          key={tag.slug}
                          href={`/blog/tag/${tag.slug}`}
                          className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Table of contents - sticky sidebar (desktop) */}
              {headings.length > 0 && (
                <aside className="hidden lg:block">
                  <BlogPostTOC headings={headings} />
                </aside>
              )}
            </div>

            {/* Related stories - Google blog style */}
            {relatedPosts.length > 0 && (
              <section className="mt-20 border-t border-neutral-200 pt-16">
                <h2 className="mb-10 text-2xl font-bold text-neutral-900">
                  Related stories
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="group"
                    >
                      {related.featuredImage ? (
                        <div className="relative aspect-[16/10] overflow-hidden rounded-xl">
                          <Image
                            src={related.featuredImage.node.sourceUrl}
                            alt={related.featuredImage.node.altText || related.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-[1.02]"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
                      )}
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {related.categories?.nodes?.[0]?.name || "Blog"}
                        {" · "}
                        {new Date(related.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <h3 className="mt-2 font-semibold text-neutral-900 group-hover:text-neutral-600">
                        {related.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                        {stripHtml(related.excerpt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Subscribe CTA - Google blog style */}
            <div className="mt-20 rounded-2xl border border-neutral-200 bg-neutral-50/50 px-6 py-12 text-center sm:px-12">
              <p className="text-lg font-medium text-neutral-900">
                Get the latest insights in your inbox
              </p>
              <p className="mt-2 text-sm text-neutral-600">
                Subscribe for digital marketing tips and updates.
              </p>
              <div className="mt-6 flex justify-center">
                <BlogSubscribe />
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
