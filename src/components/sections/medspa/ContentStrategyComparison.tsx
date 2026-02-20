export function ContentStrategyComparison() {
  return (
    <section className="border-t border-border bg-muted/30 py-20 sm:py-28" aria-labelledby="content-comparison-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Content Strategy Comparison
            </span>
          </div>
          <h2 id="content-comparison-heading" className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Manual writers vs. agencies vs. Kolavi
          </h2>

          <div className="mt-16 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse rounded-xl border border-border bg-background">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-sm font-semibold">Approach</th>
                  <th className="p-4 text-left text-sm font-semibold">Posts/Month</th>
                  <th className="p-4 text-left text-sm font-semibold">Cost</th>
                  <th className="p-4 text-left text-sm font-semibold">Treatments Covered</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="p-4">Manual writers</td>
                  <td className="p-4">2–4</td>
                  <td className="p-4">$3,200–6,000</td>
                  <td className="p-4 text-muted-foreground">1–2 max</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-4">Standard agencies</td>
                  <td className="p-4">4–8</td>
                  <td className="p-4">$2,000–4,000</td>
                  <td className="p-4 text-muted-foreground">2–4</td>
                </tr>
                <tr className="border-b border-border bg-orange-50/30 dark:bg-orange-950/20">
                  <td className="p-4 font-semibold text-orange-600 dark:text-orange-400">Kolavi AI pipeline</td>
                  <td className="p-4 font-semibold">8–12</td>
                  <td className="p-4 font-semibold">$1,499–3,999</td>
                  <td className="p-4 font-semibold text-orange-600 dark:text-orange-400">ALL simultaneously</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6">
              <h3 className="font-semibold">6 months: Competitors</h3>
              <p className="mt-2 text-muted-foreground">
                12–24 posts about Botox and fillers. Same 2–4 treatments, repeated.
              </p>
            </div>
            <div className="rounded-xl border-2 border-orange-500/50 bg-orange-50/30 p-6 dark:border-orange-400/40 dark:bg-orange-950/20">
              <h3 className="font-semibold text-orange-600 dark:text-orange-400">6 months: Kolavi clients</h3>
              <p className="mt-2 text-muted-foreground">
                48–72 pieces covering your entire service menu. Every treatment gets content.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
