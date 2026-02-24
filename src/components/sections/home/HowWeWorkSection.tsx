"use client";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const steps = [
  {
    number: "01",
    timeline: "Days 1 to 14",
    title: "Audit and Strategy",
    description:
      "We go through your digital presence without sugarcoating it. Site speed. SEO gaps. Competitor positioning. Conversion bottlenecks. You get a complete growth roadmap before we write a single line of code.",
    supporting: "No recycled playbooks. Built around your market and your revenue goals.",
  },
  {
    number: "02",
    timeline: "Days 14 to 28",
    title: "Build and Engineer",
    description:
      "Your Next.js site is built from scratch. Custom design. Schema markup. Core Web Vitals dialed in. At the same time, your SEO infrastructure goes up. GBP, citations, programmatic pages, content pipeline.",
    supporting: "Most agencies build the site, then figure out SEO. We run both tracks simultaneously so you launch with momentum.",
  },
  {
    number: "03",
    timeline: "Days 28 to 35",
    title: "Launch and Activate",
    description:
      "Site goes live with every tracking pixel in place. Automation sequences fire. Review requests activate. AI chatbot goes online. The system is generating leads before your first monthly report lands.",
    supporting: "Not a placeholder dashboard. Actual data. Actual tracking. Actual leads. From day one.",
  },
  {
    number: "04",
    timeline: "Ongoing",
    title: "Scale and Compound",
    description:
      "Monthly content stacks rankings. Programmatic pages capture long-tail searches. Backlink campaigns grow authority. CRO testing converts more from the same traffic.",
    supporting: "More leads every month. Same spend.",
  },
];

export function HowWeWorkSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="how-we-work"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            The Process
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground mb-4 leading-tight tracking-tight">
            Simple on your end.
            <br />
            Engineered on ours.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Four steps. No surprises. No waiting around. From first audit to a system that runs itself.
          </p>
        </div>

        {/* 2x2 grid — two columns at all sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`group relative flex flex-col rounded-[24px] sm:rounded-[28px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-500 overflow-hidden p-7 sm:p-8 lg:p-9 ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${80 + index * 70}ms` : "0ms",
              }}
            >
              {/* Premium orange glow */}
              <div
                className="absolute top-0 right-0 w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none z-0"
                aria-hidden
              />
              {/* Faint step number */}
              <div
                className="absolute top-6 left-6 sm:top-8 sm:left-8 text-[64px] sm:text-[80px] font-extrabold text-muted-foreground/[0.05] dark:text-muted-foreground/[0.07] leading-none pointer-events-none select-none tracking-tighter z-0"
                aria-hidden
              >
                {step.number}
              </div>

              <div className="relative z-10 flex flex-col h-full min-h-0">
                {/* Title (left) + Timeline pill (right) */}
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 mb-6 sm:mb-7">
                  <h3 className="font-bold text-lg sm:text-xl text-foreground leading-tight min-w-0">
                    {step.title}
                  </h3>
                  <span className="inline-flex shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border border-primary text-primary bg-transparent">
                    {step.timeline}
                  </span>
                </div>
                {/* Main description */}
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7] max-w-prose flex-1 min-h-0">
                  {step.description}
                </p>
                {/* Supporting line */}
                <div className="mt-6 pt-5 border-t border-border/60 shrink-0">
                  <p className="text-sm sm:text-base font-medium text-primary leading-snug">
                    {step.supporting}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
