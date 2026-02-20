"use client";

import { useEffect, useRef, useState } from "react";
import { Code2, Search, Bot, PenTool, BarChart3, Sparkles } from "lucide-react";
import Link from "next/link";

const services = [
  {
    title: "Next.js + Headless CMS",
    description:
      "Your site runs on the same architecture powering Netflix, TikTok, and Vercel. Sub-second load times. 95+ PageSpeed scores on launch day. ADA + HIPAA compliance baked in, not bolted on. No WordPress themes. No page builders. No compromises. A conversion-first platform that makes your competitors' sites feel slow by comparison.",
    icon: Code2,
    colSpan: "md:col-span-2 lg:col-span-2",
    padding: "p-10 lg:p-12",
  },
  {
    title: "AI-Powered SEO",
    description:
      "On-page optimization. Technical audits. Citation building across 50+ directories. Monthly high-DR backlinks. Programmatic SEO generating targeted city + treatment pages at scale. We don't optimize. We engineer your site to own every profitable keyword in your market before your competitors know what happened.",
    icon: Search,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    title: "Lead Gen & Automation",
    description:
      "AI chatbots capturing leads at 3AM. Multi-step funnels with CRM integration. Automated booking confirmations, appointment reminders, post-consultation nurture sequences, and dedicated GLP-1 funnels for weight loss services. Every touchpoint runs on autopilot. No lead goes cold. No opportunity dies in an inbox.",
    icon: Bot,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    title: "Content Engine",
    description:
      "Up to 30 SEO-optimized posts per month. AI-assisted, human-edited, built to rank. Video content editing for Reels, TikTok, and Shorts. We don't publish filler content to hit a word count. Every piece targets a specific keyword, treatment, or location to compound your organic traffic month over month.",
    icon: PenTool,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    title: "Reputation & Reporting",
    description:
      "Automated review requests after every patient visit. Professional responses to every review. Call tracking tying inbound calls directly to campaigns. A real-time dashboard showing exactly what's working and what's not. Monthly reports with live walkthroughs on higher tiers. You shouldn't need to guess where your money is going.",
    icon: BarChart3,
    colSpan: "md:col-span-1 lg:col-span-1",
    padding: "p-8 lg:p-10",
  },
  {
    title: "GEO: AI Search Optimization",
    description:
      "Your patients are already searching through ChatGPT, Perplexity, and Google AI Overviews. Most agencies haven't even heard of GEO yet. We've been building it in from day one. We optimize your med spa to show up in AI-powered search surfaces where your competitors are completely invisible. This isn't a nice-to-have anymore. It's where search is going, and we're already there.",
    icon: Sparkles,
    colSpan: "md:col-span-2 lg:col-span-3",
    padding: "p-10 lg:p-12",
  },
];

export function ServicesSection() {
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
      id="services"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-20 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="text-label text-primary mb-6 block">OUR SERVICES</span>
          <h2 className="text-h2 text-foreground mb-6">
            Engineered for High-Ticket Growth
          </h2>
          <p className="text-body text-muted-foreground">
            We don't build websites. We build performance-driven patient acquisition systems, custom-engineered for medical spas competing at the top.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className={`flex flex-col ${service.colSpan} ${service.padding} rounded-[20px] border border-border/50 bg-muted/20 backdrop-blur-sm shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${
                  isVisible ? "animate-reveal" : "opacity-0"
                }`}
                style={{
                  animationDelay: isVisible ? `${150 + index * 100}ms` : "0ms",
                }}
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 self-start">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-h4 text-foreground mb-4">
                  {service.title}
                </h3>
                <p className="text-body text-muted-foreground">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
        
        <div 
          className={`mt-16 text-center text-body text-muted-foreground ${isVisible ? "animate-reveal" : "opacity-0"}`}
          style={{ animationDelay: isVisible ? "750ms" : "0ms" }}
        >
          Every service available across three tiers, from launch to total market dominance.{" "}
          <Link href="#pricing" className="text-primary font-medium hover:underline inline-flex items-center">
            View Full Pricing <span className="ml-1">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
