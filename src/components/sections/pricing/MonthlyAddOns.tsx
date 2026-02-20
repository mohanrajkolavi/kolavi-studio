import { MONTHLY_ADDONS } from "@/lib/constants/pricing";

export function MonthlyAddOns() {
  return (
    <section className="border-t border-border py-16 sm:py-20" aria-labelledby="addons-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 id="addons-heading" className="text-2xl font-bold text-foreground">
            Monthly add-ons
          </h2>
          <p className="mt-2 text-muted-foreground">
            Extend your tier with extra capacity or channels.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 font-semibold text-foreground">Service</th>
                  <th className="pb-3 font-semibold text-foreground">Price</th>
                  <th className="pb-3 font-semibold text-foreground">Available for</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_ADDONS.map((row) => (
                  <tr key={row.name} className="border-b border-border/70">
                    <td className="py-3 font-medium text-foreground">{row.name}</td>
                    <td className="py-3 text-foreground">{row.price}</td>
                    <td className="py-3 text-muted-foreground">{row.availableFor}</td>
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
