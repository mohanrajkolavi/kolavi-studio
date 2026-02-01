import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CTAStripProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

export function CTAStrip({
  title = "Ready to Grow Your Business?",
  description = "Let's discuss how we can help you achieve your digital marketing goals.",
  buttonText = "Get Started",
  buttonHref = "/contact",
}: CTAStripProps) {
  return (
    <section className="bg-primary py-12 sm:py-16">
      <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 text-lg text-primary-foreground/90">
          {description}
        </p>
        <div className="mt-8">
          <Button asChild size="lg" variant="secondary">
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
