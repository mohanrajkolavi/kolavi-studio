import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-guide";
const PAGE_URL = "https://kolavistudio.com/yaml-guide";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "What Is YAML? YAML Guide, Meaning, and File Format (2026)",
  description:
    "YAML guide: what YAML stands for, what a .yaml file is, syntax rules, and how YAML compares with JSON and XML. Examples you can copy and try in our editor.",
  path: PAGE_PATH,
  keywords:
    "what is yaml, yaml meaning, what does yaml stand for, yaml stands for, yaml full form, yaml language, what is a yaml file, yaml file format, .yaml, yaml guide, yaml tutorial",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const sampleYaml = `# Sample YAML configuration
name: my-app
version: 1.4.2
production: true
servers:
  - host: api.example.com
    port: 443
  - host: web.example.com
    port: 80
features:
  auth: enabled
  rateLimit: 100
description: |
  A multiline description
  spanning two lines.
`;

const yamlVsJson = `# YAML
name: my-app
version: 1.4.2
production: true

# Equivalent JSON
{
  "name": "my-app",
  "version": "1.4.2",
  "production": true
}`;

const syntaxReference = [
  { element: "Map / key-value", yaml: "name: Alice", description: "Key, colon, space, value" },
  { element: "List", yaml: "- apple\n- pear", description: "Hyphen plus space starts each item" },
  { element: "Nested map", yaml: "user:\n  name: Alice\n  role: admin", description: "Indent with two spaces" },
  { element: "String", yaml: "title: Hello world", description: "Quotes optional unless ambiguous" },
  { element: "Number", yaml: "count: 42", description: "No quotes - parsed as integer" },
  { element: "Boolean", yaml: "enabled: true", description: "true / false (case-sensitive)" },
  { element: "Null", yaml: "owner: null", description: "Use null or ~" },
  { element: "Comment", yaml: "# This is a comment", description: "Hash at start of line or after value" },
  { element: "Multiline string", yaml: "message: |\n  line one\n  line two", description: "| keeps newlines, > folds them" },
  { element: "Anchor / alias", yaml: "default: &def\n  retries: 3\nprod:\n  <<: *def", description: "Reuse a block elsewhere" },
];

const vsJsonRows = [
  { aspect: "File extension", yaml: ".yaml or .yml", json: ".json" },
  { aspect: "Comments", yaml: "Yes (#)", json: "No native support" },
  { aspect: "Trailing commas", yaml: "Not used", json: "Not allowed" },
  { aspect: "Anchors / aliases", yaml: "Yes", json: "No" },
  { aspect: "Multiple documents per file", yaml: "Yes (--- separators)", json: "No" },
  { aspect: "Indentation", yaml: "Whitespace-significant", json: "Brackets define structure" },
  { aspect: "Booleans", yaml: "true / false (also yes / no)", json: "true / false only" },
  { aspect: "Multiline strings", yaml: "Native (| and >)", json: "Escape \\n manually" },
  { aspect: "File size", yaml: "Smaller (no brackets)", json: "Slightly larger" },
  { aspect: "Best for", yaml: "Configs, infra-as-code, human edits", json: "APIs, machine-to-machine" },
];

