import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import {
  CheckCircle2,
  ArrowRightLeft,
  ArrowLeftRight,
  Sparkles,
  FileEdit,
  BookOpen,
  MessageSquare,
  AlignLeft,
  GitCompareArrows,
  FileQuestion,
  Bug,
  ExternalLink,
  Code2,
  ListTree,
  Anchor,
  Container,
  Boxes,
  FileCode,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";
import { YAML_TOPICS } from "@/lib/yaml/tools-data";

const PAGE_PATH = "/yaml-tools";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";

export const metadata = getPageMetadata({
  title: "Free YAML Tools | Validator, Formatter, Converter & Editor",
  description:
    "Free online YAML tools: validator, YAML to JSON converter, JSON to YAML converter, formatter, editor, and a complete YAML guide. No signup required, all processing in your browser.",
  path: PAGE_PATH,
  keywords:
    "yaml tools, yaml online tools, free yaml tools, yaml utilities, yaml editor online, yaml converter, yaml validator online",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

interface ToolCard {
  href: string;
  icon: React.ElementType;
  name: string;
  description: string;
  featured?: boolean;
}

const tools: ToolCard[] = [
  {
    href: "/yaml-validator",
    icon: CheckCircle2,
    name: "YAML Validator",
    description:
      "Validate YAML syntax instantly. Spot errors with line and column numbers, see detailed messages, and confirm files are well-formed before deployment.",
    featured: true,
  },
  {
    href: "/yaml-to-json",
    icon: ArrowRightLeft,
    name: "YAML to JSON",
    description:
      "Convert YAML to JSON in your browser. Supports anchors, aliases, multiline strings, and nested structures. Copy, download, or upload files.",
    featured: true,
  },
  {
    href: "/json-to-yaml",
    icon: ArrowLeftRight,
    name: "JSON to YAML",
    description:
      "Convert JSON to YAML with custom indentation and key sorting. Safe in-browser conversion, no data leaves your device.",
    featured: true,
  },
  {
    href: "/yaml-formatter",
    icon: Sparkles,
    name: "YAML Formatter",
    description:
      "Format and beautify YAML. Choose 2 or 4 space indentation, sort keys alphabetically, and produce consistent, diff-friendly output.",
  },
  {
    href: "/yaml-editor",
    icon: FileEdit,
    name: "YAML Editor",
    description:
      "Edit YAML in the browser with live validation, syntax highlighting, and localStorage autosave. No signup required.",
  },
  {
    href: "/yaml-guide",
    icon: BookOpen,
    name: "YAML Guide",
    description:
      "Complete plain-English YAML guide. What YAML stands for, file format, syntax rules, and how it compares with JSON and XML.",
  },
];

const TOPIC_ICONS: Record<string, React.ElementType> = {
  comments: MessageSquare,
  "multiline-strings": AlignLeft,
  "yaml-vs-json": GitCompareArrows,
  "yml-vs-yaml": FileQuestion,
  "no-module-named-yaml": Bug,
  python: Code2,
  "arrays-and-lists": ListTree,
  anchors: Anchor,
  kubernetes: Boxes,
  syntax: FileCode,
  "docker-compose": Container,
};

const topics: ToolCard[] = YAML_TOPICS.map((t) => ({
  href: `/yaml-tools/${t.slug}`,
  icon: TOPIC_ICONS[t.slug] ?? FileQuestion,
  name: t.name,
  description: t.description,
}));

function ToolCardItem({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  return (
    <Link href={tool.href} className="group block h-full">
      <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-primary">
        <CardContent className="flex flex-col gap-3 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors">
              {tool.name}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tool.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function YamlToolsHubPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What YAML tools are available here?",
      answer:
        "A YAML validator, YAML to JSON converter, JSON to YAML converter, YAML formatter and beautifier, browser YAML editor with autosave, and a complete YAML guide. We also publish topic guides for comments, multiline strings, YAML vs JSON, .yml vs .yaml, and Python YAML errors.",
    },
    {
      question: "Are these YAML tools free?",
      answer:
        "Yes. Every YAML tool is free with no limits, no watermarks, and no premium tiers. Use them as much as you need without paying anything or creating an account.",
    },
    {
      question: "Is my YAML data private?",
      answer:
        "Yes. All YAML parsing, validation, and conversion happens entirely in your browser. Your YAML content is never sent to a server. Auto-saved drafts live in localStorage on your device only.",
    },
    {
      question: "Which YAML version do these tools support?",
      answer:
        "The tools target YAML 1.2, the most current spec. They handle anchors, aliases, merge keys, multiline strings (literal | and folded >), tagged values, and standard scalar types.",
    },
    {
      question: "What is YAML?",
      answer:
        "YAML stands for YAML Ain't Markup Language. It is a human-readable data serialization language used for configuration files, infrastructure-as-code, and data exchange between languages. YAML uses indentation instead of brackets, making it easier to read than JSON or XML for many config formats.",
    },
    {
      question: "Can I convert YAML to JSON without losing data?",
      answer:
        "Yes for most cases. JSON supports all common YAML scalar types (strings, numbers, booleans, null), maps, and lists. YAML features that have no JSON equivalent - comments, anchors, custom tags, and multiple documents in one file - cannot be preserved during conversion.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free YAML Tools",
    url: "https://kolavistudio.com/yaml-tools",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free online YAML tools: validator, YAML to JSON converter, JSON to YAML converter, formatter, editor, and a complete YAML guide.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free YAML Tools
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Validate, convert, format, and edit YAML in your browser. All free,
            no login required, with copy, download, and share built in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button size="lg" asChild>
              <Link href="/yaml-validator">Validate YAML</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/yaml-to-json">YAML to JSON</Link>
            </Button>
          </div>
        </div>

        {/* Answer-first callout for AI search */}
        <section className="mt-12 rounded-xl border border-border bg-muted/30 p-6 max-w-3xl mx-auto">
          <h2 className="text-base font-semibold mb-2">What can these tools do?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Validate YAML syntax with line-and-column error messages, convert
            between YAML and JSON, format and sort keys, and edit YAML with
            autosave. Every tool is free, browser-based, and processes your data
            locally with no server upload.
          </p>
        </section>

        {/* Tools Grid */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCardItem key={tool.href} tool={tool} />
            ))}
          </div>
        </section>

        {/* Topic Guides */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            YAML Topic Guides
          </h2>
          <p className="text-muted-foreground mb-6">
            Quick-reference pages for the most common YAML questions and gotchas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <ToolCardItem key={topic.href} tool={topic} />
            ))}
          </div>
        </section>

        {/* Why our tools */}
        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Why use our YAML tools?
          </h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <p>
              YAML is everywhere: Kubernetes manifests, GitHub Actions workflows,
              Docker Compose files, Ansible playbooks, OpenAPI specs, and CI
              config across every major platform. A small indentation slip can
              break a deployment, so a fast and accurate YAML toolchain matters.
            </p>
            <ul>
              <li>
                <strong>Zero friction</strong> - every tool works instantly in
                your browser with no signup or installation
              </li>
              <li>
                <strong>Line-and-column errors</strong> - the validator and
                converters surface exact error positions, not vague messages
              </li>
              <li>
                <strong>Privacy-first</strong> - YAML parsing happens in your
                browser; your data never reaches a server
              </li>
              <li>
                <strong>Autosave</strong> - the editor persists drafts to
                localStorage so you never lose work
              </li>
              <li>
                <strong>YAML 1.2 compliant</strong> - handles anchors, aliases,
                merge keys, block scalars, and tagged values
              </li>
            </ul>
          </div>
        </section>

        {/* Cross-link to markdown tools */}
        <section className="mt-16 rounded-xl border border-border bg-card p-6 max-w-3xl">
          <h2 className="text-lg font-semibold mb-2">
            Looking for Markdown tools?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            We also publish a free suite of Markdown tools: editor, table generator,
            HTML converter, PDF converter, formatter, and a full cheat sheet.
          </p>
          <Link
            href="/markdown-tools"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Browse Markdown Tools
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </section>

        <YamlToolFooter currentPath="/yaml-tools" />
      </div>
    </>
  );
}
