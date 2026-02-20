import { getPageMetadata } from "@/lib/seo/metadata";
import { TreatmentVisualizer } from "@/components/tools/TreatmentVisualizer";

export const metadata = getPageMetadata({
  title: "Treatment Coverage Visualizer",
  description:
    "See how much search volume you're missing. Select your treatments and compare current vs. potential state.",
  path: "/tools/treatment-visualizer",
  keywords: "treatment coverage, med spa SEO, missed opportunity",
});

export default function TreatmentVisualizerPage() {
  return (
    <main>
      <section className="relative border-b border-border bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Treatment Coverage Visualizer
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Select which treatments you offer. See the opportunity you&apos;re missing.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <TreatmentVisualizer />
          </div>
        </div>
      </section>
    </main>
  );
}
