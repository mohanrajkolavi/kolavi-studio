import Link from "next/link";
import { headers } from "next/headers";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getPosts, getCategoriesFromPosts } from "@/lib/blog/data";
import { stripHtml } from "@/lib/blog/utils";
import { BlogSubscribe } from "@/components/blog/BlogSubscribe";
import { BlogContent } from "@/components/blog/BlogContent";
import { SITE_URL, SEO } from "@/lib/constants";

export const revalidate = 60;

const blogPageMetadata = getPageMetadata({
  title: "Blog & Resources – Digital Marketing Insights | Kolavi Studio",
  description:
    "Expert strategies on SEO, conversion optimization, content marketing, and business growth. Proven tactics and actionable guides for medical spas, service businesses, and brands.",
  path: "/blog",
  keywords:
    "digital marketing blog, SEO tips, conversion optimization, content marketing, medical spa marketing, local SEO, web design, business growth",
});

export const metadata = {
  ...blogPageMetadata,
  alternates: {
    ...blogPageMetadata.alternates,
    types: {
      "application/rss+xml": `${SITE_URL}/blog/rss`,
    },
  },
};

export default async function BlogPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const rawPosts = await getPosts();
  const posts = [...rawPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const categories = getCategoriesFromPosts(posts);
  const firstPost = posts[0];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
    ],
  };

  const blogImage =
    firstPost?.featuredImage?.node?.sourceUrl?.startsWith("http") === true
      ? firstPost.featuredImage.node.sourceUrl
      : `${SITE_URL}/og-image.jpg`;

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Kolavi Studio Blog",
    description: "Digital marketing insights, SEO strategies, and business growth resources.",
    url: `${SITE_URL}/blog`,
    image: blogImage,
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
      description: stripHtml(post.excerpt || "").slice(0, SEO.META_DESCRIPTION_MAX_CHARS),
    })),
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        nonce={nonce}
      />

      <main>
      {/* Hero - minimal, aligned with dashboard */}
      <section className="border-b border-border bg-background py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Blog & Resources
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Digital Marketing Insights
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              SEO strategies, conversion optimization, and growth tactics for medical spas, service businesses, and brands.
            </p>
            {/* Stats - inline, minimal */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-1">
              <span className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tabular-nums text-foreground">{posts.length}</span>
                <span className="text-sm text-muted-foreground">articles</span>
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="text-xl font-semibold tabular-nums text-foreground">{categories.length}</span>
                <span className="text-sm text-muted-foreground">topics</span>
              </span>
            </div>
            {/* Newsletter + Social */}
            <div className="mt-10 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-8">
              <div className="w-full max-w-sm">
                <BlogSubscribe />
              </div>
              <div className="flex items-center gap-2">
                <a href="https://twitter.com/kolavistudio" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z" /></svg>
                </a>
                <a href="https://linkedin.com/company/kolavi-studio" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="LinkedIn">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <Link href="/blog/rss" className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="RSS">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" /></svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BlogContent posts={posts} categories={categories} />

      {/* Empty state (only when no posts at all) */}
      {posts.length === 0 && (
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl rounded-xl border border-dashed border-border bg-muted/30 py-16 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                No articles yet
              </p>
              <p className="mt-2 text-foreground">
                We're preparing expert content on digital marketing, SEO, and business growth. Check back soon.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA */}
      <section className="border-b border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl rounded-xl border border-border bg-card px-6 py-8 sm:px-8 sm:py-10 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Newsletter
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground sm:text-2xl">
              Get the latest insights
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Digital marketing tips, SEO strategies, and growth tactics.
            </p>
            <div className="mt-6">
              <BlogSubscribe />
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-background py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Ready to grow?
            </p>
            <p className="mt-2 text-lg text-foreground">
              We help medical spas, service businesses, and brands win online.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-6 py-2.5 font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Get in Touch
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-2.5 font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
