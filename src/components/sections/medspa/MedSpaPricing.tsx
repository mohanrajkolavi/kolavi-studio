import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const TIERS = [
  {
    name: "Starter",
    price: 1499,
    description: "New med spas (0–12 months) offering 3–5 core treatments",
    coverage: ["Injectable menu", "2–3 additional categories"],
    cta: "Start with Starter",
    href: "/contact?tier=starter",
  },
  {
    name: "Growth",
    price: 2499,
    badge: "Most Popular",
    description: "Established practices (1–3 years) offering 8–12 treatments",
    coverage: ["Complete injectable menu", "Body contouring", "Lasers", "Skin treatments"],
    cta: "Choose Growth",
    href: "/contact?tier=growth",
  },
  {
    name: "Scale",
    price: 3999,
    description: "Multi-provider or multi-location, 12+ treatments, aggressive growth",
    coverage: ["Full-spectrum optimization", "Every treatment", "Every location", "Every patient journey"],
    cta: "Scale Your Practice",
    href: "/contact?tier=scale",
  },
];

export function MedSpaPricing() {
  return (
    <section className="border-t border-border py-20 sm:py-28" aria-labelledby="medspa-pricing-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden="true" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Med Spa Pricing
            </span>
          </div>
          <h2 id="medspa-pricing-heading" className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Built for your practice stage
          </h2>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  tier.badge
                    ? "border-orange-500/50 bg-orange-50/30 shadow-lg dark:border-orange-400/40 dark:bg-orange-950/20"
                    : "border-border bg-background"
                }`}
              >
                {tier.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600">
                    {tier.badge}
                  </Badge>
                )}
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${tier.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{tier.description}</p>
                <p className="mt-3 text-xs font-medium text-orange-600 dark:text-orange-400">
                  Treatment coverage:
                </p>
                <ul className="mt-2 space-y-2">
                  {tier.coverage.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  size="lg"
                  className={`mt-8 w-full rounded-2xl ${tier.badge ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                  variant={tier.badge ? "default" : "outline"}
                >
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
