"use client";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

export function WhoWeAreSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-24 sm:py-32 flex flex-col justify-center min-h-[50vh]"
      id="about"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
        <div
          className={`mx-auto ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block px-4 py-1.5 mb-8 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
            ABOUT US
          </span>
          <h2 className="text-h2 text-foreground mb-10 text-balance">
            Built Different From Day One
          </h2>
          
          <div className="space-y-8 text-body text-muted-foreground text-balance leading-relaxed">
            <p>
              Kolavi Studio was founded in 2026 with a simple conviction: the med spa marketing industry is years behind. Agencies charging premium retainers for WordPress templates, 2 blog posts a month, and dashboards nobody checks. We asked a different question. What would a med spa agency look like if it were built today, from scratch, with modern engineering and AI-native workflows?
            </p>
            <p className="font-semibold text-foreground">
              We're a brand new agency. And that's exactly the point.
            </p>
            <p>
              Before Kolavi, our founder built Business Mavericks to 31,000+ monthly organic visitors and 60,000+ Instagram followers. That wasn't luck. It was systematic, AI-powered content strategy executed with obsessive precision over years of testing what actually compounds.
            </p>
            <p>
              That same obsession carries into everything at Kolavi. Obsession with performance. Obsession with design. Obsession with getting every detail right, from the way a page loads to the way a button feels on hover. We don't cut corners because we physically cannot bring ourselves to ship anything less than exceptional.
            </p>
            <p>
              We're not here to be the biggest agency. We're building the one that med spa owners actually trust. Because every deliverable is engineered with the kind of perfectionism that most agencies reserve for their own pitch decks, not their clients' results.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
