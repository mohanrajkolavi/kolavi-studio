import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { request } from "@/lib/graphql/client";
import { GET_POST_BY_SLUG, GET_ALL_POST_SLUGS } from "@/lib/graphql/queries";
import { PostBySlugResponse } from "@/lib/graphql/types";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getSamplePostBySlug, SAMPLE_POSTS } from "@/lib/sample-posts";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  try {
    const data = await request<PostBySlugResponse>(GET_POST_BY_SLUG, { slug });
    if (data.post) return data.post;
  } catch (error) {
    console.error("Error fetching post:", error);
  }
  return getSamplePostBySlug(slug);
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
  try {
    const data = await request<{ posts: { nodes: { slug: string }[] } }>(
      GET_ALL_POST_SLUGS
    );
    if (data.posts.nodes.length > 0) {
      return data.posts.nodes.slice(0, 50).map((post) => ({
        slug: post.slug,
      }));
    }
  } catch (error) {
    console.error("Error generating static params:", error);
  }
  return SAMPLE_POSTS.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

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

      <article className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              {" / "}
              <Link href="/blog" className="hover:text-foreground">
                Blog
              </Link>
              {" / "}
              <span className="text-foreground">{post.title}</span>
            </nav>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              {post.categories.nodes.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex flex-wrap gap-2">
                    {post.categories.nodes.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/blog/category/${category.slug}`}
                        className="text-primary hover:underline"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative mt-8 h-96 w-full overflow-hidden rounded-xl">
                <Image
                  src={post.featuredImage.node.sourceUrl}
                  alt={post.featuredImage.node.altText || post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-lg mt-8 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags.nodes.length > 0 && (
              <div className="mt-12 border-t pt-8">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.nodes.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/blog/tag/${tag.slug}`}
                      className="rounded-full bg-muted px-3 py-1 text-sm hover:bg-muted/80"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
