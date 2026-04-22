import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";

// ---------------------------------------------------------------------------
// Page constants
// ---------------------------------------------------------------------------

const PAGE_PATH = "/markdown-tools/obsidian";
const DATE_PUBLISHED = "2026-04-22T00:00:00Z";
const DATE_MODIFIED = "2026-04-22T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 22, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "Obsidian Markdown: Complete Syntax Guide + Cheat Sheet (2026)",
  description:
    "Obsidian markdown guide: syntax, wiki-links, tables, callouts, a full cheat sheet, and editor tips. Copy every format. Updated 2026.",
  path: PAGE_PATH,
  keywords:
    "obsidian markdown, obsidian markdown syntax, obsidian markdown cheat sheet, obsidian markdown guide, obsidian markdown table, obsidian markdown support, does obsidian use markdown, obsidian markdown editor, how to use markdown in obsidian, obsidian markdown features, obsidian flavored markdown, obsidian wiki links, obsidian callouts",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

// ---------------------------------------------------------------------------
// Data: cheat sheet rows
// ---------------------------------------------------------------------------

const cheatSheetRows: {
  format: string;
  syntax: string;
  renders: string;
  category: string;
}[] = [
  { category: "Text", format: "Heading 1-6", syntax: "# H1\n## H2\n### H3", renders: "Large to small headings" },
  { category: "Text", format: "Bold", syntax: "**bold text**", renders: "bold text" },
  { category: "Text", format: "Italic", syntax: "*italic text*", renders: "italic text" },
  { category: "Text", format: "Bold + italic", syntax: "***both***", renders: "bold italic text" },
  { category: "Text", format: "Strikethrough", syntax: "~~struck~~", renders: "struck-through text (GFM)" },
  { category: "Text", format: "Highlight", syntax: "==highlight==", renders: "highlighted text (Obsidian)" },
  { category: "Text", format: "Inline code", syntax: "`code`", renders: "monospaced inline code" },
  { category: "Lists", format: "Unordered list", syntax: "- Item one\n- Item two", renders: "Bulleted list" },
  { category: "Lists", format: "Ordered list", syntax: "1. First\n2. Second", renders: "Numbered list" },
  { category: "Lists", format: "Task list", syntax: "- [ ] Open task\n- [x] Done task", renders: "Checkbox list (GFM)" },
  { category: "Lists", format: "Nested list", syntax: "- Parent\n    - Child", renders: "Indented sublist" },
  { category: "Links", format: "Wiki-link (internal)", syntax: "[[Note Title]]", renders: "Link to another note in your vault" },
  { category: "Links", format: "Wiki-link with alias", syntax: "[[Note Title|Display text]]", renders: "Link with custom label" },
  { category: "Links", format: "Wiki-link to heading", syntax: "[[Note Title#Section]]", renders: "Link to a specific heading" },
  { category: "Links", format: "Wiki-link to block", syntax: "[[Note Title#^block-id]]", renders: "Link to a specific block" },
  { category: "Links", format: "External link", syntax: "[Obsidian](https://obsidian.md)", renders: "Standard CommonMark link" },
  { category: "Embeds", format: "Embed a note", syntax: "![[Note Title]]", renders: "Inlines another note's content" },
  { category: "Embeds", format: "Embed a heading", syntax: "![[Note Title#Section]]", renders: "Inlines a single section" },
  { category: "Embeds", format: "Embed an image", syntax: "![[image.png]]", renders: "Displays a local image" },
  { category: "Embeds", format: "Embed a PDF", syntax: "![[doc.pdf]]", renders: "Inlines a PDF viewer" },
  { category: "Quotes", format: "Blockquote", syntax: "> Quoted text", renders: "Indented quote block" },
  {
    category: "Quotes",
    format: "Callout",
    syntax: "> [!note]\n> This is a note callout.",
    renders: "Styled note block (Obsidian)",
  },
  {
    category: "Quotes",
    format: "Foldable callout",
    syntax: "> [!tip]- Click to expand\n> Hidden tip.",
    renders: "Collapsed callout (Obsidian)",
  },
  { category: "Code", format: "Fenced code", syntax: "```js\nconsole.log('hi');\n```", renders: "Syntax-highlighted code block" },
  { category: "Tables", format: "Table", syntax: "| A | B |\n| --- | --- |\n| 1 | 2 |", renders: "Pipe table (GFM)" },
  { category: "Math", format: "Inline LaTeX", syntax: "$E = mc^2$", renders: "Inline math via MathJax" },
  { category: "Math", format: "Block LaTeX", syntax: "$$\\int_0^1 x^2 dx$$", renders: "Display math block" },
  { category: "Refs", format: "Footnote", syntax: "Text[^1]\n\n[^1]: Footnote body", renders: "Footnote (reading view)" },
  { category: "Refs", format: "Block reference id", syntax: "A paragraph. ^block-id", renders: "Anchor for linking to a block" },
  { category: "Refs", format: "Tag", syntax: "#project/active", renders: "Nested tag" },
  { category: "Other", format: "Horizontal rule", syntax: "---", renders: "Divider line" },
  { category: "Other", format: "Escape character", syntax: "\\*not italic\\*", renders: "Literal * symbols" },
];

const cheatSheetDownload = cheatSheetRows
  .map((r) => `## ${r.format}\n\n${r.syntax}\n\nRenders as: ${r.renders}\n`)
  .join("\n");

