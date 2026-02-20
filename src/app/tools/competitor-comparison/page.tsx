import { getPageMetadata } from "@/lib/seo/metadata";
import { CompetitorComparisonTool } from "@/components/tools/CompetitorComparisonTool";

export const metadata = getPageMetadata({
  title: "Competitor Comparison Tool",
  description:
    "Compare your med spa website to competitors. See PageSpeed, treatment pages, and digital presence gaps.",
  path: "/tools/competitor-comparison",
  keywords: "competitor comparison, med spa marketing, PageSpeed comparison",
});

export default function CompetitorComparisonPage() {
  return (
    <main>
      <section className="relative border-b border-border bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Competitor Comparison
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Enter your site and top 3 competitors. We&apos;ll analyze PageSpeed, treatment coverage, and show where you stand.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <CompetitorComparisonTool />
          </div>
        </div>
      </section>
    </main>
  );
}
