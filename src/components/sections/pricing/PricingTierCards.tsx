"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  TIER_SUMMARIES,
  getYearlyMonthlyEquivalent,
  type TierId,
} from "@/lib/constants/pricing";

export interface PricingTierCardsProps {
  variant: "home" | "glance";
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export function PricingTierCards({
  variant,
  sectionTitle,
  sectionSubtitle,
}: PricingTierCardsProps) {
  return (
    <section className="relative z-10 bg-background py-24 sm:py-32" aria-label="Pricing tiers">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {TIER_SUMMARIES.map((tier, index) => (
            <TierCard key={tier.id} tierId={tier.id} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({
  tierId,
  index,
}: {
  tierId: TierId;
  index: number;
}) {
  const tier = TIER_SUMMARIES.find((t) => t.id === tierId);
  if (!tier) return null;
  const yearlyMonthly = getYearlyMonthlyEquivalent(tier.monthlyRetainer);
  const isPopular = tier.id === "growth";

  return (
    <article
      className={`relative flex flex-col p-10 rounded-[32px] transition-all animate-reveal ${
        isPopular
          ? "bg-muted/50 border border-primary/20 shadow-premium"
          : "bg-transparent border border-border hover:border-muted-foreground/30"
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      aria-labelledby={`tier-${tierId}-name`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-[48px] bg-primary text-primary-foreground text-label shadow-lg">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 id={`tier-${tierId}-name`} className="text-h3 text-foreground mb-4">
          {tier.name}
        </h3>
        <div className="text-h4 text-foreground mb-2 font-bold">
          ${tier.monthlyRetainer.toLocaleString()}/mo
        </div>
        <div className="text-small text-muted-foreground mb-4">
          +${tier.setupFee.toLocaleString()} setup fee
          <br/>
          <span className="text-xs opacity-75">(${yearlyMonthly.toLocaleString()}/mo billed annually)</span>
        </div>
        <p className="text-small text-muted-foreground min-h-[48px]">
          {tier.bestFor}
        </p>
      </div>

      <div className="mb-12 flex-1">
        <ul className="space-y-4">
          {tier.deliverables.map((d) => (
            <li key={d} className="flex items-start">
              <Check className="h-5 w-5 text-primary shrink-0 mr-4 mt-0.5" aria-hidden />
              <span className="text-small text-foreground">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button
        asChild
        size="lg"
        variant={isPopular ? "default" : "outline"}
        className={`w-full h-14 rounded-[48px] text-button ${
          isPopular
            ? "bg-primary text-primary-foreground shadow-premium hover:bg-primary/90"
            : "bg-transparent hover:bg-muted"
        }`}
      >
        <Link href={`/contact?tier=${tierId}`}>
          Apply Now
        </Link>
      </Button>
    </article>
  );
}