const faqs = [
  {
    question: "What does YAML stand for?",
    answer:
      "YAML stands for YAML Ain't Markup Language. It's a recursive acronym - the YAML at the start of the expansion is the same YAML being defined. The original 2001 expansion was Yet Another Markup Language, but it was renamed in 2002 to emphasize that YAML is for data, not markup.",
  },
  {
    question: "What is YAML used for?",
    answer:
      "YAML is used primarily for configuration files. Major uses include Kubernetes manifests, GitHub Actions workflows, Docker Compose files, Ansible playbooks, OpenAPI specifications, GitLab CI configs, CircleCI configs, Helm charts, and Hugo or Jekyll site front matter. Anywhere humans need to read and edit structured config, YAML tends to be the format of choice.",
  },
  {
    question: "Is YAML a programming language?",
    answer:
      "No. YAML is a data serialization language - it represents data structures (maps, lists, scalars) in a human-readable text format. It has no control flow, no variables, and no execution model. You write YAML, then a program reads it and acts on the values.",
  },
  {
    question: "What is a .yaml file?",
    answer:
      "A .yaml file is a plain text file containing YAML-formatted data. It uses indentation, colons, and hyphens to express maps and lists. The .yml extension is identical - it's just a shorter alias used by some communities and tools.",
  },
  {
    question: "Is .yml the same as .yaml?",
    answer:
      "Yes. They are the same format. The official YAML site recommends .yaml for new files, but .yml is widely used for legacy and Windows-friendly reasons. Every modern YAML parser handles both extensions identically.",
  },
  {
    question: "What is the difference between YAML and JSON?",
    answer:
      "YAML and JSON describe the same data shapes - maps, lists, and scalars - but YAML is whitespace-sensitive and supports comments, anchors, and multi-document files. JSON uses brackets and is stricter, which makes it easier for machines to parse but harder for humans to write. Every JSON document is also valid YAML.",
  },
  {
    question: "Is JSON valid YAML?",
    answer:
      "Yes, since YAML 1.2. The YAML 1.2 spec was explicitly designed to be a superset of JSON, so any JSON document is also a valid YAML document. The reverse is not true - YAML features like comments and anchors have no JSON equivalent.",
  },
  {
    question: "What indentation does YAML use?",
    answer:
      "YAML uses spaces for indentation. Tabs are not allowed by the spec. Two spaces per level is the community default and what Kubernetes, GitHub Actions, and Docker Compose use. The exact width does not matter as long as it's consistent within each map or list.",
  },
  {
    question: "Can YAML have comments?",
    answer:
      "Yes. Comments start with the hash character (#) and run to the end of the line. They can appear at the start of a line or after a value. YAML does not have a block comment syntax - you must place a # at the start of every commented line.",
  },
  {
    question: "How do I write multiline strings in YAML?",
    answer:
      "Use a literal block scalar (|) to keep newlines as written, or a folded block scalar (>) to fold newlines into spaces. Add a chomping indicator (- to strip the trailing newline, + to keep all trailing newlines) to fine-tune the output. See our multiline strings guide for examples.",
  },
  {
    question: "What are YAML anchors and aliases?",
    answer:
      "An anchor (&name) marks a node so you can reference it elsewhere with an alias (*name). The merge key (<<: *name) merges the referenced map into the current map. Anchors let you DRY up repeated config without external templating.",
  },
  {
    question: "Is YAML hard to learn?",
    answer:
      "No. The basics - keys with colons, lists with hyphens, indentation for nesting - take about ten minutes. The harder parts are the edge cases: when to quote strings, how block scalars chomp newlines, how anchors work. Use a validator while you learn so you catch indentation mistakes early.",
  },
];

