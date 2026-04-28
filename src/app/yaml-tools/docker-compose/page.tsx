import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/docker-compose";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/docker-compose";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: "Docker Compose YAML: compose.yaml & docker-compose.yml Guide (2026)",
  description:
    "Complete docker-compose YAML reference. Services, networks, volumes, env_file, depends_on, profiles, and anchor reuse with copy-ready examples.",
  path: PAGE_PATH,
  keywords:
    "docker compose yaml, compose.yaml, docker-compose.yml, docker compose example, compose file, docker compose services, docker compose volumes",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const minimalCompose = `# compose.yaml - minimal web + database
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: secret
`;

const fullExample = `# compose.yaml - production-grade example
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    image: myorg/web:1.4.0
    ports:
      - "80:8080"
    environment:
      NODE_ENV: production
    env_file:
      - .env
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - frontend
      - backend

  db:
    image: postgres:16
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: app
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

volumes:
  db_data:

networks:
  frontend:
  backend:

secrets:
  db_password:
    file: ./secrets/db_password.txt
`;

const envFile = `# .env (sibling of compose.yaml)
NODE_ENV=production
DATABASE_URL=postgres://app:secret@db:5432/app
LOG_LEVEL=info
`;

const profilesExample = `# Run subsets of services with --profile
services:
  web:
    image: myorg/web:latest
    # always runs - no profile

  worker:
    image: myorg/worker:latest
    profiles: ["worker"]

  debug:
    image: nicolaka/netshoot
    profiles: ["debug"]
    network_mode: "service:web"
# docker compose up                  # only web
# docker compose --profile worker up # web + worker
# docker compose --profile debug up  # web + debug
`;

const anchorReuse = `# DRY: share env across services with anchors
x-shared-env: &shared-env
  TZ: UTC
  LOG_LEVEL: info

services:
  web:
    image: myorg/web:latest
    environment:
      <<: *shared-env
      ROLE: web

  worker:
    image: myorg/worker:latest
    environment:
      <<: *shared-env
      ROLE: worker
`;

const dependsOnHealth = `# Wait for db to be healthy before starting api
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: myorg/api:1.4.2
    depends_on:
      db:
        condition: service_healthy
`;

const FAQS = [
  {
    question: "What is a Docker Compose YAML file?",
    answer:
      "A Docker Compose YAML file (compose.yaml or docker-compose.yml) declares a multi-container application. It lists services, networks, volumes, and secrets in YAML, and 'docker compose up' brings the whole stack online with one command. Compose is the standard for local development and lightweight production deployments.",
  },
  {
    question: "Should I use compose.yaml or docker-compose.yml?",
    answer:
      "Both work. Modern Compose (v2.x and the Compose Specification) recommends 'compose.yaml' as the canonical filename. 'docker-compose.yml' is still recognized for backward compatibility. If both exist, compose.yaml wins. New projects should use compose.yaml.",
  },
  {
    question: "Do I need a 'version' field in docker-compose.yml?",
    answer:
      "No. As of Docker Compose v2 and the Compose Specification, the top-level 'version:' field is obsolete and ignored. Older guides and Stack Overflow answers still show it - safely delete it. The Compose engine version is determined by the Docker Compose binary, not the file.",
  },
  {
    question: "How do I define a service in Docker Compose YAML?",
    answer:
      "Add a key under 'services:' with the service name. At minimum, set 'image:' (a registry image) or 'build:' (a path to a Dockerfile). Add 'ports', 'environment', 'volumes', and 'depends_on' as needed. Each service becomes one or more running containers.",
  },
  {
    question: "How do I pass environment variables in docker-compose.yml?",
    answer:
      "Three options. Inline under 'environment:' as a map ('KEY: value') or list ('- KEY=value'). Reference an external file with 'env_file: .env' (or a list of files) - Compose loads it relative to the compose file. For host shell vars, write '${VAR}' and Compose substitutes at parse time.",
  },
  {
    question: "What is the difference between 'env_file' and 'environment' in Compose?",
    answer:
      "'env_file' loads variables from a .env-style file into the container at runtime. 'environment' sets variables inline in the compose file. Inline values override env_file values for the same key. env_file is best for secrets and per-environment differences; environment is best for variables that belong with the service definition.",
  },
  {
    question: "How do volumes work in Docker Compose?",
    answer:
      "Two flavors. A bind mount maps a host path to a container path: 'volumes: - ./src:/app'. A named volume is managed by Docker and survives 'docker compose down': 'volumes: - db_data:/var/lib/postgresql/data', plus a top-level 'volumes: db_data: {}'. Use named volumes for databases.",
  },
  {
    question: "How do I make one Compose service wait for another?",
    answer:
      "Use 'depends_on' with a 'condition'. 'service_started' waits until the dependency starts. 'service_healthy' waits until its healthcheck passes - this is what you want for databases. Without a condition, depends_on only controls start order, not readiness.",
  },
  {
    question: "What are Docker Compose profiles?",
    answer:
      "A profile is a tag that gates a service. By default, services with no profile always run. A service marked 'profiles: [\"worker\"]' only runs when you pass '--profile worker' on the command line. Use profiles to keep dev-only or optional services in the same compose file without starting them by default.",
  },
  {
    question: "Can I share configuration across Docker Compose services?",
    answer:
      "Yes. Use YAML anchors and merge keys. Define a shared block under a top-level extension key like 'x-shared-env: &shared-env { ... }', then merge it into each service with 'environment: <<: *shared-env'. Compose ignores 'x-' prefixed top-level keys, so they exist only to host the anchor.",
  },
  {
    question: "How do I run multiple Compose files together?",
    answer:
      "Pass them with '-f': 'docker compose -f compose.yaml -f compose.prod.yaml up'. Later files override earlier ones for matching keys. The standard pattern is one base compose.yaml plus per-environment override files (compose.dev.yaml, compose.prod.yaml) committed alongside.",
  },
  {
    question: "Why does docker-compose say 'YAML syntax error'?",
    answer:
      "Most often: tab characters in indentation (YAML rejects tabs - use spaces), an unquoted value that looks like a number or boolean (port '8080:80' must be quoted because of the colon), or inconsistent indentation between siblings. Run the file through a YAML validator to find the exact line.",
  },
];

