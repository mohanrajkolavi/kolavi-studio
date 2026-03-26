import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Markdown Guide - How to Use Markdown (Beginner Tutorial)",
  description:
    "Learn what markdown is, why it matters, and how to start using it today. A beginner-friendly tutorial covering the basics, common use cases, and popular markdown flavors.",
  path: "/markdown-guide",
  keywords:
    "markdown guide, how to use markdown, markdown tutorial, what is markdown, getting started with markdown, learn markdown, markdown for beginners",
});

const firstDocExample = `# My First Document

This is a paragraph of text. Markdown lets you write
**bold text**, *italic text*, and [links](https://example.com).

## Shopping List

- Apples
- Bread
- Coffee

## Notes

> Markdown is simple to learn and powerful to use.

That is all you need to get started!`;

const faqItems = [
  {
    question: "What is markdown used for?",
    answer:
      "Markdown is used for writing documentation, README files, blog posts, notes, technical articles, and messages on platforms like GitHub, Reddit, and Discord. It is the standard format for developer documentation and is supported by most content management systems.",
  },
  {
    question: "Is markdown hard to learn?",
    answer:
      "No. Markdown was designed to be as easy to read and write as possible. You can learn the essential syntax (headings, bold, italic, links, and lists) in under 10 minutes. The plain text format means you do not need any special software to get started.",
  },
  {
    question: "What is the difference between markdown and HTML?",
    answer:
      "Markdown is a simplified writing format that gets converted into HTML. While HTML uses tags like <strong> and <a>, markdown uses symbols like ** for bold and [text](url) for links. Markdown is faster to write and easier to read, but HTML offers more control over layout and styling.",
  },
  {
    question: "What software do I need to write markdown?",
    answer:
      "You can write markdown in any plain text editor, including Notepad, TextEdit, or VS Code. For a better experience, use a dedicated markdown editor with live preview. Our free online markdown editor lets you write and preview markdown instantly in your browser.",
  },
  {
    question: "Can I convert markdown to other formats?",
    answer:
      "Yes. Markdown can be converted to HTML, PDF, Word documents, slides, and many other formats. Tools like Pandoc handle complex conversions. Our site offers free markdown to HTML and markdown to PDF converters that work directly in your browser.",
  },
];

