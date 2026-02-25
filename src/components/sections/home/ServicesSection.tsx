"use client";

import { Code2, Search, Bot, PenTool, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";

const services = [
  {
    badge: "95+ PageSpeed, Day One",
    title: "Performance Websites",
    hook: "Built to load fast, rank high, and convert.",
    body: "Custom Next.js. No WordPress. No templates. No page builders. 95+ PageSpeed on launch day. Better rankings, lower ad costs, more clients.",
    outcomeStat: "Every site scores 95+ on launch. No exceptions.",
    icon: Code2,
    colSpan: "md:col-span-2 lg:col-span-2",
    padding: "p-8 lg:p-10",
  },
  {
    badge: "Market Capture",
    title: "AI-Powered SEO",
    hook: "Own every search before competitors know what happened.",
    body: "On-page optimization. Technical audits. 50+ directory citations. Monthly backlinks. Programmatic pages at scale. Not maintenance. Market capture.",
    outcomeStat: "First ranking movement within 45 days.",
    icon: Search,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    badge: "24/7 Pipeline",
    title: "Lead Gen and Automation",
    hook: "Leads come in at 3am. The system follows up before you wake up.",
    body: "AI chatbots. CRM integration. Booking confirmations, reminders, nurture sequences. All running without you. No lead goes cold.",
    outcomeStat: "Pipeline live from day one.",
    icon: Bot,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    badge: "30 Posts Per Month",
    title: "Content Engine",
    hook: "30 posts a month. Every one targeting a keyword that closes deals.",
    body: "AI-assisted, human-edited. Every piece maps to a keyword, service, or location. Not filler. Built to rank and compound.",
    outcomeStat: "Compounding typically kicks in by month 3.",
    icon: PenTool,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    badge: "Full Visibility",
    title: "Reputation and Reporting",
    hook: "You will always know exactly where every client came from.",
    body: "Automated review requests. Call tracking tied to campaigns. A real-time dashboard showing exactly what drove each lead. No vanity metrics.",
    outcomeStat: "Live revenue dashboard from day one.",
    icon: BarChart3,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    badge: "Future Ready",
    title: "GEO: AI Search Visibility",
    hook: "Your clients are already searching on ChatGPT. Are you showing up?",
    body: "Google AI Overviews, ChatGPT, Perplexity. Most agencies have never heard of GEO. We build it in from day one. Show up where competitors are invisible.",
    outcomeStat: "Your competitors are not there yet. You will be.",
    icon: Sparkles,
    colSpan: "md:col-span-2 lg:col-span-3",
    padding: "p-8 lg:p-10",
  },
];

export function ServicesSection() {
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="services"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-14 sm:mb-16 ${isVisible ? "animate-reveal" : "opacity-0"
            }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            What We Build
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold text-foreground mb-4 leading-tight tracking-tight">
            Six systems. One goal. More revenue every month.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Every piece connects. SEO brings traffic. The site converts it. Automation captures it. Content compounds it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className={`group relative flex flex-col ${service.colSpan} rounded-[32px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-500 overflow-hidden p-6 sm:p-8 lg:p-10 ${isVisible ? "animate-reveal" : "opacity-0"
                  }`}
                style={{
                  animationDelay: isVisible ? `${120 + index * 80}ms` : "0ms",
                }}
              >
                <div className="absolute top-0 right-0 w-[280px] h-[280px] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" aria-hidden />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-5 flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 border border-primary/20">
                    <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <span className="inline-flex w-fit px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider mb-3 border border-primary/20">
                    {service.badge}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 leading-snug">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base font-medium text-foreground/90 mb-3 leading-snug">
                    {service.hook}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4 leading-relaxed flex-1">
                    {service.body}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-primary leading-snug">
                    {service.outcomeStat}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className={`mt-14 sm:mt-16 text-center ${isVisible ? "animate-reveal" : "opacity-0"}`}
          style={{ animationDelay: isVisible ? "700ms" : "0ms" }}
        >
          <Link
            href="#pricing"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-premium transition-all hover:border-primary/20 hover:shadow-lg"
          >
            View Full Pricing <span className="ml-1.5 text-primary" aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
