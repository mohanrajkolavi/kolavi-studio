"use client";

import { DISCOUNTS, MONTHLY_ADDONS, ONE_TIME_PROJECTS } from "@/lib/constants/pricing";

export function PricingExtras() {
  return (
    <section
      className="relative z-10 bg-background py-24 sm:py-32"
      aria-labelledby="extras-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-reveal">
          <span className="text-label text-primary mb-6 block">Extensions</span>
          <h2 id="extras-heading" className="text-h2 text-foreground mb-6">
            Add-ons & One-Time Projects
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            Extend your tier with custom capabilities or take advantage of our multi-location and annual billing discounts.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 animate-reveal" style={{ animationDelay: "100ms" }}>
          
          <div className="rounded-[32px] border border-border p-8 bg-card shadow-sm">
            <h3 className="text-h4 text-foreground mb-8">Monthly Add-ons</h3>
            <ul className="space-y-6">
              {MONTHLY_ADDONS.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between border-b border-border/50 pb-6 last:border-0 last:pb-0"
                >
                  <span className="text-body text-foreground font-medium">{row.name}</span>
                  <span className="text-body text-muted-foreground">{row.price}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[32px] border border-border p-8 bg-card shadow-sm">
            <h3 className="text-h4 text-foreground mb-8">One-Time Projects</h3>
            <ul className="space-y-6">
              {ONE_TIME_PROJECTS.map((row) => (
                <li
                  key={row.name}
                  className="flex items-center justify-between border-b border-border/50 pb-6 last:border-0 last:pb-0"
                >
                  <span className="text-body text-foreground font-medium">{row.name}</span>
                  <span className="text-body text-muted-foreground">{row.price}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-[32px] border border-primary/20 bg-primary/5 p-8 shadow-sm animate-reveal" style={{ animationDelay: "200ms" }}>
          <h3 className="text-h4 text-foreground mb-8 text-center">Discounts Available</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {DISCOUNTS.map((d) => (
              <li key={d.name} className="flex flex-col text-center sm:text-left">
                <span className="text-body font-bold text-foreground mb-2">{d.name}</span>
                <span className="text-h4 text-primary mb-2">{d.amount}</span>
                <span className="text-small text-muted-foreground">{d.notes}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
