import { COMPETITOR_COMPARISON_ROWS } from "@/lib/constants/pricing";

export function CompetitorTable() {
  return (
    <section className="border-t border-border py-16 sm:py-20" aria-labelledby="competitor-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 id="competitor-heading" className="text-center text-2xl font-bold text-foreground">
            Competitor comparison
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
            How Kolavi stacks up against other med spa marketing agencies.
          </p>
          <div className="mt-8 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 font-semibold text-foreground">Feature</th>
                  <th className="p-3 font-semibold text-foreground">PatientGain</th>
                  <th className="p-3 font-semibold text-foreground">Growth99</th>
                  <th className="p-3 font-semibold text-foreground">Sagapixel</th>
                  <th className="p-3 font-semibold text-foreground">Kolavi T1</th>
                  <th className="p-3 font-semibold text-foreground">Kolavi T2</th>
                  <th className="p-3 font-semibold text-foreground">Kolavi T3</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-3 font-medium text-foreground">{row.feature}</td>
                    <td className="p-3 text-muted-foreground">{row.patientGain}</td>
                    <td className="p-3 text-muted-foreground">{row.growth99}</td>
                    <td className="p-3 text-muted-foreground">{row.sagapixel}</td>
                    <td className="p-3 text-foreground">{row.kolaviT1}</td>
                    <td className="p-3 text-foreground">{row.kolaviT2}</td>
                    <td className="p-3 text-foreground">{row.kolaviT3}</td>
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
