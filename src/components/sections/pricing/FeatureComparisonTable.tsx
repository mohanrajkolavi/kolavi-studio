"use client";

import { FEATURE_COMPARISON_ROWS } from "@/lib/constants/pricing";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_COLUMNS = [
  { id: "visibility" as const, name: "Essential" },
  { id: "growth" as const, name: "Growth", badge: "Popular" },
  { id: "dominance" as const, name: "Enterprise" },
] as const;

type TierColumn = {
  id: "visibility" | "growth" | "dominance";
  name: string;
  badge?: string;
};

function Cell({ value }: { value: string | boolean | number }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-primary" title="Included">
        <Check className="h-5 w-5 shrink-0" aria-hidden />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-muted-foreground/30" title="Not included">
        <Minus className="h-5 w-5 shrink-0" aria-hidden />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return (
    <span className="text-small text-foreground tabular-nums">
      {String(value)}
    </span>
  );
}

export function FeatureComparisonTable() {
  return (
    <section
      className="relative z-10 bg-background py-24 sm:py-32"
      aria-labelledby="feature-table-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-reveal">
          <span className="text-label text-primary mb-6 block">Feature Breakdown</span>
          <h2
            id="feature-table-heading"
            className="text-h2 text-foreground"
          >
            Compare Tiers
          </h2>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-border bg-card shadow-premium animate-reveal" style={{ animationDelay: "100ms" }}>
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-6 px-8 font-semibold text-foreground text-h4">
                  Features
                </th>
                {(TIER_COLUMNS as readonly TierColumn[]).map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    className={cn(
                      "py-6 px-6 text-center font-semibold text-h4 text-foreground border-l border-border",
                      col.badge && "bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      {col.name}
                      {col.badge && (
                        <span className="text-label text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {col.badge}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FEATURE_COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="transition-colors hover:bg-muted/10"
                >
                  <td className="py-5 px-8 text-body text-foreground font-medium">
                    {row.feature}
                  </td>
                  <td className="py-5 px-6 text-center border-l border-border">
                    <Cell value={row.visibility} />
                  </td>
                  <td className="py-5 px-6 text-center border-l border-border bg-primary/5">
                    <Cell value={row.growth} />
                  </td>
                  <td className="py-5 px-6 text-center border-l border-border">
                    <Cell value={row.dominance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
