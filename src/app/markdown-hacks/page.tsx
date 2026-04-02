import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Markdown Hacks - Tips, Tricks & Workarounds",
  description:
    "Advanced markdown tips and workarounds for underline, color text, center alignment, collapsible sections, image sizing, and more. Copy-ready HTML and markdown examples.",
  path: "/markdown-hacks",
  keywords:
    "markdown hacks, markdown tips, markdown tricks, markdown underline, markdown color, markdown center text, markdown workarounds",
});

const sections = [
  {
    id: "table-of-contents",
    title: "Table of Contents",
    description:
      "Markdown does not generate a table of contents automatically, but you can build one manually using internal links. Each link points to a heading anchor. Some processors like GitHub auto-generate heading IDs from the heading text.",
    syntax: `## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Advanced Usage](#advanced-usage)

## Introduction

Your content here...`,
    note: "GitHub auto-generates heading IDs by lowercasing and replacing spaces with hyphens. Some static site generators offer plugins for automatic TOC generation.",
  },
  {
    id: "underline",
    title: "Underline",
    description:
      "Markdown has no native underline syntax because underlined text is easily confused with hyperlinks. The workaround is to use the HTML <ins> tag, which semantically represents inserted text and renders as underlined.",
    syntax: `<ins>This text is underlined.</ins>

Regular text with an <ins>underlined word</ins> inside.`,
    note: "Works on GitHub, GitLab, and most processors that allow inline HTML. Some strict processors may strip HTML tags.",
  },
  {
    id: "indent",
    title: "Indent and Tab",
    description:
      "Standard markdown does not support arbitrary indentation. Leading spaces are usually ignored or interpreted as code blocks. You can use non-breaking spaces or nested blockquotes as workarounds.",
    syntax: `&nbsp;&nbsp;&nbsp;&nbsp;This line is indented with non-breaking spaces.

> First level indent
>> Second level indent
>>> Third level indent`,
    note: "The &nbsp; approach works in HTML-rendering processors. Nested blockquotes are a visual trick and add quote styling.",
  },
  {
    id: "center-text",
    title: "Center Text",
    description:
      "Markdown does not have alignment syntax. To center text, wrap it in an HTML div or paragraph tag with an align attribute. This works in most processors that permit inline HTML.",
    syntax: `<div align="center">

This text is centered.

**Bold centered text**

</div>

<p align="center">A centered paragraph.</p>`,
    note: "Works on GitHub README files and most HTML-permitting processors. Leave blank lines between the div tags and the markdown content inside.",
  },
  {
    id: "color-text",
    title: "Color Text",
    description:
      "Markdown has no built-in support for colored text. You can use HTML span tags with inline styles to apply color. Note that GitHub strips style attributes from markdown files, so this works best in HTML-rendering contexts.",
    syntax: `<span style="color: red">This text is red.</span>

<span style="color: #1e90ff">This text is dodger blue.</span>

<span style="color: green">**Green bold text**</span>`,
    note: "GitHub README files strip inline styles for security. This works in HTML email, static site generators, and processors that support inline styles.",
  },
  {
    id: "comments",
    title: "Comments",
    description:
      "Use HTML comment syntax to add notes that will not appear in the rendered output. Comments are useful for leaving instructions for collaborators or temporarily hiding content.",
    syntax: `<!-- This is a comment. It will not appear in the output. -->

Some visible text.

<!-- TODO: Add more examples here -->

More visible text.`,
    note: "Works in virtually all markdown processors. Comments are visible in the raw source but hidden in the rendered output.",
  },
  {
    id: "admonitions",
    title: "Admonitions and Callouts",
    description:
      "Admonitions are highlighted blocks used for tips, warnings, and notes. Markdown does not have a standard syntax for these, but GitHub supports a blockquote-based format with special markers. Other platforms use different conventions.",
    syntax: `> [!NOTE]
> This is a note callout on GitHub.

> [!WARNING]
> This is a warning callout on GitHub.

> [!TIP]
> This is a tip callout on GitHub.

> [!IMPORTANT]
> This is an important callout on GitHub.

> [!CAUTION]
> This is a caution callout on GitHub.`,
    note: "The [!TYPE] syntax is GitHub-specific. Obsidian, MkDocs, and other tools have their own callout formats.",
  },
  {
    id: "image-sizing",
    title: "Image Sizing",
    description:
      "Standard markdown image syntax does not support width or height attributes. Use an HTML img tag to control image dimensions. This gives you full control over display size.",
    syntax: `<!-- Standard markdown image (no size control) -->
![Logo](https://example.com/logo.png)

<!-- HTML image with width -->
<img src="https://example.com/logo.png" alt="Logo" width="300">

<!-- HTML image with width and height -->
<img src="https://example.com/logo.png" alt="Logo" width="300" height="200">`,
    note: "The HTML img tag works on GitHub, GitLab, and most processors. Always include an alt attribute for accessibility.",
  },
  {
    id: "link-targets",
    title: "Link Targets",
    description:
      "Markdown links always open in the current tab. To open a link in a new tab, use an HTML anchor tag with target=\"_blank\". Adding rel=\"noopener noreferrer\" is a security best practice.",
    syntax: `<!-- Standard markdown link (same tab) -->
[Example](https://example.com)

<!-- HTML link that opens in a new tab -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Example (new tab)
</a>`,
    note: "Works in processors that allow inline HTML. GitHub strips target attributes from links in markdown files for security.",
  },
  {
    id: "symbols",
    title: "Symbols and Special Characters",
    description:
      "You can insert special characters using HTML entities. This is useful for characters that markdown would otherwise interpret as formatting syntax, or for symbols not available on your keyboard.",
    syntax: `&copy; Copyright symbol
&reg; Registered trademark
&trade; Trademark
&amp; Ampersand
&lt; Less than
&gt; Greater than
&nbsp; Non-breaking space
&mdash; Em dash
&rarr; Right arrow: &rarr;
&check; Check mark: &check;`,
    note: "HTML entities work in most markdown processors. You can also paste Unicode characters directly into your markdown.",
  },
  {
    id: "table-formatting",
    title: "Table Formatting",
    description:
      "Markdown tables do not natively support line breaks or multi-line content in cells. You can use the HTML <br> tag for line breaks within a cell, or switch to full HTML tables for complex layouts.",
    syntax: `| Feature | Description |
| ------- | ----------- |
| Line breaks | Use the HTML br tag<br>to break lines in a cell |
| Long content | Keep the cell content<br>readable with breaks |

<!-- For complex tables, use HTML directly -->
<table>
  <tr>
    <th>Name</th>
    <th>Details</th>
  </tr>
  <tr>
    <td>Item 1</td>
    <td>
      First line<br>
      Second line
    </td>
  </tr>
</table>`,
    note: "The <br> tag works in most GFM-compatible processors. For complex tables, consider using our table generator tool.",
  },
  {
    id: "videos",
    title: "Videos",
    description:
      "Markdown does not support video embedding directly. The most common workaround is to display a thumbnail image that links to the video. On GitHub, you can also use an HTML video tag for uploaded video files.",
    syntax: `<!-- Linked thumbnail (works everywhere) -->
[![Video Title](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

<!-- HTML video tag (GitHub supports this for uploaded files) -->
<video src="https://example.com/video.mp4" width="400" controls>
  Your browser does not support the video tag.
</video>`,
    note: "The linked thumbnail approach works in all processors. The video tag is only supported where inline HTML is allowed.",
  },
  {
    id: "collapsible-sections",
    title: "Collapsible Sections",
    description:
      "Use the HTML details and summary elements to create expandable/collapsible sections. The summary text is always visible, and clicking it toggles the hidden content. This is great for FAQs, long code examples, or optional details.",
    syntax: `<details>
<summary>Click to expand</summary>

This content is hidden by default.

You can put **any markdown** here:
- Lists
- Code blocks
- Images

</details>

<details>
<summary>Another collapsible section</summary>

More hidden content here.

</details>`,
    note: "Works on GitHub, GitLab, and most modern processors. Leave a blank line after the summary tag before your markdown content.",
  },
];

