import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

const PAGE_PATH = "/markdown-guide";
const DATE_PUBLISHED = "2026-03-25T00:00:00Z";
const DATE_MODIFIED = "2026-04-22T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "What is Markdown? Markdown Guide and Tutorial (2026)",
  description:
    "Markdown guide: What is markdown? Learn markdown syntax with our beginner tutorial. See examples, try it live, and start writing in 10 minutes.",
  path: PAGE_PATH,
  keywords:
    "markdown, what is markdown, markdown guide, markdown tutorial, learn markdown, how to use markdown, markdown syntax, markdown for beginners, what does markdown do, markdown definition",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
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

const syntaxReference = [
  { element: "Heading 1", markdown: "# Heading 1", result: "Large bold heading" },
  { element: "Heading 2", markdown: "## Heading 2", result: "Medium bold heading" },
  { element: "Bold", markdown: "**bold text**", result: "bold text" },
  { element: "Italic", markdown: "*italic text*", result: "italic text" },
  { element: "Link", markdown: "[text](https://url.com)", result: "Clickable link" },
  { element: "Image", markdown: "![alt](image.jpg)", result: "Rendered image" },
  { element: "Unordered list", markdown: "- Item one\n- Item two", result: "Bulleted list" },
  { element: "Ordered list", markdown: "1. First\n2. Second", result: "Numbered list" },
  { element: "Inline code", markdown: "`code`", result: "Monospaced code" },
  { element: "Blockquote", markdown: "> Quoted text", result: "Indented quote" },
];

const vsHtmlRows = [
  {
    aspect: "Bold text",
    markdown: "**hello**",
    html: "<strong>hello</strong>",
  },
  {
    aspect: "Heading",
    markdown: "# Hello",
    html: "<h1>Hello</h1>",
  },
  {
    aspect: "Link",
    markdown: "[Home](/)",
    html: '<a href="/">Home</a>',
  },
  {
    aspect: "Readability in source",
    markdown: "High: reads like plain text",
    html: "Low: cluttered with angle brackets",
  },
  {
    aspect: "Time to learn basics",
    markdown: "Under 10 minutes",
    html: "A few hours for full tag set",
  },
  {
    aspect: "Primary use case",
    markdown: "Writing, docs, README files, notes",
    html: "Full web page structure and styling",
  },
  {
    aspect: "Output",
    markdown: "Converts to HTML, PDF, Word, slides",
    html: "Already HTML (rendered by browser)",
  },
];

