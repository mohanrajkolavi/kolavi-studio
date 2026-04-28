import Link from "next/link";

const tools = [
  { href: "/yaml-tools", label: "All YAML Tools" },
  { href: "/yaml-validator", label: "YAML Validator" },
  { href: "/yaml-to-json", label: "YAML to JSON" },
  { href: "/json-to-yaml", label: "JSON to YAML" },
  { href: "/yaml-formatter", label: "YAML Formatter" },
  { href: "/yaml-editor", label: "YAML Editor" },
  { href: "/yaml-diff", label: "YAML Diff" },
  { href: "/yaml-guide", label: "YAML Guide" },
  { href: "/yaml-tools/syntax", label: "YAML Syntax" },
  { href: "/yaml-tools/comments", label: "YAML Comments" },
  { href: "/yaml-tools/multiline-strings", label: "Multiline Strings" },
  { href: "/yaml-tools/anchors", label: "YAML Anchors" },
  { href: "/yaml-tools/arrays-and-lists", label: "Arrays & Lists" },
  { href: "/yaml-tools/yaml-vs-json", label: "YAML vs JSON" },
  { href: "/yaml-tools/yml-vs-yaml", label: "YML vs YAML" },
  { href: "/yaml-tools/python", label: "YAML in Python" },
  { href: "/yaml-tools/kubernetes", label: "Kubernetes YAML" },
  { href: "/yaml-tools/docker-compose", label: "Docker Compose YAML" },
  { href: "/yaml-tools/no-module-named-yaml", label: "Fix: No module named yaml" },
];

interface YamlToolFooterProps {
  currentPath?: string;
}

export function YamlToolFooter({ currentPath }: YamlToolFooterProps) {
  return (
    <nav
      className="border-t border-border py-8 mt-12"
      aria-label="More YAML tools"
    >
      <p className="text-sm font-medium text-muted-foreground mb-3">
        More YAML tools:
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
