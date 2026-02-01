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
    const rootMargin = "-80px 0% -70% 0%";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            return;
          }
        }
      },
      { rootMargin, threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-24 shrink-0 lg:w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Accent header */}
      <div className="border-b border-border bg-muted/50 px-4 py-3.5 lg:px-5 dark:bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground">
          On this page
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {headings.length} {headings.length === 1 ? "section" : "sections"}
        </p>
      </div>

      <ul className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3 lg:p-4 space-y-0.5">
        {headings.map((item) => {
          const isActive = activeId === item.id;
          const isH3 = item.level === 3;

          return (
            <li
              key={item.id}
              className={isH3 ? "pl-3 ml-1.5 border-l border-border" : ""}
            >
              <Link
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`
                  relative block rounded-lg py-2 px-3 text-left text-sm transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  ${isH3 ? "text-muted-foreground" : "font-medium text-foreground"}
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
      </ul>
    </nav>
  );
}
