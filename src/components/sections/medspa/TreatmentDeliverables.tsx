"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DELIVERABLES = [
  {
    category: "Injectable SEO Package",
    items: [
      "Dedicated pages for each brand (Botox, Dysport, Xeomin, Jeuveau)",
      "Filler-specific variations (lip, cheek, nasolabial)",
      "Comparison content (Botox vs Dysport, filler types)",
      "Area-specific content (forehead, crow's feet, etc.)",
      "GEO optimization for AI search",
    ],
  },
  {
    category: "Body Contouring Package",
    items: [
      "Technology pages (CoolSculpting, Emsculpt, SculpSure)",
      "Body area pages (abdomen, thighs, arms)",
      "Post-GLP-1 body contouring content",
      "Before/after optimization",
      "Comparison content (CoolSculpting vs Emsculpt)",
    ],
  },
  {
    category: "Laser Package",
    items: [
      "Service-specific pages (face, underarms, legs, etc.)",
      "Skin type safety content",
      "Technology brand pages",
      "Results timelines and expectations",
    ],
  },
  {
    category: "Skin Rejuvenation Package",
    items: [
      "Modality pages (chemical peels, microneedling, HydraFacial)",
      "Condition-specific content (acne, hyperpigmentation, aging)",
      "Treatment combination content",
    ],
  },
];

export function TreatmentDeliverables() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-border py-20 sm:py-28" aria-labelledby="deliverables-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Treatment-Specific Deliverables
            </span>
          </div>
          <h2 id="deliverables-heading" className="mx-auto max-w-2xl text-center text-2xl font-semibold tracking-tight sm:text-4xl">
            Exactly what we deliver for each category
          </h2>

          <div className="mt-16 space-y-4">
            {DELIVERABLES.map((d, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={d.category}
                  className="rounded-2xl border border-border bg-muted/20 overflow-hidden"
                >
                  <button
                    type="button"
                    id={`button-${index}`}
                    aria-expanded={isOpen}
                    aria-controls={`panel-${index}`}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                  >
                    <h3 className="text-lg font-semibold">{d.category}</h3>
                    <ChevronDown
                      className={cn("h-5 w-5 transition-transform", isOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div
                      id={`panel-${index}`}
                      aria-labelledby={`button-${index}`}
                      className="border-t border-border px-6 pb-6 pt-2"
                    >
                      <ul className="space-y-2">
                        {d.items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-muted-foreground">
                            <span className="text-orange-500 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
