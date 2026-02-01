import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import { request } from "@/lib/graphql/client";
import { GET_TAG_BY_SLUG, GET_ALL_TAG_SLUGS } from "@/lib/graphql/queries";
import { TagBySlugResponse } from "@/lib/graphql/types";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTag(slug: string) {
  try {
    const data = await request<TagBySlugResponse>(GET_TAG_BY_SLUG, {
      slug,
      first: 12,
    });
    return data.tag;
  } catch (error) {
    console.error("Error fetching tag:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return {};
  }

  return getPageMetadata({
    title: `${tag.name} - Blog Tag`,
    description: `Browse all posts tagged with ${tag.name}.`,
    path: `/blog/tag/${slug}`,
  });
}

export async function generateStaticParams() {
  try {
    const data = await request<{ tags: { nodes: { slug: string }[] } }>(
      GET_ALL_TAG_SLUGS
    );
    return data.tags.nodes.slice(0, 50).map((tag) => ({
      slug: tag.slug,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: tag.name, url: `/blog/tag/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <section className="py-16 sm:py-24">
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
              <span className="text-foreground">{tag.name}</span>
            </nav>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Posts tagged: {tag.name}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Browse all articles related to {tag.name}.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {tag.posts.nodes.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {post.featuredImage && (
                      <div className="relative h-48 w-full">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="rounded-t-xl object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription
                        className="line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: post.excerpt }}
                      />
                      <p className="mt-4 text-sm text-muted-foreground">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
