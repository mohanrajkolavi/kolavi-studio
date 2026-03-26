import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

export const metadata = getPageMetadata({
  title: "Markdown Syntax - Complete Basic Syntax Reference",
  description:
    "Learn every basic markdown syntax element with copy-ready examples. Covers headings, bold, italic, links, images, lists, code blocks, blockquotes, and more.",
  path: "/markdown-syntax",
  keywords:
    "markdown syntax, markdown basic syntax, markdown bold, markdown italic, markdown link, markdown image, markdown heading, markdown list",
});

const sections = [
  {
    id: "paragraphs",
    title: "Paragraphs",
    description:
      "Paragraphs in markdown are one or more lines of text separated by a blank line. You do not need any special characters to start a paragraph. Simply write your text and leave an empty line before the next paragraph.",
    syntax: `This is the first paragraph.

This is the second paragraph.`,
    tip: "Avoid indenting paragraphs with spaces or tabs unless you intend to create a code block.",
  },
  {
    id: "headings",
    title: "Headings",
    description:
      "Create headings by adding hash symbols (#) before your text. The number of hashes determines the heading level, from 1 (largest) through 6 (smallest). Always put a space between the hash symbols and the heading text.",
    syntax: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6`,
    tip: "Use heading levels in order. Do not skip from H1 to H3 without an H2 in between. This helps with accessibility and SEO.",
  },
  {
    id: "bold",
    title: "Bold",
    description:
      "Wrap text in double asterisks or double underscores to make it bold. Both notations produce the same result, but double asterisks are more widely recommended because they work in the middle of a word.",
    syntax: `**This text is bold**
__This is also bold__
Use **bold** in the middle of a sentence.`,
    tip: "Prefer ** over __ for bold. Underscores may not render correctly when used in the middle of a word on some processors.",
  },
  {
    id: "italic",
    title: "Italic",
    description:
      "Wrap text in single asterisks or single underscores to italicize it. Like bold, single asterisks are the preferred choice for mid-word emphasis.",
    syntax: `*This text is italic*
_This is also italic_
An *italic* word in a sentence.`,
    tip: "Stick with * for italic text to avoid rendering issues with underscores inside words.",
  },
  {
    id: "bold-and-italic",
    title: "Bold and Italic",
    description:
      "Combine bold and italic by wrapping text in triple asterisks. You can also nest single and double asterisks, but triple asterisks are the simplest approach.",
    syntax: `***Bold and italic text***
**_Also bold and italic_**
*__Another combination__*`,
    tip: null,
  },
  {
    id: "blockquotes",
    title: "Blockquotes",
    description:
      "Start a line with > followed by a space to create a blockquote. Blockquotes can span multiple lines and can be nested by adding additional > characters.",
    syntax: `> This is a blockquote.
>
> It can span multiple lines.

> Nested blockquotes use multiple arrows.
>
>> This is a nested blockquote.`,
    tip: "Add a blank line before and after blockquotes for best compatibility across markdown processors.",
  },
  {
    id: "ordered-lists",
    title: "Ordered Lists",
    description:
      "Create ordered (numbered) lists by starting each line with a number followed by a period and a space. The numbers do not need to be sequential; markdown will auto-number them in order.",
    syntax: `1. First item
2. Second item
3. Third item

1. First item
1. Second item
1. Third item`,
    tip: "Starting every item with 1. makes it easy to insert new items later without renumbering.",
  },
  {
    id: "unordered-lists",
    title: "Unordered Lists",
    description:
      "Create unordered (bulleted) lists by starting each line with a dash (-), asterisk (*), or plus sign (+). All three produce the same result. Pick one and use it consistently.",
    syntax: `- First item
- Second item
- Third item

* First item
* Second item
* Third item`,
    tip: "Dashes (-) are the most common convention. Avoid mixing different markers within the same list.",
  },
  {
    id: "code",
    title: "Code",
    description:
      "Use backticks for inline code and triple backticks for fenced code blocks. Fenced code blocks can include a language identifier after the opening backticks to enable syntax highlighting.",
    syntax: `Inline code: \`const x = 42;\`

\`\`\`javascript
function greet(name) {
  return "Hello, " + name;
}
\`\`\``,
    tip: "Always specify the language after the opening triple backticks so readers and syntax highlighters can process your code correctly.",
  },
  {
    id: "links",
    title: "Links",
    description:
      "Create links by wrapping the link text in square brackets followed by the URL in parentheses. You can optionally add a title in quotes after the URL, which appears as a tooltip on hover.",
    syntax: `[Kolavi Studio](https://kolavistudio.com)
[Link with title](https://kolavistudio.com "Visit Kolavi Studio")`,
    tip: "Always use descriptive link text instead of raw URLs. This improves readability and accessibility.",
  },
  {
    id: "images",
    title: "Images",
    description:
      "Image syntax is identical to link syntax but with an exclamation mark (!) at the front. The text inside the square brackets becomes the alt text, which is important for accessibility.",
    syntax: `![Alt text for the image](https://example.com/image.png)
![Logo](https://example.com/logo.png "Company Logo")`,
    tip: "Always provide meaningful alt text. Screen readers rely on it, and it displays when the image fails to load.",
  },
  {
    id: "horizontal-rules",
    title: "Horizontal Rules",
    description:
      "Create a horizontal rule (a visual divider line) by placing three or more dashes, asterisks, or underscores on a line by themselves. Add blank lines above and below for compatibility.",
    syntax: `---

***

___`,
    tip: "Put a blank line before and after the horizontal rule. Without blank lines, some processors may interpret --- as a heading.",
  },
];

