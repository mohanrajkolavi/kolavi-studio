"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "01",
    title: "Audit & Strategy",
    description:
      "We tear apart your current digital presence with zero sentiment. Site speed. SEO gaps. Competitor positioning. Local search landscape. Conversion bottlenecks. Everything. You get a complete audit and a prioritized growth roadmap before we write a single line of code. No assumptions. No recycled playbooks. A strategy built around your highest-margin treatments and your specific market.",
    duration: "Week 1-2",
    colSpan: "md:col-span-2 lg:col-span-2",
    padding: "p-10 lg:p-12",
  },
  {
    number: "02",
    title: "Engineer & Build",
    description:
      "Your Next.js site gets built from a blank canvas. Custom design. HIPAA + ADA compliance engineered in. Schema markup. Core Web Vitals dialed. Simultaneously, we stand up your entire SEO infrastructure: Google Business Profile, citations, programmatic pages, content pipeline. Everything launches together. Nothing ships half-done.",
    duration: "Week 2-4",
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    number: "03",
    title: "Launch & Activate",
    description:
      "Site goes live with every tracking pixel in place. Call tracking. Conversion tracking. Real-time dashboard, live from day one. Automation sequences fire: booking confirmations, review requests, lead nurture flows. Your AI chatbot activates. The system starts working for you before your first monthly report.",
    duration: "Week 4-5",
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    number: "04",
    title: "Scale & Dominate",
    description:
      "This is where compounding takes over. Monthly content stacks organic rankings. Programmatic pages capture long-tail searches across every treatment + city combination. Backlink campaigns build domain authority. CRO testing squeezes more bookings from the same traffic. Every month your lead volume grows. Not because we're spending more, but because the system was designed to compound from the start. Monthly reports show exactly what moved and what's next.",
    duration: "Ongoing",
    colSpan: "md:col-span-2 lg:col-span-2",
    padding: "p-10 lg:p-12",
  },
];

export function HowWeWorkSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-24 sm:py-32"
      id="how-we-work"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-20 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="text-label text-primary mb-6 block">OUR PROCESS</span>
          <h2 className="text-h2 text-foreground mb-6">
            The Path to Market Leadership
          </h2>
          <p className="text-body text-muted-foreground">
            Four steps. Zero guesswork. A system designed to compound your results every single month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`relative overflow-hidden flex flex-col ${step.colSpan} ${step.padding} rounded-[20px] border border-border/50 bg-muted/20 backdrop-blur-sm shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${150 + index * 100}ms` : "0ms",
              }}
            >
              <div className="absolute top-2 left-4 md:top-4 md:left-6 text-[80px] lg:text-[120px] font-extrabold text-foreground/[0.03] dark:text-foreground/[0.05] leading-none pointer-events-none select-none z-0 tracking-tighter">
                {step.number}
              </div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-6 flex justify-between items-start">
                  <h3 className="text-h3 text-foreground mt-2">
                    {step.title}
                  </h3>
                  <span className="inline-flex px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ml-4 mt-2 shrink-0">
                    {step.duration}
                  </span>
                </div>
                <p className="text-body text-muted-foreground mt-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
