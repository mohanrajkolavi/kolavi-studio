import { getPageMetadata } from "@/lib/seo/metadata";
import { ROICalculator } from "@/components/tools/ROICalculator";

export const metadata = getPageMetadata({
  title: "Med Spa ROI Calculator",
  description:
    "Calculate your potential revenue increase from multi-treatment SEO. See how much you're leaving on the table.",
  path: "/tools/roi-calculator",
  keywords: "med spa ROI calculator, revenue projection, treatment SEO ROI",
});

export default function ROICalculatorPage() {
  return (
    <main>
      <section className="relative border-b border-border bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Med Spa ROI Calculator
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              See how much revenue you could gain by ranking for all your treatments, not just Botox.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <ROICalculator />
          </div>
        </div>
      </section>
    </main>
  );
}
