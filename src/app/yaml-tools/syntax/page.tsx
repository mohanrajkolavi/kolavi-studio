import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/syntax";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/syntax";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML Syntax Reference & Cheat Sheet (2026)",
  description:
    "Complete YAML 1.2 syntax reference. Scalars, sequences, mappings, indentation, comments, anchors, multiline, and a full cheat-sheet example.",
  path: PAGE_PATH,
  keywords:
    "yaml syntax, yaml format, yaml example, yaml code, yaml structure, yaml language reference, yaml cheat sheet, yaml format example",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const scalars = `# Scalars: strings, numbers, booleans, nulls
title: Quick start            # plain string (no quotes)
quoted: "Hello, world"       # double-quoted - allows escapes
literal: 'C:\\Users\\me'      # single-quoted - all literal
count: 42                     # integer
ratio: 3.14                   # float
hex: 0xFF                     # hexadecimal integer
exp: 6.022e23                 # scientific notation
enabled: true                 # boolean (also: yes, on)
disabled: false               # boolean (also: no, off)
empty: null                   # null (also: ~ or unset)
date: 2026-04-28              # ISO date
timestamp: 2026-04-28T10:30:00Z
`;

const sequences = `# Sequences (lists/arrays)
fruits:                       # block style
  - apple
  - banana
  - cherry

ports: [80, 443, 8080]        # flow style (inline)

nested:
  - name: Web
    port: 80
  - name: API
    port: 8080
`;

const mappings = `# Mappings (maps/dicts/objects)
server:                       # block style
  host: localhost
  port: 8080

inline: { host: localhost, port: 8080 }   # flow style
`;

const indentation = `# Indentation defines structure
parent:
  child:
    grandchild: value         # 2 spaces per level (most common)
    sibling: value
  another_child: value
parent2: value
`;

const comments = `# Comments start with # and run to end of line
service: api                  # comments can also be inline
# version: 1.0                # entire line commented out
`;

const blockScalars = `# Block scalars for multiline strings
literal: |
  Line 1
  Line 2
  Line 3

folded: >
  These three lines
  fold into a single
  paragraph with spaces.

stripped: |-                  # |- removes trailing newlines
  No trailing newline here.
`;

const anchorsAliases = `# Anchors and aliases for reuse
defaults: &defaults
  retries: 3
  timeout: 30

development:
  <<: *defaults              # merge keys
  database: app_dev

production:
  <<: *defaults
  database: app_prod
  timeout: 60                # local key overrides merged value
`;

const multiDoc = `# Multiple documents in one file (separated by ---)
apiVersion: v1
kind: Namespace
metadata:
  name: production
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: info
`;

const cheatSheet = `# YAML Cheat Sheet - one file covering everything
# Strings
plain_string: hello
double_quoted: "with \\n escapes"
single_quoted: 'literal \\n'

# Numbers and booleans
count: 100
price: 19.99
enabled: true
ratio: ~                       # null

# Lists
tags:                          # block list
  - alpha
  - beta
inline_tags: [alpha, beta]     # flow list

# Maps
address:                       # block map
  street: "123 Main"
  city: Springfield
inline: { x: 1, y: 2 }         # flow map

# Multiline strings
description: |
  Line 1
  Line 2

summary: >
  Folded lines
  become spaces.

# Comments
# This entire line is a comment.
api: v1                        # inline comment

# Anchors
defaults: &defaults
  retries: 3

production:
  <<: *defaults
  region: us-east-1
`;

