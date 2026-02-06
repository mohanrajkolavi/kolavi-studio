import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VERTICAL_LINKS, SITE_URL } from "@/lib/constants";
import { getPageMetadata } from "@/lib/seo/metadata";
import { ArrowRight, HeartPulse, Scale, Smile } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Who We Serve - Industries We Specialize In",
  description: "Kolavi Studio helps medical spas, dental practices, and law firms grow with expert digital marketing, web design, and SEO services tailored to your industry.",
  path: "/industries",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "medical spa marketing, dental practice marketing, law firm marketing, industry-specific digital marketing",
});

const INDUSTRY_CONFIG: Record<
  string,
  { icon: React.ReactNode; tagline: string; description: string }
> = {
  "Medical Spas": {
    icon: <HeartPulse className="h-10 w-10" />,
    tagline: "Attract clients, increase bookings",
    description:
      "Strategic digital marketing and premium web design for med spas. Build trust, showcase results, and stand out in a competitive market.",
  },
  "Dental Practices": {
    icon: <Smile className="h-10 w-10" />,
    tagline: "Grow your practice online",
    description:
      "Targeted SEO and conversion-focused websites for dental practices. Reach more patients and fill your chair with qualified leads.",
  },
  "Law Firms": {
    icon: <Scale className="h-10 w-10" />,
    tagline: "Establish authority, generate leads",
    description:
      "Professional positioning and lead-generation strategies for law firms. Build credibility and attract clients who need your expertise.",
  },
};

export default function IndustriesPage() {
  return (
    <main>
      {/* Hero (match Blog index) */}
      <section className="relative border-b border-border bg-background">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Who We{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Serve
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                We specialize in industries where trust, expertise, and digital presence matter most. Our strategies are tailored to the unique challenges and opportunities of each sector.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                  <Link href="/contact">
                    Schedule a Consultation
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-2 px-8 font-semibold">
                  <Link href="/portfolio">View Our Work</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value line – subtle strip */}
      <section className="border-b border-border bg-muted/30 py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-lg text-muted-foreground">
              Generic marketing rarely works. We focus on a few verticals so we can deliver strategies that actually move the needle for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Industries grid (Blog-level cards) */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="industries-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <h2 id="industries-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                Industries We Serve
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VERTICAL_LINKS.map((vertical) => {
                const config = INDUSTRY_CONFIG[vertical.name] ?? {
                  icon: null,
                  tagline: "Industry-specific strategies",
                  description:
                    "Grow your business with digital marketing tailored to your sector.",
                };
                const isAvailable = vertical.available;

                return (
                  <Card
                    key={vertical.href}
                    className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 ${
                      isAvailable
                        ? "hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                        : "border-border/60 bg-muted/50 opacity-90"
                    }`}
                  >
                    <CardHeader>
                      <div
                        className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                          isAvailable
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {config.icon}
                      </div>
                      <CardTitle className="text-xl">{vertical.name}</CardTitle>
                      <CardDescription className="text-sm font-medium text-muted-foreground">
                        {config.tagline}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {config.description}
                      </p>
                      {isAvailable ? (
                        <Link
                          href={vertical.href}
                          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-all group-hover:gap-3 dark:text-orange-400"
                        >
                          Explore
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      ) : (
                        <span className="mt-6 inline-block rounded-full border border-border bg-muted/80 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA – match Blog */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Don&apos;t see your industry?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We&apos;re always expanding. Get in touch; we&apos;d love to hear about your business and explore how we can help.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                <Link href="/contact">
                  Get in Touch
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-2 px-8 font-semibold">
                <Link href="/services">Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
