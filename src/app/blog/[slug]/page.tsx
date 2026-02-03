import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { parseRankMathFullHead } from "@/lib/seo/rank-math-parser";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPostBySlug, getPosts, getPostAuthorName, getPostAuthorUrl, fetchAllPostSlugs } from "@/lib/blog-data";
import { processContentForToc } from "@/lib/blog-utils";
import { BlogPostTOC } from "@/components/blog/BlogPostTOC";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { BlogSubscribe } from "../BlogSubscribe";
import { SITE_URL } from "@/lib/constants";
import type { WPPost } from "@/lib/graphql/types";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getRelatedPosts(currentSlug: string, limit = 3): Promise<WPPost[]> {
  const posts = await getPosts();
  return posts.filter((p) => p.slug !== currentSlug).slice(0, limit);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function readingTimeMinutes(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const parsed = parseRankMathFullHead(post.seo?.fullHead);
  const title = parsed.ogTitle?.trim() || post.title;
  const description =
    parsed.metaDescription?.trim() ||
    stripHtml(post.excerpt || "").substring(0, 160);
  const image =
    parsed.ogImage?.trim() || post.featuredImage?.node.sourceUrl;
  return getPageMetadata({
    title,
    description,
    path: `/blog/${slug}`,
    image,
    author: getPostAuthorName(post),
    publishedTime: post.date,
    modifiedTime: post.modified,
    ogDescription: parsed.ogDescription?.trim() || undefined,
    twitterTitle: parsed.twitterTitle?.trim() || undefined,
    twitterDescription: parsed.twitterDescription?.trim() || undefined,
    twitterImage: parsed.twitterImage?.trim() || undefined,
  });
}

export async function generateStaticParams() {
  const slugs = await fetchAllPostSlugs();
  return slugs.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, relatedPosts] = await Promise.all([
    getPostBySlug(slug),
    getRelatedPosts(slug),
  ]);

  if (!post) notFound();

  const safeContent = post.content || "";
  const safeExcerpt = post.excerpt || "";
  const { headings, content } = processContentForToc(safeContent);
  const h2h3 = headings.filter((h) => h.level <= 3);
  const tocHeadings =
    h2h3.length > 12 ? headings.filter((h) => h.level === 2) : h2h3;
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const firstCategory = post.categories?.nodes?.[0];
  const readTime = readingTimeMinutes(safeContent);
  const wordCount = stripHtml(safeContent).split(/\s+/).filter(Boolean).length;
  const mediaDetails = post.featuredImage?.node?.mediaDetails;

  const articleSchema = getArticleSchema({
    headline: post.title,
    description: stripHtml(safeExcerpt),
    datePublished: post.date,
    dateModified: post.modified,
    authorName: getPostAuthorName(post),
    authorUrl: getPostAuthorUrl(post),
    image: post.featuredImage?.node.sourceUrl,
    imageWidth: mediaDetails?.width,
    imageHeight: mediaDetails?.height,
    url: postUrl,
    wordCount,
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

  const parsedSeo = parseRankMathFullHead(post.seo?.fullHead);
  const leadText =
    parsedSeo.metaDescription?.trim() || stripHtml(safeExcerpt);

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

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Breadcrumb - redesigned with chevrons and subtle background */}
            <nav
              aria-label="Breadcrumb"
              className="pt-10 pb-6"
            >
              <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                <li>
                  <Link
                    href="/"
                    className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Home
                  </Link>
                </li>
                <li aria-hidden className="text-muted-foreground/50">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Blog
                  </Link>
                </li>
                {firstCategory && (
                  <>
                    <li aria-hidden className="text-muted-foreground/50">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </li>
                    <li>
                      <Link
                        href={`/blog/category/${firstCategory.slug}`}
                        className="rounded px-2 py-1 font-medium text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
                      >
                        {firstCategory.name}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            {/* Meta: category pill + date + read time - redesigned */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              {post.categories?.nodes?.[0] && (
                <Link
                  href={`/blog/category/${post.categories.nodes[0].slug}`}
                  className="inline-flex items-center rounded-full bg-orange-100 px-3.5 py-1.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-200"
                >
                  {post.categories.nodes[0].name}
                </Link>
              )}
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time dateTime={post.date}>{formattedDate}</time>
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTime} min read
              </span>
            </div>

            {/* Title - H1 (unchanged - you like it) */}
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>

            {/* Lead paragraph / meta description (unchanged - you like it) */}
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {leadText}
            </p>

            {/* Author + Share – single card */}
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-5 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-amber-100 text-sm font-bold text-orange-700">
                  {getPostAuthorName(post).charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{getPostAuthorName(post)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                    Digital marketing insights for service businesses
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-border pt-3 sm:border-t-0 sm:border-l sm:border-border sm:pl-5 sm:pt-0">
                <span className="text-sm font-medium text-muted-foreground">Share</span>
                <ShareButtons url={postUrl} title={post.title} showLabel={false} />
              </div>
            </div>

            {/* Featured image */}
            {post.featuredImage && (
              <figure className="mt-8">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-muted">
                  <Image
                    src={post.featuredImage.node.sourceUrl}
                    alt={post.featuredImage.node.altText || post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
                  />
                </div>
              </figure>
            )}

            {/* TOC mobile */}
            {tocHeadings.length > 0 && (
              <div className="mt-8 lg:hidden">
                <BlogPostTOC headings={tocHeadings} maxLevel={3} />
              </div>
            )}

            {/* Content + sidebar TOC */}
            <div className="mt-12 flex flex-col gap-12 pb-12 lg:flex-row lg:gap-16">
              <div className="min-w-0 flex-1">
                <div
                  className="prose prose-lg prose-neutral dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-p:leading-relaxed prose-a:text-orange-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
                  dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Categories + Tags – rounded pills */}
                <footer className="mt-10 border-t border-border pt-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {(post.categories?.nodes?.length ?? 0) + (post.tags?.nodes?.length ?? 0) > 0 && (
                      <span className="text-muted-foreground">Posted in</span>
                    )}
                    {post.categories?.nodes?.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/blog/category/${cat.slug}`}
                        className="rounded-full bg-muted px-3 py-1.5 text-foreground transition-colors hover:bg-orange-100 hover:text-orange-700 dark:hover:bg-orange-900/30 dark:hover:text-orange-400"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {post.tags?.nodes?.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/blog/tag/${tag.slug}`}
                        className="rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-orange-300 hover:text-orange-600 dark:hover:border-orange-600 dark:hover:text-orange-400"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </footer>
              </div>

              {tocHeadings.length > 0 && (
                <aside className="hidden shrink-0 lg:block">
                  <BlogPostTOC headings={tocHeadings} maxLevel={3} />
                </aside>
              )}
            </div>

            {/* Read next – redesigned */}
            {relatedPosts.length > 0 && (
              <section className="border-t border-border pt-6 pb-12 sm:pt-8 sm:pb-14">
                <div className="flex flex-col items-center gap-6 sm:gap-8">
                  <span className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                    More to read
                  </span>
                  <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                    >
                      {related.featuredImage ? (
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <Image
                            src={related.featuredImage.node.sourceUrl}
                            alt={related.featuredImage.node.altText || related.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] bg-muted" />
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {related.categories?.nodes?.[0] && (
                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-medium text-orange-700">
                              {related.categories.nodes[0].name}
                            </span>
                          )}
                          <time className="text-muted-foreground">
                            {new Date(related.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                        <h3 className="mt-3 font-semibold text-foreground line-clamp-2 transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {related.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                          {stripHtml(related.excerpt || "")}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 group-hover:gap-2">
                          Read article
                          <svg className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  ))}
                  </div>
                </div>
              </section>
            )}

            {/* Newsletter – horizontal layout (heading left, form right) */}
            <div className="mb-14 flex flex-col gap-6 rounded-2xl border border-border bg-card px-5 py-6 sm:mb-16 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  Want product news and updates?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign up for our newsletter.
                </p>
              </div>
              <div className="shrink-0 sm:min-w-[280px]">
                <BlogSubscribe />
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
