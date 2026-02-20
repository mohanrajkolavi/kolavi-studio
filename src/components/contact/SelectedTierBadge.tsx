"use client";

import { useSearchParams } from "next/navigation";
import type { TierId } from "@/lib/constants/pricing";
import { TIER_SUMMARIES } from "@/lib/constants/pricing";

const VALID_TIERS: TierId[] = ["visibility", "growth", "dominance"];

function isValidTier(tier: string | null): tier is TierId {
  return tier !== null && VALID_TIERS.includes(tier as TierId);
}

export function SelectedTierBadge() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier");

  if (!isValidTier(tierParam)) return null;

  const tier = TIER_SUMMARIES.find((t) => t.id === tierParam);
  if (!tier) return null;

  return (
    <div
      className="mb-6 rounded-xl border border-orange-200 bg-orange-50/80 px-4 py-3 dark:border-orange-800 dark:bg-orange-950/40"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-foreground">
        You selected: <span className="font-semibold text-orange-700 dark:text-orange-300">{tier.name}</span> tier
        <span className="text-muted-foreground"> (${tier.setupFee.toLocaleString()} setup + ${tier.monthlyRetainer.toLocaleString()}/mo)</span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        We&apos;ll follow up with details for this tier.
      </p>
    </div>
  );
}
