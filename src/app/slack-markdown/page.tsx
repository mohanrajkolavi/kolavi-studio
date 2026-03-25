import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Slack Markdown: Text Formatting Guide",
  description:
    "Complete Slack text formatting reference. Covers all Slack-specific mrkdwn syntax including bold, italic, strikethrough, code blocks, lists, and block quotes with copy-ready examples.",
  path: "/slack-markdown",
  keywords:
    "slack markdown, slack formatting, slack text formatting, slack bold text, slack code block, mrkdwn",
});

const syntaxEntries = [
  {
    format: "Bold",
    syntax: "*text*",
    result: "Bold text",
  },
  {
    format: "Italic",
    syntax: "_text_",
    result: "Italic text",
  },
  {
    format: "Strikethrough",
    syntax: "~text~",
    result: "Strikethrough text",
  },
  {
    format: "Inline Code",
    syntax: "`code`",
    result: "Monospaced code",
  },
  {
    format: "Code Block",
    syntax: "```code```",
    result: "Multi-line code block",
  },
  {
    format: "Block Quote",
    syntax: "> text",
    result: "Indented quote",
  },
  {
    format: "Ordered List",
    syntax: "1. item",
    result: "Numbered list item",
  },
  {
    format: "Unordered List",
    syntax: "- item",
    result: "Bulleted list item",
  },
];

export default function SlackMarkdownPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Slack Markdown", url: "/slack-markdown" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "Does Slack use standard markdown?",
      answer:
        "No. Slack uses its own formatting syntax called mrkdwn, which differs from standard Markdown in several ways. For example, bold uses a single asterisk (*text*) instead of double asterisks, and links use angle bracket syntax (<url|text>) instead of square brackets.",
    },
    {
      question: "How do you bold text in Slack?",
      answer:
        "Wrap your text in single asterisks like *text* to make it bold. This is different from standard Markdown, which uses double asterisks. In Slack, single asterisks always produce bold text.",
    },
    {
      question: "How do you use code blocks in Slack?",
      answer:
        "Use a single backtick for inline code (`code`) or triple backticks for a multi-line code block (```code```). Slack code blocks do not support language-specific syntax highlighting.",
    },
    {
      question: "What is mrkdwn?",
      answer:
        "mrkdwn is Slack's custom text formatting syntax. It is similar to Markdown but has key differences: single asterisks for bold, single tildes for strikethrough, angle bracket links, and no support for tables, images, or syntax-highlighted code blocks.",
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
          Slack Markdown: Text Formatting Guide
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Slack uses its own flavour of markdown called mrkdwn. The syntax differs
          from standard Markdown in a few important ways, most notably that bold uses
          a single asterisk instead of double. Use the reference below for
          copy-ready examples.
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
            Slack Quirks
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            <li>
              Slack uses non-standard markdown.{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                *single asterisk*
              </code>{" "}
              produces bold, not italic.
            </li>
            <li>
              Standard Markdown links{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                [text](url)
              </code>{" "}
              are not supported. Use{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                &lt;url|text&gt;
              </code>{" "}
              instead.
            </li>
            <li>
              Code blocks do not support language-specific syntax highlighting.
            </li>
            <li>
              Strikethrough uses a single tilde{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                ~text~
              </code>{" "}
              instead of double{" "}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900">
                ~~text~~
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
        </div>

        <ToolFooter currentPath="/slack-markdown" />
      </div>
    </>
  );
}
