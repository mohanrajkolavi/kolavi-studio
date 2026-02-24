"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const PROOF_CARDS = [
  {
    value: "95+ PageSpeed",
    detail: "Every site we have ever shipped. Day one. No exceptions.",
  },
  {
    value: "45 Days",
    detail: "Average time to first ranking movement across every market we have entered.",
  },
  {
    value: "Day One",
    detail: "Automation, lead capture, and reporting live before your first monthly report.",
  },
  {
    value: "Month 3",
    detail: "When compounding kicks in and lead volume starts climbing without needing to increase ad spend.",
  },
];

const FOUNDER_STATS = [
  { number: "31K", label: "Monthly organic visitors built", detail: "" },
  { number: "60K+", label: "Followers grown organically", detail: "" },
  { number: "5+", label: "Worked with Fortune 500", detail: "" },
];

export function TestimonialsSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="testimonials"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Proven Methodology
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground mb-5 leading-tight tracking-tight">
            We built the system for ourselves first. Then we opened it to clients.
          </h2>
          <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            <p>
              Before taking a single client, the founder built and ran every system Kolavi now deploys. Websites, SEO, automation, lead generation, content, and paid ads. All of it. On a real platform with real traffic and real revenue.
            </p>
            <p>
              We know what works because we lived the results, not because we read a case study.
            </p>
          </div>
        </div>

        {/* Proof cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-14">
          {PROOF_CARDS.map((card, index) => (
            <div
              key={card.value}
              className={`group relative overflow-hidden rounded-[20px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-500 p-6 ${isVisible ? "animate-reveal" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${250 + index * 100}ms` : "0ms" }}
            >
              <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" aria-hidden />
              <div className="relative z-10">
                <p className="text-h4 text-foreground font-semibold mb-2">{card.value}</p>
                <p className="text-small text-muted-foreground">{card.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Founder proof stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-10">
          {FOUNDER_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`group relative overflow-hidden rounded-[20px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-500 p-6 text-center ${isVisible ? "animate-reveal" : "opacity-0"}`}
              style={{ animationDelay: isVisible ? `${550 + index * 100}ms` : "0ms" }}
            >
              <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" aria-hidden />
              <div className="relative z-10">
                <div className="text-stat text-primary font-bold">{stat.number}</div>
                <p className="text-label text-foreground mt-2">{stat.label}</p>
                {stat.detail ? <p className="text-small text-muted-foreground mt-2">{stat.detail}</p> : null}
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center ${isVisible ? "animate-reveal" : "opacity-0"}`} style={{ animationDelay: isVisible ? "850ms" : "0ms" }}>
          <Button asChild size="lg" className="rounded-full shadow-premium">
            <Link href="/tools/speed-audit">Get Your Free Audit</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-5 leading-relaxed max-w-sm mx-auto">
            See exactly how the system applies to your business.
          </p>
        </div>
      </div>
    </section>
  );
}
