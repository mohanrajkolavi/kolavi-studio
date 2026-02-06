import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Benefits } from "@/components/sections/Benefits";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";
import {
  Search,
  Globe,
  PenTool,
  BarChart,
  Megaphone,
  Code,
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "Our Services - Digital Marketing & Web Design",
  description: "Comprehensive digital marketing services including SEO, web design, content marketing, PPC advertising, and more. Tailored solutions for your business growth.",
  path: "/services",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "SEO services, web design, content marketing, PPC advertising, digital marketing services, business growth",
});

const services = [
  {
    icon: <Search className="h-8 w-8" />,
    title: "Search Engine Optimization",
    description:
      "Improve your search rankings and drive organic traffic with technical SEO, on-page optimization, and strategic link building.",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Web Design & Development",
    description:
      "Beautiful, mobile-first websites that convert visitors into customers. Built for performance and optimized for search engines.",
  },
  {
    icon: <PenTool className="h-8 w-8" />,
    title: "Content Marketing",
    description:
      "Engage your audience with high-quality content that educates, builds trust, and drives conversions.",
  },
  {
    icon: <BarChart className="h-8 w-8" />,
    title: "Analytics & Reporting",
    description:
      "Data-driven insights to measure performance, identify opportunities, and optimize your marketing ROI.",
  },
  {
    icon: <Megaphone className="h-8 w-8" />,
    title: "Pay-Per-Click Advertising",
    description:
      "Targeted PPC campaigns on Google Ads and social media platforms to drive immediate results and qualified leads.",
  },
  {
    icon: <Code className="h-8 w-8" />,
    title: "Technical SEO",
    description:
      "Optimize your website's technical foundation for better crawlability, indexing, and Core Web Vitals performance.",
  },
];

const whyUsBenefits = [
  {
    icon: <BarChart className="h-8 w-8" />,
    title: "Strategy to Execution",
    description: "From planning to launch, we own the full journey. No handoffs, no gaps.",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Industry-Specific",
    description: "We tailor every tactic to your vertical so campaigns actually convert.",
  },
  {
    icon: <Search className="h-8 w-8" />,
    title: "Results You Can Measure",
    description: "Clear reporting and KPIs so you always know what's working.",
  },
  {
    icon: <PenTool className="h-8 w-8" />,
    title: "Long-Term Partnership",
    description: "We optimize continuously so your growth doesn't stop after launch.",
  },
];

export default function ServicesPage() {
  return (
    <main>
      {/* Hero (match Blog index) */}
      <section className="relative border-b border-border bg-background">
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Our{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Services
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                From strategy to execution, we deliver digital marketing and web design that drives real growth. SEO, paid ads, content, and analytics, all tailored to your industry.
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

      {/* What we do: section label + grid */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="what-we-do-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <h2 id="what-we-do-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                What We Do
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-lg text-muted-foreground">
              Full-spectrum digital marketing so you can focus on running your business.
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Card
                  key={service.title}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                >
                  <CardHeader>
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-white">
                      {service.icon}
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-base leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Benefits
        title="Why work with us"
        sectionLabel="Why work with us"
        benefits={whyUsBenefits}
      />

      {/* Tailored for your industry: single cross-link, no duplicate CTA */}
      <section className="border-b border-border bg-muted/20 py-10 sm:py-12" aria-labelledby="tailored-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:gap-8 sm:text-left">
            <div className="min-w-0">
              <h2 id="tailored-heading" className="text-xl font-semibold text-foreground sm:text-2xl">
                Tailored for your industry
              </h2>
              <p className="mt-2 text-muted-foreground">
                We specialize in medical spas, dental practices, and law firms so your strategy fits your market.
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

      {/* Primary CTA: one clear action block */}
      <section className="border-t border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="cta-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to grow your business?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Let&apos;s discuss your project. Get in touch for a free consultation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-2 px-8 font-semibold">
                <Link href="/industries">Who We Serve</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
