import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/anchors";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/anchors";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "YAML Anchors, Aliases & Merge Keys (<<:) Explained (2026)",
  description:
    "Reuse YAML data with anchors (&), aliases (*), and merge keys (<<:). Examples for Docker Compose, GitLab CI, and Kubernetes - plus deep-merge gotchas.",
  path: PAGE_PATH,
  keywords:
    "yaml anchors, yaml anchor, yaml alias, yaml merge key, yaml <<:, yaml reference, yaml anchor and alias, yaml dry, anchor in yaml",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const basicAnchor = `# Define once with &anchor, reuse with *alias
defaults: &defaults
  adapter: postgres
  host: localhost
  port: 5432

development:
  <<: *defaults
  database: app_dev

test:
  <<: *defaults
  database: app_test
`;

const overrideKeys = `# Aliased values can be overridden by sibling keys
defaults: &defaults
  timeout: 30
  retries: 3

production:
  <<: *defaults
  timeout: 60
`;

const multipleAnchors = `# Merge multiple anchors in priority order (left = highest)
base: &base
  region: us-east-1
  timeout: 30

retry: &retry
  retries: 5
  backoff: exponential

prod_service:
  <<: [*base, *retry]
  region: us-west-2
`;

const anchorScalar = `# Anchors work on scalars too
host: &primary "db-primary.internal"
fallback: *primary
`;

const anchorList = `# Anchors on sequences (arrays)
common_ports: &common_ports
  - 80
  - 443

web:
  ports: *common_ports

api:
  ports: *common_ports
`;

const composeExample = `# docker-compose.yml - share env across services
x-shared-env: &shared-env
  TZ: UTC
  LOG_LEVEL: info

services:
  web:
    image: app:latest
    environment:
      <<: *shared-env
      ROLE: web
  worker:
    image: app:latest
    environment:
      <<: *shared-env
      ROLE: worker
`;

const gitlabCiExample = `# .gitlab-ci.yml - DRY job definitions
.deploy_template: &deploy
  stage: deploy
  image: alpine:latest
  script:
    - ./deploy.sh

deploy_staging:
  <<: *deploy
  environment: staging
  only:
    - main

deploy_prod:
  <<: *deploy
  environment: production
  when: manual
`;

const deepMergeGotcha = `# Merge key is shallow - nested maps replace, not merge
defaults: &defaults
  database:
    host: localhost
    port: 5432

prod:
  <<: *defaults
  database:
    host: prod.db
# prod.database = { host: "prod.db" }
# port: 5432 is LOST because the whole "database" map was replaced.
`;

const noJsonEquivalent = `# Anchors collapse during YAML to JSON conversion
defaults: &d
  retries: 3

dev:
  <<: *d
  name: dev

# Becomes JSON:
# { "defaults": { "retries": 3 },
#   "dev": { "retries": 3, "name": "dev" } }
# The shared structure is duplicated. JSON has no $ref by default.
`;

