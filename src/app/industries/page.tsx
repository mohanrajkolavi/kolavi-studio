import Link from "next/link";
import { VERTICAL_LINKS } from "@/lib/constants";
import { getPageMetadata } from "@/lib/seo/metadata";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Who We Serve - Industries We Specialize In",
  description: "Kolavi Studio helps medical spas, dental practices, and law firms grow with expert digital marketing, web design, and SEO services tailored to your industry.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Who We Serve
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              We specialize in industries where trust, expertise, and digital presence matter most. Our strategies are tailored to the unique challenges and opportunities of each sector.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16 sm:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VERTICAL_LINKS.map((vertical) => (
              <div
                key={vertical.href}
                className={`group relative overflow-hidden rounded-2xl border ${
                  vertical.available
                    ? "border-border bg-card shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-card"
                    : "border-border/60 bg-muted/80 opacity-75 dark:border-border/60 dark:bg-muted/50"
                }`}
              >
                <div className="p-8">
                  {vertical.available ? (
                    <Link href={vertical.href} className="block">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                        <h2 className="text-xl font-semibold text-foreground group-hover:text-muted-foreground">
                          {vertical.name}
                        </h2>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Grow your business with industry-specific digital marketing strategies.
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:gap-2 transition-all">
                        Explore
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-muted-foreground/60" />
                        <h2 className="text-xl font-semibold text-muted-foreground">
                          {vertical.name}
                        </h2>
                      </div>
                      <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Coming Soon
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30 py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-muted-foreground">
            Don&apos;t see your industry?{" "}
            <Link href="/contact" className="font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground">
              Get in touch
            </Link>
            {" "}—we&apos;re always expanding.
          </p>
        </div>
      </section>
    </>
  );
}
