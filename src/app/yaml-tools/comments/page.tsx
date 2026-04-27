import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/comments";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/comments";
const DATE_PUBLISHED = "2026-04-27T00:00:00Z";
const DATE_MODIFIED = "2026-04-27T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 27, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML Comments: Single-Line, Multiline, and Block (2026 Guide)",
  description:
    "Complete guide to YAML comments: how to write single-line and multiline comments, why YAML has no block comment, and how comments behave in Kubernetes, GitHub Actions, and Docker Compose.",
  path: PAGE_PATH,
  keywords:
    "yaml comments, yaml comment, comments in yaml, comment in yaml, yaml multiline comment, yaml block comment, yaml file comment, how to comment yaml",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const singleLine = `# This is a comment
name: my-app    # Inline comment after a value
version: 1.4.2
`;

const multilineWithHash = `# Line one of the comment
# Line two of the comment
# Line three of the comment
name: my-app
`;

const insideList = `servers:
  # The primary API server
  - host: api.example.com
    port: 443
  # The fallback server
  - host: api-backup.example.com
    port: 443
`;

const noBlockComment = `# YAML has no block comment syntax. Each line needs its own #.
# /*
#   Not valid YAML - this would be a parse error.
# */
`;

const insideStringTrick = `# Trick: a description field can hold "comment-like" docs
config:
  description: |
    These lines are part of a literal scalar, NOT a comment.
    They survive YAML to JSON conversion intact.
  active: true
`;

const FAQS = [
  {
    question: "How do you write a comment in YAML?",
    answer:
      "Start any line with the hash character (#) and the rest of the line is treated as a comment. You can also place a comment after a value on the same line by separating it from the value with whitespace. Example: name: my-app  # production app.",
  },
  {
    question: "Does YAML support multiline comments?",
    answer:
      "YAML does not have a native block-comment syntax like /* ... */. To write a multiline comment, prefix every line you want to comment with the # character. Most editors have a 'toggle comment' shortcut that does this for a selected block.",
  },
  {
    question: "Can I put a comment after a value in YAML?",
    answer:
      "Yes. Place at least one space after the value, then the # character and the comment text. Example: timeout: 30  # seconds. The parser drops the comment and keeps only the value.",
  },
  {
    question: "Are comments preserved when YAML is converted to JSON?",
    answer:
      "No. JSON has no comment syntax, so comments are dropped during YAML to JSON conversion. If you need to preserve documentation, move comments into a description field or a separate readme file.",
  },
  {
    question: "Can I comment out a YAML key?",
    answer:
      "Yes. Add a # at the start of the line containing the key. The parser will skip that key entirely. Be careful with multi-line values (block scalars and nested maps) - you must comment every line of the value as well, not just the key line.",
  },
  {
    question: "Why is my YAML comment causing an error?",
    answer:
      "The most common cause is a missing space between the value and the # character. YAML requires whitespace before an inline comment. Another cause is a # inside a flow value where the parser treats it as part of the string - quote the value to fix this.",
  },
  {
    question: "Do GitHub Actions YAML files support comments?",
    answer:
      "Yes. GitHub Actions reads workflow files as standard YAML, so comments work the same way. They are useful for documenting why a step exists or marking a temporary disable.",
  },
  {
    question: "Do Kubernetes YAML manifests support comments?",
    answer:
      "Yes. kubectl ignores comments when applying manifests. They are useful for documenting non-obvious config choices, owner contacts, and ticket references.",
  },
  {
    question: "Can YAML comments contain special characters?",
    answer:
      "Yes. Everything from the # to the end of the line is treated as comment text, including quotes, brackets, and Unicode characters. The only restriction is the line break, which always ends the comment.",
  },
  {
    question: "Is there a way to write a multiline comment in YAML?",
    answer:
      "Not as a single token. The cleanest approximation is a block of consecutive single-line comments, each starting with #. Some teams use a description field with a literal block scalar (|) for longer documentation that should travel with the data.",
  },
];

