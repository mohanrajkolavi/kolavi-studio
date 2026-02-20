"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  title?: string;
  items: FAQItem[];
  className?: string;
}

export function FAQ({
  title = "Frequently Asked Questions",
  items,
  className,
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-h2 text-foreground">
              {title}
            </h2>
          </div>
        )}
        <div className="mx-auto max-w-3xl">
          <div className="border-t border-border">
            {items.map((item, index) => {
              const answerId = `faq-answer-${index}`;
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`border-b border-border transition-colors duration-300 animate-reveal ${
                    isOpen ? "bg-muted/30" : "hover:bg-muted/10"
                  }`}
                  style={{ animationDelay: `${150 + index * 100}ms` }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    id={`${answerId}-button`}
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
                    id={answerId}
                    role="region"
                    aria-labelledby={`${answerId}-button`}
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
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
