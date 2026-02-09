import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getCategoryBySlug, getAllCategorySlugs } from "@/lib/blog/data";
import { truncateToWords } from "@/lib/blog/utils";
import { SITE_URL, IMAGE_EAGER_COUNT, IMAGE_BLUR_PLACEHOLDER } from "@/lib/constants";

export const revalidate = 60; // ISR: revalidate every 60 seconds

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Optional visual styles per category slug (WordPress provides name/description only)
const CATEGORY_STYLES: Record<
  string,
  { icon: string; color: string; tagline?: string }
> = {
  seo: {
    icon: "🔍",
    color: "from-blue-500 to-cyan-500",
    tagline: "Master Search Engine Optimization",
  },
  guides: {
    icon: "📚",
    color: "from-purple-500 to-pink-500",
    tagline: "Step-by-Step Digital Marketing Tutorials",
  },
  marketing: {
    icon: "📈",
    color: "from-orange-500 to-red-500",
    tagline: "Grow Your Business with Smart Marketing",
  },
  "medical-spa-marketing": {
    icon: "💆",
    color: "from-teal-500 to-emerald-500",
    tagline: "Attract More Clients to Your Med Spa",
  },
  automation: { icon: "⚙️", color: "from-slate-500 to-slate-600" },
  compliance: { icon: "✓", color: "from-emerald-500 to-teal-500" },
  design: { icon: "🎨", color: "from-violet-500 to-purple-500" },
  growth: { icon: "📈", color: "from-amber-500 to-orange-500" },
  insights: { icon: "💡", color: "from-yellow-500 to-amber-500" },
};

const DEFAULT_STYLE = { icon: "📁", color: "from-orange-500 to-orange-600" };

function getCategoryStyle(slug: string) {
  return CATEGORY_STYLES[slug] ?? DEFAULT_STYLE;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {};
  }

  const postCount = category.posts.nodes.length;
  const description =
    category.description?.replace(/<[^>]*>/g, "").trim() ||
    `Browse ${postCount} article${postCount !== 1 ? "s" : ""} in ${category.name}.`;

  return getPageMetadata({
    title: `${category.name} Articles & Resources | Kolavi Studio`,
    description,
    path: `/blog/category/${slug}`,
    keywords: [category.name, "digital marketing", "business growth"].join(", "),
  });
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export default async function CategoryPage({ params }: PageProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const style = getCategoryStyle(slug);
  const postCount = category.posts.nodes.length;
  const latestPost = category.posts.nodes[0];
  const olderPosts = category.posts.nodes.slice(1);
  const descriptionPlain =
    category.description?.replace(/<[^>]*>/g, "").trim() || "";

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Category", url: "/blog/category" },
    { name: category.name, url: `/blog/category/${slug}` },
  ]);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Articles`,
    description:
      descriptionPlain ||
      `Browse articles in ${category.name}.`,
    url: `${SITE_URL}/blog/category/${slug}`,
    about: {
      "@type": "Thing",
      name: category.name,
      description: descriptionPlain || category.name,
    },
    numberOfItems: postCount,
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

      {/* Hero Section with Gradient */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className={`absolute inset-0 bg-gradient-to-br ${style.color} opacity-5`} />
        
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
                <Link href="/blog/category" className="hover:text-foreground transition-colors">
                  Category
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">{category.name}</span>
              </nav>

              {/* Category Icon & Badge */}
              <div className="mb-6 flex items-center gap-3">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${style.color} text-3xl shadow-lg`}>
                  {style.icon}
                </div>
                <div className="rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground">
                  {postCount} Article{postCount !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Title & Description */}
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {category.name}
              </h1>
              
              {style.tagline && (
                <p className="mb-3 text-xl font-medium text-muted-foreground sm:text-2xl">
                  {style.tagline}
                </p>
              )}

              {descriptionPlain ? (
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  {descriptionPlain}
                </p>
              ) : (
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  Browse our latest articles and resources in {category.name}.
                </p>
              )}

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
                  {latestPost.featuredImage?.node?.sourceUrl && (
                    <div className="img-hover-zoom relative h-64 overflow-hidden md:h-full">
                      <Image
                        src={latestPost.featuredImage.node.sourceUrl}
                        alt={latestPost.featuredImage.node.altText || latestPost.title}
                        fill
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        placeholder="blur"
                        blurDataURL={IMAGE_BLUR_PLACEHOLDER}
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
                      {truncateToWords(stripHtml(latestPost.excerpt || ""), 20)}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-all group-hover:gap-3">
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
                      {post.featuredImage?.node?.sourceUrl ? (
                        <div className="img-hover-zoom relative h-48 overflow-hidden">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105 motion-reduce:transform-none"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={index < IMAGE_EAGER_COUNT ? "eager" : "lazy"}
                            placeholder="blur"
                            blurDataURL={IMAGE_BLUR_PLACEHOLDER}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-muted" />
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
                          {truncateToWords(stripHtml(post.excerpt ?? ""), 20)}
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
              <div className="mb-6 text-6xl">{style.icon}</div>
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
