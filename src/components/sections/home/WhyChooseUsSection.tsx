"use client";

import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const differentiators = [
  {
    title: "Speed is a revenue variable, not a technical footnote.",
    body: "A one-second delay drops conversions by 7 percent. Every site we ship loads in under one second on launch day. Your competitors are running 22-plugin WordPress installs sitting at PageSpeed 54. That gap compounds over every visitor, every day.",
    proof: "95+ PageSpeed, every launch, no exceptions.",
  },
  {
    title: "We do in days what takes other agencies months.",
    body: "AI-powered workflows let us ship 30 SEO posts a month, build 200 programmatic pages, and run automated nurture sequences around the clock. The output scales. Your retainer does not have to.",
    proof: "10x faster delivery than traditional agencies.",
  },
  {
    title: "We report in revenue, not impressions",
    body: "Every dashboard connects campaign activity to booked clients. Call tracking. Conversion attribution. Revenue by source. If we cannot trace a dollar from campaign to client, we fix the tracking before the next report. No vanity metrics.",
    proof: "Every client gets a live revenue dashboard from day one.",
  },
  {
    title: "Your clients are searching on ChatGPT. We make sure they find you.",
    body: "Google AI Overviews, ChatGPT, and Perplexity are already changing how people discover local businesses. Most agencies have never heard of Generative Engine Optimization. We have been building it into every site from day one. Your competitors are invisible there. You will not be.",
    proof: "Your competitors are not there yet. You will be.",
  },
];

const STATS = [
  { value: "95+", label: "PageSpeed on every launch" },
  { value: "31K", label: "Organic visitors built from zero" },
  { value: "0", label: "Templates ever used" },
  { value: "10x", label: "Faster delivery than traditional agencies" },
];

export function WhyChooseUsSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="why-choose-us"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Why Kolavi
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground mb-5 leading-tight tracking-tight">
            Built for 2026.
            <br />
            Not 2012.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Most agencies updated their website. Not their process. We built ours from scratch in 2026, AI-native from day one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-14 sm:mb-16">
          {differentiators.map((diff, index) => (
            <div
              key={diff.title}
              className={`flex flex-col p-7 sm:p-8 lg:p-9 rounded-[24px] border border-border bg-card shadow-sm hover:shadow-md transition-shadow ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${150 + index * 100}ms` : "0ms",
              }}
            >
              <h4 className="text-lg sm:text-xl font-bold text-foreground mb-4 leading-snug">
                {diff.title}
              </h4>
              <p className="text-sm sm:text-base text-muted-foreground leading-[1.65] mb-5">
                {diff.body}
              </p>
              <p className="text-sm font-medium text-primary leading-snug">
                {diff.proof}
              </p>
            </div>
          ))}
        </div>

        {/* Stats block */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              className={`p-6 rounded-[20px] border border-border bg-card/50 text-center ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${550 + index * 80}ms` : "0ms",
              }}
            >
              <div className="text-h3 text-primary font-bold">{stat.value}</div>
              <p className="text-small text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
