import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Markdown Extended Syntax - Tables, Footnotes, Task Lists & More",
  description:
    "Complete reference for extended markdown syntax including tables, fenced code blocks, footnotes, task lists, strikethrough, emoji, and more. Copy-ready examples for every element.",
  path: "/markdown-extended-syntax",
  keywords:
    "markdown extended syntax, markdown table, markdown footnotes, markdown task list, markdown strikethrough, markdown emoji, GFM syntax",
});

const sections = [
  {
    id: "tables",
    title: "Tables",
    description:
      "Create tables using pipes (|) and hyphens (-). The second row of hyphens separates the header from the body. Use colons to control column alignment: left-align with :---, center with :---:, and right-align with ---:.",
    syntax: `| Feature   | Supported | Notes        |
| :-------- | :-------: | -----------: |
| Tables    | Yes       | GFM required |
| Footnotes | Yes       | Limited       |
| Emoji     | Yes       | :smile:      |`,
    support: "GitHub, GitLab, most modern markdown processors.",
  },
  {
    id: "fenced-code-blocks",
    title: "Fenced Code Blocks",
    description:
      "Wrap code in triple backticks and add a language identifier after the opening backticks to enable syntax highlighting. This is one of the most widely supported extended features and is part of the GitHub Flavored Markdown (GFM) specification.",
    syntax: `\`\`\`python
def hello(name):
    print(f"Hello, {name}!")

hello("world")
\`\`\`

\`\`\`json
{
  "name": "project",
  "version": "1.0.0"
}
\`\`\``,
    support: "Nearly universal. Supported by GitHub, GitLab, VS Code, Obsidian, and most processors.",
  },
  {
    id: "footnotes",
    title: "Footnotes",
    description:
      "Add footnotes with bracket notation. Place [^1] in your text where you want the reference, then define the footnote content anywhere in the document. Footnotes are automatically numbered and linked.",
    syntax: `Here is a sentence with a footnote.[^1]

[^1]: This is the footnote content.

You can also use named footnotes.[^note]

[^note]: Named footnotes work the same way.`,
    support: "GitHub, PHP Markdown Extra, Obsidian, Pandoc. Not supported in all processors.",
  },
  {
    id: "heading-ids",
    title: "Heading IDs",
    description:
      "Some processors let you assign custom IDs to headings using curly braces. This gives you control over the anchor link for that heading, which is useful when you need predictable URLs for deep linking.",
    syntax: `### My Section {#custom-id}

Link to it: [Jump to section](#custom-id)`,
    support: "Pandoc, kramdown, PHP Markdown Extra. Not supported in standard GFM.",
  },
  {
    id: "definition-lists",
    title: "Definition Lists",
    description:
      "Create definition lists by writing the term on one line and the definition on the next line, prefixed with a colon and a space. Definition lists are useful for glossaries and reference documentation.",
    syntax: `Markdown
: A lightweight markup language for formatting text.

HTML
: The standard markup language for web pages.

CSS
: A style sheet language for describing presentation.`,
    support: "PHP Markdown Extra, Pandoc, kramdown. Not part of GFM.",
  },
  {
    id: "strikethrough",
    title: "Strikethrough",
    description:
      "Wrap text in double tildes to display it with a strikethrough line. This is commonly used to indicate deleted or outdated content. Strikethrough is part of the GFM specification.",
    syntax: `~~This text is crossed out.~~

The price was ~~$100~~ $75.`,
    support: "GitHub, GitLab, most GFM-compatible processors.",
  },
  {
    id: "task-lists",
    title: "Task Lists",
    description:
      "Create interactive checklists using list items prefixed with [ ] for unchecked and [x] for checked. Task lists are a GFM feature and render as checkboxes on GitHub.",
    syntax: `- [x] Write the introduction
- [x] Add code examples
- [ ] Review and edit
- [ ] Publish the article`,
    support: "GitHub, GitLab, Obsidian, and most GFM-compatible processors.",
  },
  {
    id: "emoji",
    title: "Emoji",
    description:
      "Insert emoji using shortcodes wrapped in colons. The shortcode name matches the standard emoji naming convention. You can also paste Unicode emoji characters directly into your markdown.",
    syntax: `:smile: :rocket: :thumbsup:
:warning: :white_check_mark: :x:

You can also paste emoji directly: 🚀 ✅`,
    support: "GitHub, GitLab, Slack, Discord. Shortcode support varies by processor.",
  },
  {
    id: "highlight",
    title: "Highlight",
    description:
      "Wrap text in double equals signs to mark it as highlighted. This renders with a yellow background in processors that support it. It is useful for drawing attention to key phrases.",
    syntax: `==This text is highlighted.==

The ==important part== is marked.`,
    support: "Obsidian, some static site generators. Not part of GFM or CommonMark.",
  },
  {
    id: "subscript-superscript",
    title: "Subscript and Superscript",
    description:
      "Use single tildes for subscript and carets for superscript. These are useful for scientific notation, mathematical formulas, and chemical formulas. Support for these is limited to certain processors.",
    syntax: `H~2~O (subscript for water)

X^2^ (superscript for squared)

Footnote style: E = mc^2^`,
    support: "Pandoc, Obsidian, some static site generators. Not part of GFM.",
  },
];

