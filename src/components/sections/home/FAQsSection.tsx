"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { HOMEPAGE_FAQ_ITEMS } from "@/lib/constants/homepage-faq";

function FAQItem({
  item,
  isOpen,
  onClick,
  delay,
  isVisible,
}: {
  item: { question: string; answer: string };
  isOpen: boolean;
  onClick: () => void;
  delay: string;
  isVisible: boolean;
}) {
  return (
    <div
      className={`border-b border-border transition-colors duration-300 ${
        isVisible ? "animate-reveal" : "opacity-0"
      } ${isOpen ? "bg-muted/30" : "hover:bg-muted/10"}`}
      style={{ animationDelay: isVisible ? delay : "0ms" }}
    >
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        className="w-full py-5 sm:py-6 px-5 sm:px-6 flex items-center justify-between text-left gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
      >
        <span className={`text-h4 transition-colors duration-300 ${isOpen ? "text-primary" : "text-foreground group-hover:text-primary/80"}`}>
          {item.question}
        </span>
        <span 
          className={`flex-shrink-0 text-primary transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          {isOpen ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6 px-5 sm:px-6 text-sm sm:text-base text-muted-foreground leading-[1.65] transform transition-transform duration-300 ease-in-out origin-top">
            {item.answer}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FAQsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [sectionRef, isVisible] = useRevealOnScroll({ threshold: 0.2 });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 bg-background py-20 sm:py-24 md:py-28"
      id="faqs"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div
          className={`text-center mb-12 sm:mb-14 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="inline-block text-xs sm:text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight tracking-tight">
            Questions worth asking.
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Not finding what you need? Book a free audit call. We answer everything before you commit to anything.
          </p>
        </div>

        <div className="border-t border-border rounded-lg overflow-hidden">
          {HOMEPAGE_FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              delay={`${150 + index * 100}ms`}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
