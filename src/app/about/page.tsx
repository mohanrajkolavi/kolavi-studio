import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPageMetadata } from "@/lib/seo/metadata";
import {
  Target,
  TrendingUp,
  MessageSquare,
  Handshake,
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "About Us - Digital Marketing Experts",
  description: "Learn about Kolavi Studio, our mission to help businesses grow through strategic digital marketing, and the team behind our success.",
  path: "/about",
  keywords: "digital marketing agency, about Kolavi Studio, marketing team, business growth experts",
});

const whyUsItems = [
  {
    icon: <Target className="h-8 w-8" />,
    title: "Industry Expertise",
    description:
      "We specialize in serving specific industries, giving us unique insights into what works and what doesn't in your market.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Proven Results",
    description:
      "Our track record speaks for itself. We've helped dozens of businesses achieve significant growth through strategic digital marketing.",
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: "Transparent Communication",
    description:
      "You'll always know what we're working on, why we're doing it, and what results to expect. No surprises, just clear communication.",
  },
  {
    icon: <Handshake className="h-8 w-8" />,
    title: "Long-Term Partnership",
    description:
      "We're not interested in quick wins. We build lasting relationships and continuously optimize to ensure your sustained success.",
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* Hero (match Who We Serve / Services) */}
      <section className="relative border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                About{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Kolavi Studio
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                We're a digital marketing agency on a mission to help businesses thrive in the digital age. With a focus on medical spas, dental practices, and law firms, we combine industry expertise with cutting-edge marketing strategies to deliver exceptional results.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="rounded-full bg-orange-600 px-8 font-semibold hover:bg-orange-700">
                  <Link href="/contact">Get in Touch</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-2 px-8 font-semibold">
                  <Link href="/services">Our Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="story-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <h2 id="story-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                Our Story
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                Kolavi Studio was founded with a simple belief: every business deserves a digital presence that truly represents their brand and drives real results. Too many agencies promise the world but deliver generic, cookie-cutter solutions that don't move the needle.
              </p>
              <p>
                We took a different approach. By specializing in specific industries, starting with medical spas, we developed deep expertise in what actually works. We understand the unique challenges, regulations, and opportunities in each market we serve.
              </p>
              <p>
                Today, we're proud to partner with businesses across the country, helping them attract more clients, increase revenue, and build brands that stand out in competitive markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="border-b border-border bg-muted/20 py-14 sm:py-20" aria-labelledby="approach-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <h2 id="approach-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                Our Approach
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>
                We believe in transparency, data-driven decisions, and building long-term partnerships. Our approach combines strategic thinking with hands-on execution, ensuring every campaign is optimized for maximum ROI.
              </p>
              <p>
                Whether it's SEO, web design, content marketing, or paid advertising, we focus on what matters most: driving real business results. No vanity metrics, no fluff. Just strategies that work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="why-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <h2 id="why-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
                Why Work With Us
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {whyUsItems.map((item) => (
                <Card
                  key={item.title}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-white">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA (light strip, match Services / Industries) */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to work together?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Partner with a team that's committed to your success. Get in touch today.
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
