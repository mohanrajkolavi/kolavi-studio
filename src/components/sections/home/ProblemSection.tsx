import { TrendingDown, Users, DollarSign } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: TrendingDown,
      stat: "1–2",
      label: "treatments ranking",
      description: "Most med spas offer 10–15 treatments but only rank for 1–2. The rest are invisible to patients searching for them.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: Users,
      stat: "80%",
      label: "of patients lost",
      description: "You lose 80% of potential patients searching for your other services because you don't show up in search results.",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-950/20",
    },
    {
      icon: DollarSign,
      stat: "$15–30K",
      label: "monthly for writers",
      description: "Hiring writers for comprehensive content across 10–15 treatments costs $15,000–30,000 monthly. Impossible to afford at scale.",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
  ];

  return (
    <section className="relative border-t border-border py-20 sm:py-28 overflow-hidden" aria-labelledby="problem-heading">
      <div className="absolute inset-0 bg-muted/20 -z-10" aria-hidden />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-background border border-border shadow-sm mb-6">
              <div className="h-2 w-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                The Industry Problem
              </span>
            </div>
            <h2 id="problem-heading" className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              Three critical gaps holding your med spa back
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance leading-relaxed">
              Factual, data-driven insights. This is exactly why most med spas plateau while a select few dominate the market.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            {problems.map((problem, index) => (
              <div
                key={index}
                className="group relative rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm transition-all duration-200 hover:shadow-premium hover:border-border/80 motion-safe:hover:-translate-y-0.5"
              >
                <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${problem.bg} ${problem.color} mb-5`}>
                  <problem.icon className="h-6 w-6" aria-hidden />
                </div>
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{problem.stat}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{problem.label}</p>
                <div className="my-4 h-px w-full bg-border" aria-hidden />
                <p className="text-base leading-relaxed text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-sm max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-foreground mb-2">The Result?</h3>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              <strong className="text-foreground font-semibold">Incomplete content coverage</strong> across your full treatment menu.{" "}
              <strong className="text-foreground font-semibold">Slow multi-page WordPress sites</strong> that can&apos;t scale.{" "}
              <strong className="text-foreground font-semibold">Manual content creation</strong> that&apos;s impossible to afford for 10–15 treatments.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
