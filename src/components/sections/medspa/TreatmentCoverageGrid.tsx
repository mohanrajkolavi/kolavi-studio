import { CheckCircle2 } from "lucide-react";

const TREATMENT_CATEGORIES = [
  {
    category: "Injectable Treatments",
    treatments: ["Botox", "Dysport", "Xeomin", "Jeuveau", "All filler brands", "Lip filler", "Cheek filler", "Kybella"],
  },
  {
    category: "Body Contouring & Sculpting",
    treatments: ["CoolSculpting", "Emsculpt", "Emsculpt NEO", "SculpSure", "BodyTite", "Post-GLP-1 body contouring"],
  },
  {
    category: "Laser Treatments",
    treatments: ["Laser hair removal (all areas)", "IPL", "Laser skin resurfacing", "Laser tattoo removal", "Vascular lasers"],
  },
  {
    category: "Skin Rejuvenation",
    treatments: ["Chemical peels", "Microneedling", "HydraFacial", "Dermaplaning", "LED therapy", "RF microneedling"],
  },
  {
    category: "Medical-Grade Skincare",
    treatments: ["Skinceuticals", "ZO Skin Health", "Obagi", "Custom regimens", "Prescription retinoids"],
  },
  {
    category: "Wellness & IV Therapy",
    treatments: ["IV hydration", "NAD+", "Vitamin drips", "Weight loss IV", "Immune boost"],
  },
  {
    category: "Intimate Wellness",
    treatments: ["MonaLisa Touch", "O-Shot", "Vaginal rejuvenation", "Labiaplasty"],
  },
  {
    category: "Men's Aesthetic Services",
    treatments: ["Brotox", "Male filler", "Hair restoration", "Body contouring for men"],
  },
];

export function TreatmentCoverageGrid() {
  return (
    <section className="relative border-t border-border py-20 sm:py-28 overflow-hidden" aria-labelledby="treatment-grid-heading">
      <div className="absolute inset-0 bg-muted/20 -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border shadow-sm mb-6">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Complete Service Coverage
              </span>
            </div>
            <h2 id="treatment-grid-heading" className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl text-balance">
              Every treatment category we optimize
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-balance">
              Most agencies optimize 2–3 categories. We optimize ALL of them. Simultaneously. At scale.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TREATMENT_CATEGORIES.map((cat) => (
              <div
                key={cat.category}
                className="group rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md dark:hover:border-orange-900/50"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-orange-500"></div>
                  <h3 className="font-bold text-lg text-foreground leading-tight">{cat.category}</h3>
                </div>

                <ul className="space-y-2">
                  {cat.treatments.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors">
                      <CheckCircle2 className="h-4 w-4 text-orange-500 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      <span className="-ml-6 group-hover:ml-0 transition-all duration-300">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-50 to-orange-100/50 p-8 text-center dark:from-orange-950/20 dark:to-orange-900/10">
            <p className="text-xl font-semibold text-orange-900 dark:text-orange-200 lg:text-2xl text-balance">
              "We used to only rank for Botox. Now we're getting leads for lasers, body contouring, and even intimate wellness—services we didn't think we could market online."
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded-full bg-orange-200 dark:bg-orange-800"></div>
              <span className="text-sm font-medium text-orange-800 dark:text-orange-300">Dr. Sarah M., Medical Director</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