const faqItems = [
  {
    question: "Can I underline text in markdown?",
    answer:
      "Markdown does not have native underline syntax. Use the HTML <ins> tag to underline text: <ins>underlined text</ins>. This works in most processors that allow inline HTML. Underline was intentionally left out of markdown because underlined text looks like a hyperlink.",
  },
  {
    question: "How do I center text in markdown?",
    answer:
      "Wrap your text in a div tag with align=\"center\". For example: <div align=\"center\">Centered text</div>. Leave blank lines between the div tags and the content inside. This works on GitHub and most processors that allow HTML.",
  },
  {
    question: "Can I change text color in markdown?",
    answer:
      "Markdown does not support text color natively. You can use an HTML span tag with an inline style: <span style=\"color:red\">red text</span>. Note that GitHub strips inline styles from markdown files, so this works best in other contexts.",
  },
  {
    question: "How do I create collapsible sections in markdown?",
    answer:
      "Use the HTML details and summary elements. Wrap your content in <details> tags with a <summary> for the visible toggle text. GitHub, GitLab, and most modern markdown processors support this pattern.",
  },
  {
    question: "Why do some markdown hacks not work on GitHub?",
    answer:
      "GitHub sanitizes markdown for security. It strips inline styles, target attributes on links, and certain HTML tags. Hacks that rely on these features will work in other contexts like static site generators, email clients, and local markdown editors, but not in GitHub markdown files.",
  },
];

export default function MarkdownHacksPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown Hacks", url: "/markdown-hacks" },
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
          Markdown Hacks: Tips, Tricks, and Workarounds
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Markdown is powerful, but it does not cover everything. This page
          collects practical workarounds for things like underline, colored
          text, centered content, and collapsible sections. Most of these rely
          on inline HTML. Need the fundamentals first? Start with the{" "}
          <Link
            href="/markdown-syntax"
            className="text-primary underline underline-offset-4"
          >
            basic syntax reference
          </Link>{" "}
          or the{" "}
          <Link
            href="/markdown-extended-syntax"
            className="text-primary underline underline-offset-4"
          >
            extended syntax reference
          </Link>
          .
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
              {section.note}
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
          <h2 className="text-xl font-semibold mb-3">Explore More</h2>
          <p className="text-muted-foreground mb-4">
            Try these hacks in our editor or dive into the full syntax
            references.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/markdown-editor"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Open Editor
            </Link>
            <Link
              href="/markdown-formatter"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Formatter
            </Link>
            <Link
              href="/markdown-syntax"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Basic Syntax
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
          </div>
        </section>

        <ToolFooter currentPath="/markdown-hacks" />
      </main>
    </>
  );
}
