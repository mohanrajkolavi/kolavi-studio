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
      className="sticky top-24 shrink-0 lg:w-60 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      {/* Accent header */}
      <div className="border-b border-neutral-100 bg-gradient-to-r from-neutral-50 to-white px-4 py-3.5 lg:px-5">
        <h3 className="text-sm font-semibold text-neutral-800">
          On this page
        </h3>
        <p className="mt-0.5 text-xs text-neutral-500">
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
              className={isH3 ? "pl-3 ml-1.5 border-l border-neutral-200" : ""}
            >
              <Link
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`
                  relative block rounded-lg py-2 px-3 text-left text-sm transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2
                  ${isH3 ? "text-neutral-600" : "font-medium text-neutral-800"}
                  ${isActive
                    ? "bg-orange-50 text-orange-700 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-orange-500 before:content-['']"
                    : "hover:bg-neutral-50 hover:text-neutral-900"}
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
