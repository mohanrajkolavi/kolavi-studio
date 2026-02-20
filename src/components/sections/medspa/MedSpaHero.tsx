import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { TrendingUp, Check } from "lucide-react";

const rankings = [
  { treatment: "Botox", before: 3, after: 1 },
  { treatment: "Fillers", before: 12, after: 2 },
  { treatment: "CoolSculpting", before: 23, after: 4 },
  { treatment: "Laser Hair Removal", before: 8, after: 1 },
];

export function MedSpaHero() {
  return (
    <>
      <PageHero
        title="You Offer 10–15 Treatments. You Only Rank for 1–2."
        description="That means 80% of patients searching for your other services never find you. We fix that—comprehensive treatment coverage, not just Botox or one service."
        badge="Med Spa Marketing Specialists"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/tools/treatment-analyzer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-8 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
          >
            Analyze My Full Treatment Menu
          </Link>
          <Link
            href="/tools/speed-audit"
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-card px-8 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Get Free Speed Audit
          </Link>
        </div>
      </PageHero>

      {/* Rankings – blog-style card */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="medspa-rankings-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 id="medspa-rankings-heading" className="sr-only">Multi-treatment rankings example</h2>
            <div className="rounded-2xl border border-border bg-card px-6 py-6 shadow-sm ring-1 ring-border sm:p-8">
              <p className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Multi-treatment rankings (90 days)
              </p>
              <div className="space-y-4">
                {rankings.map((r) => (
                  <div
                    key={r.treatment}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-foreground">{r.treatment}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-red-500 line-through opacity-70">#{r.before}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="flex items-center gap-1 font-semibold text-green-600 dark:text-green-400">
                        <TrendingUp className="h-3 w-3" />
                        #{r.after}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                Trusted by top Med Spas. Results vary by market and starting point.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
