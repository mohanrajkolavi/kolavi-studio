"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolHeader } from "@/components/markdown-tools/ToolHeader";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";
import { parseMarkdown } from "@/lib/markdown/parser";
import { encodeShareContent } from "@/lib/markdown/shareUrl";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SyntaxEntry {
  syntax: string;
  label?: string;
}

interface CheatSheetSection {
  id: string;
  name: string;
  entries: SyntaxEntry[];
}

const sections: CheatSheetSection[] = [
  {
    id: "headings",
    name: "Headings",
    entries: [
      { syntax: "# Heading 1", label: "H1 heading" },
      { syntax: "## Heading 2", label: "H2 heading" },
      { syntax: "### Heading 3", label: "H3 heading" },
    ],
  },
  {
    id: "emphasis",
    name: "Emphasis",
    entries: [
      { syntax: "**bold text**", label: "Bold" },
      { syntax: "*italic text*", label: "Italic" },
      { syntax: "~~strikethrough~~", label: "Strikethrough" },
    ],
  },
  {
    id: "lists",
    name: "Lists",
    entries: [
      {
        syntax: "- Unordered item\n  - Sub-item\n  - Sub-item\n- Another item",
        label: "Unordered list",
      },
      {
        syntax: "1. First item\n2. Second item\n3. Third item",
        label: "Ordered list",
      },
    ],
  },
  {
    id: "links",
    name: "Links",
    entries: [
      { syntax: "[Link text](https://example.com)", label: "Basic link" },
      {
        syntax: '[Link with title](https://example.com "Title")',
        label: "Link with title",
      },
    ],
  },
  {
    id: "images",
    name: "Images",
    entries: [
      {
        syntax: "![Alt text](https://via.placeholder.com/150)",
        label: "Image",
      },
    ],
  },
  {
    id: "code",
    name: "Code",
    entries: [
      { syntax: "`inline code`", label: "Inline code" },
      {
        syntax:
          '```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```',
        label: "Fenced code block",
      },
    ],
  },
  {
    id: "tables",
    name: "Tables",
    entries: [
      {
        syntax:
          "| Name | Age | Role |\n| :--- | :---: | ---: |\n| Alice | 30 | Engineer |\n| Bob | 25 | Designer |",
        label: "Table with alignment",
      },
    ],
  },
  {
    id: "blockquotes",
    name: "Blockquotes",
    entries: [
      { syntax: "> Single blockquote", label: "Blockquote" },
      { syntax: ">> Nested blockquote", label: "Nested blockquote" },
    ],
  },
  {
    id: "horizontal-rule",
    name: "Horizontal Rule",
    entries: [{ syntax: "---", label: "Horizontal rule" }],
  },
  {
    id: "task-lists",
    name: "Task Lists",
    entries: [
      { syntax: "- [x] Completed task", label: "Completed task" },
      { syntax: "- [ ] Incomplete task", label: "Incomplete task" },
    ],
  },
  {
    id: "strikethrough",
    name: "Strikethrough",
    entries: [{ syntax: "~~deleted text~~", label: "Strikethrough" }],
  },
];

function SyntaxCard({ entry }: { entry: SyntaxEntry }) {
  const html = useMemo(
    () => parseMarkdown(entry.syntax, { gfm: true, sanitize: true }),
    [entry.syntax]
  );

  const tryItUrl = useMemo(
    () => `/markdown-editor?c=${encodeShareContent(entry.syntax)}`,
    [entry.syntax]
  );

  return (
    <Card>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col gap-2">
          <pre className="rounded-md bg-muted px-3 py-2 text-sm font-mono whitespace-pre-wrap break-words">
            <code>{entry.syntax}</code>
          </pre>
          <div className="flex items-center gap-2">
            <CopyButton content={entry.syntax} label="Copy" />
            <Button variant="link" size="sm" asChild>
              <a href={tryItUrl}>Try it &rarr;</a>
            </Button>
          </div>
        </div>
        <div
          className="prose prose-sm dark:prose-invert max-w-none rounded-md border border-border px-3 py-2 overflow-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  );
}

export function CheatSheetClient() {
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string>(sections[0].id);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const el of sectionRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        entries: section.entries.filter(
          (entry) =>
            entry.syntax.toLowerCase().includes(q) ||
            section.name.toLowerCase().includes(q) ||
            (entry.label && entry.label.toLowerCase().includes(q))
        ),
      }))
      .filter((section) => section.entries.length > 0);
  }, [search]);

  function registerRef(id: string, el: HTMLElement | null) {
    if (el) {
      sectionRefs.current.set(id, el);
    } else {
      sectionRefs.current.delete(id);
    }
  }

  function scrollToSection(id: string) {
    const el = sectionRefs.current.get(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolHeader
        title="Markdown Cheat Sheet"
        description="Complete markdown syntax reference with live examples. Copy any syntax in one click."
      />

      <div className="relative mt-8 max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search syntax..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label="Search markdown syntax"
        />
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block shrink-0" style={{ width: 200 }}>
          <nav
            className="sticky top-20 flex flex-col gap-0.5"
            aria-label="Sections"
          >
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start text-sm font-normal",
                  activeSection === section.id &&
                    "bg-accent text-accent-foreground font-medium"
                )}
                onClick={() => scrollToSection(section.id)}
              >
                {section.name}
              </Button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-12">
          {filteredSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              ref={(el) => registerRef(section.id, el)}
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  {section.name}
                </h2>
                {section.id === "tables" && (
                  <Link
                    href="/markdown-table-generator"
                    className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Build tables visually
                  </Link>
                )}
              </div>
              <div className="space-y-4">
                {section.entries.map((entry, idx) => (
                  <SyntaxCard key={`${section.id}-${idx}`} entry={entry} />
                ))}
              </div>
            </section>
          ))}

          {filteredSections.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No results found for &ldquo;{search}&rdquo;
            </p>
          )}
        </main>
      </div>

      <ToolFooter currentPath="/markdown-cheat-sheet" />
    </div>
  );
}
