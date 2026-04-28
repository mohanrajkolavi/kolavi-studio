import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getArticleSchema } from "@/lib/seo/jsonld/article";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { YamlToolFooter } from "@/components/yaml-tools/YamlToolFooter";

const PAGE_PATH = "/yaml-tools/yml-vs-yaml";
const PAGE_URL = "https://kolavistudio.com/yaml-tools/yml-vs-yaml";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";
const LAST_UPDATED_LABEL = "Last updated: April 28, 2026";
const AUTHOR_NAME = "Mohan Raj Kolavi";
const AUTHOR_URL = "/about";

export const metadata = getPageMetadata({
  title: ".yml vs .yaml: Are They the Same? (Definitive 2026 Answer)",
  description:
    "Are .yml and .yaml the same file extension? Yes. The complete history, tool support matrix, and the official recommendation from the YAML organization.",
  path: PAGE_PATH,
  keywords:
    "yml vs yaml, yaml vs yml, .yml vs .yaml, yml or yaml, difference between yml and yaml, yml file vs yaml file, .yml or .yaml",
  author: AUTHOR_NAME,
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "Is .yml the same as .yaml?",
    answer:
      "Yes. Both extensions identify the same file format - YAML. Every parser that reads .yaml also reads .yml. The content rules, indentation, and syntax are identical.",
  },
  {
    question: "Which extension should I use - .yml or .yaml?",
    answer:
      "The official YAML organization recommends .yaml. The .yml extension is a historical Windows-era three-letter shortening that stuck in some ecosystems (Ruby, older Java, Docker Compose). Use .yaml for new files unless your tool requires .yml.",
  },
  {
    question: "Why are there two extensions for YAML?",
    answer:
      "Early Windows file systems limited extensions to three characters, so .yml was used. After YAML 1.2 (2009), the YAML community standardized on .yaml. The two extensions coexist for backward compatibility, and most tools now accept either.",
  },
  {
    question: "Does Kubernetes care if I use .yml or .yaml?",
    answer:
      "No. kubectl reads files by content, not by extension. Both kubectl apply -f deploy.yml and kubectl apply -f deploy.yaml work. The community convention for Kubernetes is .yaml.",
  },
  {
    question: "Does GitHub Actions need .yml or .yaml?",
    answer:
      "GitHub Actions accepts both .yml and .yaml in the .github/workflows directory. Historically, GitHub examples use .yml, so most existing workflows are named workflow.yml.",
  },
  {
    question: "Does Docker Compose require .yml?",
    answer:
      "Docker Compose accepts both. Older docs and the default file name convention use docker-compose.yml, but compose.yaml is also recognized and is the newer convention.",
  },
  {
    question: "Will switching from .yml to .yaml break my project?",
    answer:
      "Almost never. The only risk is build scripts or CI configs that explicitly look for one extension. Search your repo for the literal string .yml or .yaml before renaming and update any hardcoded paths.",
  },
  {
    question: "What does YAML stand for?",
    answer:
      "YAML originally stood for 'Yet Another Markup Language' but was redefined as 'YAML Ain't Markup Language' to clarify that it is a data serialization format rather than a markup language like XML or HTML.",
  },
  {
    question: "Are .yml and .yaml MIME types different?",
    answer:
      "The official IANA-registered MIME type is application/yaml (registered in 2024). Older tools may serve YAML as text/yaml or text/x-yaml. The MIME type is independent of the file extension.",
  },
  {
    question: "Should I convert all my .yml files to .yaml?",
    answer:
      "No. There is no functional benefit, and a mass rename can break CI scripts that look for specific filenames. Use .yaml for new files; leave existing .yml files alone unless you have a specific reason to rename them.",
  },
];

