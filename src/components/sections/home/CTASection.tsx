"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function CTASection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-16 sm:py-20 lg:py-24 overflow-hidden flex flex-col justify-center min-h-[40vh]"
      id="cta"
    >
      <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center relative z-10">
        <div className={isVisible ? "animate-reveal" : "opacity-0"}>
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-5">
            Limited Availability
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8 text-balance leading-tight tracking-tight">
            Your next client is searching right now.
            <br />
            Make sure they find you first.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <Button asChild size="lg" className="w-full sm:w-auto rounded-full shadow-premium min-w-[200px]">
              <Link href="/tools/speed-audit">Get Your Free Audit</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto rounded-full min-w-[200px]">
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-10 max-w-md mx-auto leading-relaxed">
            Free audit. No commitment. Response within 24 hours.
            <br />
            We cap new clients each month to protect delivery quality.
          </p>
        </div>
      </div>
    </section>
  );
}
