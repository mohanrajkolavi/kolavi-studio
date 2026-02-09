import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPosts, getTagsFromPosts } from "@/lib/blog/data";
import { stripHtml, truncateToWords } from "@/lib/blog/utils";
import { SITE_URL, IMAGE_BLUR_PLACEHOLDER } from "@/lib/constants";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getTag(slug: string) {
  let allPosts;
  try {
    allPosts = await getPosts();
  } catch (error) {
    console.error("getTag: getPosts failed", error);
    return null;
  }
  const posts = (allPosts ?? []).filter((post) =>
    post.tags?.nodes?.some((tag) => tag.slug === slug)
  );

  if (posts.length === 0) return null;

  const tagName = posts[0].tags?.nodes?.find((tag) => tag.slug === slug)?.name || slug;

  return {
    slug,
    name: tagName,
    posts: { nodes: posts },
  };
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
    keywords: `blog tag, ${tag.name}, articles, Kolavi Studio`,
  });
}

export async function generateStaticParams() {
  try {
    const posts = await getPosts();
    const tags = getTagsFromPosts(posts ?? []);
    return tags.map((t) => ({ slug: t.slug }));
  } catch (error) {
    console.error("generateStaticParams (tag):", error);
    return [];
  }
}

export default async function TagPage({ params }: PageProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Tag", url: "/blog/tag" },
    { name: tag.name, url: `/blog/tag/${slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Posts tagged: ${tag.name}`,
    description: `Browse all posts tagged with ${tag.name}.`,
    url: `${SITE_URL}/blog/tag/${slug}`,
    numberOfItems: tag.posts.nodes.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        nonce={nonce}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        nonce={nonce}
      />

      <main>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <span>/</span>
              <Link href="/blog/tag" className="hover:text-foreground transition-colors">
                Tag
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">{tag.name}</span>
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
                    {post.featuredImage?.node?.sourceUrl && (
                      <div className="img-hover-zoom relative h-48 w-full overflow-hidden">
                        <Image
                          src={post.featuredImage.node.sourceUrl}
                          alt={post.featuredImage.node.altText || post.title}
                          fill
                          className="rounded-t-xl object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          placeholder="blur"
                          blurDataURL={IMAGE_BLUR_PLACEHOLDER}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3">
                        {truncateToWords(stripHtml(post.excerpt || ""), 20)}
                      </CardDescription>
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
      </main>
    </>
  );
}
