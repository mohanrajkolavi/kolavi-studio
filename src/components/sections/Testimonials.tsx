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
  testimonials = defaultTestimonials,
  className,
}: TestimonialsProps) {
  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
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
