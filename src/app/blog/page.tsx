import Link from "next/link";
import Image from "next/image";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SAMPLE_POSTS } from "@/lib/sample-posts";
import { BlogSubscribe } from "./BlogSubscribe";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 60;

export const metadata = getPageMetadata({
  title: "Blog & Resources – Digital Marketing Insights | Kolavi Studio",
  description:
    "Expert strategies on SEO, conversion optimization, content marketing, and business growth. Proven tactics and actionable guides for medical spas, service businesses, and brands.",
  path: "/blog",
  keywords:
    "digital marketing blog, SEO tips, conversion optimization, content marketing, medical spa marketing, local SEO, web design, business growth",
});

async function getPosts() {
  return SAMPLE_POSTS;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

function getAllCategories() {
  const seen = new Map<string, { slug: string; name: string }>();
  SAMPLE_POSTS.forEach((post) => {
    post.categories.nodes.forEach((cat) => {
      if (!seen.has(cat.slug)) seen.set(cat.slug, { slug: cat.slug, name: cat.name });
    });
  });
  return Array.from(seen.values());
}

function getCategoryPostCount(slug: string): number {
  return SAMPLE_POSTS.filter((post) =>
    post.categories.nodes.some((c) => c.slug === slug)
  ).length;
}

const BLOG_TOPICS = [
  { slug: "seo", name: "SEO", icon: "🔍", color: "from-blue-500 to-cyan-500" },
  { slug: "guides", name: "Guides", icon: "📚", color: "from-purple-500 to-pink-500" },
  { slug: "marketing", name: "Marketing", icon: "📈", color: "from-orange-500 to-red-500" },
  { slug: "medical-spa-marketing", name: "Medical Spa", icon: "💆", color: "from-teal-500 to-emerald-500" },
] as const;

export default async function BlogPage() {
  const posts = await getPosts();
  const featuredPost = posts[0];
  const latestPosts = posts.slice(1, 4);
  const morePosts = posts.slice(4);
  const categories = getAllCategories();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ],
  };

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Kolavi Studio Blog",
    description: "Digital marketing insights, SEO strategies, and business growth resources.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: "Kolavi Studio",
      url: SITE_URL,
    },
    blogPost: posts.slice(0, 10).map((post, i) => ({
      "@type": "BlogPosting",
      position: i + 1,
      headline: post.title,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      description: stripHtml(post.excerpt).slice(0, 160),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-cyan-500/5" />
        <div className="relative py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <nav
                className="mb-8 flex items-center gap-2 text-sm text-neutral-500"
                aria-label="Breadcrumb"
              >
                <Link href="/" className="hover:text-neutral-900 transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="font-medium text-neutral-900">Blog</span>
              </nav>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                {posts.length} Article{posts.length !== 1 ? "s" : ""}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
                Blog & Resources
              </h1>
              <p className="mt-4 text-xl font-medium text-neutral-700 sm:text-2xl">
                Digital marketing insights that drive growth
              </p>
              <p className="mt-4 text-lg leading-relaxed text-neutral-600 max-w-2xl">
                Expert strategies on SEO, conversion optimization, content marketing, and more. Practical guides and tactics for service businesses and brands.
              </p>

              {/* Topic pills */}
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-neutral-600">Browse by topic:</span>
                <Link
                  href="/blog"
                  className="inline-flex items-center rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  All
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/blog/category/${cat.slug}`}
                    className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-orange-400 hover:text-orange-600"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {/* Social + RSS */}
              <div className="mt-8 flex items-center gap-4 border-t border-neutral-200 pt-8">
                <span className="text-sm font-medium text-neutral-600">Follow:</span>
                <div className="flex gap-2">
                  <a
                    href="https://twitter.com/kolavistudio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-orange-500 hover:text-white"
                    aria-label="Twitter"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://linkedin.com/company/kolavi-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-orange-500 hover:text-white"
                    aria-label="LinkedIn"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                  <a
                    href="/blog/rss.xml"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-orange-500 hover:text-white"
                    aria-label="RSS"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured article */}
      {featuredPost && (
        <section className="border-b border-neutral-200 bg-neutral-50/50 py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-orange-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Featured
                </h2>
              </div>

              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-xl"
              >
                <article className="grid gap-0 md:grid-cols-2">
                  {featuredPost.featuredImage && (
                    <div className="relative h-64 md:h-full min-h-[320px]">
                      <Image
                        src={featuredPost.featuredImage.node.sourceUrl}
                        alt={featuredPost.featuredImage.node.altText || featuredPost.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-8 lg:p-12">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {featuredPost.categories?.nodes?.[0] && (
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                          {featuredPost.categories.nodes[0].name}
                        </span>
                      )}
                      <time className="font-medium text-neutral-500">
                        {new Date(featuredPost.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                      {featuredPost.content && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <span className="text-neutral-500">
                            {calculateReadingTime(featuredPost.content)} min read
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-4 text-2xl font-bold text-neutral-900 transition-colors group-hover:text-orange-600 sm:text-3xl lg:text-4xl">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-4 text-lg leading-relaxed text-neutral-600">
                      {stripHtml(featuredPost.excerpt)}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-gap group-hover:gap-3">
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

      {/* Latest – 3-card grid */}
      {latestPosts.length > 0 && (
        <section className="border-b border-neutral-200 bg-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-neutral-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  Latest
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latestPosts.map((post, index) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <article className="h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:shadow-lg">
                      {post.featuredImage && (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading={index < 3 ? "eager" : "lazy"}
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <time className="font-medium uppercase tracking-wide text-neutral-500">
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                          {post.categories?.nodes?.[0] && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="font-medium text-orange-600">
                                {post.categories.nodes[0].name}
                              </span>
                            </>
                          )}
                          {post.content && (
                            <>
                              <span className="text-neutral-300">·</span>
                              <span className="text-neutral-500">
                                {calculateReadingTime(post.content)} min read
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-3 line-clamp-2 text-xl font-bold text-neutral-900 transition-colors group-hover:text-orange-600">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-600">
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

      {/* Browse by topic – category cards */}
      <section className="border-b border-neutral-200 bg-neutral-50/50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center gap-2">
              <div className="h-1 w-8 rounded-full bg-neutral-300" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Browse by topic
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BLOG_TOPICS.map((topic) => {
                const count = getCategoryPostCount(topic.slug);
                return (
                  <Link
                    key={topic.slug}
                    href={`/blog/category/${topic.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
                  >
                    <div
                      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${topic.color} text-2xl shadow-md transition-transform group-hover:scale-105`}
                    >
                      {topic.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-neutral-900 group-hover:text-orange-600 transition-colors">
                        {topic.name}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        {count} article{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* More articles – list (if any) */}
      {morePosts.length > 0 && (
        <section className="border-b border-neutral-200 bg-white py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              <div className="mb-8 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full bg-neutral-300" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  More articles
                </h2>
              </div>

              <ul className="space-y-6" role="list">
                {morePosts.map((post) => (
                  <li key={post.id}>
                    <article>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-orange-200 hover:shadow-md sm:flex-row"
                      >
                      {post.featuredImage && (
                        <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-44">
                          <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 176px"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                          <time>
                            {new Date(post.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </time>
                          {post.categories?.nodes?.[0] && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-orange-600">
                                {post.categories.nodes[0].name}
                              </span>
                            </>
                          )}
                          {post.content && (
                            <>
                              <span>·</span>
                              <span>{calculateReadingTime(post.content)} min read</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-neutral-900 transition-colors group-hover:text-orange-600 line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                          {stripHtml(post.excerpt)}
                        </p>
                      </div>
                        <span className="flex items-center gap-1 text-sm font-semibold text-orange-600 self-start sm:self-center">
                          Read
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 py-20 text-center">
              <h2 className="text-2xl font-bold text-neutral-900">No articles yet</h2>
              <p className="mt-4 text-neutral-600">
                We're preparing expert content on digital marketing, SEO, and business growth. Check back soon.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-8 sm:p-10 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-2xl text-white">
                ✉️
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                Get the latest insights
              </h2>
              <p className="mt-3 text-lg text-neutral-600">
                Digital marketing tips, SEO strategies, and growth tactics delivered to your inbox.
              </p>
              <div className="mt-8">
                <BlogSubscribe />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Ready to grow your business?
            </h2>
            <p className="mt-4 text-lg text-neutral-600">
              We help medical spas, service businesses, and brands win online with SEO, design, and strategy.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-neutral-300 bg-white px-8 py-3 font-semibold text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