const FAQS = [
  {
    question: "What are YAML anchors and aliases?",
    answer:
      "An anchor (&name) marks a node so it can be reused. An alias (*name) inserts the anchored node by reference. Together they let you define a value once and reference it many times in the same file, eliminating copy-paste duplication.",
  },
  {
    question: "What is the YAML merge key (<<:)?",
    answer:
      "The merge key (<<:) merges the keys of an aliased mapping into the current mapping. It is widely supported by PyYAML, ruamel.yaml, the JS yaml package, Docker Compose, and GitLab CI. The merge is shallow - sibling keys at the current level take precedence over the aliased values.",
  },
  {
    question: "How do I define a YAML anchor?",
    answer:
      "Place an ampersand and a name immediately after a key, before its value. For example: 'defaults: &defaults' anchors the mapping that follows under the name 'defaults'. The anchor name must be unique within the document.",
  },
  {
    question: "How do I reference an anchor in YAML?",
    answer:
      "Use an asterisk and the anchor name: '*defaults'. The parser substitutes the anchored value at that position. With the merge key '<<: *defaults' the parser merges the keys of the aliased mapping into the current mapping instead of replacing it.",
  },
  {
    question: "Can I merge multiple YAML anchors at once?",
    answer:
      "Yes. Pass an array to the merge key: '<<: [*base, *retry]'. The leftmost alias has the highest priority - keys defined in earlier aliases shadow keys from later ones, and any sibling key on the merging map wins over all aliases.",
  },
  {
    question: "Does the YAML merge key do a deep merge?",
    answer:
      "No. The merge key is shallow. If the aliased map and the current map both define a key whose value is itself a map, the current map's value replaces the aliased map's value entirely - it does not recurse. To deep-merge nested structures you need an out-of-spec extension or a templating layer.",
  },
  {
    question: "Are YAML anchors part of the YAML 1.2 specification?",
    answer:
      "Anchors and aliases are part of YAML 1.2. The merge key (<<:) is technically a YAML 1.1 type, but it is supported by every major modern parser including PyYAML, ruamel.yaml, the npm yaml package, libyaml, and snakeyaml. It is the de facto standard for DRY YAML.",
  },
  {
    question: "Do YAML anchors work in JSON?",
    answer:
      "No. JSON has no anchor or reference syntax. When a YAML file with anchors is converted to JSON, every alias is expanded into a full copy of the anchored value. The output is valid but loses the structural sharing that the original YAML expressed.",
  },
  {
    question: "Where are YAML anchors used in real projects?",
    answer:
      "Docker Compose uses anchors to share environment variables and labels across services. GitLab CI uses anchors with merge keys for job templates. Kubernetes manifests sometimes use them for shared resource limits. Anywhere a config file repeats the same block, anchors are the canonical fix.",
  },
  {
    question: "Why is my YAML anchor not working?",
    answer:
      "Three common causes: the alias appears before the anchor in the document (anchors must be defined first), the parser does not support merge keys (older or strict YAML 1.2 parsers), or the alias is mistyped (anchor names are case-sensitive). Run the file through a validator to confirm the parser sees what you expect.",
  },
  {
    question: "Can I anchor a list or a scalar in YAML?",
    answer:
      "Yes. Anchors work on any node - scalars, sequences (lists), and mappings (dictionaries). You cannot use the merge key '<<:' with a sequence or scalar; the merge key is only valid when the aliased value is a mapping. For sequences and scalars use a plain alias '*name' to substitute the value in place.",
  },
  {
    question: "Should I use YAML anchors or a templating tool like Helm?",
    answer:
      "Use anchors when the duplication lives in a single file and is purely structural - they keep the file self-describing and parseable by any YAML tool. Reach for a templating layer (Helm, Kustomize, Jinja, envsubst) when you need cross-file reuse, conditional logic, or values that come from outside the YAML.",
  },
];

