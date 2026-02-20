import { ONE_TIME_PROJECTS } from "@/lib/constants/pricing";

export function OneTimeProjects() {
  return (
    <section className="border-t border-border bg-muted/20 py-16 sm:py-20" aria-labelledby="one-time-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 id="one-time-heading" className="text-2xl font-bold text-foreground">
            One-time projects
          </h2>
          <p className="mt-2 text-muted-foreground">
            Add-ons for Tier 1 or Tier 2 clients who want specific upgrades without changing tier.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-semibold text-foreground">Service</th>
                  <th className="pb-3 font-semibold text-foreground">Price</th>
                  <th className="pb-3 font-semibold text-foreground">Who buys</th>
                </tr>
              </thead>
              <tbody>
                {ONE_TIME_PROJECTS.map((row) => (
                  <tr key={row.name} className="border-b border-border/70">
                    <td className="py-3 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 text-foreground">{row.price}</td>
                    <td className="py-3 text-muted-foreground">{row.whoBuys}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
