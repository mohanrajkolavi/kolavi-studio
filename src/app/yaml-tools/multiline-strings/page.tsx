import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/multiline-strings";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/multiline-strings";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML Multiline Strings | Block Scalar | and > Explained (2026)",
  description:
    "Complete guide to YAML multiline strings. Block scalars (literal | and folded >), chomping indicators (-, +), quoting, and gotchas with copy-ready examples.",
  path: PAGE_PATH,
  keywords:
    "yaml multiline string, yaml multiline, yaml block scalar, yaml literal block, yaml folded scalar, yaml string newlines, yaml pipe, yaml |, yaml >",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const literal = `description: |
  This is line one.
  This is line two.
  This is line three.
`;

const folded = `description: >
  This is one long
  paragraph that gets folded
  into a single line with spaces.
`;

const chompStrip = `description: |-
  No trailing newline.
  The hyphen strips it.
`;

const chompKeep = `description: |+
  Keep all trailing newlines.



`;

const quotedDouble = `message: "Line one\\nLine two\\tIndented"
`;

const quotedSingle = `path: 'C:\\Users\\me\\Documents'
`;

const indentationGotcha = `# Indent indicator (number after | or >)
script: |2
    indented two extra spaces below the indentation indicator
    this entire line is part of the script
`;

const FAQS = [
  {
    question: "How do I write a multiline string in YAML?",
    answer:
      "Use a block scalar. Place a pipe (|) after the key for a literal block where newlines are preserved, or a greater-than sign (>) for a folded block where newlines become spaces. The body is indented two spaces under the key.",
  },
  {
    question: "What is the difference between | and > in YAML?",
    answer:
      "Pipe (|) is a literal block scalar - newlines are kept exactly as written. Greater-than (>) is a folded block scalar - newlines become single spaces, making the content read like one paragraph after parsing.",
  },
  {
    question: "How do I keep or strip trailing newlines in YAML block scalars?",
    answer:
      "Add a chomping indicator after | or >. The minus (|-) strips the final newline. The plus (|+) keeps every trailing newline. With no indicator, exactly one trailing newline is kept (the 'clip' default).",
  },
  {
    question: "How do I write a multiline string with special characters?",
    answer:
      "Use a double-quoted string and escape sequences. Inside double quotes, \\n inserts a newline, \\t inserts a tab, and \\\\ inserts a backslash. Single-quoted strings treat all content as literal except for the quote character itself.",
  },
  {
    question: "Why is my YAML multiline string not working?",
    answer:
      "Most often the body of the block scalar is not indented far enough or far enough consistently. Every line of the value must indent past the column of the first character after the | or > indicator. Mixing tabs with spaces also breaks YAML parsing.",
  },
  {
    question: "How do I write JSON-style multiline strings in YAML?",
    answer:
      "Quote the string and embed \\n escape sequences inside double quotes. Example: message: \"Line one\\nLine two\". This works the same way as multiline JSON strings, since YAML 1.2 is a superset of JSON.",
  },
  {
    question: "Can I have a multiline string in a YAML list?",
    answer:
      "Yes. The block scalar follows a list-item hyphen exactly like it follows a map key. Use - | for a literal list-item and indent the body under the hyphen.",
  },
  {
    question: "Does YAML preserve indentation inside block scalars?",
    answer:
      "Yes, but the parser strips the leading indentation that matches the block's base indent. Add an explicit indentation indicator (a number after | or >) if your content starts with extra leading whitespace you need preserved.",
  },
  {
    question: "How do I write a long single-line string without folding?",
    answer:
      "Wrap the string in double quotes and let it span the line in source. Or use the | block scalar without any newlines. For automatic line wrapping in your editor, leave hard-wrap off and let the parser see one logical line.",
  },
  {
    question: "Are tabs allowed in YAML multiline strings?",
    answer:
      "YAML does not allow tabs for indentation. Inside a block scalar, tabs in the content itself are usually fine, but any line that begins with a tab is rejected by the parser. Use spaces for all leading whitespace.",
  },
];

