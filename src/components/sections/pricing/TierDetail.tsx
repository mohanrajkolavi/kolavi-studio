import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { TierId } from "@/lib/constants/pricing";
import {
  TIER_SUMMARIES,
  TIER_ACCOUNT_DETAILS,
  TIER_SERVICE_GROUPS,
  TIER_NOT_INCLUDED,
} from "@/lib/constants/pricing";

const TIER_IDS: TierId[] = ["visibility", "growth", "dominance"];

function getTierSummary(id: TierId) {
  return TIER_SUMMARIES.find((t) => t.id === id)!;
}

export function TierDetail({ tierId }: { tierId: TierId }) {
  const summary = getTierSummary(tierId);
  const account = TIER_ACCOUNT_DETAILS[tierId];
  const groups = TIER_SERVICE_GROUPS[tierId];
  const notIncluded = TIER_NOT_INCLUDED[tierId];

  return (
    <section
      className="border-t border-border py-16 sm:py-20"
      aria-labelledby={`tier-${tierId}-heading`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id={`tier-${tierId}-heading`} className="text-2xl font-bold text-foreground">
              Tier {TIER_IDS.indexOf(tierId) + 1} — {summary.name}
            </h2>
            <p className="text-lg font-semibold text-foreground">
              ${summary.setupFee.toLocaleString()} setup + ${summary.monthlyRetainer.toLocaleString()}/mo
            </p>
          </div>
          <p className="mt-2 text-muted-foreground">{summary.bestFor}</p>

          <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 sm:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h3>
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              <li>Manager: {account.manager}</li>
              <li>Response: {account.responseTime}</li>
              {account.monthlyCall && <li>Monthly call: {account.monthlyCall}</li>}
              {account.quarterlyStrategy && <li>Quarterly strategy: {account.quarterlyStrategy}</li>}
              <li>Ad-hoc requests: {account.adHocRequests}</li>
              {account.founderAccess && <li>Founder access: Yes</li>}
            </ul>
          </div>

          <div className="mt-10 space-y-10">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
                <dl className="mt-3 space-y-2">
                  {group.services.map((s) => (
                    <div key={s.service} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                      <dt className="text-sm font-medium text-foreground shrink-0 sm:w-64">{s.service}</dt>
                      <dd className="text-sm text-muted-foreground">{s.details}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          {notIncluded.length > 0 && (
            <div className="mt-10 rounded-xl border border-border border-amber-200/50 bg-amber-50/30 dark:border-amber-800/40 dark:bg-amber-950/20 p-4 sm:p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-200">
                Not included in Tier {TIER_IDS.indexOf(tierId) + 1}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {notIncluded.join(", ")}.
              </p>
            </div>
          )}

          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full">
              <Link href={`/contact?tier=${tierId}`}>Get in touch — {summary.name}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
