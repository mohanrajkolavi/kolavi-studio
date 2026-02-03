"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/blog-utils";

interface BlogPostTOCProps {
  headings: TocItem[];
}

export function BlogPostTOC({ headings }: BlogPostTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const ids = headings.map((h) => h.id);
    const offset = 100; // Pixels from top of viewport (below header)

    const updateActiveId = () => {
      let active: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset) {
          active = id;
        }
      }
      if (active) setActiveId(active);
      else if (ids.length > 0) setActiveId(ids[0]);
    };

    updateActiveId();
    window.addEventListener("scroll", updateActiveId, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveId);
  }, [headings]);

  if (headings.length === 0) return null;

  const indentByLevel: Record<number, string> = {
    2: "",
    3: "pl-3 ml-1.5 border-l border-border",
    4: "pl-5 ml-1.5 border-l border-border",
    5: "pl-7 ml-1.5 border-l border-border",
    6: "pl-9 ml-1.5 border-l border-border",
  };

  return (
    <nav
      aria-label="Table of contents"
      role="navigation"
      className="sticky top-24 shrink-0 lg:w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border bg-muted/50 px-4 py-3.5 lg:px-5 dark:bg-muted/30">
        <p className="text-sm font-semibold text-foreground">
          On this page
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {headings.length} {headings.length === 1 ? "section" : "sections"}
        </p>
      </div>

      <ol
        className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3 lg:p-4 space-y-0.5 list-none"
        role="list"
      >
        {headings.map((item) => {
          const isActive = activeId === item.id;
          const isSubheading = item.level >= 3;

          return (
            <li key={item.id} className={indentByLevel[item.level] ?? ""}>
              <Link
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`
                  relative block rounded-lg py-2 px-3 text-left text-sm transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  ${isSubheading ? "text-muted-foreground" : "font-medium text-foreground"}
                  ${isActive
                    ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-orange-500 dark:before:bg-orange-400 before:content-['']"
                    : "hover:bg-muted hover:text-foreground"}
                `}
              >
                <span className="line-clamp-2">{item.text}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
