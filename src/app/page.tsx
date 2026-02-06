import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Benefits } from "@/components/sections/Benefits";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";

export const metadata = getPageMetadata({
  title: "Digital Marketing Agency for Medical Spas, Dental & Law Firms",
  description: "Kolavi Studio helps businesses grow with expert digital marketing, web design, and SEO services. Specializing in medical spas, dental practices, and law firms.",
  path: "/",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "digital marketing agency, medical spa marketing, dental practice SEO, law firm marketing, web design, SEO services, business growth",
});

export default function HomePage() {
  return (
    <main>
      {/* Hero – same rounded rectangle as dashboard */}
      <section className="relative px-4 pt-8 pb-12 sm:px-6 sm:pt-10 sm:pb-14 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30 shadow-sm px-6 py-12 sm:px-8 sm:py-16 lg:py-20">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="relative mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Transform Your Business with{" "}
                <span className="bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                  Expert Digital Marketing
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                We help medical spas, dental practices, and law firms grow their online presence and attract more clients through strategic digital marketing and stunning web design.
              </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-2xl bg-primary px-8 font-semibold hover:bg-primary/90">
                <Link href="/contact">Schedule a Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl border border-border px-8 font-semibold">
                <Link href="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Industries strip: who we serve */}
      <section className="border-b border-border bg-muted/30 py-10 sm:py-12" aria-labelledby="industries-strip-heading">
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
              <Button asChild size="lg" className="rounded-2xl bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl border border-border px-8 font-semibold">
                <Link href="/services">Our Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}