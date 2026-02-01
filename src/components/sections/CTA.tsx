import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTAProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
  className?: string;
}

export function CTA({
  title = "Ready to Transform Your Business?",
  description = "Let's create a digital strategy that drives real results for your business.",
  buttonText = "Get in Touch",
  buttonHref = "/contact",
  className,
}: CTAProps) {
  return (
    <section className={cn("bg-primary py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-6 text-lg leading-8 text-primary-foreground/90">
            {description}
          </p>
          <div className="mt-10">
            <Button asChild size="lg" variant="secondary">
              <Link href={buttonHref}>{buttonText}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
