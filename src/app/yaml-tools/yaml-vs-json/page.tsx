import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/yaml-vs-json";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/yaml-vs-json";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML vs JSON: Differences, Use Cases, and Conversion (2026)",
  description:
    "Compare YAML and JSON side by side. Syntax, comments, file size, parser support, and concrete guidance on when to use each. Includes free conversion tools.",
  path: PAGE_PATH,
  keywords:
    "yaml vs json, json vs yaml, yaml or json, yaml json comparison, difference between yaml and json, yaml json differences, yaml or json which is better",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const yamlExample = `# Application config in YAML
name: my-app
version: 1.4.2
features:
  - search
  - analytics
  - billing
database:
  host: db.example.com
  port: 5432
  pools:
    read: 10
    write: 5
`;

const jsonExample = `{
  "name": "my-app",
  "version": "1.4.2",
  "features": ["search", "analytics", "billing"],
  "database": {
    "host": "db.example.com",
    "port": 5432,
    "pools": { "read": 10, "write": 5 }
  }
}
`;

const yamlAnchorsExample = `defaults: &defaults
  timeout: 30
  retries: 3

production:
  <<: *defaults
  host: prod.example.com

staging:
  <<: *defaults
  host: staging.example.com
`;

const jsonNoAnchorsExample = `{
  "production": {
    "timeout": 30,
    "retries": 3,
    "host": "prod.example.com"
  },
  "staging": {
    "timeout": 30,
    "retries": 3,
    "host": "staging.example.com"
  }
}
`;

const FAQS = [
  {
    question: "What is the main difference between YAML and JSON?",
    answer:
      "YAML uses indentation and minimal punctuation for human readability, while JSON uses braces, brackets, and quotes for unambiguous machine parsing. JSON is a strict subset of YAML 1.2, so any valid JSON document is also valid YAML.",
  },
  {
    question: "Is YAML better than JSON?",
    answer:
      "Neither is universally better. YAML is preferred for human-edited config (Kubernetes, GitHub Actions, Docker Compose) because it supports comments and is less noisy. JSON is preferred for machine-to-machine APIs because it is faster to parse and unambiguous.",
  },
  {
    question: "Can YAML be converted to JSON?",
    answer:
      "Yes. Any YAML document that uses standard scalar types maps directly to JSON. Anchors and aliases are expanded, and tags are usually dropped. Use our free YAML to JSON converter for browser-based conversion that preserves the structure.",
  },
  {
    question: "Can JSON be converted to YAML?",
    answer:
      "Yes. JSON converts cleanly to YAML because every JSON document is already valid YAML. The converter typically reformats braces and brackets into block style and produces shorter, more readable output. Try our JSON to YAML converter.",
  },
  {
    question: "Why does YAML support comments but JSON does not?",
    answer:
      "JSON was designed as a minimal data interchange format with no human-edited features. Comments would complicate parsers and add ambiguity. YAML was designed for human-edited config files, where inline documentation is essential, so it includes a comment syntax (the # character).",
  },
  {
    question: "Which is faster to parse: YAML or JSON?",
    answer:
      "JSON is significantly faster to parse. It has a smaller grammar, no indentation rules, no anchors, and no implicit type detection. Parsing speed differences become noticeable for files larger than a few megabytes or for high-throughput pipelines.",
  },
  {
    question: "When should I use YAML over JSON?",
    answer:
      "Use YAML when humans will read or edit the file regularly, when comments are useful, and when the format ships with config-driven tools (Kubernetes, Ansible, GitHub Actions). Use JSON when the file is generated and consumed by machines or sent over an API.",
  },
  {
    question: "Is JSON valid YAML?",
    answer:
      "Yes. The YAML 1.2 specification was deliberately designed so that valid JSON is also valid YAML. You can paste a JSON document into a YAML parser and it will produce the same data structure. The reverse is not always true, since YAML supports features (comments, anchors, multiline strings) that JSON does not.",
  },
  {
    question: "Does YAML produce smaller files than JSON?",
    answer:
      "Usually yes for human-edited config. YAML drops most quotes, braces, and commas, so a typical Kubernetes manifest is 20-40 percent smaller than the equivalent JSON. For deeply nested or string-heavy data the gap narrows.",
  },
  {
    question: "Why do tools like Kubernetes prefer YAML?",
    answer:
      "Kubernetes manifests are written and reviewed by humans, often committed to Git, and frequently include comments explaining policy decisions. YAML supports all three of those workflows directly. Kubernetes still accepts JSON manifests, but YAML is the convention.",
  },
];