// ---------------------------------------------------------------------------
// Data: support / features matrix
// ---------------------------------------------------------------------------

const featureMatrixRows: {
  feature: string;
  cm: "yes" | "no" | "partial";
  gfm: "yes" | "no" | "partial";
  obsidian: "yes" | "no" | "partial";
  notes?: string;
}[] = [
  { feature: "Headings (H1-H6)", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Bold, italic, inline code", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Unordered + ordered lists", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Links + images", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Blockquotes", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Fenced code blocks", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Strikethrough", cm: "no", gfm: "yes", obsidian: "yes" },
  { feature: "Task lists", cm: "no", gfm: "yes", obsidian: "yes" },
  { feature: "Pipe tables", cm: "no", gfm: "yes", obsidian: "yes" },
  { feature: "Autolinked URLs", cm: "no", gfm: "yes", obsidian: "yes" },
  { feature: "Footnotes", cm: "no", gfm: "no", obsidian: "partial", notes: "Rendered in reading view only" },
  { feature: "Wiki-links [[note]]", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Wiki-link aliases [[note|text]]", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Embeds ![[note]]", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Callouts > [!note]", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Highlights ==text==", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Block references ^block-id", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Tags #tag", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "LaTeX math (MathJax)", cm: "no", gfm: "no", obsidian: "yes" },
  { feature: "Diagrams (Mermaid)", cm: "no", gfm: "partial", obsidian: "yes" },
  { feature: "HTML passthrough", cm: "yes", gfm: "yes", obsidian: "yes" },
  { feature: "Underline (native syntax)", cm: "no", gfm: "no", obsidian: "no", notes: "Use <u>text</u> or CSS snippet" },
];

// ---------------------------------------------------------------------------
// Data: vs standard markdown
// ---------------------------------------------------------------------------

const vsStandardRows: { aspect: string; standard: string; obsidian: string }[] = [
  {
    aspect: "Internal link",
    standard: "[Other note](other-note.md)",
    obsidian: "[[Other note]]",
  },
  {
    aspect: "Embed a note",
    standard: "Not supported natively",
    obsidian: "![[Other note]]",
  },
  {
    aspect: "Callout",
    standard: "Just a blockquote",
    obsidian: "> [!note] styled, colored, foldable",
  },
  {
    aspect: "Block reference",
    standard: "Not supported",
    obsidian: "Append ^block-id, link with [[Note#^block-id]]",
  },
  {
    aspect: "Highlight",
    standard: "Not supported in CommonMark or GFM",
    obsidian: "==highlight==",
  },
  {
    aspect: "Tag",
    standard: "Not supported",
    obsidian: "#topic or nested #project/active",
  },
  {
    aspect: "Math",
    standard: "Not in CommonMark or GFM",
    obsidian: "$inline$ and $$block$$ via MathJax",
  },
  {
    aspect: "Storage",
    standard: "Depends on the platform",
    obsidian: "Plain .md files on your local disk",
  },
  {
    aspect: "Portability",
    standard: "Varies by parser",
    obsidian: "Readable in any plain-text editor",
  },
];

// ---------------------------------------------------------------------------
// Data: FAQs (question cluster from GSC + Ahrefs + AI-citation oriented)
// ---------------------------------------------------------------------------

