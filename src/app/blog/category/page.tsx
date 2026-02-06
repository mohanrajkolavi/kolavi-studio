import Link from "next/link";
import { headers } from "next/headers";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getPosts, getCategoriesFromPosts } from "@/lib/blog/data";

export const revalidate = 60;

export const metadata = getPageMetadata({
  title: "Blog Categories | Kolavi Studio",
  description: "Browse all blog categories and explore topics that matter to your business.",
  path: "/blog/category",
  keywords: "blog categories, digital marketing topics, Kolavi Studio blog",
});

export default async function BlogCategoryIndexPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const posts = await getPosts();
  const categories = getCategoriesFromPosts(posts)
    .map((cat) => ({
      ...cat,
      count: posts.filter((post) =>
        post.categories?.nodes?.some((c) => c.slug === cat.slug)
      ).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Category", url: "/blog/category" },
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
                <span className="font-medium text-foreground">Category</span>
              </nav>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Blog Categories
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                Explore all topics we cover and jump into the category that fits your goals.
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              {categories.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/blog/category/${cat.slug}`}
                      className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                    >
                      <h2 className="text-xl font-semibold text-foreground transition-colors group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {cat.name}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {cat.count} article{cat.count === 1 ? "" : "s"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/50 py-16 text-center">
                  <p className="text-lg font-medium text-foreground">
                    No categories available yet.
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
