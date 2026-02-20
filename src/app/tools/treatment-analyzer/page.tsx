import { getPageMetadata } from "@/lib/seo/metadata";
import { TreatmentAnalyzerForm } from "@/components/tools/TreatmentAnalyzerForm";

export const metadata = getPageMetadata({
  title: "Free Treatment Coverage Analyzer",
  description:
    "See how many of your med spa treatments are actually optimized for search. Get a free analysis of your treatment coverage and rankings.",
  path: "/tools/treatment-analyzer",
  keywords: "med spa treatment analyzer, treatment coverage SEO, med spa rankings",
});

export default function TreatmentAnalyzerPage() {
  return (
    <main>
      <section className="relative border-b border-border bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Analyze Your Full Treatment Menu
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Enter your website URL. We&apos;ll identify all treatments you offer, check which ones rank in your local market, and show you the revenue opportunity you&apos;re missing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md">
            <TreatmentAnalyzerForm />
          </div>
        </div>
      </section>
    </main>
  );
}