const faqItems = [
  {
    question: "What is Obsidian markdown?",
    answer:
      "Obsidian markdown is standard markdown (CommonMark and GitHub Flavored Markdown) with Obsidian-specific extensions layered on top. Every note is a plain .md file that stores your formatting as symbols like # and **, plus extras like [[wiki-links]], callouts, embeds, and block references that only Obsidian reads natively.",
  },
  {
    question: "Does Obsidian use markdown?",
    answer:
      "Yes. Obsidian uses plain markdown (.md) files as its native file format. There is no proprietary database or hidden container. Every note you write is saved as a regular text file on your disk, which means you can open the same file in any other markdown editor without converting anything.",
  },
  {
    question: "Does Obsidian support markdown?",
    answer:
      "Yes. Obsidian fully supports CommonMark plus GitHub Flavored Markdown (GFM) features like tables, task lists, strikethrough, and autolinked URLs. It also supports footnotes in reading view and adds its own syntax for wiki-links, callouts, embeds, highlights, block references, and LaTeX math through MathJax.",
  },
  {
    question: "What markdown does Obsidian use?",
    answer:
      "Obsidian uses CommonMark as its baseline, adds GitHub Flavored Markdown (GFM) extensions for tables and task lists, then layers its own syntax on top: [[wiki-links]], ![[embeds]], > [!callouts], ==highlights==, ^block-references, #tags, and LaTeX math. Everything stays in plain .md files.",
  },
  {
    question: "How does Obsidian markdown work?",
    answer:
      "You type markdown symbols into a .md file inside your vault. Obsidian reads those symbols and renders them in live preview or reading mode. Wiki-links resolve against other note filenames in the vault, embeds pull in content by filename, and the file itself stays as plain text on disk.",
  },
  {
    question: "How does Obsidian store notes as local markdown files?",
    answer:
      "Obsidian stores every note as a plain .md text file inside a folder on your computer called a vault. Images, PDFs, and attachments sit alongside the notes as regular files. Nothing is locked in a database, which is why you can open, edit, or back up your notes with any tool.",
  },
  {
    question: "How do you bold text in Obsidian?",
    answer:
      "Wrap the text in double asterisks: **bold text**. You can also select the text and press Cmd + B on Mac or Ctrl + B on Windows or Linux. The same syntax and shortcut work in every standard markdown editor, so bolded text carries over to other apps without change.",
  },
  {
    question: "How do you underline text in Obsidian?",
    answer:
      "Obsidian has no native markdown syntax for underline because CommonMark and GFM do not define one. The workaround is to use HTML: <u>underlined text</u>. Obsidian renders inline HTML in live preview and reading mode. You can also add a CSS snippet to style ==highlights== as underlines if you prefer pure markdown.",
  },
  {
    question: "How do you create a table in Obsidian markdown?",
    answer:
      "Use pipe table syntax: separate columns with vertical bars and put a divider row of dashes under the header. Example: | Column A | Column B |\\n| --- | --- |\\n| Row 1 | Value |. Obsidian renders the table in live preview and reading mode. The Advanced Tables community plugin adds tab-key navigation.",
  },
  {
    question: "How do you import markdown files into Obsidian?",
    answer:
      "Drag a folder of .md files into any Obsidian vault folder, or copy them in through your operating system file manager. Because Obsidian stores notes as plain markdown on disk, there is no import step - the files appear in the sidebar as soon as they land inside the vault.",
  },
  {
    question: "How do you query markdown tables with Dataview in Obsidian?",
    answer:
      "Install the Dataview community plugin. Then write a ```dataview code block in any note with a TABLE, LIST, or TASK query. Dataview reads frontmatter and inline fields from every note in your vault and generates a live table that updates when you edit the source notes.",
  },
  {
    question: "Can Obsidian render LaTeX math?",
    answer:
      "Yes. Obsidian uses MathJax to render LaTeX. Wrap an expression in single dollar signs for inline math ($E = mc^2$) and double dollar signs for block math ($$\\int_0^1 x^2 dx$$). Most standard LaTeX commands work, and you can add custom macros in the editor settings.",
  },
  {
    question: "Is Obsidian markdown compatible with other apps?",
    answer:
      "Mostly. Standard markdown (headings, bold, italic, lists, links, code, tables) opens cleanly in any other editor. Obsidian-specific syntax like [[wiki-links]], ![[embeds]], callouts, and ==highlights== will display as plain text in apps that do not understand them, but your underlying .md files stay intact.",
  },
  {
    question: "What is the difference between Obsidian markdown and standard markdown?",
    answer:
      "Standard markdown (CommonMark plus GFM) covers headings, formatting, lists, links, tables, and task lists. Obsidian adds wiki-links for linking notes by filename, embeds for inlining other notes, callouts for styled blocks, highlights, block references, nested tags, and LaTeX math through MathJax.",
  },
  {
    question: "Does Obsidian use its own markdown flavor?",
    answer:
      "Obsidian does not fork markdown. It starts from CommonMark, adds GFM, and then supports extra syntax on top. A plain Obsidian note is still valid markdown that any CommonMark parser can read. Only the Obsidian-specific extras like wiki-links and callouts render as plain text elsewhere.",
  },
];

// ---------------------------------------------------------------------------
// Data: HowTo schema payloads
// ---------------------------------------------------------------------------

const howToCreateTable = getHowToSchema({
  name: "How to create a table in Obsidian markdown",
  description:
    "Create a pipe table in Obsidian using GitHub Flavored Markdown syntax. Works in live preview and reading mode.",
  totalTime: "PT1M",
  tool: ["Obsidian"],
  steps: [
    {
      name: "Start a header row",
      text: "Type a pipe character, each column heading separated by pipes, then close with a trailing pipe. Example: | Task | Owner | Due |.",
    },
    {
      name: "Add the divider row",
      text: "On the next line add a pipe, at least three dashes per column, and pipes between. Example: | --- | --- | --- |.",
    },
    {
      name: "Add one row per record",
      text: "Each following line is a data row, columns separated by pipes. Cells can contain bold, links, and inline code.",
    },
    {
      name: "Preview the table",
      text: "Switch to live preview or reading mode. Obsidian renders the table automatically. Install the Advanced Tables plugin for tab-key navigation while editing.",
    },
  ],
});

const howToImportMarkdown = getHowToSchema({
  name: "How to import markdown files into Obsidian",
  description:
    "Bring existing .md files from Notion, Bear, Apple Notes, or any other source into an Obsidian vault without conversion.",
  totalTime: "PT5M",
  tool: ["Obsidian", "Operating system file manager"],
  steps: [
    {
      name: "Export your notes as markdown",
      text: "From Notion, Bear, Logseq, or any source app, export your notes as .md files. Most apps offer a Markdown export option in settings or file menu.",
    },
    {
      name: "Locate your Obsidian vault folder",
      text: "Open Obsidian, go to Settings, then Files and links, and note the vault path. The vault is a regular folder on your disk.",
    },
    {
      name: "Copy the exported files into the vault",
      text: "Use your OS file manager to drag or copy the .md files into the vault folder, or any subfolder inside it. You can nest folders however you like.",
    },
    {
      name: "Fix links if needed",
      text: "If the source app used standard [text](url.md) links, they keep working. To convert them to wiki-links, use the Obsidian Importer community plugin or a text-find-replace tool.",
    },
  ],
});