export default function YamlVsJsonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML vs JSON", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML vs JSON: Differences, Use Cases, and Conversion",
    description:
      "Side-by-side YAML vs JSON comparison covering syntax, comments, file size, parser support, and when to choose each format.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1700,
  });

  const howToSchema = getHowToSchema({
    name: "How to choose between YAML and JSON",
    description:
      "Decision steps to pick YAML or JSON for your config or data file.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Identify the audience",
        text: "If humans will read and edit the file regularly, lean YAML. If only machines produce and consume it, lean JSON.",
      },
      {
        name: "Check for comments",
        text: "If you need inline documentation in the file, choose YAML. JSON has no comment syntax.",
      },
      {
        name: "Consider the ecosystem",
        text: "Some tools (Kubernetes, Ansible, GitHub Actions) expect YAML; others (REST APIs, NPM, browser fetch) expect JSON. Match the convention of the tool.",
      },
      {
        name: "Check the size and parsing context",
        text: "For files under 1 MB the parsing speed difference is negligible. For very large or high-throughput data, prefer JSON.",
      },
      {
        name: "Convert if you need both",
        text: "Use a free converter to switch between formats without rewriting by hand.",
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
              YAML vs JSON: A Practical Comparison
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Concrete differences between YAML and JSON, when to choose each,
              and how to convert between them without losing fidelity.
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
              Quick answer: YAML vs JSON
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>YAML</strong> is a human-friendly superset of JSON that
              uses indentation, supports comments, and is preferred for
              human-edited configuration files (Kubernetes, GitHub Actions,
              Docker Compose).{" "}
              <strong>JSON</strong> is a stricter, faster-to-parse format
              preferred for machine-to-machine APIs and serialized data. Every
              valid JSON document is also valid YAML 1.2, so converting JSON to
              YAML is always safe; the reverse drops comments and resolves
              anchors.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="comparison-table">YAML vs JSON at a glance</h2>
            <div className="not-prose overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Feature
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">YAML</th>
                    <th className="px-4 py-3 text-left font-semibold">JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">Comments</td>
                    <td className="px-4 py-3">Yes (# syntax)</td>
                    <td className="px-4 py-3">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Indentation</td>
                    <td className="px-4 py-3">Significant (spaces only)</td>
                    <td className="px-4 py-3">Cosmetic</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Quotes around keys</td>
                    <td className="px-4 py-3">Optional</td>
                    <td className="px-4 py-3">Required</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Multiline strings</td>
                    <td className="px-4 py-3">Native (literal | and folded &gt;)</td>
                    <td className="px-4 py-3">Manual escapes</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Anchors / aliases</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">No</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Trailing commas</td>
                    <td className="px-4 py-3">Not applicable</td>
                    <td className="px-4 py-3">Disallowed</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">File size (typical)</td>
                    <td className="px-4 py-3">20-40% smaller</td>
                    <td className="px-4 py-3">Larger due to punctuation</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Parsing speed</td>
                    <td className="px-4 py-3">Slower (richer grammar)</td>
                    <td className="px-4 py-3">Faster</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Specification</td>
                    <td className="px-4 py-3">YAML 1.2 (2009)</td>
                    <td className="px-4 py-3">RFC 8259 / ECMA-404</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Common file extensions</td>
                    <td className="px-4 py-3">.yaml, .yml</td>
                    <td className="px-4 py-3">.json</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Native browser parser</td>
                    <td className="px-4 py-3">No</td>
                    <td className="px-4 py-3">Yes (JSON.parse)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="syntax-comparison">Syntax comparison</h2>
            <p>
              Here is the same data structure expressed in both formats. Notice
              the lower visual noise of YAML and the stricter punctuation of
              JSON:
            </p>

            <div className="not-prose grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    config.yaml
                  </span>
                  <CopyButton content={yamlExample} label="Copy" />
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                  {yamlExample}
                </pre>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    config.json
                  </span>
                  <CopyButton content={jsonExample} label="Copy" />
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                  {jsonExample}
                </pre>
              </div>
            </div>

            <p>
              The YAML version is shorter, supports comments, and reads like a
              bullet list. The JSON version is unambiguous and parses faster
              but loses the inline documentation.
            </p>

            <h2 id="when-to-use-yaml">When to use YAML</h2>
            <ul>
              <li>
                <strong>Configuration files</strong> committed to Git and
                reviewed by humans (Kubernetes, GitHub Actions, Ansible).
              </li>
              <li>
                <strong>Docs that ship with data</strong> - inline comments
                explain why a value was chosen.
              </li>
              <li>
                <strong>Files with shared sections</strong> - anchors and
                aliases avoid duplication across environments.
              </li>
              <li>
                <strong>Multiline strings</strong> like email templates or shell
                scripts where literal block scalars are cleaner than escaped
                JSON strings.
              </li>
              <li>
                <strong>OpenAPI / Swagger specs</strong> when the spec is
                authored by hand rather than generated.
              </li>
            </ul>

            <h2 id="when-to-use-json">When to use JSON</h2>
            <ul>
              <li>
                <strong>API request and response bodies</strong> - every browser
                and language has a built-in parser.
              </li>
              <li>
                <strong>Machine-generated data</strong> like log lines, event
                streams, and serialized objects.
              </li>
              <li>
                <strong>Performance-critical pipelines</strong> where parsing
                throughput matters at scale.
              </li>
              <li>
                <strong>Strict schema enforcement</strong> using JSON Schema -
                the tooling is more mature than YAML schema validation.
              </li>
              <li>
                <strong>Data interchange</strong> between two systems that do
                not need human review of the payload.
              </li>
            </ul>

            <h2 id="anchors-and-aliases">YAML features JSON cannot express</h2>
            <p>
              Anchors and aliases let YAML files share data without
              duplication. JSON has no equivalent, so converting YAML with
              anchors to JSON expands them inline:
            </p>
            <div className="not-prose grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    With anchors (YAML)
                  </span>
                  <CopyButton content={yamlAnchorsExample} label="Copy" />
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                  {yamlAnchorsExample}
                </pre>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Expanded (JSON)
                  </span>
                  <CopyButton content={jsonNoAnchorsExample} label="Copy" />
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                  {jsonNoAnchorsExample}
                </pre>
              </div>
            </div>
            <p>
              Comments are also lost when YAML converts to JSON. If you need to
              preserve documentation across the conversion, store it inside a
              <code> description</code> field rather than as a comment.
            </p>

            <h2 id="convert-between-formats">Convert between YAML and JSON</h2>
            <p>
              Both directions are well-supported. Use our free,
              browser-based converters - no signup, your data never leaves
              your device:
            </p>
            <ul>
              <li>
                <Link
                  href="/yaml-to-json"
                  className="text-primary hover:underline"
                >
                  YAML to JSON converter
                </Link>{" "}
                - paste any YAML document, get strict JSON output.
              </li>
              <li>
                <Link
                  href="/json-to-yaml"
                  className="text-primary hover:underline"
                >
                  JSON to YAML converter
                </Link>{" "}
                - convert JSON to readable YAML with custom indent and key
                sorting.
              </li>
              <li>
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                - check syntax before converting.
              </li>
              <li>
                <Link
                  href="/yaml-formatter"
                  className="text-primary hover:underline"
                >
                  YAML formatter
                </Link>{" "}
                - normalize indentation and sort keys for clean diffs.
              </li>
            </ul>

            <h2 id="json-is-yaml">Every JSON document is valid YAML</h2>
            <p>
              The YAML 1.2 specification was rewritten to make JSON a strict
              subset of YAML. That means you can paste any JSON document into a
              YAML parser and it will parse correctly. Practically, this lets
              you start a config file as JSON and gradually migrate to
              YAML-flavoured syntax (dropping quotes, adding comments) as the
              file grows.
            </p>

            <h2 id="related">Related YAML guides</h2>
            <ul>
              <li>
                <Link
                  href="/yaml-guide"
                  className="text-primary hover:underline"
                >
                  Complete YAML guide
                </Link>{" "}
                - what YAML is, file format, syntax rules.
              </li>
              <li>
                <Link
                  href="/yaml-tools/yml-vs-yaml"
                  className="text-primary hover:underline"
                >
                  YML vs YAML
                </Link>{" "}
                - are .yml and .yaml the same file extension?
              </li>
              <li>
                <Link
                  href="/yaml-tools/comments"
                  className="text-primary hover:underline"
                >
                  YAML comments
                </Link>{" "}
                - the feature JSON does not support.
              </li>
              <li>
                <Link
                  href="/yaml-tools/multiline-strings"
                  className="text-primary hover:underline"
                >
                  YAML multiline strings
                </Link>{" "}
                - block scalars and chomping indicators.
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
