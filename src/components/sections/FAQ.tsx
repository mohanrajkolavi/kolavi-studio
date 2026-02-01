"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="space-y-4">
            {items.map((item, index) => {
              const answerId = `faq-answer-${index}`;
              const isOpen = openIndex === index;
              return (
                <div key={index} className="border-b pb-4">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                  >
                    <span className="text-lg font-semibold">{item.question}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform",
                        isOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  <div id={answerId} role="region">
                    {isOpen && (
                      <p className="mt-4 text-muted-foreground">{item.answer}</p>
                    )}
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