export default function YamlDockerComposePage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "Docker Compose YAML", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: "Docker Compose YAML: Services, Networks, Volumes & Profiles",
    description:
      "End-to-end Docker Compose YAML reference: compose.yaml vs docker-compose.yml, services, env_file, depends_on, profiles, and anchor reuse.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1700,
  });

  const howToSchema = getHowToSchema({
    name: "How to write a Docker Compose YAML file",
    description:
      "Author a compose.yaml that brings up a multi-container application with one command.",
    totalTime: "PT3M",
    steps: [
      {
        name: "Create compose.yaml",
        text: "In your project root, create compose.yaml. Skip the obsolete 'version:' field.",
      },
      {
        name: "Define services",
        text: "Under 'services:', add a key for each container. Set 'image:' or 'build:', plus ports, environment, and volumes as needed.",
      },
      {
        name: "Wire dependencies",
        text: "Use 'depends_on' with 'condition: service_healthy' to make services wait for their dependencies' healthchecks.",
      },
      {
        name: "Add networks and volumes",
        text: "Declare top-level 'networks:' and 'volumes:' for any shared resources, then reference them under each service.",
      },
      {
        name: "Validate and run",
        text: "Run 'docker compose config' to validate the file, then 'docker compose up -d' to start the stack in the background.",
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
              Docker Compose YAML
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Complete reference for <code>compose.yaml</code> and{" "}
              <code>docker-compose.yml</code>: services, networks, volumes,
              env_file, depends_on with healthchecks, profiles, and anchor
              reuse - with copy-ready examples.
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
              A Docker Compose file declares a multi-container application in
              YAML. The recommended filename is <code>compose.yaml</code>{" "}
              (older <code>docker-compose.yml</code> still works). Define
              containers under <code>services:</code>, shared resources under
              top-level <code>networks:</code>, <code>volumes:</code>, and{" "}
              <code>secrets:</code>, then run{" "}
              <code>docker compose up -d</code>. The top-level{" "}
              <code>version:</code> field is obsolete and should be omitted.
            </p>
          </div>

          <nav className="mb-10 rounded-lg border border-border bg-muted/30 p-5">
            <p className="text-sm font-semibold mb-2">On this page</p>
            <ul className="text-sm space-y-1">
              <li>
                <a href="#minimal" className="text-primary hover:underline">
                  Minimal compose.yaml
                </a>
              </li>
              <li>
                <a href="#full-example" className="text-primary hover:underline">
                  Production-grade example
                </a>
              </li>
              <li>
                <a href="#env-file" className="text-primary hover:underline">
                  env_file vs environment
                </a>
              </li>
              <li>
                <a href="#depends-on" className="text-primary hover:underline">
                  depends_on with healthchecks
                </a>
              </li>
              <li>
                <a href="#profiles" className="text-primary hover:underline">
                  Profiles for optional services
                </a>
              </li>
              <li>
                <a href="#anchor-reuse" className="text-primary hover:underline">
                  DRY with anchors
                </a>
              </li>
              <li>
                <a href="#filename" className="text-primary hover:underline">
                  compose.yaml vs docker-compose.yml
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
            <h2 id="minimal">Minimal compose.yaml</h2>
            <p>
              The smallest useful Compose file: a web server and a database.
              No <code>version:</code> field is required - it has been
              obsolete since Compose v2:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  compose.yaml
                </span>
                <CopyButton content={minimalCompose} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {minimalCompose}
              </pre>
            </div>
            <p>
              Run <code>docker compose up -d</code> in the directory to bring
              the stack online, <code>docker compose ps</code> to see the
              running containers, and <code>docker compose down</code> to
              tear it down.
            </p>

            <h2 id="full-example">Production-grade example</h2>
            <p>
              A more complete file with build context, healthchecks, named
              volumes, named networks, secrets, and image pinning:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  compose.yaml (full)
                </span>
                <CopyButton content={fullExample} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {fullExample}
              </pre>
            </div>
            <p>Highlights:</p>
            <ul>
              <li>
                <strong>Image pinning</strong> -{" "}
                <code>postgres:16</code>, <code>nginx:1.27</code> rather than{" "}
                <code>:latest</code>. Reproducible builds depend on it.
              </li>
              <li>
                <strong>Healthchecks</strong> - both containers expose them so
                <code>depends_on.condition: service_healthy</code> is
                meaningful.
              </li>
              <li>
                <strong>Named volumes</strong> - <code>db_data</code> survives
                <code>docker compose down</code>; bind mounts would not.
              </li>
              <li>
                <strong>Named networks</strong> - explicit{" "}
                <code>frontend</code> / <code>backend</code> networks let you
                isolate which services can talk to each other.
              </li>
              <li>
                <strong>Secrets</strong> - the database password lives in a
                file the container reads at startup, not in the compose file.
              </li>
            </ul>

            <h2 id="env-file">env_file vs environment</h2>
            <p>
              <code>environment:</code> sets variables inline. Use it for
              values that belong with the service definition. <code>
                env_file:
              </code>{" "}
              loads from an external file - use it for secrets and
              per-environment differences:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  .env
                </span>
                <CopyButton content={envFile} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {envFile}
              </pre>
            </div>
            <p>
              Compose loads <code>.env</code> from the directory of the
              compose file. Inline <code>environment:</code> values override
              env_file values for the same key.
            </p>

            <h2 id="depends-on">depends_on with healthchecks</h2>
            <p>
              Plain <code>depends_on</code> only controls start order - the
              dependent container starts as soon as the dependency starts,
              not when it is ready. For a database, that is too soon. Pair
              with a healthcheck and the <code>service_healthy</code>{" "}
              condition:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  depends-on-health.yaml
                </span>
                <CopyButton content={dependsOnHealth} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {dependsOnHealth}
              </pre>
            </div>

            <h2 id="profiles">Profiles for optional services</h2>
            <p>
              A profile gates a service behind a CLI flag. Use profiles for
              dev-only tooling, optional workers, or debug containers that
              should not start by default:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  profiles.yaml
                </span>
                <CopyButton content={profilesExample} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {profilesExample}
              </pre>
            </div>

            <h2 id="anchor-reuse">DRY with YAML anchors</h2>
            <p>
              Compose supports YAML anchors and merge keys directly. The{" "}
              <code>x-</code> prefix tells Compose to ignore the top-level
              key, so it exists only to host the anchor:
            </p>
            <div className="not-prose rounded-lg border bg-muted/30 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  anchor-reuse.yaml
                </span>
                <CopyButton content={anchorReuse} label="Copy" />
              </div>
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs">
                {anchorReuse}
              </pre>
            </div>
            <p>
              Full reference on the{" "}
              <Link
                href="/yaml-tools/anchors"
                className="text-primary hover:underline"
              >
                YAML anchors
              </Link>{" "}
              page, including merging multiple anchors and the deep-merge
              gotcha.
            </p>

            <h2 id="filename">compose.yaml vs docker-compose.yml</h2>
            <ul>
              <li>
                <strong>compose.yaml</strong> - canonical filename per the
                Compose Specification. Use it for new projects.
              </li>
              <li>
                <strong>docker-compose.yml</strong> - legacy filename. Still
                recognized by Docker Compose v2 for backward compatibility.
              </li>
              <li>
                <strong>Either extension works</strong> - <code>.yaml</code>{" "}
                or <code>.yml</code>. See{" "}
                <Link
                  href="/yaml-tools/yml-vs-yaml"
                  className="text-primary hover:underline"
                >
                  YML vs YAML
                </Link>{" "}
                for the full comparison.
              </li>
              <li>
                If both <code>compose.yaml</code> and{" "}
                <code>docker-compose.yml</code> exist in the same directory,
                Compose loads <code>compose.yaml</code>.
              </li>
            </ul>

            <h2 id="related">Validate before you ship</h2>
            <p>
              <code>docker compose config</code> resolves the file (including
              anchor expansion and env substitution) and prints the canonical
              YAML the engine will use - the fastest way to spot bugs. For
              syntax-level checks, drop the file into the{" "}
              <Link
                href="/yaml-validator"
                className="text-primary hover:underline"
              >
                YAML validator
              </Link>
              . For Kubernetes-style manifests, see the{" "}
              <Link
                href="/yaml-tools/kubernetes"
                className="text-primary hover:underline"
              >
                Kubernetes YAML
              </Link>{" "}
              page.
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
