import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/arrays-and-lists";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/arrays-and-lists";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML Arrays, Lists, and Dictionaries: Complete Guide (2026)",
  description:
    "YAML lists, arrays, and dictionaries explained: block sequences, flow style, nested arrays, lists of maps, and the variables idiom. Copy-ready examples included.",
  path: PAGE_PATH,
  keywords:
    "yaml list, yaml array, yaml dictionary, yaml variables, yaml lists, yaml nested array, yaml list of maps, yaml flow array, yaml block sequence",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const blockList = `# Block style - one item per line, dash + space prefix
fruits:
  - apple
  - banana
  - cherry
`;

const flowList = `# Flow style - same data, single line, comma-separated
fruits: [apple, banana, cherry]
`;

const nestedList = `# Lists of lists - indent nested levels two spaces
matrix:
  - [1, 2, 3]
  - [4, 5, 6]
  - [7, 8, 9]

# Or block style for the inner lists too
groups:
  - - admin
    - editor
  - - viewer
    - guest
`;

const listOfMaps = `# Each item is itself a map - the most common shape
servers:
  - host: api.example.com
    port: 443
    primary: true
  - host: api-backup.example.com
    port: 443
    primary: false
`;

const dictionary = `# YAML calls maps "mappings". They are Python dicts / JS objects.
database:
  host: db.example.com
  port: 5432
  credentials:
    username: app_user
    password: \${DB_PASSWORD}

# Flow form (single line)
limits: { cpu: 500m, memory: 256Mi }
`;

const variablesPattern = `# YAML has no native "variables" - use anchors and aliases instead
defaults: &defaults
  timeout: 30
  retries: 3
  log_level: info

production:
  <<: *defaults
  host: prod.example.com

staging:
  <<: *defaults
  host: staging.example.com
  log_level: debug   # Override one field
`;

const emptyAndNull = `# Empty list
tags: []

# Empty map
metadata: {}

# Null value (three valid forms)
description: null
description: ~
description:
`;

const FAQS = [
  {
    question: "How do you write a list in YAML?",
    answer:
      "Block style uses a dash and space at the start of each item, with consistent indentation: `- apple` on one line, `- banana` on the next. Flow style puts items in square brackets on a single line: `[apple, banana, cherry]`. Both produce the same parsed array.",
  },
  {
    question: "What is the difference between a YAML list and a YAML array?",
    answer:
      "Nothing. YAML uses the term 'sequence' in the spec, but 'list' and 'array' are interchangeable in everyday usage. They map to a Python list, a JavaScript array, or a Go slice depending on the parser language.",
  },
  {
    question: "How do I create a YAML dictionary?",
    answer:
      "A YAML dictionary (also called a mapping) is a set of key-value pairs at the same indent level. Block style uses 'key: value' on each line; flow style uses curly braces and commas: `{a: 1, b: 2}`. Both forms are interchangeable.",
  },
  {
    question: "Can I have a list of dictionaries in YAML?",
    answer:
      "Yes - this is the most common YAML shape, used in Kubernetes manifests, GitHub Actions steps, and Compose services. Each list item begins with a dash, then key-value pairs indented two spaces under it.",
  },
  {
    question: "How do I write a nested array in YAML?",
    answer:
      "Indent the inner list two spaces under its parent dash. Or use flow style for the inner list: `- [1, 2, 3]`. Mixing block and flow is allowed but block style is more readable for deep nesting.",
  },
  {
    question: "Does YAML support variables?",
    answer:
      "Not natively. The closest equivalents are anchors (&name) and aliases (*name), which let you reuse a value defined earlier. The merge key (<<: *anchor) splices a map's contents into another map, which is the canonical 'shared defaults' pattern.",
  },
  {
    question: "How do I represent an empty list or map in YAML?",
    answer:
      "Use empty flow syntax: `[]` for an empty list, `{}` for an empty map. Plain `key:` with no value parses as null, not as an empty container.",
  },
  {
    question: "Can YAML lists contain mixed types?",
    answer:
      "Yes. A list can hold strings, numbers, booleans, maps, or other lists in any combination. Most consuming code expects homogeneous lists, so keep types consistent unless you have a reason not to.",
  },
  {
    question: "How does YAML decide if `- 5` is a string or a number?",
    answer:
      "By scalar style and content. Unquoted values are parsed by type detection rules - `5` becomes an integer, `5.0` a float, `true/false` a boolean, and unrecognized tokens become strings. Quote a value with single or double quotes to force it to be a string: `- '5'`.",
  },
  {
    question: "Can I have duplicate keys in a YAML map?",
    answer:
      "The YAML 1.2 spec says no, but many parsers silently accept duplicates and keep the last value. Don't rely on this - validate your YAML to catch unintended duplicates before they cause confusing bugs.",
  },
];

