import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CASE_STUDIES = [
  {
    title: "PageSpeed transformation",
    metric: "38 → 98",
    timeframe: "14 days",
    description: "Projected based on industry benchmarks. Next.js migration delivered near-perfect scores.",
    source: "PageSpeed Insights benchmarks",
  },
  {
    title: "Content output increase",
    metric: "4 → 12 posts/month",
    timeframe: "Ongoing",
    description: "AI pipeline enabled 3× content volume covering injectables, body contouring, lasers, and skin treatments.",
    source: "Typical agency vs AI pipeline benchmarks",
  },
  {
    title: "Multi-treatment rankings",
    metric: "8 services ranking",
    timeframe: "90 days",
    description: "Before and after: Botox, fillers, CoolSculpting, laser hair removal, chemical peels, microneedling, IV therapy, PDO threads. All ranking.",
    source: "Multi-treatment SEO benchmarks",
  },
];

export function CaseStudiesSection() {
  return (
    <section className="border-t border-border bg-muted/30 py-20 sm:py-28" aria-labelledby="case-studies-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Projected Results
            </span>
          </div>
          <h2 id="case-studies-heading" className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Based on industry benchmarks
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed">
            Real data sources. Ready to swap with actual client results as they come in.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
            {CASE_STUDIES.map((study, index) => (
              <Card key={index} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-premium">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    {study.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground tracking-tight">{study.metric}</p>
                  <p className="text-sm text-muted-foreground">{study.timeframe}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{study.description}</p>
                  <p className="mt-4 text-xs text-muted-foreground">Source: {study.source}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="h-12 rounded-2xl bg-orange-600 px-8 font-semibold hover:bg-orange-700 transition-colors duration-200">
              <Link href="/tools/speed-audit">Get Similar Results — Free Audit</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
