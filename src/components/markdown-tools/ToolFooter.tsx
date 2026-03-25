import Link from "next/link";
import { Button } from "@/components/ui/button";

const tools = [
  { href: "/markdown-tools", label: "All Markdown Tools" },
  { href: "/markdown-editor", label: "Markdown Editor" },
  { href: "/markdown-table-generator", label: "Table Generator" },
  { href: "/markdown-to-pdf", label: "Markdown to PDF" },
  { href: "/markdown-cheat-sheet", label: "Cheat Sheet" },
  { href: "/markdown-to-html", label: "Markdown to HTML" },
  { href: "/markdown-formatter", label: "Formatter" },
  { href: "/discord-markdown", label: "Discord Markdown" },
  { href: "/slack-markdown", label: "Slack Markdown" },
  { href: "/github-markdown", label: "GitHub Markdown" },
];

interface ToolFooterProps {
  currentPath?: string;
}

export function ToolFooter({ currentPath }: ToolFooterProps) {
  return (
    <nav
      className="border-t border-border py-8 mt-12"
      aria-label="More markdown tools"
    >
      <p className="text-sm font-medium text-muted-foreground mb-3">
        More markdown tools:
      </p>
      <div className="flex flex-wrap gap-2">
        {tools
          .filter((tool) => tool.href !== currentPath)
          .map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {tool.label}
            </Link>
          ))}
      </div>
    </nav>
  );
}