const FAQS = [
  {
    question: "What is the basic syntax of YAML?",
    answer:
      "YAML uses indentation (spaces, never tabs) to express structure. Maps are 'key: value' pairs, lists use a leading hyphen and space ('- item'), and nested structures indent two spaces deeper than their parent. Comments start with #. The current spec is YAML 1.2.",
  },
  {
    question: "How do you write a list in YAML?",
    answer:
      "Two styles. Block style uses a hyphen and a space at the start of each line: '- apple', '- banana'. Flow style uses square brackets inline: '[apple, banana]'. Both produce the same array at parse time. Use block style for readable, multi-line lists.",
  },
  {
    question: "How do you write a key-value pair in YAML?",
    answer:
      "Write the key, a colon, a space, then the value: 'name: alice'. The space after the colon is required by the spec. For nested values, indent the child two spaces under the key. For values with special characters, wrap them in single or double quotes.",
  },
  {
    question: "Can you use tabs in YAML?",
    answer:
      "No. The YAML 1.2 specification forbids tabs for indentation. Always use spaces. Most parsers reject any file containing a tab in indentation with a clear error. Configure your editor to convert tabs to spaces inside .yaml files.",
  },
  {
    question: "What characters need to be quoted in YAML?",
    answer:
      "Quote a string when it contains special characters (#, &, *, !, |, >, %, @, `, comma, colon followed by space), starts with a YAML-reserved character (-, ?, :), or could be misread as a different type (numbers like '10', booleans like 'yes', or 'null'). When in doubt, quote it.",
  },
  {
    question: "How do you write a multiline string in YAML?",
    answer:
      "Use a block scalar. The literal style (pipe, |) preserves newlines exactly. The folded style (greater-than, >) folds newlines into spaces, producing a single paragraph at parse time. Both keep the body indented two spaces under the key.",
  },
  {
    question: "What is the difference between flow style and block style YAML?",
    answer:
      "Block style uses indentation and one item per line - easy for humans to read and version-control. Flow style uses brackets and braces inline, like JSON - compact but harder to diff. Most config files use block style; flow is useful for short inline lists or when embedding YAML in another format.",
  },
  {
    question: "How do you add comments to YAML?",
    answer:
      "Start a comment with # and write text until the end of the line. Comments can take an entire line or appear after a value (with at least one space before the #). YAML does not have block-comment syntax - to comment out multiple lines, prefix each line with #.",
  },
  {
    question: "What is the file extension for YAML?",
    answer:
      "Both .yaml and .yml are valid. The official recommendation since YAML 1.2 is .yaml, but .yml is widespread on Windows-derived tooling. They are byte-for-byte identical in content; only the extension differs. See our YAML vs YML page for the full tool support matrix.",
  },
  {
    question: "How do you separate multiple documents in a single YAML file?",
    answer:
      "Use a line containing only three hyphens (---) between documents. Each section is parsed as an independent document, so you can ship a Namespace, Deployment, Service, and ConfigMap together in a single file and apply them in order.",
  },
  {
    question: "How do I check if my YAML syntax is valid?",
    answer:
      "Drop the file into an online YAML validator like ours - it parses with a YAML 1.2-compliant library and reports errors with line and column numbers. Locally, use 'yamllint file.yaml' or load the file in Python with yaml.safe_load to confirm it parses.",
  },
  {
    question: "What is YAML 1.1 vs YAML 1.2?",
    answer:
      "YAML 1.2 (the current spec, since 2009) is the alignment with JSON - YAML 1.2 is a strict superset of JSON. YAML 1.1 is the earlier spec; its main practical difference is the 'Norway problem' where 'NO' parses as a boolean. Modern parsers default to 1.2; quote any string that could be misread.",
  },
];