export default function MarkdownGuidePage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown Guide", url: "/markdown-guide" },
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
          Markdown Guide: Learn Markdown from Scratch
        </h1>
        <p className="text-lg text-muted-foreground mb-10">
          A beginner-friendly introduction to markdown. By the end of this
          guide you will understand what markdown is, why people use it, and
          how to write your first formatted document.
        </p>

        {/* Section 1: What is Markdown? */}
        <section id="what-is-markdown" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">What is Markdown?</h2>
          <p className="text-muted-foreground mb-4">
            Markdown is a lightweight markup language that lets you format
            plain text using simple symbols. It was created by John Gruber in
            2004 with the goal of making text that is easy to read in its raw
            form and easy to convert into HTML for the web.
          </p>
          <p className="text-muted-foreground mb-4">
            Instead of clicking buttons in a toolbar to make text bold or
            create a heading, you type simple characters like ** for bold and
            # for headings. The result is a plain text file that any computer
            can open, but that can also be rendered as a beautifully formatted
            document.
          </p>
          <p className="text-muted-foreground">
            Today, markdown is used by millions of people for everything from
            developer documentation to personal notes. If you have ever
            written a README file on GitHub or formatted a message on Reddit,
            you have already used markdown.
          </p>
        </section>

        {/* Section 2: Why Use Markdown? */}
        <section id="why-use-markdown" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Why Use Markdown?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Portable</h3>
              <p className="text-sm text-muted-foreground">
                Markdown files are plain text. You can open them on any
                operating system, in any text editor, without special software.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Platform-independent</h3>
              <p className="text-sm text-muted-foreground">
                Your content is not locked into any proprietary format. Switch
                tools anytime without losing your formatting.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Future-proof</h3>
              <p className="text-sm text-muted-foreground">
                Plain text files will always be readable. Unlike binary formats
                that require specific software versions, markdown files will
                open decades from now.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Widely supported</h3>
              <p className="text-sm text-muted-foreground">
                GitHub, GitLab, Reddit, Discord, Notion, Obsidian, VS Code,
                and hundreds of other platforms support markdown natively.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How Does Markdown Work? */}
        <section id="how-markdown-works" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            How Does Markdown Work?
          </h2>
          <p className="text-muted-foreground mb-4">
            The markdown workflow has three steps:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-4">
            <li>
              <span className="font-medium text-foreground">Write</span> your
              content in plain text using markdown syntax (# for headings, **
              for bold, etc.).
            </li>
            <li>
              <span className="font-medium text-foreground">Process</span> the
              file through a markdown parser. The parser reads your symbols and
              converts them into structured output.
            </li>
            <li>
              <span className="font-medium text-foreground">Output</span> the
              result as HTML, PDF, or another format ready for display or
              publishing.
            </li>
          </ol>
          <p className="text-muted-foreground">
            For example, when you write **hello** in markdown, the parser
            converts it to{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
              &lt;strong&gt;hello&lt;/strong&gt;
            </code>{" "}
            in HTML, which your browser renders as <strong>hello</strong>.
          </p>
        </section>

        {/* Section 4: Your First Markdown Document */}
        <section id="first-document" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Your First Markdown Document
          </h2>
          <p className="text-muted-foreground mb-4">
            Let us write a simple document together. Copy the example below
            and paste it into our{" "}
            <Link
              href="/markdown-editor"
              className="text-primary underline underline-offset-4"
            >
              markdown editor
            </Link>{" "}
            to see the formatted result instantly.
          </p>
          <div className="relative">
            <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
              <code>{firstDocExample}</code>
            </pre>
            <div className="absolute top-2 right-2">
              <CopyButton content={firstDocExample} />
            </div>
          </div>
          <p className="mt-4 text-muted-foreground">
            That is everything you need to write a formatted document. The #
            symbol creates headings, ** makes text bold, * makes it italic,
            dashes create bullet lists, and {">"} creates blockquotes.
          </p>
        </section>

        {/* Section 5: Where to Use Markdown */}
        <section id="where-to-use" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Where to Use Markdown
          </h2>
          <p className="text-muted-foreground mb-4">
            Markdown shows up in more places than you might expect. Here are
            the most common use cases:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">
                  Documentation
                </span>{" "}
                - README files, API docs, wikis, and knowledge bases.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">Notes</span> -
                Personal and team notes in apps like Obsidian, Notion, and Bear.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">Websites</span>{" "}
                - Static site generators like Next.js, Hugo, Jekyll, and
                Gatsby use markdown for content.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">Messages</span>{" "}
                - Slack, Discord, Reddit, and GitHub comments all support
                markdown formatting.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">Email</span> -
                Some email clients and tools let you compose messages in
                markdown.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 6: Markdown Flavors */}
        <section id="markdown-flavors" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Markdown Flavors</h2>
          <p className="text-muted-foreground mb-4">
            Over the years, different organizations have created their own
            extensions to the original markdown specification. Here are the
            most important ones:
          </p>
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">CommonMark</h3>
              <p className="text-sm text-muted-foreground">
                A strict, well-defined specification that removes ambiguity
                from the original markdown rules. It serves as the foundation
                for many modern parsers.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">
                GitHub Flavored Markdown (GFM)
              </h3>
              <p className="text-sm text-muted-foreground">
                Built on top of CommonMark, GFM adds tables, task lists,
                strikethrough, and auto-linked URLs. It is the standard on
                GitHub and widely adopted elsewhere.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">MultiMarkdown</h3>
              <p className="text-sm text-muted-foreground">
                Extends the original spec with metadata, footnotes, tables,
                citations, and cross-references. Popular in academic writing.
              </p>
            </div>
          </div>
        </section>

        {/* Section 7: What Tools Support Markdown? */}
        <section id="tools" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            What Tools Support Markdown?
          </h2>
          <p className="text-muted-foreground mb-4">
            You can write markdown in any text editor, but dedicated tools give
            you live preview, syntax highlighting, and export options. Our{" "}
            <Link
              href="/markdown-tools"
              className="text-primary underline underline-offset-4"
            >
              markdown tools hub
            </Link>{" "}
            includes a free online editor, table generator, PDF converter, HTML
            converter, and formatter that all work in your browser with no
            signup required.
          </p>
          <p className="text-muted-foreground">
            Popular desktop editors include VS Code, Obsidian, Typora, and iA
            Writer. For quick tasks, our browser-based tools let you start
            writing immediately.
          </p>
        </section>

        {/* Section 8: Next Steps */}
        <section id="next-steps" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Next Steps</h2>
          <p className="text-muted-foreground mb-4">
            You now know what markdown is, why people use it, and how to write
            a basic document. Here is where to go next:
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/markdown-syntax"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Basic Syntax Reference
            </Link>
            <Link
              href="/markdown-extended-syntax"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Extended Syntax
            </Link>
            <Link
              href="/markdown-cheat-sheet"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cheat Sheet
            </Link>
            <Link
              href="/markdown-editor"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Try the Editor
            </Link>
            <Link
              href="/markdown-hacks"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Markdown Hacks
            </Link>
          </div>
        </section>

        {/* FAQ */}
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

        <ToolFooter currentPath="/markdown-guide" />
      </main>
    </>
  );
}
