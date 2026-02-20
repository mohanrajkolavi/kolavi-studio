"use client";

import { COMPETITOR_COMPARISON_ROWS, VALUE_HOOK_SENTENCE } from "@/lib/constants/pricing";

export function WhyKolavi() {
  return (
    <section
      className="relative z-10 bg-background py-24 sm:py-32"
      aria-labelledby="why-kolavi-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-reveal">
          <span className="text-label text-primary mb-6 block">The Kolavi Difference</span>
          <h2 id="why-kolavi-heading" className="text-h2 text-foreground mb-6">
            How We Compare
          </h2>
          <p className="text-body text-muted-foreground max-w-2xl mx-auto">
            {VALUE_HOOK_SENTENCE}
          </p>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-border bg-card shadow-premium animate-reveal" style={{ animationDelay: "100ms" }}>
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="py-6 px-6 font-semibold text-foreground text-h4">Feature</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-body border-l border-border">PatientGain</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-body border-l border-border">Growth99</th>
                <th className="py-6 px-4 font-semibold text-muted-foreground text-body border-l border-border">Sagapixel</th>
                <th className="py-6 px-4 font-bold text-primary text-body border-l border-border bg-primary/5">Kolavi Studio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPETITOR_COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="transition-colors hover:bg-muted/10">
                  <td className="py-5 px-6 text-body text-foreground font-medium">{row.feature}</td>
                  <td className="py-5 px-4 text-small text-muted-foreground border-l border-border">{row.patientGain}</td>
                  <td className="py-5 px-4 text-small text-muted-foreground border-l border-border">{row.growth99}</td>
                  <td className="py-5 px-4 text-small text-muted-foreground border-l border-border">{row.sagapixel}</td>
                  <td className="py-5 px-4 text-small font-bold text-foreground border-l border-border bg-primary/5">{row.kolaviT2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
