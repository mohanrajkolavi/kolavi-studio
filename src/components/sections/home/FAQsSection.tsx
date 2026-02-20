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
        className="w-full py-8 px-4 sm:px-8 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 group"
      >
        <span className={`text-h4 transition-colors duration-300 pr-8 ${isOpen ? "text-primary" : "text-foreground group-hover:text-primary/80"}`}>
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
          <div className="pb-8 px-4 sm:px-8 text-body text-muted-foreground max-w-3xl transform transition-transform duration-300 ease-in-out origin-top">
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
      className="relative z-10 bg-background py-24 sm:py-32"
      id="faqs"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div
          className={`text-center mb-16 ${
            isVisible ? "animate-reveal" : "opacity-0"
          }`}
        >
          <span className="text-label text-primary mb-6 block">FAQ</span>
          <h2 className="text-h2 text-foreground mb-6">
            Common Questions
          </h2>
        </div>

        <div className="border-t border-border">
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
