import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { SAMPLE_POSTS } from "@/lib/sample-posts";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Define available categories with descriptions
const CATEGORIES = {
  seo: {
    name: "SEO",
    description: "Learn search engine optimization strategies to improve your website's visibility and attract more organic traffic.",
  },
  guides: {
    name: "Guides",
    description: "Comprehensive guides and tutorials to help you master digital marketing and grow your business.",
  },
  marketing: {
    name: "Marketing",
    description: "Discover effective marketing strategies and tactics to reach your target audience and drive results.",
  },
  "medical-spa-marketing": {
    name: "Medical Spa Marketing",
    description: "Specialized marketing strategies for medical spas to attract more clients and grow your practice.",
  },
};

async function getCategory(slug: string) {
  const categoryInfo = CATEGORIES[slug as keyof typeof CATEGORIES];
  if (!categoryInfo) return null;

  // Filter posts by category slug
  const posts = SAMPLE_POSTS.filter((post) =>
    post.categories.nodes.some((cat) => cat.slug === slug)
  );

  return {
    slug,
    name: categoryInfo.name,
    description: categoryInfo.description,
    posts: { nodes: posts },
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {};
  }

  return getPageMetadata({
    title: `${category.name} - Blog Category`,
    description: category.description || `Browse all posts in the ${category.name} category.`,
    path: `/blog/category/${slug}`,
  });
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({
    slug,
  }));
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: category.name, url: `/blog/category/${slug}` },
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
              <span className="text-foreground">{category.name}</span>
            </nav>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            
            {category.description && (
              <div className="mt-6 space-y-4 text-lg leading-8 text-muted-foreground">
                <p>{category.description}</p>
                {slug === "medical-spa-marketing" && (
                  <p>
                    Looking for expert help with your medical spa marketing? Check out our{" "}
                    <Link href="/medical-spas" className="text-primary hover:underline">
                      medical spa services
                    </Link>{" "}
                    to learn how we can help you grow your business.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {category.posts.nodes.map((post) => (
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
