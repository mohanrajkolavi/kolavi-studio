"use client";

import { Check } from "lucide-react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Marketing",
    price: "$2,499 setup + $999 per month",
    bestFor: "Growing businesses ready to stop losing clients to competitors.",
    features: [
      "Custom Next.js website up to 6 pages, 95+ PageSpeed guaranteed",
      "Local SEO including Google Business Profile management and citation building across 50+ directories",
      "AI-powered SEO",
      "Generative Engine Optimization (GEO)",
      "Social media marketing (1 platform)",
      "8 pages per month on-page optimization",
      "6 SEO blog posts per month",
      "Real-time performance dashboard",
      "Shared account manager",
    ],
    guarantee:
      "No ranking movement in 60 days? We keep working at no extra charge until there is.",
    cta: "Book a Call for Marketing",
    ctaHref: "/contact",
    isPopular: false,
  },
  {
    name: "Growth",
    price: "$3,499 setup + $1,499 per month",
    bestFor: "Established businesses ready to own their local market.",
    features: [
      "Everything in Marketing, plus:",
      "Custom Next.js website up to 12 pages (up from 6)",
      "16 pages per month on-page optimization (up from 8)",
      "16 SEO blog posts per month (up from 6)",
      "AI chatbot for 24/7 lead capture",
      "Lead generation funnel",
      "Automated follow-up sequences",
      "Reputation management and review automation",
      "Monthly strategy call (30 minutes)",
      "Dedicated account manager (up from shared)",
      "2 social media platforms (up from 1)",
    ],
    guarantee:
      "Not seeing measurable lead growth by month 3? We keep working until you do.",
    cta: "Book a Call for Growth",
    ctaHref: "/contact",
    isPopular: true,
  },
  {
    name: "Full System",
    price: "$5,999 setup + $2,499 per month",
    bestFor: "Multi-location operators who want total market ownership.",
    features: [
      "Everything in Growth, plus:",
      "Custom Next.js website up to 18 pages (up from 12)",
      "Up to 30 pages per month on-page optimization (up from 16)",
      "30 SEO blog posts per month (up from 16)",
      "Google and Meta Ads management (ad spend billed directly by client)",
      "Conversion Rate Optimization (CRO) testing",
      "Full automation suite (up from basic)",
      "Video editing for Reels, Shorts, and TikTok (up to 8 videos per month)",
      "4 social media platforms (up from 2)",
      "Monthly strategy call (60 minutes) & quarterly strategy session with founder",
    ],
    guarantee:
      "Miss any agreed deliverable? That month is free. Every deliverable. Every month.",
    cta: "Book a Call for Full System",
    ctaHref: "/contact",
    isPopular: false,
  },
];

export function PricingSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="pricing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 ${isVisible ? "animate-reveal" : "opacity-0"
            }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Investment
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground mb-4 leading-tight tracking-tight">
            Transparent pricing. No retainer shock. No hidden fees.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            We bill for results, not hours. Every tier is a complete system. Not a list of tasks.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-14">
          {tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={`group relative flex flex-col rounded-[32px] border overflow-hidden transition-all duration-500 ${tier.isPopular
                  ? "bg-card border-2 border-primary shadow-premium lg:scale-105 z-10"
                  : "bg-card border-border shadow-premium hover:shadow-xl"
                } ${isVisible ? "animate-reveal" : "opacity-0"}`}
              style={{
                animationDelay: isVisible ? `${120 + index * 80}ms` : "0ms",
              }}
            >
              <div
                className="absolute top-0 right-0 w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none z-0"
                aria-hidden
              />
              <div className="relative z-10 flex flex-col h-full p-7 sm:p-8 lg:p-9">
                <div className="mb-6">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                      {tier.name}
                    </h3>
                    {tier.isPopular && (
                      <span className="inline-flex px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {tier.price}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Best for: {tier.bestFor}
                  </p>
                </div>

                <div className="mb-8 flex-1 min-h-0 overflow-auto">
                  <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider mb-4">
                    Included
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground leading-[1.6]">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-primary font-medium mt-6 leading-snug">
                    Guarantee: {tier.guarantee}
                  </p>
                </div>

                <div className="pt-6 border-t border-border/60 mt-auto shrink-0">
                  <Button
                    asChild
                    size="lg"
                    variant={tier.isPopular ? "default" : "outline"}
                    className="w-full rounded-full shadow-premium"
                  >
                    <Link href={tier.ctaHref}>{tier.cta}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Build */}
        <div
          className={`group relative flex flex-col rounded-[32px] border border-border bg-card shadow-premium overflow-hidden p-8 sm:p-9 lg:p-10 mb-14 sm:mb-16 ${isVisible ? "animate-reveal" : "opacity-0"}`}
          style={{ animationDelay: isVisible ? "400ms" : "0ms" }}
        >
          <div
            className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none z-0"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                Custom Build
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Best for: Businesses that need one specific solution, not the whole engine.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Just need a website? Only want SEO and GEO? Want us to handle your ads or automations
                only? We scope it on a call and build exactly what your business needs.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto shrink-0 rounded-full shadow-premium"
            >
              <Link href="/contact">Book a Custom Scoping Call</Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`text-center space-y-5 ${isVisible ? "animate-reveal" : "opacity-0"}`}
          style={{ animationDelay: isVisible ? "500ms" : "0ms" }}
        >
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Everything we build is yours. Cancel any time with 30 days notice.
          </p>
          <p>
            <Link
              href="/pricing"
              className="inline-flex text-sm font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Need the full breakdown? View Full Pricing
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
