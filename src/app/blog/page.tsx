import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getPosts, getCategoriesFromPosts } from "@/lib/blog/data";
import { stripHtml } from "@/lib/blog/utils";
import { BlogSubscribe } from "@/components/blog/BlogSubscribe";
import { BlogContent } from "@/components/blog/BlogContent";
import { SITE_URL } from "@/lib/constants";

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
      description: stripHtml(post.excerpt || "").slice(0, 160),
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

      <main>
      {/* Hero - Inspired by Flair but enhanced */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        
        <div className="relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Centered content with max-width */}
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              {/* Main heading */}
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Kolavi Studio{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Blog
                </span>
                {" "}& Resources
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Discover the latest insights, guides and tutorials on digital marketing, SEO, and business growth. Learn best practices that drive real results.
              </p>

              {/* Newsletter subscribe - prominent placement */}
              <div className="mt-10">
                <BlogSubscribe />
              </div>

              {/* Stats + Social */}
              <div className="mt-14 inline-flex flex-col items-center gap-6 rounded-2xl bg-card px-8 py-6 shadow-sm ring-1 ring-border sm:flex-row sm:gap-10">
                <div className="flex items-center gap-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-foreground">{posts.length}</span>
                    <span className="text-sm text-muted-foreground">articles</span>
                  </div>
                  <div className="h-4 w-px bg-border" aria-hidden />
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tabular-nums text-foreground">{categories.length}</span>
                    <span className="text-sm text-muted-foreground">topics</span>
                  </div>
                  <div className="h-4 w-px bg-border" aria-hidden />
                  <span className="text-sm text-muted-foreground">New every week</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">5,000+ readers</span>
                  <div className="flex gap-1.5">
                    <a href="https://twitter.com/kolavistudio" target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-orange-600 dark:hover:text-orange-400" aria-label="Twitter">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                    <a href="https://linkedin.com/company/kolavi-studio" target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-orange-600 dark:hover:text-orange-400" aria-label="LinkedIn">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                    </a>
                    <a href="/blog/rss.xml" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-orange-600 dark:hover:text-orange-400" aria-label="RSS">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" /></svg>
                    </a>
                  </div>
                </div>
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
            <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-border bg-muted/50 py-20 text-center">
              <h2 className="text-2xl font-bold text-foreground">No articles yet</h2>
              <p className="mt-4 text-muted-foreground">
                We're preparing expert content on digital marketing, SEO, and business growth. Check back soon.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter CTA - two-tone dark design in dark mode */}
      <section className="border-b border-border bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-transparent dark:shadow-none">
              {/* Top section: light gradient / dark warm brown-gray */}
              <div className="border-b border-border bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 px-8 py-10 sm:px-12 sm:py-12 text-center dark:border-white/10 dark:bg-[#3a2f2b] dark:from-transparent dark:via-transparent dark:to-transparent">
                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-white">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl dark:text-white">
                  Get the latest insights
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg dark:text-neutral-400">
                  Digital marketing tips, SEO strategies, and growth tactics delivered to your inbox.
                </p>
              </div>
              {/* Bottom section: light card / dark cooler gray */}
              <div className="px-8 py-10 sm:px-12 sm:pb-12 dark:bg-[#27282d]">
                <BlogSubscribe />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to grow your business?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
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
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-8 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
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
