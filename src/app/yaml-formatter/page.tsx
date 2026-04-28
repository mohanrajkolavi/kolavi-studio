import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { YamlFormatterClient } from "./client";

const PAGE_PATH = "/yaml-formatter";
const PAGE_URL = "https://kolavistudio.com/yaml-formatter";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";

export const metadata = getPageMetadata({
  title: "YAML Formatter & Beautifier | Free Online Pretty Print Tool",
  description:
    "Format and beautify YAML files. Choose 2 or 4 space indentation, sort keys alphabetically, and produce consistent, diff-friendly YAML output. Free, no signup.",
  path: PAGE_PATH,
  keywords:
    "yaml formatter, yaml beautifier, yaml pretty print, yaml viewer, format yaml, yaml indent, beautify yaml online, yaml prettifier",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "What does the YAML formatter do?",
    answer:
      "It parses your YAML, normalizes whitespace and indentation, optionally sorts keys alphabetically, and emits clean output that follows the YAML 1.2 spec. Trailing whitespace is removed and inconsistent indentation is fixed automatically.",
  },
  {
    question: "How do I beautify YAML?",
    answer:
      "Paste your messy YAML, choose 2 or 4 space indentation, optionally toggle sort keys, and the formatter returns a properly indented version. Click Copy or Download to grab the output.",
  },
  {
    question: "Will formatting break my anchors and aliases?",
    answer:
      "Anchors and aliases are resolved during formatting. The output is the fully expanded structure. If you need to preserve anchor references in the output, use the YAML editor instead and rely on it for whitespace cleanup only.",
  },
  {
    question: "Does the formatter preserve comments?",
    answer:
      "No. The underlying parser produces a data tree without comment nodes, so comments are dropped during formatting. If keeping comments matters, use a code editor with a YAML formatter extension that operates on the source text.",
  },
  {
    question: "Why use a YAML formatter for diffs?",
    answer:
      "When two team members format their YAML differently, every commit produces noisy diffs. Running everything through a single formatter with sort keys enabled yields deterministic output, so diffs only show real changes.",
  },
  {
    question: "What indentation should I use?",
    answer:
      "Use 2 spaces. It is the YAML community default and what Kubernetes, GitHub Actions, Docker Compose, and most YAML tools assume. 4 spaces is sometimes used in Ansible playbooks but is not required.",
  },
  {
    question: "Is the formatter safe for large files?",
    answer:
      "Yes, up to 5 MB. For larger files, format them in your IDE or run a CLI formatter as part of your build pipeline.",
  },
  {
    question: "Does the formatter validate YAML at the same time?",
    answer:
      "Yes. Formatting requires parsing the input, so any syntax errors are surfaced with the exact line and column number, just like the dedicated YAML validator.",
  },
  {
    question: "Can I sort keys for cleaner diffs?",
    answer:
      "Yes. Toggle the Sort keys option to alphabetize map keys at every nesting level. The result is deterministic, which makes pull-request reviews much easier.",
  },
  {
    question: "Is the formatter sent to a server?",
    answer:
      "No. Parsing and formatting run entirely in your browser, so your YAML never leaves your device. The tool is safe for secrets and proprietary infrastructure config.",
  },
];

export default function YamlFormatterPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Formatter", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "YAML Formatter & Beautifier",
    description:
      "Format and beautify YAML with 2 or 4 space indentation and optional key sorting.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to format YAML online",
    description:
      "Quick steps to clean up and beautify any YAML file in the browser.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the formatter",
        text: "Navigate to the YAML Formatter page.",
        url: PAGE_PATH,
      },
      {
        name: "Paste or upload YAML",
        text: "Paste messy YAML or upload a .yml or .yaml file.",
      },
      {
        name: "Pick options",
        text: "Choose 2 or 4 space indentation and optionally enable sort keys.",
      },
      {
        name: "Copy the output",
        text: "Copy or download the formatted YAML.",
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
      <YamlFormatterClient faqs={FAQS} />
    </>
  );
}
