import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import {
  FileEdit,
  Table,
  FileDown,
  BookOpen,
  Code,
  Sparkles,
  MessageCircle,
  Hash,
  Github,
  FileText,
  Puzzle,
  Compass,
  Lightbulb,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";
import { MARKDOWN_TOOLS, TOOL_CATEGORIES } from "@/lib/markdown/tools-data";

export const metadata = getPageMetadata({
  title: "Free Markdown Tools | Editor, Converter, Formatter & More",
  description:
    "Free online markdown tools: live editor, table generator, PDF converter, HTML converter, formatter, and cheat sheet. No login required. All processing happens in your browser.",
  path: "/markdown-tools",
  keywords:
    "markdown tools, markdown editor online, markdown converter, free markdown tools, markdown utilities, online markdown",
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
    href: "/markdown-editor",
    icon: FileEdit,
    name: "Markdown Editor",
    description:
      "Write and preview markdown side by side with a live rendered preview. Includes formatting toolbar, GFM support, and auto-save.",
    featured: true,
  },
  {
    href: "/markdown-table-generator",
    icon: Table,
    name: "Table Generator",
    description:
      "Build markdown tables visually or import from CSV. Set column alignment and copy the output in one click.",
    featured: true,
  },
  {
    href: "/markdown-to-pdf",
    icon: FileDown,
    name: "Markdown to PDF",
    description:
      "Convert markdown to a clean PDF with multiple themes including default, GitHub, and resume. Choose font size and page format.",
  },
  {
    href: "/markdown-cheat-sheet",
    icon: BookOpen,
    name: "Cheat Sheet",
    description:
      "Complete markdown syntax reference with live previews, copy buttons, and links to try each example in the editor.",
    featured: true,
  },
  {
    href: "/markdown-to-html",
    icon: Code,
    name: "Markdown to HTML",
    description:
      "Convert markdown to semantic HTML with syntax highlighting. Toggle GFM, sanitization, minification, and HTML wrapper.",
  },
  {
    href: "/markdown-formatter",
    icon: Sparkles,
    name: "Formatter & Beautifier",
    description:
      "Clean up messy markdown automatically. Fixes heading spacing, list indentation, blank lines, and bold/italic markers.",
  },
];

const references: ToolCard[] = [
  {
    href: "/discord-markdown",
    icon: MessageCircle,
    name: "Discord Markdown",
    description:
      "Every Discord formatting code including bold, italic, spoilers, code blocks, and more with copy-ready examples.",
  },
  {
    href: "/slack-markdown",
    icon: Hash,
    name: "Slack Markdown",
    description:
      "Slack text formatting reference covering its non-standard syntax like single asterisk bold, tilde strikethrough, and more.",
  },
  {
    href: "/github-markdown",
    icon: Github,
    name: "GitHub Markdown",
    description:
      "GitHub Flavored Markdown reference covering task lists, tables, alerts, emoji shortcuts, and footnotes.",
  },
];

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

export default function MarkdownToolsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What markdown tools are available?",
      answer:
        "We offer a live markdown editor with preview, a visual table generator, a markdown to PDF converter, a markdown to HTML converter, a formatter and beautifier, and a complete cheat sheet. We also provide platform-specific guides for Discord, Slack, and GitHub markdown.",
    },
    {
      question: "Are these markdown tools free?",
      answer:
        "Yes. Every tool is completely free to use with no limits, no watermarks, and no premium tiers. You can use them as much as you need without paying anything.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "No. All tools work instantly in your browser with no signup, login, or account required. Just open a tool and start using it right away.",
    },
    {
      question: "Is my data private when using these tools?",
      answer:
        "Yes. All processing happens entirely in your browser. Your markdown content is never sent to a server. Auto-saved content is stored in your browser's local storage and stays on your device.",
    },
    {
      question: "What is markdown?",
      answer:
        "Markdown is a lightweight markup language that uses plain text formatting syntax. It lets you write structured content using simple characters like asterisks for bold, hashes for headings, and dashes for lists. Markdown is widely used for documentation, README files, blog posts, and notes.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Markdown Tools",
    url: "https://kolavistudio.com/markdown-tools",
    applicationCategory: "Utility",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Free online markdown tools including a live editor, table generator, PDF converter, HTML converter, formatter, and cheat sheet. No login required.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appSchema),
        }}
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free Markdown Tools
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to write, convert, format, and reference
            markdown. All free, no login required. Pick a tool and get started
            instantly.
          </p>
          <div className="mt-6">
            <Button size="lg" asChild>
              <Link href="/markdown-editor">Open Markdown Editor</Link>
            </Button>
          </div>
        </div>

        {/* Tools Grid */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCardItem key={tool.href} tool={tool} />
            ))}
          </div>
        </section>

        {/* Reference Guides */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            Platform Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {references.map((tool) => (
              <ToolCardItem key={tool.href} tool={tool} />
            ))}
          </div>
        </section>

        {/* Syntax & Learning */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-6">
            Learn Markdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { href: "/markdown-guide", icon: Compass, name: "Getting Started", description: "Beginner-friendly introduction to markdown" },
              { href: "/markdown-syntax", icon: FileText, name: "Basic Syntax", description: "Complete reference for core markdown elements" },
              { href: "/markdown-extended-syntax", icon: Puzzle, name: "Extended Syntax", description: "Tables, footnotes, task lists, and more" },
              { href: "/markdown-hacks", icon: Lightbulb, name: "Hacks & Tips", description: "Workarounds for things markdown doesn't natively support" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="group block h-full">
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30">
                  <CardContent className="flex flex-col gap-2 p-5">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{item.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Apps & Tools That Support Markdown */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            Apps That Support Markdown
          </h2>
          <p className="text-muted-foreground mb-8">
            Markdown support guides for popular apps, editors, and platforms.
          </p>
          {TOOL_CATEGORIES.map((category) => {
            const categoryTools = MARKDOWN_TOOLS.filter(
              (t) => t.category === category.id
            );
            if (categoryTools.length === 0) return null;
            return (
              <div key={category.id} className="mb-10">
                <h3 className="text-lg font-semibold mb-1">{category.label}</h3>
                <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {categoryTools.map((tool) => {
                    const href = tool.externalPath || `/markdown-tools/${tool.slug}`;
                    return (
                      <Link
                        key={tool.slug}
                        href={href}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {tool.name}
                        <ExternalLink className="h-3 w-3 opacity-40" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* SEO Content */}
        <section className="mt-16 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Why use our markdown tools?
          </h2>
          <div className="prose dark:prose-invert max-w-none text-muted-foreground">
            <p>
              Markdown is the universal language for writing structured content,
              from GitHub READMEs to blog posts, documentation, and notes. Our
              free tools make it easy to write, preview, convert, and format
              markdown without installing anything.
            </p>
            <ul>
              <li>
                <strong>Zero friction</strong> - every tool works instantly in
                your browser with no signup or login
              </li>
              <li>
                <strong>Auto-save</strong> - your work persists across sessions
                via local storage
              </li>
              <li>
                <strong>Shareable</strong> - generate a URL that captures your
                exact editor state for easy sharing
              </li>
              <li>
                <strong>Privacy-first</strong> - all processing happens in your
                browser; nothing is sent to a server
              </li>
            </ul>
          </div>
        </section>

        <ToolFooter currentPath="/markdown-tools" />
      </div>
    </>
  );
}
