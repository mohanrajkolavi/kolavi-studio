"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { TocItem } from "@/lib/blog/utils";

interface BlogPostTOCProps {
  headings: TocItem[];
  /** Max heading level to show (2–6). Default 3 = H2 + H3 only. */
  maxLevel?: 2 | 3 | 4 | 5 | 6;
}

const DESKTOP_BREAKPOINT = "(min-width: 1024px)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_BREAKPOINT);
    const handler = () => setIsDesktop(mq.matches);
    handler(); // Run on mount
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

export function BlogPostTOC({ headings, maxLevel = 3 }: BlogPostTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const isDesktop = useIsDesktop();

  const visibleHeadings = useMemo(
    () => headings.filter((item) => item.level <= maxLevel),
    [headings, maxLevel]
  );

  useEffect(() => {
    if (visibleHeadings.length === 0) return;

    const ids = visibleHeadings.map((h) => h.id);
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
  }, [visibleHeadings]);

  if (visibleHeadings.length === 0) return null;

  const indentByLevel: Record<number, string> = {
    2: "",
    3: "pl-3 ml-1.5 border-l border-border",
    4: "pl-5 ml-1.5 border-l border-border",
    5: "pl-7 ml-1.5 border-l border-border",
    6: "pl-9 ml-1.5 border-l border-border",
  };

  // On mobile, show first 3 items when collapsed, all when expanded
  // On desktop (lg+), always show all items; toggle is lg:hidden so desktop never needs it
  const MOBILE_COLLAPSED_ITEMS = 3;
  const displayHeadings =
    isDesktop || isExpanded || visibleHeadings.length <= MOBILE_COLLAPSED_ITEMS
      ? visibleHeadings
      : visibleHeadings.slice(0, MOBILE_COLLAPSED_ITEMS);

  return (
    <nav
      aria-label="Table of contents"
      role="navigation"
      className="sticky top-24 shrink-0 lg:w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border bg-muted/50 px-4 py-3.5 lg:px-5 dark:bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              On this page
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {visibleHeadings.length} {visibleHeadings.length === 1 ? "section" : "sections"}
            </p>
          </div>
          {/* Mobile toggle button */}
          {visibleHeadings.length > MOBILE_COLLAPSED_ITEMS && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={isExpanded ? "Collapse table of contents" : "Expand table of contents"}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      <ol className="max-h-[calc(100vh-10rem)] overflow-y-auto p-3 lg:p-4 space-y-0.5 list-none">
        {displayHeadings.map((item) => {
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
