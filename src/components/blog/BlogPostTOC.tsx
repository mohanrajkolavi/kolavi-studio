import Link from "next/link";
import type { TocItem } from "@/lib/blog-utils";

interface BlogPostTOCProps {
  headings: TocItem[];
}

export function BlogPostTOC({ headings }: BlogPostTOCProps) {
  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-24 shrink-0 lg:w-56"
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        On this page
      </h3>
      <ul className="space-y-2 border-l border-neutral-200 pl-4">
        {headings.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? "ml-3 border-l border-neutral-200 pl-3" : ""}
          >
            <Link
              href={`#${item.id}`}
              className="block py-1 text-sm text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:rounded"
            >
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
