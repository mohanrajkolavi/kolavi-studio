import { cn } from "@/lib/utils";

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface ProcessProps {
  title?: string;
  /** Blog-style bar + uppercase label above the title (e.g. "Our Process") */
  sectionLabel?: string;
  steps?: ProcessStep[];
  className?: string;
}

const defaultSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    description: "We learn about your business, goals, and target audience to create a tailored strategy.",
  },
  {
    number: "02",
    title: "Strategy",
    description: "Our team develops a comprehensive plan designed to achieve your specific objectives.",
  },
  {
    number: "03",
    title: "Execute",
    description: "We implement the strategy with precision, keeping you informed every step of the way.",
  },
  {
    number: "04",
    title: "Optimize",
    description: "Continuous monitoring and refinement ensure maximum performance and results.",
  },
];

export function Process({
  title = "Our Process",
  sectionLabel,
  steps = defaultSteps,
  className,
}: ProcessProps) {
  return (
    <section className={cn("border-b border-border bg-muted/30 py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {sectionLabel && (
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-1 w-8 rounded-full bg-orange-500" aria-hidden />
              <span className="text-sm font-bold uppercase tracking-wider text-foreground">
                {sectionLabel}
              </span>
            </div>
          )}
          {title && (
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={cn("text-3xl font-bold tracking-tight sm:text-4xl", sectionLabel && "text-2xl sm:text-3xl")}>
                {title}
              </h2>
            </div>
          )}
        </div>
        <div className={cn("mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4", (title || sectionLabel) ? "mt-12" : "mt-0")}>
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-bold text-primary/20">
                {step.number}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
