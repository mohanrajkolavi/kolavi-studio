import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

export const metadata = getPageMetadata({
  title: "GitHub Markdown: GFM Reference Guide",
  description:
    "GitHub Flavored Markdown reference with copy-ready examples. Covers tables, task lists, alerts, footnotes, emoji shortcuts, fenced code blocks, and all GFM-specific syntax for READMEs, issues, and pull requests.",
  path: "/github-markdown",
  keywords:
    "github markdown, github flavored markdown, gfm, github readme markdown, github markdown syntax, github markdown table",
});

const syntaxEntries = [
  { format: "Bold", syntax: "**text**", result: "Bold text" },
  { format: "Italic", syntax: "*text*", result: "Italic text" },
  { format: "Bold + Italic", syntax: "***text***", result: "Bold italic text" },
  {
    format: "Strikethrough",
    syntax: "~~text~~",
    result: "Strikethrough text",
  },
  { format: "Inline Code", syntax: "`code`", result: "Monospaced code" },
  {
    format: "Fenced Code Block",
    syntax: "```javascript\ncode\n```",
    result: "Syntax-highlighted block",
  },
  { format: "Heading 1", syntax: "# Header", result: "Large heading" },
  { format: "Heading 2", syntax: "## Header", result: "Medium heading" },
  { format: "Heading 3", syntax: "### Header", result: "Small heading" },
  {
    format: "Unordered List",
    syntax: "- item",
    result: "Bulleted list item",
  },
  {
    format: "Ordered List",
    syntax: "1. item",
    result: "Numbered list item",
  },
  {
    format: "Task List",
    syntax: "- [x] done\n- [ ] todo",
    result: "Interactive checkboxes",
  },
  { format: "Block Quote", syntax: "> text", result: "Indented quote" },
  {
    format: "Link",
    syntax: "[text](url)",
    result: "Clickable linked text",
  },
  {
    format: "Image",
    syntax: "![alt](url)",
    result: "Embedded image",
  },
  {
    format: "Table",
    syntax: "| H1 | H2 |\n| --- | --- |\n| A | B |",
    result: "Formatted table",
  },
  {
    format: "Autolink",
    syntax: "https://example.com",
    result: "Auto-linked URL",
  },
  {
    format: "Emoji",
    syntax: ":emoji_name:",
    result: "Rendered emoji",
  },
  {
    format: "Footnote",
    syntax: "text[^1]\n\n[^1]: footnote",
    result: "Linked footnote reference",
  },
  {
    format: "Alert (Note)",
    syntax: "> [!NOTE]\n> Useful information.",
    result: "Highlighted note callout",
  },
  {
    format: "Alert (Warning)",
    syntax: "> [!WARNING]\n> Critical information.",
    result: "Highlighted warning callout",
  },
  {
    format: "Alert (Tip)",
    syntax: "> [!TIP]\n> Helpful advice.",
    result: "Highlighted tip callout",
  },
];

export default function GitHubMarkdownPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "GitHub Markdown", url: "/github-markdown" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What is GitHub Flavored Markdown?",
      answer:
        "GitHub Flavored Markdown (GFM) is an extended version of standard Markdown used across GitHub. It adds support for tables, task lists, strikethrough, fenced code blocks with syntax highlighting, autolinks, footnotes, and alert callouts. GFM is used in READMEs, issues, pull requests, and discussions.",
    },
    {
      question: "How do you create tables in GitHub markdown?",
      answer:
        "Use pipes (|) to separate columns and hyphens (---) for the header separator row. Every table requires a header row and a separator row to render correctly. You can set column alignment with colons, for example :--- for left, :---: for center, and ---: for right.",
    },
    {
      question: "What are GitHub markdown alerts?",
      answer:
        "Alerts are a GitHub-specific extension that creates highlighted callout boxes. Use > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], or > [!CAUTION] at the start of a block quote. These are rendered with distinct colors and icons on GitHub but may not work in other Markdown processors.",
    },
    {
      question: "How do you add task lists in GitHub markdown?",
      answer:
        "Use - [ ] for an unchecked item and - [x] for a checked item. Task list checkboxes are interactive in issues and pull requests, allowing collaborators to check them off directly. In README files, task lists render as read-only checkboxes.",
    },
  ]);

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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          GitHub Markdown: GFM Reference
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          GitHub Flavored Markdown (GFM) extends standard Markdown with task
          lists, tables, autolinks, alerts, and more. Use this reference for every
          GFM feature available in READMEs, issues, pull requests, and
          discussions.
        </p>

        {/* Prominent CTA */}
        <Card className="mt-8 border-primary/50">
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Preview your GitHub README before pushing
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your README into the editor and see exactly how GitHub will
              render it, including GFM-specific features like task lists, alerts,
              and tables.
            </p>
            <Button asChild>
              <Link href="/markdown-editor?gfm=true">
                Open README Previewer
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Syntax Reference Table */}
        <div className="mt-10 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 font-semibold">Format</th>
                <th className="px-4 py-3 font-semibold">Syntax</th>
                <th className="px-4 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody>
              {syntaxEntries.map((entry) => (
                <tr
                  key={entry.format}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{entry.format}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono whitespace-pre-wrap">
                        {entry.syntax}
                      </code>
                      <CopyButton content={entry.syntax} />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.result}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quirks Note */}
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            GFM Quirks
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li>
              Alerts (
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                [!NOTE]
              </code>
              ,{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                [!WARNING]
              </code>
              , etc.) are a GitHub-specific extension not supported elsewhere.
            </li>
            <li>
              Tables require a header row and a separator row with{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                ---
              </code>{" "}
              to render correctly.
            </li>
            <li>
              Task list checkboxes are interactive in issues and pull requests but
              read-only in README files.
            </li>
            <li>
              Emoji shortcodes like{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                :rocket:
              </code>{" "}
              work on GitHub but may not render in other Markdown processors.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 rounded-lg border bg-muted/50 p-6">
          <p className="text-sm text-muted-foreground">
            Need to write longer markdown?{" "}
            <Link
              href="/markdown-editor"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Try the Markdown Editor
            </Link>{" "}
            for a live preview as you type.
          </p>
        </div>

        <ToolFooter currentPath="/github-markdown" />
      </div>
    </>
  );
}