const faqItems = [
  {
    question: "What is basic markdown syntax?",
    answer:
      "Basic markdown syntax is the core set of formatting elements defined in John Gruber's original markdown specification. It includes headings, bold, italic, links, images, lists, blockquotes, code spans, code blocks, and horizontal rules. These elements are supported by virtually every markdown processor.",
  },
  {
    question: "How do I make text bold in markdown?",
    answer:
      "Wrap the text in double asterisks (**bold**) or double underscores (__bold__). Double asterisks are preferred because they work correctly in the middle of a word, while underscores may not render on some processors.",
  },
  {
    question: "How do I add a link in markdown?",
    answer:
      "Use the syntax [link text](URL). For example, [Google](https://google.com) creates a clickable link. You can also add a tooltip by including a title in quotes: [Google](https://google.com \"Search engine\").",
  },
  {
    question: "What is the difference between basic and extended markdown syntax?",
    answer:
      "Basic syntax covers the original elements like headings, emphasis, links, and lists. Extended syntax adds features such as tables, footnotes, task lists, strikethrough, and fenced code blocks with language highlighting. Extended syntax is not universally supported.",
  },
  {
    question: "Can I use HTML inside markdown?",
    answer:
      "Yes. Most markdown processors allow inline HTML tags. You can use HTML for features that markdown does not natively support, such as underlining text, centering content, or adding custom styling. However, not all processors permit every HTML tag.",
  },
];

export default function MarkdownSyntaxPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown Syntax", url: "/markdown-syntax" },
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
          Markdown Syntax: Complete Basic Reference
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          A comprehensive guide to every basic markdown formatting element.
          Each section includes copy-ready syntax examples you can use right
          away. Looking for tables, footnotes, or task lists? See the{" "}
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
            {section.tip && (
              <p className="mt-3 text-sm text-muted-foreground border-l-2 border-primary pl-3">
                {section.tip}
              </p>
            )}
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
          <h2 className="text-xl font-semibold mb-3">Keep Learning</h2>
          <p className="text-muted-foreground mb-4">
            Now that you know the basics, explore more markdown resources and
            tools.
          </p>
          <div className="flex flex-wrap gap-3">
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
              Open Editor
            </Link>
            <Link
              href="/markdown-guide"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Beginner Guide
            </Link>
          </div>
        </section>

        <ToolFooter currentPath="/markdown-syntax" />
      </main>
    </>
  );
}