const howToDataviewQuery = getHowToSchema({
  name: "How to query markdown tables with Dataview in Obsidian",
  description:
    "Install the Dataview plugin and write a query that turns your Obsidian markdown notes into a live, filterable table.",
  totalTime: "PT5M",
  tool: ["Obsidian", "Dataview community plugin"],
  steps: [
    {
      name: "Install the Dataview plugin",
      text: "Open Obsidian Settings, go to Community plugins, turn Restricted mode off, browse for Dataview, install and enable it.",
    },
    {
      name: "Tag your notes with frontmatter",
      text: "Add YAML at the top of each note with fields you want to query. Example: --- status: active priority: high ---.",
    },
    {
      name: "Write a Dataview query block",
      text: "In any note, open a code fence with the language set to dataview. Write a TABLE, LIST, or TASK query against your frontmatter fields.",
    },
    {
      name: "Preview the live table",
      text: "Switch to reading mode. Dataview runs the query and renders a table that updates whenever the underlying notes change.",
    },
  ],
});

const softwareAppSchema = getSoftwareApplicationSchema({
  name: "Obsidian",
  description:
    "Local-first knowledge base and markdown note-taking app. Stores every note as a plain .md file on your device. Supports wiki-links, callouts, embeds, and community plugins.",
  operatingSystem: "Windows, macOS, Linux, iOS, Android",
  applicationCategory: "ProductivityApplication",
  url: "https://obsidian.md",
  offers: { price: "0", currency: "USD" },
  author: { name: "Obsidian", url: "https://obsidian.md" },
});

// ---------------------------------------------------------------------------
// Support cell rendering
// ---------------------------------------------------------------------------