export default function YamlAnchorsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Anchors", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "YAML Anchors, Aliases & Merge Keys: Reuse Without Repetition",
    description:
      "Practical guide to YAML anchors (&), aliases (*), and merge keys (<<:) with Docker Compose, GitLab CI, and Kubernetes examples.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1700,
  });

  const howToSchema = getHowToSchema({
    name: "How to use YAML anchors and merge keys",
    description:
      "Define a YAML anchor once with &, reference it with *, and merge it with <<:.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Anchor the source value",
        text: "Add '&name' after a key, before its value, to anchor the node under the chosen name.",
      },
      {
        name: "Reference with an alias",
        text: "Use '*name' anywhere later in the document to insert the anchored node by reference.",
      },
      {
        name: "Merge map keys with <<:",
        text: "When the source is a mapping, use '<<: *name' to merge its keys into the current mapping; sibling keys override merged keys.",
      },
      {
        name: "Validate",
        text: "Run the file through a YAML validator to confirm anchors resolve and merge keys are accepted by your target parser.",
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
              YAML Anchors, Aliases & Merge Keys
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Reuse data across a YAML file with anchors (<code>&amp;</code>),
              aliases (<code>*</code>), and merge keys (<code>&lt;&lt;:</code>).
              Real Docker Compose and GitLab CI examples, plus the deep-merge
              gotchas that surprise teams.
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
              Anchor a value with <code>&amp;name</code>, reference it with{" "}
              <code>*name</code>, and merge a referenced mapping into another
              with <code>&lt;&lt;: *name</code>. The merge is shallow - sibling
              keys override merged keys, and nested maps replace rather than
              recurse. Anchors are part of YAML 1.2; merge keys are supported
              by PyYAML, ruamel.yaml, the JS <code>yaml</code> package, Docker
              Compose, and GitLab CI.
            </p>
          </div>

          <nav className="mb-10 rounded-lg border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold mb-2">On this page</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="#basic-syntax" className="text-primary hover:underline">
                  Basic anchor and alias syntax
                </a>
              </li>
              <li>
                <a href="#merge-key" className="text-primary hover:underline">
                  Merge keys (&lt;&lt;:) explained
                </a>
              </li>
              <li>
                <a href="#multiple-anchors" className="text-primary hover:underline">
                  Merging multiple anchors
                </a>
              </li>
              <li>
                <a href="#scalars-lists" className="text-primary hover:underline">
                  Anchors on scalars and lists
                </a>
              </li>
              <li>
                <a href="#docker-compose" className="text-primary hover:underline">
                  Docker Compose example
                </a>
              </li>
              <li>
                <a href="#gitlab-ci" className="text-primary hover:underline">
                  GitLab CI example
                </a>
              </li>
              <li>
                <a href="#deep-merge" className="text-primary hover:underline">
                  The deep-merge gotcha
                </a>
              </li>
              <li>
                <a href="#json-conversion" className="text-primary hover:underline">
                  What JSON loses
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
            <h2 id="basic-syntax">Basic anchor and alias syntax</h2>
            <p>
              An anchor marks a node with a name. An alias references that
              node later in the same document. The most common pattern is to
              anchor a mapping of shared defaults and merge it into several
              configurations:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  basic-anchor.yaml
                </span>
                <CopyButton content={basicAnchor} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {basicAnchor}
              </pre>
            </div>
            <p>
              After parsing, both <code>development</code> and{" "}
              <code>test</code> contain <code>adapter</code>,{" "}
              <code>host</code>, <code>port</code>, and their own{" "}
              <code>database</code> key. Edit <code>defaults</code> once and
              every consumer updates.
            </p>

            <h2 id="merge-key">
              Merge keys (<code>&lt;&lt;:</code>) explained
            </h2>
            <p>
              The merge key is the special key <code>&lt;&lt;</code> followed
              by an alias. It tells the parser: copy the keys of the aliased
              mapping into this mapping. Sibling keys defined directly on the
              current mapping override the merged values:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  override.yaml
                </span>
                <CopyButton content={overrideKeys} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {overrideKeys}
              </pre>
            </div>
            <p>
              <code>production.timeout</code> is <code>60</code>, not the{" "}
              <code>30</code> from the merged defaults. The local key always
              wins.
            </p>

            <h2 id="multiple-anchors">Merging multiple anchors</h2>
            <p>
              You can merge several aliases at once by passing a sequence to
              the merge key. Earlier entries take precedence over later ones:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  multiple-anchors.yaml
                </span>
                <CopyButton content={multipleAnchors} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {multipleAnchors}
              </pre>
            </div>
            <p>
              Final <code>prod_service</code>: <code>region: us-west-2</code>{" "}
              (sibling key wins), <code>timeout: 30</code> (from{" "}
              <code>*base</code>), <code>retries: 5</code> and{" "}
              <code>backoff: exponential</code> (from <code>*retry</code>).
            </p>

            <h2 id="scalars-lists">Anchors on scalars and lists</h2>
            <p>
              Anchors are not limited to mappings. Any node can be anchored,
              and you can substitute it with a plain alias (no merge key
              needed):
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  anchor-scalar.yaml
                </span>
                <CopyButton content={anchorScalar} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {anchorScalar}
              </pre>
            </div>
            <div className="not-prose rounded-lg border bg-muted/30 p-4 mt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  anchor-list.yaml
                </span>
                <CopyButton content={anchorList} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {anchorList}
              </pre>
            </div>
            <p>
              The merge key (<code>&lt;&lt;:</code>) only works when the
              aliased value is a mapping. For lists and scalars, use a plain
              alias.
            </p>

            <h2 id="docker-compose">Docker Compose example</h2>
            <p>
              Compose supports anchors and merge keys directly in{" "}
              <code>docker-compose.yml</code> and <code>compose.yaml</code>. A
              common pattern is sharing environment variables across services:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  docker-compose.yml
                </span>
                <CopyButton content={composeExample} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {composeExample}
              </pre>
            </div>
            <p>
              The <code>x-</code> prefix tells Compose to ignore the key as a
              service definition - it is a custom extension field that exists
              only to host the anchor.
            </p>

            <h2 id="gitlab-ci">GitLab CI example</h2>
            <p>
              GitLab pipelines use a leading <code>.</code> on a job name to
              mark it as a hidden template that is not run on its own. Combined
              with anchors and merge keys, this becomes a clean job-template
              pattern:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  .gitlab-ci.yml
                </span>
                <CopyButton content={gitlabCiExample} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {gitlabCiExample}
              </pre>
            </div>
            <p>
              Both <code>deploy_staging</code> and <code>deploy_prod</code>{" "}
              inherit the stage, image, and script, then add their
              environment-specific overrides.
            </p>

            <h2 id="deep-merge">The deep-merge gotcha</h2>
            <p>
              The single most common bug with merge keys: nested maps are
              replaced wholesale, not deep-merged. If the aliased map has a
              key whose value is itself a map, redefining that key on the
              current map drops every nested key the alias provided:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  deep-merge.yaml
                </span>
                <CopyButton content={deepMergeGotcha} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {deepMergeGotcha}
              </pre>
            </div>
            <p>
              If you need recursive merging, pre-process the YAML with a
              templating tool, or flatten the structure so every distinct
              value lives at its own top-level key.
            </p>

            <h2 id="json-conversion">What JSON loses on conversion</h2>
            <p>
              JSON has no native anchor or reference syntax. When you pass YAML
              with anchors through any{" "}
              <Link href="/yaml-to-json" className="text-primary hover:underline">
                YAML to JSON converter
              </Link>{" "}
              the structural sharing is expanded into duplicated objects:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  yaml-to-json.yaml
                </span>
                <CopyButton content={noJsonEquivalent} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {noJsonEquivalent}
              </pre>
            </div>
            <p>
              The output is correct - just larger and harder to refactor. This
              is one of the strongest arguments for staying in YAML for
              human-edited configs. Compare side-by-side on the{" "}
              <Link href="/yaml-tools/yaml-vs-json" className="text-primary hover:underline">
                YAML vs JSON
              </Link>{" "}
              page.
            </p>

            <h2 id="related">Validate your anchors</h2>
            <p>
              Anchor errors (forward references, typos, unsupported merge
              keys) are silent in many editors. Drop your file into the{" "}
              <Link href="/yaml-validator" className="text-primary hover:underline">
                YAML validator
              </Link>{" "}
              to confirm the parser sees what you expect, or use the{" "}
              <Link href="/yaml-formatter" className="text-primary hover:underline">
                YAML formatter
              </Link>{" "}
              to inspect the resolved output before deploying. For more
              advanced reuse patterns and how to share blocks across files,
              see the{" "}
              <Link href="/yaml-tools/syntax" className="text-primary hover:underline">
                YAML syntax reference
              </Link>
              .
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
