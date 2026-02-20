"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function CTASection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-24 sm:py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh]"
      id="cta"
    >
      {/* Subtle Background Glow */}
      <div className="absolute inset-0 w-full h-full bg-background" />
      <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-background via-primary/5 to-orange-500/10 dark:from-background dark:via-primary/10 dark:to-orange-500/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] rounded-full blur-[100px] opacity-20 bg-primary pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10">
        <div className={isVisible ? "animate-reveal" : "opacity-0"}>
          <h2 className="text-h2 text-foreground mb-8 text-balance">
            Ready to Stop Competing and Start Dominating?
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Get a free SEO audit of your med spa's digital presence. We'll show you exactly where you're leaving patients, and revenue, on the table.
          </p>
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto mt-4"
          >
            <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
