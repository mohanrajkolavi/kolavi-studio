import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { parseRankMathFullHead } from "@/lib/seo/rank-math-parser";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPostBySlug, getPosts, getPostAuthorName, getPostAuthorUrl, fetchAllPostSlugs } from "@/lib/blog/data";
import { processContentForToc } from "@/lib/blog/utils";
import { BlogPostTOC } from "@/components/blog/BlogPostTOC";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { BlogSubscribe } from "@/components/blog/BlogSubscribe";
import { SITE_URL, SEO } from "@/lib/constants";
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
    stripHtml(post.excerpt || "").substring(0, SEO.META_DESCRIPTION_MAX_CHARS);
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
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

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
  ];
  if (firstCategory) {
    breadcrumbItems.push({
      name: firstCategory.name,
      url: `/blog/category/${firstCategory.slug}`,
    });
  }
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

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
        nonce={nonce}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        nonce={nonce}
      />

      <article className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="pt-8 pb-4">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <li>
                  <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li aria-hidden className="text-muted-foreground/50">/</li>
                <li>
                  <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
                    Blog
                  </Link>
                </li>
                {firstCategory && (
                  <>
                    <li aria-hidden className="text-muted-foreground/50">/</li>
                    <li>
                      <Link
                        href={`/blog/category/${firstCategory.slug}`}
                        className="font-medium text-foreground transition-colors hover:text-muted-foreground"
                      >
                        {firstCategory.name}
                      </Link>
                    </li>
                  </>
                )}
              </ol>
            </nav>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {post.categories?.nodes?.[0] && (
                <Link
                  href={`/blog/category/${post.categories.nodes[0].slug}`}
                  className="rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                >
                  {post.categories.nodes[0].name}
                </Link>
              )}
              <time dateTime={post.date}>{formattedDate}</time>
              <span>{readTime} min read</span>
            </div>

            {/* Title - H1 (unchanged - you like it) */}
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>

            {/* Lead paragraph / meta description (unchanged - you like it) */}
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {leadText}
            </p>

            {/* Author + Share */}
            <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-sm font-semibold text-foreground">
                  {getPostAuthorName(post).charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{getPostAuthorName(post)}</p>
                  <p className="text-xs text-muted-foreground">
                    Digital marketing insights
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-border pt-4 sm:border-t-0 sm:border-l sm:border-border sm:pl-5 sm:pt-0">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Share</span>
                <ShareButtons url={postUrl} title={post.title} showLabel={false} />
              </div>
            </div>

            {/* Featured image */}
            {post.featuredImage && (
              <figure className="mt-8">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={post.featuredImage.node.sourceUrl}
                    alt={post.featuredImage.node.altText || post.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
                  />
                </div>
                <figcaption className="sr-only">
                  {post.featuredImage.node.altText || post.title}
                </figcaption>
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

                {/* Categories + Tags */}
                <footer className="mt-10 border-t border-border pt-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {(post.categories?.nodes?.length ?? 0) + (post.tags?.nodes?.length ?? 0) > 0 && (
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Posted in</span>
                    )}
                    {post.categories?.nodes?.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/blog/category/${cat.slug}`}
                        className="rounded-md border border-border px-2.5 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
                      >
                        {cat.name}
                      </Link>
                    ))}
                    {post.tags?.nodes?.map((tag) => (
                      <Link
                        key={tag.slug}
                        href={`/blog/tag/${tag.slug}`}
                        className="rounded-md border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
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

            {/* Read next */}
            {relatedPosts.length > 0 && (
              <section className="border-t border-border pt-8 pb-12 sm:pt-10 sm:pb-14">
                <p className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  More to read
                </p>
                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((related) => (
                    <Link
                      key={related.id}
                      href={`/blog/${related.slug}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30 hover:bg-muted/20"
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
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {related.categories?.nodes?.[0] && (
                            <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                              {related.categories.nodes[0].name}
                            </span>
                          )}
                          <time>
                            {new Date(related.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                        </div>
                        <h3 className="mt-3 font-semibold text-foreground line-clamp-2 transition-colors group-hover:text-foreground">
                          {related.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">
                          {stripHtml(related.excerpt || "")}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-all group-hover:gap-2">
                          Read article
                          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  ))}
                  </div>
              </section>
            )}

            {/* Newsletter */}
            <div className="mb-12 flex flex-col gap-6 rounded-xl border border-border bg-card px-5 py-6 sm:mb-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Newsletter
                </p>
                <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                  Get the latest insights
                </h2>
              </div>
              <div className="shrink-0 sm:min-w-[260px]">
                <BlogSubscribe />
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