export default function YamlSyntaxPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Syntax", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML Syntax Reference & Cheat Sheet",
    description:
      "Complete YAML 1.2 syntax reference covering scalars, sequences, mappings, indentation, comments, anchors, and multiline strings.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1900,
  });

  const howToSchema = getHowToSchema({
    name: "How to write valid YAML",
    description:
      "Steps to author a YAML file that parses with any YAML 1.2 library.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Use spaces, not tabs",
        text: "Configure your editor to use 2 spaces per indent level. YAML rejects tab indentation.",
      },
      {
        name: "Write key: value pairs",
        text: "Each line is 'key: value'. Always include the space after the colon.",
      },
      {
        name: "Use - for list items",
        text: "Each list item starts with a hyphen and a space. Indent items consistently under the parent key.",
      },
      {
        name: "Quote ambiguous strings",
        text: "Wrap any value that looks like a number, boolean, or YAML-reserved word in single or double quotes.",
      },
      {
        name: "Validate the file",
        text: "Run the file through a YAML validator to confirm it parses before committing or deploying.",
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
              YAML Syntax Reference & Cheat Sheet
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The complete YAML 1.2 syntax in one page. Scalars, sequences,
              mappings, indentation, comments, anchors, multiline strings,
              and a full cheat-sheet example you can paste into any project.
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
            <h2 className="text-base font-semibold mb-2">Quick answer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YAML uses indentation with spaces (never tabs) to express
              structure. Map entries are <code>key: value</code> pairs.
              List items start with <code>-</code>. Strings, numbers, booleans
              and nulls work as expected. Comments start with <code>#</code>.
              Multiline strings use <code>|</code> (literal) or{" "}
              <code>&gt;</code> (folded). Reuse blocks with anchors
              (<code>&amp;</code>) and aliases (<code>*</code>). Multiple
              documents in one file are separated by <code>---</code>.
            </p>
          </div>

          <nav className="mb-10 rounded-lg border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold mb-2">On this page</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="#scalars" className="text-primary hover:underline">
                  Scalars (strings, numbers, booleans, null)
                </a>
              </li>
              <li>
                <a href="#sequences" className="text-primary hover:underline">
                  Sequences (lists/arrays)
                </a>
              </li>
              <li>
                <a href="#mappings" className="text-primary hover:underline">
                  Mappings (maps/dictionaries)
                </a>
              </li>
              <li>
                <a href="#indentation" className="text-primary hover:underline">
                  Indentation rules
                </a>
              </li>
              <li>
                <a href="#comments" className="text-primary hover:underline">
                  Comments
                </a>
              </li>
              <li>
                <a href="#block-scalars" className="text-primary hover:underline">
                  Multiline / block scalars
                </a>
              </li>
              <li>
                <a href="#anchors" className="text-primary hover:underline">
                  Anchors and aliases
                </a>
              </li>
              <li>
                <a href="#multi-doc" className="text-primary hover:underline">
                  Multiple documents
                </a>
              </li>
              <li>
                <a href="#cheat-sheet" className="text-primary hover:underline">
                  Full cheat sheet
                </a>
              </li>
              <li>
                <a href="#faqs" className="text-primary hover:underline">
                  FAQs
                </a>
              </li>
            </ul>
          </nav>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="scalars">Scalars</h2>
            <p>
              A scalar is a single value: a string, number, boolean, or null.
              YAML auto-detects the type from the form of the value, with
              quoted strings always typed as string:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  scalars.yaml
                </span>
                <CopyButton content={scalars} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {scalars}
              </pre>
            </div>
            <ul>
              <li>
                <strong>Plain</strong> (unquoted) strings are easiest, but
                YAML auto-detects type. Anything that looks like a number or
                boolean will be parsed as such.
              </li>
              <li>
                <strong>Double-quoted</strong> strings support C-style escape
                sequences (<code>\n</code>, <code>\t</code>,{" "}
                <code>\\</code>). Use them when you need embedded newlines or
                Unicode escapes.
              </li>
              <li>
                <strong>Single-quoted</strong> strings treat all content as
                literal. The only escape is two single quotes for one single
                quote. Use them for Windows paths and regex.
              </li>
            </ul>

            <h2 id="sequences">Sequences (lists / arrays)</h2>
            <p>
              YAML supports two list styles. Block style is one item per line
              with a leading hyphen; flow style uses square brackets inline:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  sequences.yaml
                </span>
                <CopyButton content={sequences} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {sequences}
              </pre>
            </div>
            <p>
              See{" "}
              <Link
                href="/yaml-tools/arrays-and-lists"
                className="text-primary hover:underline"
              >
                YAML arrays and lists
              </Link>{" "}
              for nested lists, lists of maps, and dictionary patterns.
            </p>

            <h2 id="mappings">Mappings (maps / dictionaries)</h2>
            <p>
              A mapping is a set of key-value pairs. Like sequences, mappings
              come in block and flow styles:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  mappings.yaml
                </span>
                <CopyButton content={mappings} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {mappings}
              </pre>
            </div>

            <h2 id="indentation">Indentation rules</h2>
            <p>
              Indentation is the only way YAML expresses nesting. Three rules
              cover almost every case:
            </p>
            <ol>
              <li>
                <strong>Spaces only.</strong> Tabs are rejected by every
                YAML 1.2 parser.
              </li>
              <li>
                <strong>Be consistent.</strong> Pick 2 spaces (most common) or
                4 and stick to it within a file.
              </li>
              <li>
                <strong>Indent strictly more than the parent.</strong> A
                child must indent past its parent's first character, not just
                its key.
              </li>
            </ol>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  indentation.yaml
                </span>
                <CopyButton content={indentation} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {indentation}
              </pre>
            </div>

            <h2 id="comments">Comments</h2>
            <p>
              Comments begin with <code>#</code> and run to the end of the
              line. There is no block-comment syntax - prefix every line you
              want to disable:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  comments.yaml
                </span>
                <CopyButton content={comments} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {comments}
              </pre>
            </div>
            <p>
              The full reference, including how comments interact with block
              scalars, is on the{" "}
              <Link
                href="/yaml-tools/comments"
                className="text-primary hover:underline"
              >
                YAML comments
              </Link>{" "}
              page.
            </p>

            <h2 id="block-scalars">Multiline / block scalars</h2>
            <p>
              For long strings, use a block scalar. The literal style (
              <code>|</code>) keeps newlines as written. The folded style (
              <code>&gt;</code>) folds newlines into spaces:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  block-scalars.yaml
                </span>
                <CopyButton content={blockScalars} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {blockScalars}
              </pre>
            </div>
            <p>
              Full reference, including chomping indicators (<code>-</code>,{" "}
              <code>+</code>) and the indent indicator, on the{" "}
              <Link
                href="/yaml-tools/multiline-strings"
                className="text-primary hover:underline"
              >
                multiline strings
              </Link>{" "}
              page.
            </p>

            <h2 id="anchors">Anchors and aliases</h2>
            <p>
              Reuse data across a file with an anchor (<code>&amp;name</code>)
              and an alias (<code>*name</code>). The merge key (
              <code>&lt;&lt;:</code>) merges an aliased mapping into the
              current mapping; sibling keys override merged values:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  anchors.yaml
                </span>
                <CopyButton content={anchorsAliases} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {anchorsAliases}
              </pre>
            </div>
            <p>
              Deep dive on the{" "}
              <Link
                href="/yaml-tools/anchors"
                className="text-primary hover:underline"
              >
                YAML anchors
              </Link>{" "}
              page, including the deep-merge gotcha.
            </p>

            <h2 id="multi-doc">Multiple documents</h2>
            <p>
              A single <code>.yaml</code> file can hold many documents,
              separated by a line containing only <code>---</code>. Each is
              parsed independently:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  multi-doc.yaml
                </span>
                <CopyButton content={multiDoc} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {multiDoc}
              </pre>
            </div>

            <h2 id="cheat-sheet">Full cheat sheet</h2>
            <p>
              One file covering every syntax feature on this page. Paste it
              into the{" "}
              <Link
                href="/yaml-validator"
                className="text-primary hover:underline"
              >
                YAML validator
              </Link>{" "}
              to see the parser's view, or convert it with the{" "}
              <Link
                href="/yaml-to-json"
                className="text-primary hover:underline"
              >
                YAML to JSON
              </Link>{" "}
              tool to see the resolved structure:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  cheat-sheet.yaml
                </span>
                <CopyButton content={cheatSheet} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {cheatSheet}
              </pre>
            </div>

            <h2 id="related">Validate your YAML</h2>
            <p>
              The fastest way to confirm syntax is correct: drop the file into
              the{" "}
              <Link
                href="/yaml-validator"
                className="text-primary hover:underline"
              >
                YAML validator
              </Link>
              . For comparison with JSON, see{" "}
              <Link
                href="/yaml-tools/yaml-vs-json"
                className="text-primary hover:underline"
              >
                YAML vs JSON
              </Link>
              . For language-specific quirks, the{" "}
              <Link
                href="/yaml-tools/python"
                className="text-primary hover:underline"
              >
                YAML in Python
              </Link>{" "}
              page covers PyYAML and ruamel.yaml.
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

        <YamlToolFooter currentPath={PAGE_PATH} />
      </div>
    </>
  );
}
