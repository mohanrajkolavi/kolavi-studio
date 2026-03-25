import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Discord Markdown Guide: Complete Formatting Reference",
  description:
    "Every Discord markdown formatting code with copy-ready examples. Learn bold, italic, code blocks, spoilers, headings, lists, and masked links for Discord messages.",
  path: "/discord-markdown",
  keywords:
    "discord markdown, discord formatting, discord text formatting, discord bold italic, discord code block, discord spoiler text",
});

const syntaxEntries = [
  { format: "Bold", syntax: "**text**", result: "Bold text" },
  { format: "Italic", syntax: "*text*", result: "Italic text" },
  { format: "Underline", syntax: "__text__", result: "Underlined text" },
  {
    format: "Strikethrough",
    syntax: "~~text~~",
    result: "Strikethrough text",
  },
  { format: "Inline Code", syntax: "`code`", result: "Monospaced code" },
  {
    format: "Code Block",
    syntax: "```language\ncode\n```",
    result: "Syntax-highlighted block",
  },
  { format: "Spoiler", syntax: "||text||", result: "Hidden until clicked" },
  { format: "Block Quote", syntax: "> text", result: "Indented quote" },
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
    format: "Masked Link",
    syntax: "[text](url)",
    result: "Clickable linked text",
  },
];

export default function DiscordMarkdownPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Discord Markdown", url: "/discord-markdown" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "Does Discord support markdown?",
      answer:
        "Yes. Discord supports a subset of Markdown for formatting messages. You can use bold, italic, underline, strikethrough, code blocks, spoiler tags, block quotes, headings, lists, and masked links directly in chat messages.",
    },
    {
      question: "How do you bold text in Discord?",
      answer:
        "Wrap your text in double asterisks like **text** to make it bold. You can combine bold with italic using ***text*** for bold italic formatting.",
    },
    {
      question: "How do you use code blocks in Discord?",
      answer:
        "Use a single backtick for inline code (`code`) or triple backticks for a multi-line code block. Add a language name after the opening triple backticks for syntax highlighting, for example ```javascript.",
    },
    {
      question: "What markdown features does Discord not support?",
      answer:
        "Discord does not support images, tables, horizontal rules, or footnotes in markdown. Headings only work at the start of a message, and masked links require the full URL including https://.",
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
          Discord Markdown: Complete Formatting Guide
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discord supports a subset of Markdown for formatting messages. Use the
          reference below to style your text with bold, italic, code blocks,
          spoilers, and more. Each example is copy-ready.
        </p>

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
            Discord Quirks
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li>
              Markdown in embeds may render differently than in regular messages.
            </li>
            <li>
              Headings (H1 to H3) only work at the start of a message, not
              mid-paragraph.
            </li>
            <li>
              Masked links require the full URL including{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                https://
              </code>
              .
            </li>
            <li>
              Nested formatting (e.g. bold + italic) uses{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                ***text***
              </code>
              .
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/markdown-tools"
              className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Browse all tools
            </Link>
            <Link
              href="/markdown-cheat-sheet"
              className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cheat Sheet
            </Link>
          </div>
        </div>

        <ToolFooter currentPath="/discord-markdown" />
      </div>
    </>
  );
}
