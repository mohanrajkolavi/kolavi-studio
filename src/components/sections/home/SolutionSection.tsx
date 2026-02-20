import { Layers, Sparkles, Search } from "lucide-react";

export function SolutionSection() {
  const advantages = [
    {
      icon: <Layers className="h-8 w-8" />,
      title: "Next.js handles unlimited treatments at lightning speed",
      description: "WordPress slows down with each page added. Next.js stays fast no matter how many treatment pages you have: injectables, body contouring, lasers, skin rejuvenation, wellness.",
      vs: "Competitors: Slow sites that get slower. Us: 0.8s load times, guaranteed.",
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "AI content pipeline covers every treatment simultaneously",
      description: "Create comprehensive coverage for every treatment at once, at one-third the cost of manual writers. No more choosing between Botox OR CoolSculpting. You get both. And everything else.",
      vs: "Competitors: 2–4 posts/month, 1–2 treatments. Us: 8–12 posts/month, ALL treatments.",
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "GEO optimization for AI search",
      description: "71% of patients now use ChatGPT or Perplexity for recommendations. We make your clients appear when patients ask AI for the best med spa in their city, not just Google.",
      vs: "Competitors: Google only. Us: Google + ChatGPT + Perplexity + AI Overviews.",
    },
  ];

  return (
    <section className="border-t border-border py-20 sm:py-28 bg-background" aria-labelledby="solution-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Our Unfair Advantages
            </span>
          </div>
          <h2 id="solution-heading" className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            What competitors can do vs. what we deliver
          </h2>

          <div className="mt-14 space-y-6 sm:space-y-8">
            {advantages.map((adv, index) => (
              <div
                key={index}
                className="flex flex-col gap-5 rounded-2xl border border-border bg-muted/20 sm:bg-card/50 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8 transition-colors duration-200 hover:bg-muted/30 sm:hover:bg-card/70"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:border dark:border-orange-500/20 dark:text-orange-400">
                  {adv.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-semibold text-foreground tracking-tight">{adv.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">{adv.description}</p>
                  <p className="mt-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 px-4 py-2.5 text-sm font-medium text-orange-800 dark:text-orange-200 border border-orange-100 dark:border-orange-900/40">
                    {adv.vs}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