function SupportCell({ value }: { value: "yes" | "no" | "partial" }) {
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Yes
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400 text-sm">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500 text-sm">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      Partial
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ObsidianMarkdownPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Obsidian Markdown", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(faqItems);

  const articleSchema = getArticleSchema({
    headline: "Obsidian Markdown: The Complete Guide to Syntax, Tables & Cheat Sheet",
    description:
      "Obsidian markdown covers CommonMark plus GFM plus Obsidian extensions: wiki-links, callouts, embeds, highlights, block references, and LaTeX math. This guide documents every syntax with copyable examples and a full cheat sheet.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    url: PAGE_PATH,
    wordCount: 3400,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToCreateTable) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToImportMarkdown) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToDataviewQuery) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/markdown-tools" className="hover:underline">
                Markdown Tools
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground">Obsidian Markdown</li>
          </ol>
        </nav>

        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Obsidian Markdown: The Complete Guide to Syntax, Tables &amp; Cheat Sheet
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {LAST_UPDATED_LABEL} &bull; By{" "}
          <Link href={AUTHOR_URL} className="hover:underline">
            {AUTHOR_NAME}
          </Link>
        </p>

        {/* Answer-first TL;DR */}
        <div className="rounded-lg border border-border bg-muted/30 p-5 mb-10">
          <p className="text-base leading-relaxed">
            <strong>Obsidian markdown is standard CommonMark plus GitHub Flavored Markdown (GFM) with Obsidian-specific extensions:</strong>{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">[[wiki-links]]</code> for internal note references,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">{"> [!note]"}</code> callouts,{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">![[embed]]</code> syntax, block references with{" "}
            <code className="bg-muted px-1 py-0.5 rounded text-sm">^block-id</code>, tags, and LaTeX math through MathJax.
            Every note is a plain <code className="bg-muted px-1 py-0.5 rounded text-sm">.md</code> file stored locally on
            your device, so your knowledge base stays portable, private, and future-proof.
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
            <li><a href="#does-obsidian-support-markdown" className="text-primary hover:underline">Does Obsidian Support Markdown?</a></li>
            <li><a href="#obsidian-markdown-syntax" className="text-primary hover:underline">Obsidian Markdown Syntax</a></li>
            <li><a href="#cheat-sheet" className="text-primary hover:underline">Obsidian Markdown Cheat Sheet</a></li>
            <li><a href="#support-features" className="text-primary hover:underline">Obsidian Markdown Support Features</a></li>
            <li><a href="#local-files" className="text-primary hover:underline">How Obsidian Stores Notes Locally</a></li>
            <li><a href="#how-to-use" className="text-primary hover:underline">How to Use Markdown in Obsidian</a></li>
            <li><a href="#editor" className="text-primary hover:underline">Obsidian Markdown Editor</a></li>
            <li><a href="#vs-standard" className="text-primary hover:underline">Obsidian vs Standard Markdown</a></li>
            <li><a href="#faq" className="text-primary hover:underline">Frequently Asked Questions</a></li>
          </ol>
        </nav>

        {/* Section 1: Does Obsidian Support Markdown? */}
        <section id="does-obsidian-support-markdown" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Does Obsidian Support Markdown?</h2>
          <p className="text-muted-foreground mb-4">
            <strong>Yes. Obsidian uses plain markdown (.md) files as its native format.</strong>{" "}
            It supports CommonMark, GitHub Flavored Markdown (GFM) features like tables and task lists,
            footnotes in reading view, and adds its own extensions: wiki-links for internal note references,
            callouts for styled blocks, embeds that pull one note into another, highlights, block references,
            nested tags, and LaTeX math through MathJax. There is nothing to convert or export - your notes
            are already markdown.
          </p>
          <p className="text-muted-foreground mb-4">
            Because every note is a plain text file on your disk, Obsidian markdown is compatible with any
            other markdown editor. Open a vault folder in VS Code, Typora, or iA Writer, and the same .md
            files render with the same formatting. Only Obsidian-specific syntax like{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">[[wiki-links]]</code> or{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{"> [!callouts]"}</code> will show as
            plain text in tools that do not understand them, but the underlying file stays intact.
          </p>
          <p className="text-muted-foreground">
            In short, Obsidian does not fork markdown. It starts from the standard spec and layers extra
            syntax on top. Read on for the full syntax reference, a copyable cheat sheet, and a feature
            matrix that compares CommonMark, GFM, and Obsidian-specific extensions side by side.
          </p>
        </section>

        {/* Section 2: Obsidian Markdown Syntax */}
        <section id="obsidian-markdown-syntax" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">Obsidian Markdown Syntax</h2>
          <p className="text-muted-foreground mb-6">
            Every syntax Obsidian supports, grouped by category. Each example is copyable.
            For a quick reference, jump to the{" "}
            <a href="#cheat-sheet" className="text-primary underline underline-offset-4">
              cheat sheet
            </a>
            . For the CommonMark baseline, see our{" "}
            <Link href="/markdown-syntax" className="text-primary underline underline-offset-4">
              markdown syntax reference
            </Link>
            {" "}and{" "}
            <Link href="/markdown-extended-syntax" className="text-primary underline underline-offset-4">
              extended syntax guide
            </Link>
            .
          </p>

          {/* H3: Headings, paragraphs */}
          <h3 id="headings" className="text-lg font-semibold mt-8 mb-2">
            Headings, paragraphs, and line breaks
          </h3>
          <p className="text-muted-foreground mb-3">
            Obsidian uses standard <code className="bg-muted px-1.5 py-0.5 rounded text-xs">#</code> hash
            syntax for headings, one hash per level up to six. A blank line between blocks creates a new
            paragraph. End a line with two spaces or a backslash to force a line break.
          </p>
          <SyntaxBlock
            code={`# H1 - top of page\n## H2 - main section\n### H3 - subsection\n\nA paragraph of text. End with two spaces  \nto force a line break.`}
          />

          {/* H3: Text formatting */}
          <h3 id="text-formatting" className="text-lg font-semibold mt-8 mb-2">
            Bold, italic, strikethrough, and highlights
          </h3>
          <p className="text-muted-foreground mb-3">
            Bold uses two asterisks, italic uses one. Strikethrough uses two tildes (GFM). Highlights
            are an Obsidian extension that wraps text in <code className="bg-muted px-1.5 py-0.5 rounded text-xs">==</code> double equals.
          </p>
          <SyntaxBlock
            code={`**bold**\n*italic*\n***both***\n~~strikethrough~~\n==highlight==\n\`inline code\``}
          />

          {/* H3: Lists */}
          <h3 id="lists" className="text-lg font-semibold mt-8 mb-2">
            Lists and task lists
          </h3>
          <p className="text-muted-foreground mb-3">
            Unordered lists use dashes, ordered lists use numbers, task lists use GFM checkbox syntax.
            Indent with four spaces (or a tab) to nest.
          </p>
          <SyntaxBlock
            code={`- Unordered item\n    - Nested item\n\n1. First\n2. Second\n\n- [ ] Open task\n- [x] Completed task`}
          />

          {/* H3: Links (wiki-links) */}
          <h3 id="links" className="text-lg font-semibold mt-8 mb-2">
            Links: wiki-links, aliases, and external URLs
          </h3>
          <p className="text-muted-foreground mb-3">
            Obsidian&apos;s signature syntax is the wiki-link: double square brackets around a note title.
            Obsidian resolves the link against filenames in your vault. Pipe-separated aliases give the
            link custom display text. External URLs still use standard CommonMark syntax.
          </p>
          <SyntaxBlock
            code={`[[Other note]]\n[[Other note|Display text]]\n[[Other note#Heading]]\n[[Other note#^block-id]]\n[External link](https://obsidian.md)`}
          />
          <p className="text-muted-foreground mt-3">
            Wiki-links are portable within a vault but render as plain text in non-Obsidian parsers.
            If you need cross-app compatibility, use standard{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[text](path.md)</code> links instead.
          </p>

          {/* H3: Embeds */}
          <h3 id="embeds" className="text-lg font-semibold mt-8 mb-2">
            Embeds: inline notes, headings, images, and PDFs
          </h3>
          <p className="text-muted-foreground mb-3">
            Prefix a wiki-link with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">!</code> to
            embed the referenced content inline. Embeds pull in other notes, specific headings, blocks,
            images, PDFs, and audio files. Useful for maps-of-content, atomic note composition, and
            transclusion workflows.
          </p>
          <SyntaxBlock
            code={`![[Other note]]\n![[Other note#Heading]]\n![[Other note#^block-id]]\n![[image.png]]\n![[document.pdf]]`}
          />

          {/* H3: Code blocks */}
          <h3 id="code-blocks" className="text-lg font-semibold mt-8 mb-2">
            Code blocks and inline code
          </h3>
          <p className="text-muted-foreground mb-3">
            Fenced code blocks use three backticks. Add a language identifier after the opening fence for
            syntax highlighting. Obsidian supports most common languages out of the box.
          </p>
          <SyntaxBlock
            code={"```js\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n```\n\nInline: `const x = 1;`"}
          />

          {/* H3: Tables */}
          <h3 id="tables" className="text-lg font-semibold mt-8 mb-2">
            Obsidian markdown tables
          </h3>
          <p className="text-muted-foreground mb-3">
            Obsidian supports GFM-style pipe tables. Column alignment uses colons in the divider row:
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">:---</code> for left,
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">:---:</code> for center,
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">---:</code> for right.
            For an interactive builder, try our{" "}
            <Link href="/markdown-table-generator" className="text-primary underline underline-offset-4">
              visual markdown table generator
            </Link>
            .
          </p>
          <SyntaxBlock
            code={`| Task      | Owner  | Due        |\n| :-------- | :----: | ---------: |\n| Draft PR  | Alice  | 2026-05-01 |\n| Review    | Bob    | 2026-05-02 |`}
          />

          {/* H3: Blockquotes and callouts */}
          <h3 id="callouts" className="text-lg font-semibold mt-8 mb-2">
            Blockquotes and callouts
          </h3>
          <p className="text-muted-foreground mb-3">
            Standard blockquotes use a greater-than sign. Obsidian extends this with callouts: prefix the
            first line with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[!type]</code> to
            get a styled, colored block. Supported types include note, abstract, info, tip, success,
            question, warning, failure, danger, bug, example, quote. Append{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">-</code> for collapsed by default or{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">+</code> for expanded by default.
          </p>
          <SyntaxBlock
            code={`> Plain blockquote text.\n\n> [!note]\n> This is a styled note callout.\n\n> [!warning] Custom title\n> Foldable warning content.\n\n> [!tip]- Click to expand\n> Hidden tip, collapsed by default.`}
          />

          {/* H3: Math */}
          <h3 id="math" className="text-lg font-semibold mt-8 mb-2">
            LaTeX math (MathJax)
          </h3>
          <p className="text-muted-foreground mb-3">
            Wrap an expression in single dollar signs for inline math, or double dollar signs for display
            math. Obsidian renders LaTeX through MathJax. Most standard commands work, and you can add
            custom macros in Settings &rarr; Editor.
          </p>
          <SyntaxBlock
            code={`Inline: $E = mc^2$\n\nBlock:\n$$\n\\int_0^1 x^2 \\, dx = \\frac{1}{3}\n$$`}
          />

          {/* H3: Footnotes */}
          <h3 id="footnotes" className="text-lg font-semibold mt-8 mb-2">
            Footnotes
          </h3>
          <p className="text-muted-foreground mb-3">
            Footnotes render in reading view only. Use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[^label]</code> where you want the
            reference, and define the body elsewhere in the file.
          </p>
          <SyntaxBlock
            code={`This claim has a footnote[^source].\n\n[^source]: Obsidian Help, accessed 2026-04.`}
          />

          {/* H3: Tags and block references */}
          <h3 id="tags-blocks" className="text-lg font-semibold mt-8 mb-2">
            Tags, block references, and other extras
          </h3>
          <p className="text-muted-foreground mb-3">
            Tags start with <code className="bg-muted px-1.5 py-0.5 rounded text-xs">#</code> and support
            nesting with slashes. Block references assign an id to any block; link to that block from
            anywhere using <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[[Note#^id]]</code>.
          </p>
          <SyntaxBlock
            code={`#project/active #status/in-progress\n\nA quotable paragraph. ^paragraph-1\n\nLink to it: [[This note#^paragraph-1]]`}
          />
        </section>

        {/* Section 3: Cheat Sheet */}
        <section id="cheat-sheet" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Obsidian Markdown Cheat Sheet
          </h2>
          <p className="text-muted-foreground mb-4">
            Every Obsidian markdown syntax in one table. Copy any row&apos;s code with the button next to
            it. For a printable version, use the copy-all button below, or see our general-purpose{" "}
            <Link href="/markdown-cheat-sheet" className="text-primary underline underline-offset-4">
              markdown cheat sheet
            </Link>
            .
          </p>
          <div className="mb-4 flex gap-2">
            <CopyButton content={cheatSheetDownload} label="Copy entire cheat sheet" />
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3 border-b border-border">Category</th>
                  <th className="text-left font-medium p-3 border-b border-border">Format</th>
                  <th className="text-left font-medium p-3 border-b border-border">Syntax</th>
                  <th className="text-left font-medium p-3 border-b border-border">Renders as</th>
                </tr>
              </thead>
              <tbody>
                {cheatSheetRows.map((row, idx) => (
                  <tr
                    key={`${row.category}-${row.format}`}
                    className={idx < cheatSheetRows.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-3 align-top text-muted-foreground whitespace-nowrap">{row.category}</td>
                    <td className="p-3 align-top font-medium whitespace-nowrap">{row.format}</td>
                    <td className="p-3 align-top">
                      <div className="flex items-start gap-2">
                        <pre className="bg-muted rounded px-2 py-1 text-xs whitespace-pre-wrap break-words flex-1 font-mono">
                          <code>{row.syntax}</code>
                        </pre>
                        <CopyButton content={row.syntax} />
                      </div>
                    </td>
                    <td className="p-3 align-top text-muted-foreground text-sm">{row.renders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Support Features matrix */}
        <section id="support-features" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Obsidian Markdown Support Features
          </h2>
          <p className="text-muted-foreground mb-4">
            Obsidian markdown support spans three layers: CommonMark (the baseline spec), GitHub Flavored
            Markdown (adds tables, task lists, strikethrough, autolinks), and Obsidian&apos;s own extensions.
            The matrix below shows which features come from which layer, so you can tell what will
            survive in a non-Obsidian editor.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3 border-b border-border">Feature</th>
                  <th className="text-left font-medium p-3 border-b border-border">CommonMark</th>
                  <th className="text-left font-medium p-3 border-b border-border">GFM</th>
                  <th className="text-left font-medium p-3 border-b border-border">Obsidian</th>
                </tr>
              </thead>
              <tbody>
                {featureMatrixRows.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className={idx < featureMatrixRows.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-3 align-top font-medium">
                      {row.feature}
                      {row.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground font-normal">{row.notes}</p>
                      )}
                    </td>
                    <td className="p-3 align-top"><SupportCell value={row.cm} /></td>
                    <td className="p-3 align-top"><SupportCell value={row.gfm} /></td>
                    <td className="p-3 align-top"><SupportCell value={row.obsidian} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Local files */}
        <section id="local-files" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            How Obsidian Stores Notes as Local Markdown Files
          </h2>
          <p className="text-muted-foreground mb-4">
            <strong>Obsidian stores every note as a plain .md text file inside a folder called a vault.</strong>{" "}
            A vault is just a regular folder on your disk. Notes sit as .md files; images, PDFs, and other
            attachments sit alongside them as regular files. There is no proprietary database, no hidden
            container, and no required cloud service. You own every byte.
          </p>
          <p className="text-muted-foreground mb-4">
            That local-first architecture is why people call Obsidian a knowledge base rather than just
            a note app. You can:
          </p>
          <ul className="space-y-2 text-muted-foreground mb-4">
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>Back up your entire vault with any file-sync tool (iCloud, Dropbox, Syncthing, Git).</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>Open the same .md files in VS Code, Typora, or any other markdown editor.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>Version-control your notes with Git for a full history of every change.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>Grep or ripgrep across thousands of notes instantly, because they are plain text.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary font-bold">-</span>
              <span>Read your notes in 20 years, regardless of what happens to the Obsidian app.</span>
            </li>
          </ul>
          <p className="text-muted-foreground">
            For the canonical reference, see{" "}
            <a
              href="https://help.obsidian.md/Getting+started/Create+notes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Obsidian&apos;s official docs on local markdown files
            </a>
            .
          </p>
        </section>

        {/* Section 6: How to use markdown in Obsidian */}
        <section id="how-to-use" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            How to Use Markdown in Obsidian
          </h2>
          <p className="text-muted-foreground mb-6">
            Four common tasks, each with copyable syntax and a step list. For CommonMark basics outside
            Obsidian, start with our{" "}
            <Link href="/markdown-guide" className="text-primary underline underline-offset-4">
              complete markdown guide
            </Link>
            .
          </p>

          {/* H3: Create table */}
          <h3 id="how-to-create-table" className="text-lg font-semibold mt-6 mb-2">
            How to create a table in Obsidian markdown
          </h3>
          <p className="text-muted-foreground mb-3">
            Obsidian uses GFM pipe tables. Separate columns with vertical bars, add a divider row of
            dashes under the header, then one row per record. Obsidian renders the table in live preview
            and reading mode.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Type a header row, columns separated by pipes.</li>
            <li>Add the divider row: pipes and at least three dashes per column.</li>
            <li>Add one data row per record.</li>
            <li>Switch to live preview or reading mode to see the rendered table.</li>
          </ol>
          <SyntaxBlock
            code={`| Task      | Owner  | Due        |\n| :-------- | :----: | ---------: |\n| Draft PR  | Alice  | 2026-05-01 |\n| Review    | Bob    | 2026-05-02 |`}
          />
          <p className="text-muted-foreground mt-3 text-sm">
            Tip: install the Advanced Tables community plugin for tab-key navigation, auto-alignment, and
            sort-by-column while editing.
          </p>

          {/* H3: Import markdown */}
          <h3 id="how-to-import" className="text-lg font-semibold mt-8 mb-2">
            How to import markdown files into Obsidian
          </h3>
          <p className="text-muted-foreground mb-3">
            Because Obsidian stores notes as plain .md files on disk, there is no import step. Copy the
            files into the vault folder and they appear in the sidebar immediately.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Export your notes as .md from the source app (Notion, Bear, Logseq, Apple Notes, etc.).</li>
            <li>Open Obsidian Settings, then Files and links, and note the vault folder path.</li>
            <li>Drag or copy the exported .md files into the vault folder using your OS file manager.</li>
            <li>Open Obsidian. The new notes appear in the file sidebar automatically.</li>
          </ol>
          <p className="text-muted-foreground text-sm">
            For Notion imports, the official Obsidian Importer plugin converts Notion exports and rewrites
            links to wiki-link format. For Bear or Apple Notes, the exported .md files work as-is, though
            internal links remain in standard{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">[text](path.md)</code> form.
          </p>

          {/* H3: Underline */}
          <h3 id="how-to-underline" className="text-lg font-semibold mt-8 mb-2">
            How to underline text in Obsidian
          </h3>
          <p className="text-muted-foreground mb-3">
            <strong>Obsidian has no native markdown syntax for underline.</strong> Neither CommonMark nor
            GFM defines one, and the Obsidian team has not added a custom symbol. Three workarounds:
          </p>
          <div className="space-y-3 mb-4">
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium text-sm mb-1">1. Use HTML directly</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Obsidian renders inline HTML. Wrap the text in{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">&lt;u&gt;</code> tags.
              </p>
              <SyntaxBlock code={`This word is <u>underlined</u>.`} />
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium text-sm mb-1">2. Repurpose highlights with a CSS snippet</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Add a CSS snippet in Settings &rarr; Appearance &rarr; CSS snippets that styles{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">mark</code> as underline. Now{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">==text==</code> renders as an
                underline across every note in your vault.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium text-sm mb-1">3. Use a community plugin</h4>
              <p className="text-sm text-muted-foreground">
                The Underline community plugin adds a shortcut (Cmd/Ctrl + U) that wraps the selection in
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs mx-1">&lt;u&gt;</code> tags.
              </p>
            </div>
          </div>

          {/* H3: Dataview */}
          <h3 id="how-to-dataview" className="text-lg font-semibold mt-8 mb-2">
            How to query markdown tables with Dataview
          </h3>
          <p className="text-muted-foreground mb-3">
            Dataview is a community plugin that treats your vault like a database. Give your notes
            frontmatter fields, then query them with SQL-like blocks that render as live tables.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
            <li>Install Dataview: Settings &rarr; Community plugins &rarr; Browse &rarr; Dataview &rarr; Install and Enable.</li>
            <li>Add YAML frontmatter to notes you want to query.</li>
            <li>Write a Dataview query in a fenced code block.</li>
            <li>Switch to reading mode to see the live table.</li>
          </ol>
          <SyntaxBlock
            code={"```dataview\nTABLE status, priority, due\nFROM #project\nWHERE status = \"active\"\nSORT priority DESC\n```"}
          />
        </section>

        {/* Section 7: Editor */}
        <section id="editor" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Obsidian Markdown Editor
          </h2>
          <p className="text-muted-foreground mb-4">
            The Obsidian markdown editor has three viewing modes:
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Source mode</h3>
              <p className="text-sm text-muted-foreground">
                Pure text view. Every symbol is visible, nothing is rendered. Closest to what the .md file
                looks like on disk.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Live preview</h3>
              <p className="text-sm text-muted-foreground">
                Hybrid mode. Symbols render as you move the cursor off the line. Good for fast writing
                with immediate feedback.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <h3 className="font-medium mb-1">Reading mode</h3>
              <p className="text-sm text-muted-foreground">
                Fully rendered, read-only view. Footnotes, Dataview queries, and embeds all render here.
              </p>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">
            Obsidian ships with standard shortcuts (Cmd/Ctrl + B for bold, Cmd/Ctrl + I for italic,
            Cmd/Ctrl + E to toggle source/preview). Community plugins extend the editor with Advanced
            Tables, Templater, Dataview, Calendar, and hundreds more. If you just want to try markdown
            without installing Obsidian, use our{" "}
            <Link href="/markdown-editor" className="text-primary underline underline-offset-4">
              free online markdown editor
            </Link>
            {" "}in the browser.
          </p>
          <p className="text-muted-foreground">
            Obsidian runs on Windows, macOS, Linux, iOS, and Android. The desktop app is free for personal
            use; paid add-ons include Sync (encrypted cloud sync) and Publish (publish vaults as
            websites).
          </p>
        </section>

        {/* Section 8: vs Standard */}
        <section id="vs-standard" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Obsidian vs Standard Markdown
          </h2>
          <p className="text-muted-foreground mb-4">
            Obsidian follows CommonMark plus GFM for core syntax, then adds extensions that only render
            inside Obsidian. Here is what changes between a standard markdown file and an Obsidian
            markdown file.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-medium p-3 border-b border-border">Aspect</th>
                  <th className="text-left font-medium p-3 border-b border-border">Standard markdown</th>
                  <th className="text-left font-medium p-3 border-b border-border">Obsidian markdown</th>
                </tr>
              </thead>
              <tbody>
                {vsStandardRows.map((row, idx) => (
                  <tr
                    key={row.aspect}
                    className={idx < vsStandardRows.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="p-3 align-top font-medium">{row.aspect}</td>
                    <td className="p-3 align-top text-muted-foreground">{row.standard}</td>
                    <td className="p-3 align-top text-muted-foreground">{row.obsidian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted-foreground">
            If cross-app portability matters, stick to CommonMark plus GFM and avoid Obsidian-only syntax
            in those notes. For knowledge-base notes that live in your vault, Obsidian extensions give you
            linking, embedding, and querying that standard markdown cannot match. Compare other apps
            in our <Link href="/markdown-tools/notion" className="text-primary underline underline-offset-4">Notion markdown support</Link>
            {" "}or <Link href="/markdown-tools/logseq" className="text-primary underline underline-offset-4">Logseq markdown</Link>{" "}
            guides.
          </p>
        </section>

        {/* Section 9: FAQ */}
        <section id="faq" className="mb-12">
          <h2 className="text-2xl font-semibold mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div key={item.question}>
                <h3 className="font-medium mb-1">{item.question}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Next steps CTA */}
        <section className="mb-12 rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold mb-3">Keep exploring</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/markdown-editor"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try it in our editor
            </Link>
            <Link
              href="/markdown-cheat-sheet"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Standard markdown cheat sheet
            </Link>
            <Link
              href="/markdown-guide"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Complete markdown guide
            </Link>
            <Link
              href="/markdown-extended-syntax"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Extended syntax
            </Link>
            <a
              href="https://obsidian.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Obsidian official site
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        </section>

        <ToolFooter currentPath={PAGE_PATH} />
      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Local helper: code block with copy button
// ---------------------------------------------------------------------------

function SyntaxBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2">
        <CopyButton content={code} />
      </div>
    </div>
  );
}