export default function YamlCommentsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Comments", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML Comments: Single-Line, Multiline, and Block",
    description:
      "Complete guide to YAML comments covering single-line, multiline, inline, and tool-specific behavior.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1500,
  });

  const howToSchema = getHowToSchema({
    name: "How to add a comment in YAML",
    description: "Step-by-step instructions for adding YAML comments.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Pick a position",
        text: "Decide whether the comment is on its own line or after a value. Both are valid.",
      },
      {
        name: "Type the # character",
        text: "Start the comment with #. If it follows a value, include at least one space before the #.",
      },
      {
        name: "Write the comment text",
        text: "Everything from # to the end of the line is the comment. Special characters are allowed.",
      },
      {
        name: "Repeat for each line",
        text: "YAML has no block comment, so each commented line must start with its own # character.",
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
              YAML Comments: A Complete Guide
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              How to write single-line, inline, and multiline comments in YAML,
              what works in Kubernetes and GitHub Actions, and the gotchas that
              break otherwise valid files.
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
              Quick answer: How to comment in YAML
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Start a line with <code>#</code> and everything after the hash on
              that line is a comment. You can also place a comment after a
              value on the same line, separated by whitespace. YAML has{" "}
              <strong>no block-comment syntax</strong> - for multiline comments,
              prefix every line with <code>#</code>.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="single-line">Single-line comments</h2>
            <p>
              The simplest YAML comment starts a line with <code>#</code>. You
              can also tail a comment after a value on the same line:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  single-line.yaml
                </span>
                <CopyButton content={singleLine} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {singleLine}
              </pre>
            </div>
            <p>
              The parser drops everything from <code>#</code> to the end of the
              line, so comments never appear in the parsed data structure.
            </p>

            <h2 id="multiline">Multiline comments</h2>
            <p>
              YAML does not have a block-comment syntax. To comment a block,
              prefix every line with <code>#</code>:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  multiline.yaml
                </span>
                <CopyButton content={multilineWithHash} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {multilineWithHash}
              </pre>
            </div>
            <p>
              Most editors have a "toggle comment" shortcut (Cmd+/ on macOS,
              Ctrl+/ on Windows / Linux) that adds or removes <code>#</code> on
              every line in the current selection.
            </p>

            <h2 id="no-block">There is no /* */ block comment</h2>
            <p>
              C-style block comments do not exist in YAML. The following will
              produce a parser error or silently treat the lines as data:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  invalid.yaml
                </span>
                <CopyButton content={noBlockComment} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {noBlockComment}
              </pre>
            </div>

            <h2 id="comments-in-lists">Comments inside lists and maps</h2>
            <p>
              Comments can sit between list items or map keys without breaking
              the structure. They are useful for explaining why a particular
              value exists:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  list-comments.yaml
                </span>
                <CopyButton content={insideList} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {insideList}
              </pre>
            </div>

            <h2 id="trick-description-field">
              The description-field trick for "permanent" comments
            </h2>
            <p>
              If you need documentation that survives a YAML to JSON conversion,
              put the text inside a <code>description</code> field as a literal
              block scalar (<code>|</code>). It travels with the data instead of
              being stripped:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  description-trick.yaml
                </span>
                <CopyButton content={insideStringTrick} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {insideStringTrick}
              </pre>
            </div>

            <h2 id="rules">YAML comment rules at a glance</h2>
            <ul>
              <li>
                Comments start with <code>#</code> and run to the end of the
                line.
              </li>
              <li>
                Inline comments need at least one space between the value and
                the <code>#</code>.
              </li>
              <li>
                <code>#</code> inside a quoted string is a literal character,
                not a comment.
              </li>
              <li>No block comment syntax exists - every line needs its own #.</li>
              <li>
                Comments are dropped when YAML is converted to JSON or another
                non-comment format.
              </li>
              <li>
                Document strings in description fields if you need them to
                persist through conversion.
              </li>
            </ul>

            <h2 id="kubernetes-actions">
              Comments in Kubernetes, GitHub Actions, and Docker Compose
            </h2>
            <p>
              All three formats are standard YAML, so comments work identically.
              Common uses:
            </p>
            <ul>
              <li>
                <strong>Kubernetes</strong> - document why a deployment uses
                specific resource limits, owner team, ticket reference.
              </li>
              <li>
                <strong>GitHub Actions</strong> - mark a step as temporarily
                disabled, document the reason, link to a PR.
              </li>
              <li>
                <strong>Docker Compose</strong> - explain custom port mappings,
                volume choices, or commented-out services kept for reference.
              </li>
            </ul>

            <h2 id="related-tools">Validate your YAML before commit</h2>
            <p>
              Bad indentation around a comment can break the file. Drop your
              YAML into our{" "}
              <Link href="/yaml-validator" className="text-primary hover:underline">
                YAML validator
              </Link>{" "}
              for an instant syntax check, or use the{" "}
              <Link href="/yaml-editor" className="text-primary hover:underline">
                YAML editor
              </Link>{" "}
              for live validation as you type.
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

        <YamlToolFooter currentPath="/yaml-tools/comments" />
      </div>
    </>
  );
}
