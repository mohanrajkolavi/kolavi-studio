import { Code2, FileText, Zap } from "lucide-react";

export function TechStackShowcase() {
  return (
    <section className="border-t border-border py-20 sm:py-28 bg-background" aria-labelledby="tech-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              The Technology Gap
            </span>
          </div>
          <h2 id="tech-heading" className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            Why our tech matters for your business
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground leading-relaxed">
            Faster sites rank higher, convert better, and handle unlimited growth.
          </p>

          <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-2xl border border-border bg-muted/20 sm:bg-card p-6 sm:p-8">
              <h3 className="text-lg font-semibold text-muted-foreground">Typical Competitor Stack</h3>
              <ul className="mt-6 space-y-4" >
                <li className="flex items-center gap-3 text-foreground/90">
                  <Code2 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Standard WordPress</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/90">
                  <FileText className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Manual content creation</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/90">
                  <Zap className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>Generic SEO tools</span>
                </li>
              </ul>
              <div className="mt-8 rounded-lg bg-muted/60 dark:bg-muted/40 p-4">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">PageSpeed: 30–50</p>
                <p className="mt-1 text-sm text-muted-foreground">Load time: 4–6+ seconds</p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/25 p-6 sm:p-8 dark:border-orange-400/30">
              <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">Kolavi Studio Stack</h3>
              <ul className="mt-6 space-y-4" >
                <li className="flex items-center gap-3 text-foreground/90">
                  <Code2 className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                  <span>Next.js + Headless WordPress</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/90">
                  <FileText className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                  <span>AI content pipeline (multiple models)</span>
                </li>
                <li className="flex items-center gap-3 text-foreground/90">
                  <Zap className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                  <span>GEO + technical SEO</span>
                </li>
              </ul>
              <div className="mt-8 rounded-lg bg-orange-100/80 dark:bg-orange-900/30 p-4 border border-orange-200/50 dark:border-orange-800/30">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">PageSpeed: 95–100</p>
                <p className="mt-1 text-sm text-muted-foreground">Load time: under 1 second</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
            <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">~5×</p>
              <p className="mt-1 text-sm text-muted-foreground">Load time difference</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">3×</p>
              <p className="mt-1 text-sm text-muted-foreground">Content output vs competitors</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">0</p>
              <p className="mt-1 text-sm text-muted-foreground">Other med spa agencies use Next.js</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
