import Link from "next/link";
import { headers } from "next/headers";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPosts, getTagsFromPosts } from "@/lib/blog/data";

export const revalidate = 60;

export const metadata = getPageMetadata({
  title: "Blog Tags | Kolavi Studio",
  description: "Browse all blog tags and find posts by specific topics.",
  path: "/blog/tag",
  keywords: "blog tags, digital marketing tags, Kolavi Studio blog",
});

export default async function BlogTagIndexPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const posts = await getPosts();
  const tags = getTagsFromPosts(posts)
    .map((tag) => ({
      ...tag,
      count: posts.filter((post) =>
        post.tags?.nodes?.some((t) => t.slug === tag.slug)
      ).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Tag", url: "/blog/tag" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        nonce={nonce}
      />
      <main>
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
                <span>/</span>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Blog
                </Link>
                <span>/</span>
                <span className="font-medium text-foreground">Tag</span>
              </nav>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Blog Tags
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Discover posts by tag and dive into the topics that matter most.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              {tags.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/blog/tag/${tag.slug}`}
                      className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                    >
                      <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {tag.name}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {tag.count} article{tag.count === 1 ? "" : "s"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/50 py-16 text-center">
                  <p className="text-lg font-medium text-foreground">
                    No tags available yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
