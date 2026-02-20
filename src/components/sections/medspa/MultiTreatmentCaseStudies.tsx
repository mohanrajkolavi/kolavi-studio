import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CASE_STUDIES = [
  {
    title: "Solo practice expansion",
    metric: "240% traffic increase",
    description: "Ranking for only Botox and fillers → expanded to rankings across 8 treatment categories.",
    treatments: "Botox, fillers, CoolSculpting, laser hair removal, chemical peels, microneedling, IV therapy, PDO threads",
  },
  {
    title: "New med spa launch",
    metric: "14 first-page rankings in 60 days",
    description: "Zero visibility → 14 first-page rankings across multiple treatments within 60 days. Fully booked by month 4.",
    treatments: "Full injectable menu + body contouring + skin",
  },
  {
    title: "Multi-location expansion",
    metric: "3× total organic traffic",
    description: "3 locations each rank independently without cannibalizing each other.",
    treatments: "Every location, every treatment",
  },
];

export function MultiTreatmentCaseStudies() {
  return (
    <section className="border-t border-border bg-muted/30 py-20 sm:py-28" aria-labelledby="medspa-case-studies-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Multi-Treatment Transformations
            </span>
          </div>
          <h2 id="medspa-case-studies-heading" className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Projected results based on industry benchmarks
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            These tell the comprehensive story that resonates with med spa owners.
          </p>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {CASE_STUDIES.map((study, index) => (
              <Card key={index} className="overflow-hidden rounded-2xl border border-border">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                    {study.title}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{study.metric}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{study.description}</p>
                  <p className="mt-4 text-xs text-muted-foreground">Treatments: {study.treatments}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-2xl bg-orange-600 px-8 font-semibold hover:bg-orange-700">
              <Link href="/tools/treatment-analyzer">Get Similar Results: Analyze My Menu</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