export default function YmlVsYamlPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YML vs YAML", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const articleSchema = getArticleSchema({
    headline: ".yml vs .yaml: Are They the Same?",
    description:
      "Definitive answer to whether .yml and .yaml are the same file extension, with history and tool support matrix.",
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    authorName: AUTHOR_NAME,
    authorUrl: AUTHOR_URL,
    url: PAGE_URL,
    wordCount: 1300,
  });

  const howToSchema = getHowToSchema({
    name: "How to choose between .yml and .yaml",
    description:
      "Decision guide for picking a YAML file extension.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Check the tool's docs",
        text: "If your tool's docs use one extension exclusively (Docker Compose used to require .yml), match that.",
      },
      {
        name: "Check existing files in the repo",
        text: "If the repo already uses one extension consistently, match that for consistency.",
      },
      {
        name: "Default to .yaml for new projects",
        text: "The YAML organization recommends .yaml. Use it for any new file unless overridden by tool requirements.",
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
              .yml vs .yaml: Are They the Same?
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              The short answer is yes. The slightly longer answer covers
              history, tool conventions, and the YAML organization&apos;s
              official recommendation.
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
              Quick answer: .yml vs .yaml
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>They are the same.</strong> Both extensions identify a
              YAML file. Every parser accepts either. The official YAML
              organization recommends <code>.yaml</code>, but{" "}
              <code>.yml</code> remains common because of legacy three-letter
              file extension limits on early Windows systems. Use{" "}
              <code>.yaml</code> for new files; leave existing{" "}
              <code>.yml</code> files alone.
            </p>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <h2 id="why-two-extensions">Why are there two extensions?</h2>
            <p>
              YAML was first proposed in 2001. At the time, common Windows file
              systems limited file extensions to three characters, so the
              shorter <code>.yml</code> was widely adopted. With YAML 1.2 (2009)
              the YAML organization standardized on <code>.yaml</code> as the
              preferred extension and added it to the official spec.
            </p>
            <p>
              Both extensions are still in active use. The choice today is
              mostly cultural - some ecosystems lean to <code>.yml</code>
              (Ruby, Rails, Docker Compose), others to <code>.yaml</code>
              (Kubernetes, OpenAPI, GitHub Actions in newer docs).
            </p>

            <h2 id="official-recommendation">The YAML org&apos;s recommendation</h2>
            <p>
              The yaml.org FAQ states that <code>.yaml</code> is the preferred
              extension. The reason is brand consistency - the format is
              spelled <em>YAML</em>, so the file extension should match. There
              is no technical difference: every YAML parser registers both
              extensions in its file-detection logic.
            </p>

            <h2 id="tool-support">Tool support matrix</h2>
            <div className="not-prose overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Tool</th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Accepts .yml
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Accepts .yaml
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Convention
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-4 py-3 font-medium">Kubernetes (kubectl)</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yaml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">GitHub Actions</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yml (legacy)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Docker Compose</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yml (legacy), .yaml (newer)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Ansible</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Ruby on Rails</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">OpenAPI / Swagger</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yaml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">GitLab CI</td>
                    <td className="px-4 py-3">Required (.gitlab-ci.yml)</td>
                    <td className="px-4 py-3">No (filename fixed)</td>
                    <td className="px-4 py-3">.yml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">CircleCI</td>
                    <td className="px-4 py-3">Required (config.yml)</td>
                    <td className="px-4 py-3">No (filename fixed)</td>
                    <td className="px-4 py-3">.yml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Helm charts</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">Yes</td>
                    <td className="px-4 py-3">.yaml</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium">Hugo / Jekyll front matter</td>
                    <td className="px-4 py-3">N/A (embedded)</td>
                    <td className="px-4 py-3">N/A (embedded)</td>
                    <td className="px-4 py-3">N/A</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 id="when-extension-is-fixed">When the extension is fixed</h2>
            <p>
              A handful of tools require a specific filename, not just a
              specific extension. Examples:
            </p>
            <ul>
              <li>
                <code>.gitlab-ci.yml</code> - GitLab CI looks for this exact
                filename in the repo root.
              </li>
              <li>
                <code>.circleci/config.yml</code> - CircleCI looks for this
                exact path.
              </li>
              <li>
                <code>docker-compose.yml</code> or <code>compose.yaml</code> -
                Docker Compose accepts both, but only those exact names.
              </li>
              <li>
                <code>.travis.yml</code> - Travis CI looks for this exact name.
              </li>
            </ul>
            <p>
              In these cases the filename is part of the tool&apos;s
              configuration contract. Do not rename them.
            </p>

            <h2 id="recommendation">Practical recommendation</h2>
            <ol>
              <li>
                <strong>Match the tool.</strong> If the docs or examples use
                one extension consistently, follow that.
              </li>
              <li>
                <strong>Match the repo.</strong> If existing files use one
                extension, keep it consistent for new files.
              </li>
              <li>
                <strong>Otherwise default to .yaml.</strong> The YAML
                organization recommends it, and it disambiguates the format
                name.
              </li>
              <li>
                <strong>Do not mass-rename.</strong> Renaming{" "}
                <code>.yml</code> files in a large repo can break CI scripts
                that hardcode filenames. Leave them alone unless there is a
                specific reason to switch.
              </li>
            </ol>

            <h2 id="next-steps">Next steps and related guides</h2>
            <ul>
              <li>
                <Link
                  href="/yaml-guide"
                  className="text-primary hover:underline"
                >
                  Complete YAML guide
                </Link>{" "}
                - what YAML stands for, syntax, file format basics.
              </li>
              <li>
                <Link
                  href="/yaml-tools/yaml-vs-json"
                  className="text-primary hover:underline"
                >
                  YAML vs JSON
                </Link>{" "}
                - feature-by-feature comparison.
              </li>
              <li>
                <Link
                  href="/yaml-validator"
                  className="text-primary hover:underline"
                >
                  YAML validator
                </Link>{" "}
                - check any .yml or .yaml file for syntax errors.
              </li>
              <li>
                <Link
                  href="/yaml-formatter"
                  className="text-primary hover:underline"
                >
                  YAML formatter
                </Link>{" "}
                - normalize indentation and produce diff-clean output.
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
