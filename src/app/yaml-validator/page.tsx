import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { YamlValidatorClient } from "./client";

const PAGE_PATH = "/yaml-validator";
const PAGE_URL = "https://kolavistudio.com/yaml-validator";
const DATE_PUBLISHED = "2026-04-27T00:00:00Z";
const DATE_MODIFIED = "2026-04-27T00:00:00Z";

export const metadata = getPageMetadata({
  title: "YAML Validator | Free Online YAML Linter & Syntax Checker",
  description:
    "Free online YAML validator. Catch syntax errors with line and column numbers, validate YAML 1.2, and check Kubernetes, GitHub Actions, and Docker Compose files in your browser.",
  path: PAGE_PATH,
  keywords:
    "yaml validator, yaml lint, yaml linter, yaml checker, yaml syntax checker, validate yaml, yaml file validator, online yaml validator, free yaml validator",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "How does the YAML validator work?",
    answer:
      "Paste your YAML and the validator parses it instantly using the YAML 1.2 specification. If the syntax is valid, you see a green confirmation. If there is a problem, the validator shows the exact line and column number along with a clear error message.",
  },
  {
    question: "What YAML errors can the validator catch?",
    answer:
      "It catches indentation errors, mismatched brackets, duplicate keys, invalid scalar types, malformed anchors and aliases, missing colons after keys, unclosed flow sequences, and other syntax problems before you ship the file.",
  },
  {
    question: "Does it support YAML 1.2?",
    answer:
      "Yes. The validator targets the YAML 1.2 specification and supports anchors, aliases, merge keys, block scalars (literal | and folded >), tagged values, and standard scalar types including strings, numbers, booleans, and null.",
  },
  {
    question: "Can I validate Kubernetes YAML files?",
    answer:
      "Yes. The validator confirms your Kubernetes manifest is syntactically valid YAML. It does not check Kubernetes-specific schema rules like apiVersion or kind values - use kubectl apply --dry-run for schema validation.",
  },
  {
    question: "Is my YAML data sent to a server?",
    answer:
      "No. All YAML parsing and validation happens in your browser. Your YAML file never leaves your device, which makes the tool safe for secrets, internal config, and proprietary data.",
  },
  {
    question: "What is the difference between a YAML linter and a validator?",
    answer:
      "A validator checks if YAML is syntactically correct and parseable. A linter goes further by enforcing style rules like indentation width, line length, and key ordering. This tool is primarily a validator with basic linting via the formatter page.",
  },
  {
    question: "Why is my YAML file not valid?",
    answer:
      "The most common YAML errors are inconsistent indentation (mixing tabs and spaces), missing colons after keys, unquoted special characters like colons inside values, and duplicate keys at the same level. The validator points you at the exact line.",
  },
  {
    question: "Can I validate GitHub Actions or Docker Compose YAML?",
    answer:
      "Yes for syntax. The validator confirms your workflow or compose file is parseable as YAML. For GitHub Actions schema checking, push to a branch and let the GitHub UI validate. For Docker Compose, use docker compose config.",
  },
  {
    question: "What encoding does the validator expect?",
    answer:
      "UTF-8, the YAML 1.2 default. The validator handles standard ASCII as well as accented characters, emojis, and other Unicode. If you paste content with a BOM, the parser silently accepts it.",
  },
  {
    question: "How large a YAML file can I validate?",
    answer:
      "Up to 5 MB per validation, which covers nearly every real-world configuration file. For larger payloads, split the file into smaller documents or run validation in your build pipeline instead.",
  },
];

export default function YamlValidatorPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Validator", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "YAML Validator",
    description:
      "Free online YAML validator. Catch syntax errors with line and column numbers and validate YAML 1.2 files in your browser.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to validate YAML online",
    description:
      "Step-by-step instructions to validate a YAML file in the browser.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the validator",
        text: "Navigate to the YAML Validator page on KolaviStudio.",
        url: PAGE_PATH,
      },
      {
        name: "Paste or upload YAML",
        text: "Paste your YAML directly or click Upload to select a .yml or .yaml file from your device.",
      },
      {
        name: "Read the result",
        text: "If valid, you see a green confirmation and a parsed JSON preview. If invalid, the validator shows the exact line and column of the first error.",
      },
      {
        name: "Fix and re-check",
        text: "Edit the input to address each error. Validation runs continuously, so you can confirm the fix without clicking a button.",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <YamlValidatorClient faqs={FAQS} />
    </>
  );
}
