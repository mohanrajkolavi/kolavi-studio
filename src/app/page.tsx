import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Benefits } from "@/components/sections/Benefits";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { getPageMetadata } from "@/lib/seo/metadata";

export const metadata = getPageMetadata({
  title: "Digital Marketing Agency for Medical Spas, Dental & Law Firms",
  description: "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.",
  path: "/",
  keywords:
    "digital marketing agency, medical spa marketing, dental practice SEO, law firm marketing, web design, SEO services, business growth",
});

export default function HomePage() {
  return (
    <main>
      {/* Hero (premium: gradient accent, no clipping) */}
      <section className="relative border-b border-border bg-background">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Transform Your Business with{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Expert Digital Marketing
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                We help medical spas, dental practices, and law firms grow their online presence and attract more clients through strategic digital marketing and stunning web design.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                  <Link href="/contact">Schedule a Consultation</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-2 px-8 font-semibold">
                  <Link href="/portfolio">View Our Work</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries strip: who we serve */}
      <section className="border-b border-border bg-muted/20 py-10 sm:py-12" aria-labelledby="industries-strip-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:gap-8 sm:text-left">
            <div className="min-w-0">
              <h2 id="industries-strip-heading" className="text-xl font-semibold text-foreground sm:text-2xl">
                Built for your industry
              </h2>
              <p className="mt-2 text-muted-foreground">
                We specialize in medical spas, dental practices, and law firms. Strategies that fit your market.
              </p>
            </div>
            <Link
              href="/industries"
              className="shrink-0 text-sm font-semibold text-orange-600 underline-offset-4 hover:underline dark:text-orange-400"
            >
              Who we serve
            </Link>
          </div>
        </div>
      </section>

      <Benefits
        title="Why Choose Kolavi Studio"
        sectionLabel="Why Choose Kolavi Studio"
      />

      <Process
        title="Our Process"
        sectionLabel="Our Process"
      />

      <Testimonials
        title="What Our Clients Say"
        sectionLabel="What Our Clients Say"
      />

      {/* Bottom CTA (light strip, match About / Services / Industries) */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to grow your business?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Let&apos;s create a digital strategy that drives real results. Get in touch for a free consultation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                <Link href="/contact">Get in Touch</Link>
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