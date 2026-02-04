import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Benefits } from "@/components/sections/Benefits";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { getPageMetadata } from "@/lib/seo/metadata";
import { ArrowRight, Target, TrendingUp, Users, Award } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Medical Spa Marketing & Web Design Services",
  description: "Specialized digital marketing and web design services for medical spas. Increase bookings, attract more clients, and grow your med spa business with proven strategies.",
  path: "/medical-spas",
  keywords:
    "medical spa marketing, med spa SEO, medical spa web design, med spa digital marketing",
});

const medSpaBenefits = [
  {
    icon: <Target className="h-8 w-8" />,
    title: "Targeted Marketing",
    description: "Reach your ideal clients with precision-targeted campaigns designed specifically for the medical spa industry.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Increase Bookings",
    description: "Convert more website visitors into paying clients with optimized booking funnels and compelling calls-to-action.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Build Trust",
    description: "Establish credibility with professional branding, testimonials, and before-and-after showcases.",
  },
  {
    icon: <Award className="h-8 w-8" />,
    title: "Stand Out",
    description: "Differentiate your med spa from competitors with unique positioning and premium web design.",
  },
];

export default function MedicalSpasPage() {
  return (
    <main>
      {/* Hero (premium: gradient accent, no clipping) */}
      <section className="relative border-b border-border bg-background">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Grow Your{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Medical Spa
                </span>
                {" "}with Strategic Digital Marketing
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                We specialize in helping medical spas attract more clients, increase bookings, and build a premium brand that stands out in a competitive market.
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

      {/* Why Medical Spas Choose Us */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="why-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden="true" />
              <h2 id="why-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                Why Medical Spas Choose Kolavi Studio
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                The medical spa industry is highly competitive. To succeed, you need more than just great services. You need a strategic digital presence that attracts your ideal clients and converts them into loyal customers.
              </p>
              <p>
                Our team understands the unique challenges of marketing medical spas, from compliance considerations to showcasing results in an authentic way. We create custom strategies that drive real results.
              </p>
            </div>
            <div className="mt-8">
              <Link
                href="/blog/category/medical-spa-marketing"
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 underline-offset-4 hover:underline dark:text-orange-400"
              >
                Read our medical spa marketing insights
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Benefits
        title="What We Deliver for Medical Spas"
        sectionLabel="What We Deliver for Medical Spas"
        benefits={medSpaBenefits}
      />

      <Process
        title="Our Medical Spa Marketing Process"
        sectionLabel="Our Process"
      />

      <Testimonials
        title="What Our Clients Say"
        sectionLabel="What Our Clients Say"
      />

      {/* Bottom CTA (light strip, match other pages) */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to grow your medical spa?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Let&apos;s create a custom marketing strategy that attracts more clients and increases your revenue.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                <Link href="/contact">Get Your Free Consultation</Link>
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