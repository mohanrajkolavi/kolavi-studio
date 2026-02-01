import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import { request } from "@/lib/graphql/client";
import { GET_POSTS } from "@/lib/graphql/queries";
import { PostsResponse } from "@/lib/graphql/types";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export const metadata = getPageMetadata({
  title: "Blog - Digital Marketing Insights & Tips",
  description: "Expert insights on digital marketing, SEO, web design, and business growth strategies for medical spas, dental practices, and law firms.",
  path: "/blog",
});

async function getPosts() {
  try {
    const data = await request<PostsResponse>(GET_POSTS, {
      first: 12,
    });
    return data.posts.nodes;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Blog
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Expert insights, strategies, and tips to help you grow your business through digital marketing.
            </p>
          </div>
        </div>
      </section>

      {featuredPost && (
        <section className="pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Link href={`/blog/${featuredPost.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {featuredPost.featuredImage && (
                      <div className="relative h-64 md:h-auto">
                        <Image
                          src={featuredPost.featuredImage.node.sourceUrl}
                          alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="mb-4">
                        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                          Featured
                        </span>
                      </div>
                      <CardTitle className="text-2xl sm:text-3xl">
                        {featuredPost.title}
                      </CardTitle>
                      <CardDescription
                        className="mt-4 text-base"
                        dangerouslySetInnerHTML={{ __html: featuredPost.excerpt }}
                      />
                      <p className="mt-4 text-sm text-muted-foreground">
                        {new Date(featuredPost.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-8 text-2xl font-bold">Recent Posts</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {remainingPosts.map((post) => (
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