const faqItems = [
  {
    question: "What is markdown used for?",
    answer:
      "Markdown is used for writing documentation, README files, blog posts, notes, technical articles, and messages on platforms like GitHub, Reddit, and Discord. It is the standard format for developer documentation and is supported by most content management systems.",
  },
  {
    question: "What does markdown mean?",
    answer:
      "Markdown means a plain text formatting syntax designed to be easy to read and easy to convert to HTML. The name refers to its inverse relationship to markup languages: markdown hides the complexity of tags behind simple characters like # and **.",
  },
  {
    question: "Is markdown a programming language?",
    answer:
      "No. Markdown is a markup language, not a programming language. It has no variables, functions, loops, or logic. It only describes how text should be formatted. A markdown parser reads the symbols and outputs structured HTML or another format.",
  },
  {
    question: "What is a .md file?",
    answer:
      "A .md file is a plain text file written in markdown syntax. The .md extension is short for markdown. You can open .md files in any text editor, and markdown-aware tools like GitHub, VS Code, and Obsidian will render them with formatting applied.",
  },
  {
    question: "Who invented markdown?",
    answer:
      "John Gruber created markdown in 2004, with early input from Aaron Swartz. Gruber published the original specification on his blog, Daring Fireball, with the goal of making web writing readable as plain text. GitHub adopted it in 2009, and CommonMark standardized it in 2014.",
  },
  {
    question: "Is markdown hard to learn?",
    answer:
      "No. Markdown was designed to be as easy to read and write as possible. You can learn the essential syntax (headings, bold, italic, links, and lists) in under 10 minutes. The plain text format means you do not need any special software to get started.",
  },
  {
    question: "What is the best way to learn markdown?",
    answer:
      "The fastest way to learn markdown is to follow a short markdown guide (like this one), work through a hands-on markdown tutorial using a live editor, then practice by writing a real README file or a set of notes. Most people are fluent in everyday syntax within an hour.",
  },
  {
    question: "How long does it take to learn markdown?",
    answer:
      "Most people learn the core markdown syntax in 10 to 15 minutes. Within an hour you can be fluent in everyday use cases like writing README files, formatted notes, or Discord messages. Extended features like tables and footnotes take another 20 minutes to pick up.",
  },
  {
    question: "What is the difference between markdown and HTML?",
    answer:
      "Markdown is a simplified writing format that gets converted into HTML. While HTML uses tags like <strong> and <a>, markdown uses symbols like ** for bold and [text](url) for links. Markdown is faster to write and easier to read, but HTML offers more control over layout and styling.",
  },
  {
    question: "What is the difference between markdown and rich text?",
    answer:
      "Rich text stores formatting as hidden data inside the file (like Word documents), while markdown stores formatting as visible symbols in plain text. That makes markdown portable across any editor, version-controllable with Git, and future-proof, at the cost of no WYSIWYG preview while you type.",
  },
  {
    question: "Is markdown still used in 2026?",
    answer:
      "Yes. Markdown remains the default format for technical writing, developer documentation, static site generators, and note-taking apps like Obsidian, Notion, and Bear. It is also the standard input for most AI writing tools and large language model prompts.",
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

  const articleSchema = getArticleSchema({
    headline: "Markdown Guide: What is Markdown? A Beginner's Tutorial",
    description:
      "Markdown is a lightweight markup language for formatting plain text using simple symbols. This markdown guide and tutorial covers what markdown is, how it works, common syntax, and how to write your first document.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    url: PAGE_PATH,
    wordCount: 3600,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
  });

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
          __html: JSON.stringify(articleSchema),
        }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Markdown Guide: What is Markdown? A Beginner&apos;s Tutorial
        </h1>
        <p className="text-sm text-muted-foreground mb-6">{LAST_UPDATED_LABEL}</p>

        {/* Answer-first callout */}
        <div className="rounded-lg border border-border bg-muted/30 p-5 mb-10">
          <p className="text-base leading-relaxed">
            <strong>
              Markdown is a lightweight markup language that formats plain text
              using simple symbols like <code className="bg-muted px-1 py-0.5 rounded text-sm">#</code> for
              headings and <code className="bg-muted px-1 py-0.5 rounded text-sm">**</code> for bold.
            </strong>{" "}
            Created by John Gruber in 2004, markdown lets you write structured
            documents in plain text that convert easily to HTML, PDF, and other
            formats. Today millions of people use it for README files, notes,
            documentation, and messages on GitHub, Reddit, and Discord. This
            markdown guide walks you through the basics, with a hands-on
            markdown tutorial you can try in your browser.
          </p>
        </div>

        {/* Table of Contents */}
        <nav
          aria-label="Table of contents"
          className="rounded-lg border border-border p-5 mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            On this page
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 text-sm list-decimal list-inside marker:text-muted-foreground">
            <li>
              <a
                href="#what-is-markdown"
                className="text-primary hover:underline"
              >
                What is Markdown?
              </a>
            </li>
            <li>
              <a
                href="#why-use-markdown"
                className="text-primary hover:underline"
              >
                Why Use Markdown?
              </a>
            </li>
            <li>
              <a
                href="#how-markdown-works"
                className="text-primary hover:underline"
              >
                How Does Markdown Work?
              </a>
            </li>
            <li>
              <a
                href="#markdown-vs-html"
                className="text-primary hover:underline"
              >
                Markdown vs HTML
              </a>
            </li>
            <li>
              <a
                href="#markdown-tutorial"
                className="text-primary hover:underline"
              >
                Markdown Tutorial: Your First Document
              </a>
            </li>
            <li>
              <a
                href="#syntax-reference"
                className="text-primary hover:underline"
              >
                Common Markdown Syntax
              </a>
            </li>
            <li>
              <a href="#where-to-use" className="text-primary hover:underline">
                Where to Use Markdown
              </a>
            </li>
            <li>
              <a
                href="#markdown-flavors"
                className="text-primary hover:underline"
              >
                Markdown Flavors
              </a>
            </li>
            <li>
              <a
                href="#who-created-markdown"
                className="text-primary hover:underline"
              >
                Who Created Markdown?
              </a>
            </li>
            <li>
              <a href="#tools" className="text-primary hover:underline">
                Tools That Support Markdown
              </a>
            </li>
            <li>
              <a href="#next-steps" className="text-primary hover:underline">
                Next Steps
              </a>
            </li>
            <li>
              <a href="#faq" className="text-primary hover:underline">
                Frequently Asked Questions
              </a>
            </li>
          </ol>
        </nav>

        {/* Section 1: What is Markdown? */}
        <section id="what-is-markdown" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">What is Markdown?</h2>
          <p className="text-muted-foreground mb-4">
            Markdown is a lightweight markup language that lets you format
            plain text using simple symbols. It was created by John Gruber in
            2004, with technical input from Aaron Swartz, with the goal of
            making text that is easy to read in its raw form and easy to
            convert into HTML for the web.
          </p>
          <p className="text-muted-foreground mb-4">
            Instead of clicking buttons in a toolbar to make text bold or
            create a heading, you type simple characters like ** for bold and
            # for headings. The result is a plain text file that any computer
            can open, but that can also be rendered as a beautifully formatted
            document.
          </p>
          <p className="text-muted-foreground mb-4">
            Markdown files usually end in the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">.md</code>{" "}
            or{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
              .markdown
            </code>{" "}
            extension. Because they are plain text, they open in any editor
            (Notepad, TextEdit, VS Code, vim) without special software. Yet
            when viewed on GitHub, Reddit, Obsidian, or most note apps, the
            same file renders with headings, bold, italics, lists, and links
            applied.
          </p>
          <p className="text-muted-foreground mb-4">
            The problem markdown solves is a split that existed between plain
            text (portable, easy to read, no formatting) and rich text
            formats like Word or Google Docs (nice formatting, but locked into
            proprietary binary files). Markdown gives you both: readable
            source text plus rendered output, all from the same file.
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
          <p className="text-muted-foreground mb-4">
            Markdown has four qualities that keep it popular decades after it
            was first released:
          </p>
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

        {/* Section 4: Markdown vs HTML */}
        <section id="markdown-vs-html" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Markdown vs HTML</h2>
          <p className="text-muted-foreground mb-4">
            Markdown and HTML both describe how text should be formatted, but
            they target different jobs. Markdown is for writing; HTML is for
            web page structure. The table below shows the practical
            differences.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3 border-b border-border">
                    Aspect
                  </th>
                  <th className="text-left font-medium p-3 border-b border-border">
                    Markdown
                  </th>
                  <th className="text-left font-medium p-3 border-b border-border">
                    HTML
                  </th>
                </tr>
              </thead>
              <tbody>
                {vsHtmlRows.map((row, idx) => (
                  <tr
                    key={row.aspect}
                    className={
                      idx < vsHtmlRows.length - 1
                        ? "border-b border-border"
                        : ""
                    }
                  >
                    <td className="p-3 font-medium align-top">{row.aspect}</td>
                    <td className="p-3 align-top text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {row.markdown}
                      </code>
                    </td>
                    <td className="p-3 align-top text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {row.html}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            In practice, most websites use a mix: authors write content in
            markdown, and a parser converts it to HTML at build time or page
            load. You get the speed and readability of markdown for writing,
            and HTML for rendering in the browser.
          </p>
        </section>

        {/* Section 5: Markdown Tutorial - Your First Document */}
        <section id="markdown-tutorial" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Markdown Tutorial: Your First Document
          </h2>
          <p className="text-muted-foreground mb-4">
            This short markdown tutorial shows the most common formatting
            elements in one file. Copy the example and paste it into our{" "}
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

        {/* Section 6: Common Markdown Syntax */}
        <section id="syntax-reference" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Common Markdown Syntax
          </h2>
          <p className="text-muted-foreground mb-4">
            These are the ten markdown elements you will use most often. For a
            deeper reference, see our{" "}
            <Link
              href="/markdown-syntax"
              className="text-primary underline underline-offset-4"
            >
              full syntax guide
            </Link>{" "}
            or the{" "}
            <Link
              href="/markdown-cheat-sheet"
              className="text-primary underline underline-offset-4"
            >
              cheat sheet
            </Link>
            .
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3 border-b border-border">
                    Element
                  </th>
                  <th className="text-left font-medium p-3 border-b border-border">
                    Markdown
                  </th>
                  <th className="text-left font-medium p-3 border-b border-border">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {syntaxReference.map((row, idx) => (
                  <tr
                    key={row.element}
                    className={
                      idx < syntaxReference.length - 1
                        ? "border-b border-border"
                        : ""
                    }
                  >
                    <td className="p-3 font-medium align-top">{row.element}</td>
                    <td className="p-3 align-top">
                      <pre className="bg-muted rounded px-2 py-1 text-xs whitespace-pre-wrap break-words">
                        <code>{row.markdown}</code>
                      </pre>
                    </td>
                    <td className="p-3 align-top text-muted-foreground">
                      {row.result}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 7: Where to Use Markdown */}
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
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>
                <span className="font-medium text-foreground">AI prompts</span>{" "}
                - Markdown is the default input format for ChatGPT, Claude,
                and most large language model interfaces.
              </span>
            </li>
          </ul>
        </section>

        {/* Section 8: Markdown Flavors */}
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

        {/* Section 9: Who Created Markdown? */}
        <section id="who-created-markdown" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Who Created Markdown?
          </h2>
          <p className="text-muted-foreground mb-4">
            John Gruber, author of the blog Daring Fireball, released the
            first version of markdown on March 19, 2004. He designed it with
            a single goal: writing for the web should be readable as plain
            text. Aaron Swartz, the programmer and activist, helped shape the
            syntax in email exchanges with Gruber during the design phase.
          </p>
          <p className="text-muted-foreground mb-4">
            The original spec was informal and had ambiguous edge cases,
            which led different tools to render markdown differently. GitHub
            popularized the format in 2009 when it began rendering README
            files as markdown. In 2014, a group of developers published
            CommonMark, a strict specification that resolved the ambiguities
            of the original.
          </p>
          <p className="text-muted-foreground">
            Gruber holds the trademark on the Markdown name and has kept the
            original spec at{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
              daringfireball.net/projects/markdown
            </code>{" "}
            mostly unchanged. Most modern markdown processors follow
            CommonMark or a superset of it (GitHub Flavored Markdown being
            the most popular).
          </p>
        </section>

        {/* Section 10: What Tools Support Markdown? */}
        <section id="tools" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Tools That Support Markdown
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

        {/* Section 11: Next Steps */}
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
        <section id="faq" className="mb-12">
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