export default function YamlArraysAndListsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "Arrays and Lists", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML Arrays, Lists, and Dictionaries: A Complete Guide",
    description:
      "Complete guide to YAML lists, arrays, and dictionaries with block and flow styles, nested forms, and the variables idiom.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1500,
  });

  const howToSchema = getHowToSchema({
    name: "How to write a list in YAML",
    description: "Steps to create block- and flow-style lists in YAML.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Pick a key",
        text: "Choose the parent key for your list. Use a colon at the end and a newline.",
      },
      {
        name: "Indent two spaces",
        text: "Indent each list item two spaces under the parent key. YAML rejects tabs.",
      },
      {
        name: "Prefix with dash + space",
        text: "Each item starts with '- ' (dash followed by a space). The dash marks a sequence entry.",
      },
      {
        name: "Optionally use flow style",
        text: "For short lists, write '[a, b, c]' on one line as flow style. Both forms parse identically.",
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
              YAML Arrays, Lists, and Dictionaries
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              How to write block and flow lists, nested arrays, dictionaries
              (mappings), and the &quot;variables&quot; pattern using anchors -
              with copy-ready examples for every shape.
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
              Quick answer: list, array, dictionary
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              In YAML, &quot;list&quot; and &quot;array&quot; are
              interchangeable terms for a <strong>sequence</strong> (the spec
              term). A <strong>dictionary</strong> is a YAML{" "}
              <strong>mapping</strong>. Block style uses indentation and dashes
              (<code>- item</code>); flow style uses brackets (
              <code>[a, b, c]</code>) and braces (
              <code>{`{ a: 1 }`}</code>). YAML has no native variables — use{" "}
              <Link
                href="/yaml-tools/anchors"
                className="text-primary hover:underline"
              >
                anchors and aliases
              </Link>{" "}
              instead.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="block-list">Block-style list</h2>
            <p>
              The most common form. Each list item starts on its own line with
              <code> - </code> (dash + space) and consistent indentation:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  block.yaml
                </span>
                <CopyButton content={blockList} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {blockList}
              </pre>
            </div>

            <h2 id="flow-list">Flow-style list (array)</h2>
            <p>The same data on a single line:</p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  flow.yaml
                </span>
                <CopyButton content={flowList} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {flowList}
              </pre>
            </div>
            <p>
              Flow style is compact and JSON-compatible. Use it for short,
              simple lists. Switch to block style as soon as the list grows or
              contains nested structures.
            </p>

            <h2 id="nested-list">Nested arrays (lists of lists)</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  nested.yaml
                </span>
                <CopyButton content={nestedList} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {nestedList}
              </pre>
            </div>

            <h2 id="list-of-maps">List of maps (most common shape)</h2>
            <p>
              Kubernetes containers, GitHub Actions steps, and Compose services
              all use this pattern. Each list item is a map:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  list-of-maps.yaml
                </span>
                <CopyButton content={listOfMaps} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {listOfMaps}
              </pre>
            </div>

            <h2 id="dictionary">YAML dictionaries (mappings)</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  dictionary.yaml
                </span>
                <CopyButton content={dictionary} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {dictionary}
              </pre>
            </div>

            <h2 id="variables">YAML &quot;variables&quot; pattern</h2>
            <p>
              YAML has no native variable syntax. The idiomatic substitute is
              an anchor (<code>&amp;name</code>) plus alias (
              <code>*name</code>) plus merge key (<code>&lt;&lt;:</code>) for
              shared defaults across maps:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  variables.yaml
                </span>
                <CopyButton content={variablesPattern} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {variablesPattern}
              </pre>
            </div>
            <p>
              Some tools (Ansible, GitHub Actions) also support template-style
              variables like <code>{`{{ var }}`}</code> on top of YAML, but
              those are tool features, not YAML features. See our{" "}
              <Link
                href="/yaml-tools/anchors"
                className="text-primary hover:underline"
              >
                anchors and aliases guide
              </Link>{" "}
              for the full pattern.
            </p>

            <h2 id="empty-and-null">Empty lists, empty maps, and null</h2>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  empty.yaml
                </span>
                <CopyButton content={emptyAndNull} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {emptyAndNull}
              </pre>
            </div>
            <p>
              An empty list is <code>[]</code>; an empty map is{" "}
              <code>{`{}`}</code>. A bare <code>key:</code> with no value is{" "}
              <strong>null</strong>, not an empty list or map. This trips up
              many beginners.
            </p>

            <h2 id="when-to-use-which">When to use block vs flow</h2>
            <ul>
              <li>
                <strong>Block:</strong> default for any list or map larger than
                a few items, or whenever you want comments alongside data.
              </li>
              <li>
                <strong>Flow:</strong> short, scalar-only lists and maps where
                a single line is more readable. Common for tags, port lists,
                and inline limits.
              </li>
              <li>
                <strong>Mix freely:</strong> YAML allows block and flow to be
                nested either way. Stay consistent within a file for readability.
              </li>
            </ul>

            <h2 id="related">Related YAML guides</h2>
            <ul>
              <li>
                <Link
                  href="/yaml-tools/syntax"
                  className="text-primary hover:underline"
                >
                  YAML syntax reference
                </Link>{" "}
                — full grammar with all node types.
              </li>
              <li>
                <Link
                  href="/yaml-tools/anchors"
                  className="text-primary hover:underline"
                >
                  YAML anchors, aliases, and merge keys
                </Link>{" "}
                — the variables idiom in depth.
              </li>
              <li>
                <Link
                  href="/yaml-tools/multiline-strings"
                  className="text-primary hover:underline"
                >
                  YAML multiline strings
                </Link>{" "}
                — block scalars for long values inside list items.
              </li>
              <li>
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                — instant syntax check for your sequences and mappings.
              </li>
            </ul>
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
