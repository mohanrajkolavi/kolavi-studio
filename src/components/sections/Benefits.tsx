import { CheckCircle, TrendingUp, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface BenefitsProps {
  title?: string;
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
  benefits = defaultBenefits,
  className,
}: BenefitsProps) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                {benefit.icon}
              </div>
              <h3 className="mt-6 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