const faqItems = [
  {
    question: "What is extended markdown syntax?",
    answer:
      "Extended markdown syntax refers to formatting features that go beyond John Gruber's original markdown specification. These include tables, footnotes, task lists, strikethrough, and fenced code blocks with syntax highlighting. Many of these features are part of GitHub Flavored Markdown (GFM).",
  },
  {
    question: "What is GitHub Flavored Markdown (GFM)?",
    answer:
      "GFM is an extension of standard markdown maintained by GitHub. It adds support for tables, task lists, strikethrough, fenced code blocks, and automatic URL linking. GFM is one of the most widely adopted markdown flavors.",
  },
  {
    question: "How do I create a table in markdown?",
    answer:
      "Use pipes (|) to separate columns and hyphens (-) to create the header separator row. Add colons to the separator row to control alignment: :--- for left, :---: for center, and ---: for right alignment.",
  },
  {
    question: "Do all markdown processors support extended syntax?",
    answer:
      "No. Extended syntax support varies by processor. Features like tables, fenced code blocks, and task lists are widely supported through GFM. Others like footnotes, definition lists, and highlight are only available in specific processors such as Pandoc, Obsidian, or kramdown.",
  },
  {
    question: "Can I use strikethrough in markdown?",
    answer:
      "Yes, wrap text in double tildes like ~~this~~ to create strikethrough text. This feature is part of the GFM specification and works on GitHub, GitLab, and most modern markdown editors and processors.",
  },
];

export default function MarkdownExtendedSyntaxPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Extended Syntax", url: "/markdown-extended-syntax" },
  ]);

  const faqSchema = getFAQSchema(faqItems);

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

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Markdown Extended Syntax Reference
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Extended syntax adds powerful features on top of{" "}
          <Link
            href="/markdown-syntax"
            className="text-primary underline underline-offset-4"
          >
            basic markdown
          </Link>
          . These include tables, footnotes, task lists, strikethrough, and
          more. Not every processor supports all of these features, so each
          section notes where the syntax works.
        </p>

        <nav className="mb-10 p-4 rounded-lg border border-border bg-muted/40">
          <p className="text-sm font-medium mb-2">On this page</p>
          <ul className="columns-2 gap-x-6 text-sm space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <h2 className="text-2xl font-semibold mb-3">{section.title}</h2>
            <p className="text-muted-foreground mb-4">{section.description}</p>
            <div className="relative">
              <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
                <code>{section.syntax}</code>
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton content={section.syntax} />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground border-l-2 border-primary pl-3">
              <span className="font-medium">Supported by:</span>{" "}
              {section.support}
            </p>
          </section>
        ))}

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div key={item.question}>
                <h3 className="font-medium mb-1">{item.question}</h3>
                <p className="text-muted-foreground text-sm">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-muted/40 p-6 mb-12">
          <h2 className="text-xl font-semibold mb-3">Related Resources</h2>
          <p className="text-muted-foreground mb-4">
            Build tables visually, practice in our editor, or review the
            basics.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/markdown-table-generator"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Table Generator
            </Link>
            <Link
              href="/markdown-editor"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Open Editor
            </Link>
            <Link
              href="/markdown-syntax"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Basic Syntax
            </Link>
            <Link
              href="/markdown-cheat-sheet"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cheat Sheet
            </Link>
          </div>
        </section>

        <ToolFooter currentPath="/markdown-extended-syntax" />
      </main>
    </>
  );
}
