import { cn } from "@/lib/utils";

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface ProcessProps {
  title?: string;
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
  steps = defaultSteps,
  className,
}: ProcessProps) {
  return (
    <section className={cn("bg-muted/50 py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
