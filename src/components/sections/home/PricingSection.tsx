"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Visibility",
    price: "$1,299/mo",
    setup: "+ $2,599 setup",
    description: "Best for: New or small single-location med spas",
    features: [
      "Custom Next.js website",
      "8 pages/mo on-page SEO",
      "6 blog posts/mo",
      "Basic lead gen funnel",
      "Basic automation",
      "Reputation management",
      "Real-time dashboard",
      "Shared account manager",
    ],
  },
  {
    name: "Growth",
    price: "$1,699/mo",
    setup: "+ $3,599 setup",
    description: "Best for: Established spas ready to dominate their city",
    isPopular: true,
    features: [
      "Everything in Visibility plus",
      "Unlimited on-page SEO",
      "Programmatic SEO",
      "16 blog posts/mo",
      "Google Ads management",
      "AI chatbot",
      "Full automation & GLP-1 funnel",
      "CRO testing & Strategy call",
    ],
  },
  {
    name: "Dominance",
    price: "$2,499/mo",
    setup: "+ $5,599 setup",
    description: "Best for: Multi-location, $2M+ revenue, PE-backed groups",
    features: [
      "Everything in Growth plus",
      "30 blog posts/mo & Video editing",
      "Meta Ads",
      "Membership upsell automation",
      "Micro-influencer matching",
      "Virtual consultation setup",
      "1:1 Account manager",
      "Founder access",
    ],
  },
];

export function PricingSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-24 sm:py-32"
      id="pricing"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-20 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="text-label text-primary mb-6 block">Pricing</span>
          <h2 className="text-h2 text-foreground mb-6">
            Transparent Investment
          </h2>
          <p className="text-body text-muted-foreground">
            Elite engineering meets aggressive patient acquisition. We never bill for hours. We bill for complete domination of your local market.
          </p>
        </div>

        {/* Generous gap for premium feel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {plans.map((plan, index) => {
            const separatorIndex = plan.description.indexOf(': ');
            const descriptionLabel = separatorIndex !== -1 
              ? plan.description.substring(0, separatorIndex + 1)
              : plan.description;
            const descriptionValue = separatorIndex !== -1 
              ? plan.description.substring(separatorIndex + 2)
              : '';

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col p-10 rounded-[32px] transition-all duration-300 ${
                  plan.isPopular
                    ? "bg-card border-2 border-primary shadow-premium lg:scale-105 z-10"
                    : "bg-card border border-border hover:border-muted-foreground/30 shadow-sm"
                } ${isVisible ? "animate-reveal" : "opacity-0"}`}
                style={{
                  animationDelay: isVisible ? `${150 + index * 100}ms` : "0ms",
                }}
              >
                {plan.isPopular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-[48px] bg-primary text-primary-foreground text-label shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-h3 text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-h2 text-foreground font-bold">{plan.price}</span>
                  </div>
                  <div className="text-small text-muted-foreground font-medium mb-4">{plan.setup}</div>
                  <p className="text-body text-muted-foreground min-h-[48px] py-4 border-y border-border/50">
                    <span className="font-semibold text-foreground/80">{descriptionLabel}</span> {descriptionValue}
                  </p>
                </div>

                <div className="mb-12 flex-1">
                  <ul className="space-y-5">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-4">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-small text-muted-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-8 border-t border-border/50">
                  <Button
                    asChild
                    size="lg"
                    variant={plan.isPopular ? "default" : "outline"}
                    className="w-full"
                  >
                    <Link href="/contact">Apply Now</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div 
          className={`flex justify-center ${isVisible ? "animate-reveal" : "opacity-0"}`}
          style={{ animationDelay: isVisible ? "450ms" : "0ms" }}
        >
          <Button
            asChild
            variant="secondary"
            size="default"
          >
            <Link href="/pricing">View Full Pricing Details</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