export default function YamlMultilineStringsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "Multiline Strings", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML Multiline Strings: Block Scalars Explained",
    description:
      "How to write multiline strings in YAML using literal (|) and folded (>) block scalars, chomping indicators, and quoted strings.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1500,
  });

  const howToSchema = getHowToSchema({
    name: "How to write a YAML multiline string",
    description: "Steps to author a multiline string in YAML.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Pick a block scalar style",
        text: "Use | to keep newlines literal or > to fold them into spaces.",
      },
      {
        name: "Optionally add a chomping indicator",
        text: "Add - to strip the final newline, + to keep every trailing newline, or omit for the default single-newline clip.",
      },
      {
        name: "Indent the body",
        text: "Each body line indents two spaces under the key, consistently.",
      },
      {
        name: "Validate the result",
        text: "Run the file through the YAML validator to confirm the parser sees what you expect.",
      },
    ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article>
          <header className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">
              {LAST_UPDATED_LABEL}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              YAML Multiline Strings: Block Scalars Explained
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The complete guide to YAML multiline strings: literal (
              <code>|</code>) and folded (<code>&gt;</code>) block scalars,
              chomping indicators, quoted alternatives, and the indent
              gotchas that break otherwise correct files.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Written by{" "}
              <Link href={AUTHOR_URL} className="underline hover:text-foreground">
                {AUTHOR_NAME}
              </Link>
              .
            </p>
          </header>

          <div className="mb-10 rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-semibold mb-2">
              Quick answer
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use <code>|</code> after a key to write a literal block scalar -
              newlines are kept as written. Use <code>&gt;</code> to write a
              folded block scalar - newlines become spaces and the content
              reads like one paragraph. Add <code>-</code> to strip the final
              newline or <code>+</code> to keep all trailing newlines.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="literal-block">Literal block scalar (|)</h2>
            <p>
              The literal style preserves newlines exactly as you type them. It
              is the right choice for shell scripts, code blocks, formatted
              text, or anything where the line structure matters:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  literal.yaml
                </span>
                <CopyButton content={literal} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {literal}
              </pre>
            </div>
            <p>
              Parsed value:{" "}
              <code>"This is line one.\nThis is line two.\nThis is line three.\n"</code>
            </p>

            <h2 id="folded-block">Folded block scalar (&gt;)</h2>
            <p>
              The folded style replaces single newlines with spaces. Use it for
              long descriptions, error messages, or any prose you want stored
              as a single line at runtime:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  folded.yaml
                </span>
                <CopyButton content={folded} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {folded}
              </pre>
            </div>
            <p>
              Parsed value:{" "}
              <code>"This is one long paragraph that gets folded into a single line with spaces.\n"</code>
            </p>
            <p>
              Two consecutive newlines in the source become a single newline in
              the output, so blank lines act as paragraph breaks.
            </p>

            <h2 id="chomping">Chomping indicators: -, +, and the default</h2>
            <p>
              The chomping indicator controls trailing newlines:
            </p>
            <ul>
              <li>
                <code>|-</code> or <code>&gt;-</code> - strip every trailing
                newline.
              </li>
              <li>
                <code>|+</code> or <code>&gt;+</code> - keep every trailing
                newline.
              </li>
              <li>
                <code>|</code> or <code>&gt;</code> - keep exactly one trailing
                newline (the "clip" default).
              </li>
            </ul>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  chomp-strip.yaml
                </span>
                <CopyButton content={chompStrip} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {chompStrip}
              </pre>
            </div>
            <div className="not-prose rounded-lg border bg-muted/30 p-4 mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  chomp-keep.yaml
                </span>
                <CopyButton content={chompKeep} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {chompKeep}
              </pre>
            </div>

            <h2 id="quoted">Quoted multiline strings</h2>
            <p>
              For shorter strings with embedded special characters, use quoted
              forms instead of block scalars:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  double-quoted.yaml
                </span>
                <CopyButton content={quotedDouble} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {quotedDouble}
              </pre>
            </div>
            <p>
              Double-quoted strings support C-style escape sequences:{" "}
              <code>\n</code> for newline, <code>\t</code> for tab,{" "}
              <code>\\</code> for a literal backslash, and <code>\"</code> for
              a literal quote.
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4 mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  single-quoted.yaml
                </span>
                <CopyButton content={quotedSingle} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {quotedSingle}
              </pre>
            </div>
            <p>
              Single-quoted strings treat all content as literal. The only
              escape is two single quotes (<code>''</code>) for a single quote
              character.
            </p>

            <h2 id="indent-indicator">The indent indicator</h2>
            <p>
              You can add a numeric indent indicator after <code>|</code> or{" "}
              <code>&gt;</code> to tell the parser exactly how many spaces of
              indentation count as the base. This is useful when your content
              starts with extra whitespace that needs to be preserved:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  indent-indicator.yaml
                </span>
                <CopyButton content={indentationGotcha} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {indentationGotcha}
              </pre>
            </div>

            <h2 id="when-to-use-which">Which style should you use?</h2>
            <ul>
              <li>
                <strong>Shell scripts, code, formatted text</strong> - use{" "}
                <code>|</code> with the default chomp.
              </li>
              <li>
                <strong>Long prose / descriptions</strong> - use <code>&gt;</code>
                so the runtime gets one clean string.
              </li>
              <li>
                <strong>Embedded newlines or tabs in short strings</strong> -
                use double-quoted with <code>\n</code> escapes.
              </li>
              <li>
                <strong>Strings with backslashes that should not be
                escaped</strong> - use single-quoted (Windows paths, regex).
              </li>
              <li>
                <strong>Trailing whitespace matters</strong> - pick the
                chomping indicator (<code>-</code> or <code>+</code>)
                explicitly so behavior is obvious to the next reader.
              </li>
            </ul>

            <h2 id="related">Validate your block scalars</h2>
            <p>
              Indentation mistakes in block scalars are silent in many
              editors. Drop the file into our{" "}
              <Link href="/yaml-validator" className="text-primary hover:underline">
                YAML validator
              </Link>{" "}
              to confirm it parses, or use the{" "}
              <Link href="/yaml-to-json" className="text-primary hover:underline">
                YAML to JSON converter
              </Link>{" "}
              to inspect exactly what the runtime will see.
            </p>
          </div>

          <section id="faqs" className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {FAQS.map((faq) => (
                <div key={faq.question} className="rounded-lg border p-5">
                  <h3 className="text-base font-semibold mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </article>

        <YamlToolFooter currentPath="/yaml-tools/multiline-strings" />
      </div>
    </>
  );
}