export default function YamlGuidePage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Guide", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(faqs);

  const articleSchema = getArticleSchema({
    headline: "What Is YAML? YAML Guide, Meaning, and File Format",
    description:
      "Plain-English YAML guide covering what YAML stands for, .yaml file format, syntax rules, and how it compares with JSON and XML.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 2200,
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
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article>
          {/* Header */}
          <header className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">
              {LAST_UPDATED_LABEL}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              What Is YAML? A Plain-English Guide (2026)
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              YAML is the language behind Kubernetes manifests, GitHub Actions
              workflows, Docker Compose files, and most modern config. This
              guide explains what YAML stands for, how the file format works,
              and the syntax you need to know.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Written by{" "}
              <Link href={AUTHOR_URL} className="underline hover:text-foreground">
                {AUTHOR_NAME}
              </Link>
              .
            </p>
          </header>

          {/* Answer-first callout */}
          <div className="mb-10 rounded-xl border border-border bg-muted/30 p-6">
            <h2 className="text-base font-semibold mb-2">
              Quick answer: What is YAML?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              YAML stands for <strong>YAML Ain't Markup Language</strong>. It is
              a human-readable data serialization language used for
              configuration files and data exchange. YAML uses indentation
              instead of brackets, supports comments, and represents the same
              data shapes as JSON (maps, lists, scalars) in a format easier for
              humans to edit. Files use the <code>.yaml</code> or{" "}
              <code>.yml</code> extension.
            </p>
          </div>

          {/* Table of contents */}
          <nav className="mb-10 rounded-xl border bg-card p-5" aria-label="Table of contents">
            <h2 className="text-sm font-semibold mb-3">In this guide</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#meaning" className="text-primary hover:underline">
                  What does YAML stand for?
                </a>
              </li>
              <li>
                <a href="#file-format" className="text-primary hover:underline">
                  The .yaml file format
                </a>
              </li>
              <li>
                <a href="#syntax" className="text-primary hover:underline">
                  YAML syntax in 60 seconds
                </a>
              </li>
              <li>
                <a href="#example" className="text-primary hover:underline">
                  Full YAML example
                </a>
              </li>
              <li>
                <a href="#yaml-vs-json" className="text-primary hover:underline">
                  YAML vs JSON
                </a>
              </li>
              <li>
                <a href="#use-cases" className="text-primary hover:underline">
                  Where YAML is used
                </a>
              </li>
              <li>
                <a href="#tools" className="text-primary hover:underline">
                  Free YAML tools
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
            <h2 id="meaning">What does YAML stand for?</h2>
            <p>
              YAML stands for <strong>YAML Ain't Markup Language</strong>. It's
              a recursive acronym - the YAML at the start of the expansion is
              the same YAML being defined. The format was originally proposed in
              2001 with the expansion <em>Yet Another Markup Language</em>, then
              renamed a year later to clarify that YAML is for data, not
              markup. The current spec is YAML 1.2, published in 2009 and
              revised in 2021.
            </p>
            <p>
              The full form is sometimes spelled out as YAML Ain't a Markup
              Language. Both spellings appear in the official documentation and
              both refer to the same format.
            </p>

            <h2 id="file-format">The .yaml file format</h2>
            <p>
              A YAML file is plain UTF-8 text with the <code>.yaml</code> or{" "}
              <code>.yml</code> extension. Both extensions are identical -{" "}
              <code>.yaml</code> is the official recommendation, but{" "}
              <code>.yml</code> is widely used because some legacy tools assume
              three-character extensions.
            </p>
            <p>
              YAML is whitespace-sensitive. Indentation - always with spaces,
              never tabs - defines the structure of nested maps and lists. The
              file format defines:
            </p>
            <ul>
              <li>
                <strong>Maps</strong> - key-value pairs separated by a colon and
                a space.
              </li>
              <li>
                <strong>Lists</strong> - items prefixed by a hyphen and a space.
              </li>
              <li>
                <strong>Scalars</strong> - strings, numbers, booleans, and null.
              </li>
              <li>
                <strong>Comments</strong> - any text after a hash character on
                a line.
              </li>
              <li>
                <strong>Anchors / aliases</strong> - reusable references with{" "}
                <code>&amp;name</code> and <code>*name</code>.
              </li>
              <li>
                <strong>Block scalars</strong> - multiline strings using{" "}
                <code>|</code> for literal text or <code>&gt;</code> for folded
                lines.
              </li>
            </ul>

            <h2 id="syntax">YAML syntax in 60 seconds</h2>
            <p>
              Here are the elements you'll use in 95% of YAML files:
            </p>
            <div className="not-prose overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Element</th>
                    <th className="px-3 py-2 text-left font-semibold">YAML</th>
                    <th className="px-3 py-2 text-left font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {syntaxReference.map((row) => (
                    <tr key={row.element} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.element}</td>
                      <td className="px-3 py-2">
                        <code className="block whitespace-pre text-xs">
                          {row.yaml}
                        </code>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {row.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 id="example">A full YAML example</h2>
            <p>
              Here is a complete YAML file showing maps, lists, comments,
              booleans, and a multiline string:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  example.yaml
                </span>
                <CopyButton content={sampleYaml} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {sampleYaml}
              </pre>
            </div>
            <p>
              Try this in our{" "}
              <Link href="/yaml-editor" className="text-primary hover:underline">
                YAML editor
              </Link>{" "}
              to see live validation and syntax highlighting, or paste it into
              the{" "}
              <Link href="/yaml-to-json" className="text-primary hover:underline">
                YAML to JSON converter
              </Link>{" "}
              to see the equivalent JSON.
            </p>

            <h2 id="yaml-vs-json">YAML vs JSON</h2>
            <p>
              YAML and JSON describe the same data shapes, so any YAML document
              can be converted to JSON. The differences are about ergonomics
              and feature set:
            </p>
            <div className="not-prose overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Aspect</th>
                    <th className="px-3 py-2 text-left font-semibold">YAML</th>
                    <th className="px-3 py-2 text-left font-semibold">JSON</th>
                  </tr>
                </thead>
                <tbody>
                  {vsJsonRows.map((row) => (
                    <tr key={row.aspect} className="border-t">
                      <td className="px-3 py-2 font-medium">{row.aspect}</td>
                      <td className="px-3 py-2">{row.yaml}</td>
                      <td className="px-3 py-2">{row.json}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Same data, two formats:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Comparison
                </span>
                <CopyButton content={yamlVsJson} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {yamlVsJson}
              </pre>
            </div>
            <p>
              For a deeper comparison, read our dedicated{" "}
              <Link href="/yaml-tools/yaml-vs-json" className="text-primary hover:underline">
                YAML vs JSON guide
              </Link>
              .
            </p>

            <h2 id="use-cases">Where YAML is used</h2>
            <p>
              YAML is the default config format across modern infrastructure and
              developer tooling:
            </p>
            <ul>
              <li>
                <strong>Kubernetes</strong> - manifests for deployments,
                services, ingress, and every other resource use YAML.
              </li>
              <li>
                <strong>GitHub Actions</strong> - workflow files in{" "}
                <code>.github/workflows/</code>.
              </li>
              <li>
                <strong>Docker Compose</strong> -{" "}
                <code>docker-compose.yaml</code> service definitions.
              </li>
              <li>
                <strong>Ansible</strong> - playbooks, inventory, and role
                definitions.
              </li>
              <li>
                <strong>OpenAPI / Swagger</strong> - API specifications.
              </li>
              <li>
                <strong>GitLab CI / CircleCI / Travis</strong> - pipeline
                config.
              </li>
              <li>
                <strong>Helm</strong> - chart values and templates.
              </li>
              <li>
                <strong>Hugo / Jekyll</strong> - site config and post front
                matter.
              </li>
              <li>
                <strong>Cloud-init</strong> - server bootstrap config for AWS,
                GCP, and Azure.
              </li>
            </ul>

            <h2 id="tools">Free YAML tools on this site</h2>
            <p>
              Our YAML toolset covers the most common day-to-day tasks:
            </p>
            <ul>
              <li>
                <Link href="/yaml-validator" className="text-primary hover:underline">
                  YAML Validator
                </Link>{" "}
                - live syntax checking with line-and-column errors.
              </li>
              <li>
                <Link href="/yaml-to-json" className="text-primary hover:underline">
                  YAML to JSON Converter
                </Link>{" "}
                - convert YAML to JSON with anchor expansion.
              </li>
              <li>
                <Link href="/json-to-yaml" className="text-primary hover:underline">
                  JSON to YAML Converter
                </Link>{" "}
                - convert JSON to YAML with custom indent and key sorting.
              </li>
              <li>
                <Link href="/yaml-formatter" className="text-primary hover:underline">
                  YAML Formatter
                </Link>{" "}
                - beautify and normalize YAML for diff-clean commits.
              </li>
              <li>
                <Link href="/yaml-editor" className="text-primary hover:underline">
                  YAML Editor
                </Link>{" "}
                - browser editor with live validation and autosave.
              </li>
            </ul>
            <p>
              For specific topics, see our guides on{" "}
              <Link href="/yaml-tools/comments" className="text-primary hover:underline">
                YAML comments
              </Link>
              ,{" "}
              <Link href="/yaml-tools/multiline-strings" className="text-primary hover:underline">
                multiline strings
              </Link>
              , and{" "}
              <Link href="/yaml-tools/yml-vs-yaml" className="text-primary hover:underline">
                .yml vs .yaml
              </Link>
              .
            </p>
          </div>

          {/* FAQ */}
          <section id="faqs" className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
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

        <YamlToolFooter currentPath="/yaml-guide" />
      </div>
    </>
  );
}
