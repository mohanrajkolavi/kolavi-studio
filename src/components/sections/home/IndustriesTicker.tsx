"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TREATMENTS = [
    "Botox",
    "Dermal Fillers",
    "CoolSculpting",
    "Laser Hair Removal",
    "HydraFacial",
    "Microneedling",
    "Chemical Peels",
    "IPL Photofacial",
    "Body Contouring",
    "Skin Tightening",
    "IV Therapy",
    "Laser Resurfacing",
    "PDO Threads",
    "Morpheus8",
    "Emsculpt",
];

export function IndustriesTicker() {
    const [isPaused, setIsPaused] = useState(false);
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            addAnimation();
        }
    }, []);

    function addAnimation() {
        if (scrollerRef.current) {
            const scrollerContent = scrollerRef.current.querySelector(".scroller-inner");
            if (scrollerContent && scrollerContent.children.length < TREATMENTS.length * 2) { // minimal check to avoid double cloning
                const scrollerContentChildren = Array.from(scrollerContent.children);
                scrollerContentChildren.forEach((item) => {
                    const duplicatedItem = item.cloneNode(true) as HTMLElement;
                    duplicatedItem.setAttribute("aria-hidden", "true");
                    if (scrollerRef.current) {
                        scrollerContent.appendChild(duplicatedItem);
                    }
                });
            }
        }
    }

    return (
        <section
            className="border-y border-border bg-muted/30 py-10 overflow-hidden"
            aria-label="Treatments we specialize in"
        >
            <div className="container mx-auto px-4 mb-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dominating Every Treatment
                </p>
            </div>

            <div
                className="scroller ticker-mask relative z-20 mx-auto max-w-7xl overflow-hidden"
                ref={scrollerRef}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div
                    className={cn(
                        "scroller-inner flex w-max min-w-full gap-8 py-4 flex-nowrap",
                        !isPaused && "animate-scroll"
                    )}
                >
                    {TREATMENTS.map((item, idx) => (
                        <span
                            key={item + idx}
                            className="relative rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm whitespace-nowrap"
                        >
                            {item}
                        </span>
                    ))}
                    {TREATMENTS.map((item, idx) => (
                        <span
                            key={item + idx + "duplicate"}
                            className="relative rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm whitespace-nowrap"
                            aria-hidden="true"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <style jsx global>{`
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        @keyframes scroll {
          to {
            transform: translate(calc(-50% - 0.5rem));
          }
        }
      `}</style>
        </section>
    );
}
