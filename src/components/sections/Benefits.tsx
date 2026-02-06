import { CheckCircle, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface BenefitsProps {
  title?: string;
  /** Blog-style bar + uppercase label above the title (e.g. "Why work with us") */
  sectionLabel?: string;
  benefits?: Benefit[];
  className?: string;
}

const defaultBenefits: Benefit[] = [
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Proven Results",
    description: "Data-driven strategies that deliver measurable growth and ROI for your business.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Expert Team",
    description: "Industry specialists with years of experience in digital marketing and web design.",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Fast Execution",
    description: "Quick turnaround times without compromising on quality or attention to detail.",
  },
  {
    icon: <CheckCircle className="h-8 w-8" />,
    title: "Full Support",
    description: "Ongoing support and optimization to ensure your continued success.",
  },
];

export function Benefits({
  title = "Why Choose Kolavi Studio",
  sectionLabel,
  benefits = defaultBenefits,
  className,
}: BenefitsProps) {
  return (
    <section className={cn("border-t border-border py-20 sm:py-28", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {sectionLabel && (
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {sectionLabel}
              </span>
            </div>
          )}
          {title && (
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={cn("font-semibold tracking-tight sm:text-4xl", sectionLabel ? "text-2xl sm:text-3xl" : "text-3xl")}>
                {title}
              </h2>
            </div>
          )}
        </div>
        <div className={cn("mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4", sectionLabel && "mt-12")}>
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-white">
                {benefit.icon}
              </div>
              <h3 className="mt-6 text-lg font-medium">{benefit.title}</h3>
              <p className="mt-3 text-base text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
