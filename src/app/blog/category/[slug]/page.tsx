import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPosts } from "@/lib/blog-data";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Define available categories with enhanced descriptions and metadata
const CATEGORIES = {
  seo: {
    name: "SEO",
    tagline: "Master Search Engine Optimization",
    description: "Learn search engine optimization strategies to improve your website's visibility and attract more organic traffic.",
    longDescription: "Discover proven SEO techniques, algorithm updates, and best practices that help businesses rank higher in search results. From technical SEO to content optimization, we cover everything you need to dominate search engines.",
    icon: "🔍",
    color: "from-blue-500 to-cyan-500",
    relatedTopics: ["Technical SEO", "Local SEO", "Content Strategy", "Link Building"],
  },
  guides: {
    name: "Guides",
    tagline: "Step-by-Step Digital Marketing Tutorials",
    description: "Comprehensive guides and tutorials to help you master digital marketing and grow your business.",
    longDescription: "In-depth, actionable guides that walk you through complex digital marketing strategies. Whether you're a beginner or expert, our tutorials provide clear steps to achieve your marketing goals.",
    icon: "📚",
    color: "from-purple-500 to-pink-500",
    relatedTopics: ["Getting Started", "Advanced Tactics", "Tools & Resources", "Best Practices"],
  },
  marketing: {
    name: "Marketing",
    tagline: "Grow Your Business with Smart Marketing",
    description: "Discover effective marketing strategies and tactics to reach your target audience and drive results.",
    longDescription: "Explore cutting-edge marketing strategies that drive real business growth. From content marketing to social media, learn how to create campaigns that resonate with your audience and deliver measurable ROI.",
    icon: "📈",
    color: "from-orange-500 to-red-500",
    relatedTopics: ["Content Marketing", "Social Media", "Email Marketing", "Analytics"],
  },
  "medical-spa-marketing": {
    name: "Medical Spa Marketing",
    tagline: "Attract More Clients to Your Med Spa",
    description: "Specialized marketing strategies for medical spas to attract more clients and grow your practice.",
    longDescription: "Industry-specific marketing insights for medical spas and aesthetic practices. Learn how to navigate compliance, build trust, and attract high-value clients in the competitive med spa industry.",
    icon: "💆",
    color: "from-teal-500 to-emerald-500",
    relatedTopics: ["Patient Acquisition", "Online Reputation", "Before & After Marketing", "Compliance"],
  },
};

async function getCategory(slug: string) {
  const categoryInfo = CATEGORIES[slug as keyof typeof CATEGORIES];
  if (!categoryInfo) return null;

  const allPosts = await getPosts();
  const posts = allPosts.filter((post) =>
    post.categories?.nodes?.some((cat) => cat.slug === slug)
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

  const categoryInfo = CATEGORIES[slug as keyof typeof CATEGORIES];
  const postCount = category.posts.nodes.length;

  return getPageMetadata({
    title: `${category.name} Articles & Resources | ${categoryInfo.tagline}`,
    description: `${categoryInfo.longDescription} Browse ${postCount} expert article${postCount !== 1 ? 's' : ''} on ${category.name.toLowerCase()}.`,
    path: `/blog/category/${slug}`,
    keywords: [category.name, ...categoryInfo.relatedTopics, "digital marketing", "business growth"].join(", "),
  });
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((slug) => ({
    slug,
  }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const categoryInfo = CATEGORIES[slug as keyof typeof CATEGORIES];
  const postCount = category.posts.nodes.length;
  const latestPost = category.posts.nodes[0];
  const olderPosts = category.posts.nodes.slice(1);

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: category.name, url: `/blog/category/${slug}` },
  ]);

  // Collection List Schema for SEO (WordPress headless compatible)
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Articles`,
    description: categoryInfo.longDescription,
    url: `${SITE_URL}/blog/category/${slug}`,
    about: {
      "@type": "Thing",
      name: category.name,
      description: categoryInfo.description,
    },
    numberOfItems: postCount,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${categoryInfo.color} opacity-5`} />
        
        <div className="relative py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              {/* Breadcrumb */}
              <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">{category.name}</span>
              </nav>

              {/* Category Icon & Badge */}
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${categoryInfo.color} text-3xl shadow-lg`}>
                  {categoryInfo.icon}
                </div>
                <div className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
                  {postCount} Article{postCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {category.name}
              </h1>
              
              <p className="mb-3 text-xl font-medium text-muted-foreground sm:text-2xl">
                {categoryInfo.tagline}
              </p>

              <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                {categoryInfo.longDescription}
              </p>

              {/* Related Topics */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-muted-foreground">Related topics:</span>
                {categoryInfo.relatedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-card px-3 py-1 text-sm font-medium text-foreground shadow-sm ring-1 ring-border"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              {/* CTA for Medical Spa Marketing */}
              {slug === "medical-spa-marketing" && (
                <div className="mt-8 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6">
                  <p className="text-foreground">
                    <strong>Need expert help?</strong> Our team specializes in medical spa marketing.{" "}
                    <Link href="/medical-spas" className="font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2">
                      Explore our services →
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Latest Article - Featured */}
      {latestPost && (
        <section className="border-b border-border bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  Latest Article
                </h2>
              </div>

              <Link
                href={`/blog/${latestPost.slug}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-xl dark:hover:border-orange-800"
              >
                <article className="grid gap-0 md:grid-cols-2">
                  {latestPost.featuredImage && (
                    <div className="relative h-64 md:h-full">
                      <Image
                        src={latestPost.featuredImage.node.sourceUrl}
                        alt={latestPost.featuredImage.node.altText || latestPost.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <time className="mb-3 text-sm font-medium text-muted-foreground">
                      {new Date(latestPost.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <h3 className="mb-4 text-2xl font-bold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400 sm:text-3xl lg:text-4xl">
                      {latestPost.title}
                    </h3>
                    <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                      {stripHtml(latestPost.excerpt)}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-gap group-hover:gap-3">
                      Read article
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </article>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Articles Grid */}
      {olderPosts.length > 0 && (
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  All Articles
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {olderPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <article className="h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg dark:hover:border-orange-800">
                      {post.featuredImage && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={index < 6 ? "eager" : "lazy"}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <time className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {new Date(post.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                        <h3 className="mb-3 line-clamp-2 text-xl font-bold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {post.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {stripHtml(post.excerpt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* No Posts Message */}
      {postCount === 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-6 text-6xl">{categoryInfo.icon}</div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">
                No articles yet
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                We're working on creating great content for this category. Check back soon!
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
              >
                Browse all articles
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA Section */}
      {postCount > 0 && (
        <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-4 text-2xl font-bold text-foreground sm:text-3xl">
                Want more {category.name.toLowerCase()} insights?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Subscribe to our newsletter for the latest tips, strategies, and industry updates delivered to your inbox.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
                >
                  Get in Touch
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-8 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  View All Articles
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
