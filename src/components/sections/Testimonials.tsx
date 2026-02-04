import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

interface TestimonialsProps {
  title?: string;
  /** Blog-style bar + uppercase label above the title (e.g. "What Our Clients Say") */
  sectionLabel?: string;
  testimonials?: Testimonial[];
  className?: string;
}

const defaultTestimonials: Testimonial[] = [
  {
    quote: "Kolavi Studio transformed our online presence. Our bookings increased by 150% in just three months.",
    author: "Sarah Johnson",
    role: "Owner",
    company: "Serenity Med Spa",
  },
  {
    quote: "The team's expertise in SEO and web design helped us dominate local search results. Highly recommended!",
    author: "Michael Chen",
    role: "Marketing Director",
    company: "Elite Wellness Center",
  },
  {
    quote: "Professional, responsive, and results-driven. They truly understand the medical spa industry.",
    author: "Jennifer Martinez",
    role: "Founder",
    company: "Radiance Aesthetics",
  },
];

export function Testimonials({
  title = "What Our Clients Say",
  sectionLabel,
  testimonials = defaultTestimonials,
  className,
}: TestimonialsProps) {
  return (
    <section className={cn("border-b border-border bg-muted/20 py-16 sm:py-24", className)}>
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
        <div className={cn("mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3", (title || sectionLabel) ? "mt-12" : "mt-0")}>
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="overflow-hidden rounded-2xl border border-border shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-800">
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="mt-6">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
