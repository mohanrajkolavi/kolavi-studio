import { Building2, Shield, MessageCircle } from "lucide-react";

export function IndustryExpertise() {
  const columns = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "We Understand Your Business Model",
      items: [
        "Treatment hierarchy and revenue mix",
        "Patient LTV by category",
        "Seasonal trends (Botox pre-events, body contouring post-summer)",
        "Membership models and retention",
        "Multi-provider capacity planning",
      ],
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "We Know Your Compliance Requirements",
      items: [
        "HIPAA considerations for before/after photos",
        "State-specific advertising restrictions",
        "Medical director requirements",
        "Controlled substance messaging",
        "International compliance (UK ASA, Australia TGA)",
      ],
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "We Speak Your Patient's Language",
      items: [
        "Search intent differences by treatment",
        "Age demographics by treatment",
        "Pain points and objections",
        "Price sensitivity variations",
        "Research behavior patterns",
      ],
    },
  ];

  return (
    <section className="border-t border-border bg-muted/30 py-20 sm:py-28" aria-labelledby="expertise-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Med Spa Industry Expertise
            </span>
          </div>
          <h2 id="expertise-heading" className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Generalist agencies vs. true specialists
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            This is what separates us from agencies that &quot;also do med spas.&quot;
          </p>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {columns.map((col) => (
              <div
                key={col.title}
                className="rounded-2xl border border-border bg-background p-6 shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:text-orange-400">
                  {col.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{col.title}</h3>
                <ul className="mt-4 space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">• {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
