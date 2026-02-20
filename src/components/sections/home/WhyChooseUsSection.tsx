"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  {
    target: 95,
    suffix: "+",
    label: "Google PageSpeed",
    expanded: "Every site we ship hits 95+ on Google PageSpeed. Not after months of tweaking. On launch day. This directly impacts your Google rankings, your ad quality scores, and whether a patient stays or bounces in the first 3 seconds. Your competitors are running 50-60. You won't be.",
  },
  {
    target: 100,
    suffix: "%",
    label: "Med Spa Exclusive",
    expanded: "We don't serve restaurants. We don't serve dentists. We don't do e-commerce. Every single workflow, automation, content template, and growth strategy we've built is for medical spas. Botox, fillers, body contouring, laser treatments, GLP-1. Your agency shouldn't need to \"learn your industry.\" We already live in it.",
  },
  {
    target: 10,
    suffix: "x",
    label: "Faster Iteration",
    expanded: "AI-powered workflows let us ship in days what traditional agencies deliver in weeks. 30 blog posts per month. Programmatic pages at scale. Automated nurture sequences. We move at the speed your growth demands, not the speed your agency's bandwidth allows.",
  },
  {
    target: 0,
    suffix: "s",
    label: "Template Code",
    expanded: "No WordPress themes. No Squarespace. No drag-and-drop builders. Every pixel is custom-engineered in Next.js with a headless CMS. This is the reason your site loads faster, ranks higher, and converts better than anything built on the platforms your competitors are still using.",
  },
];

function Counter({ target, isVisible }: { target: number; isVisible: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    
    let rafId: number;
    const duration = 2000;
    const startTime = performance.now();
    
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeProgress * target));
      
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };
    
    rafId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(rafId);
  }, [isVisible, target]);

  return <span>{count}</span>;
}

export function WhyChooseUsSection() {
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
      { threshold: 0.3 }
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
      id="why-choose-us"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div
          className={`text-center max-w-3xl mx-auto mb-24 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="text-label text-primary mb-6 block">THE KOLAVI ADVANTAGE</span>
          <h2 className="text-h2 text-foreground mb-6">
            Engineered to Dominate
          </h2>
          <p className="text-body text-muted-foreground">
            Purpose-built for medical spas from day one. Modern stack. AI-native workflows. Results that legacy agencies can't match at any price.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`flex flex-col p-10 rounded-[20px] bg-muted/20 border border-border/50 backdrop-blur-sm ${
                isVisible ? "animate-reveal" : "opacity-0"
              }`}
              style={{
                animationDelay: isVisible ? `${150 + index * 100}ms` : "0ms",
              }}
            >
              <div className="text-stat text-primary mb-6 flex items-baseline">
                <Counter target={stat.target} isVisible={isVisible} />
                <span className="text-h3 text-primary">{stat.suffix}</span>
              </div>
              <h4 className="text-h4 text-foreground mb-4">
                {stat.label}
              </h4>
              <p className="text-body text-muted-foreground leading-relaxed">
                {stat.expanded}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
