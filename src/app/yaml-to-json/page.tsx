import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { YamlToJsonClient } from "./client";

const PAGE_PATH = "/yaml-to-json";
const PAGE_URL = "https://kolavistudio.com/yaml-to-json";
const DATE_PUBLISHED = "2026-04-27T00:00:00Z";
const DATE_MODIFIED = "2026-04-27T00:00:00Z";

export const metadata = getPageMetadata({
  title: "YAML to JSON Converter | Free Online Tool with Anchors Support",
  description:
    "Convert YAML to JSON instantly in your browser. Supports anchors, aliases, merge keys, and multiline strings. Free, no signup, with copy, download, and upload.",
  path: PAGE_PATH,
  keywords:
    "yaml to json, convert yaml to json, yaml to json converter, yaml to json online, yml to json, yaml to json parser, yaml json conversion",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "How do I convert YAML to JSON?",
    answer:
      "Paste your YAML in the left panel and the equivalent JSON appears on the right instantly. Choose 2 or 4 space indentation, then copy the JSON to your clipboard or download it as a .json file.",
  },
  {
    question: "Does the converter support YAML anchors and aliases?",
    answer:
      "Yes. YAML anchors (&name), aliases (*name), and merge keys (<<:) are resolved during conversion, so the JSON output contains the fully expanded structure.",
  },
  {
    question: "What happens to YAML comments during conversion?",
    answer:
      "JSON has no comment syntax, so YAML comments (#) are dropped. If you need to preserve documentation, move comments into a description field or a separate readme.",
  },
  {
    question: "How are multiline strings handled?",
    answer:
      "Block scalars - literal (|) and folded (>) - are converted to JSON strings with the correct newline characters. Chomping indicators (-, +) are respected, so trailing newlines behave exactly as the YAML 1.2 spec defines.",
  },
  {
    question: "Can I convert YAML files larger than a few hundred KB?",
    answer:
      "Yes. The converter handles up to 5 MB per request, which covers nearly every real-world Kubernetes manifest, OpenAPI spec, or Compose file. For larger payloads, split the YAML into multiple documents.",
  },
  {
    question: "Is my YAML sent to a server?",
    answer:
      "No. YAML parsing and JSON generation happen in your browser, so your data never leaves your device. The tool is safe for secrets, internal config, and proprietary infrastructure files.",
  },
  {
    question: "How does YAML to JSON conversion handle dates?",
    answer:
      "YAML date scalars like 2026-04-27 are converted to ISO 8601 strings in JSON. JSON has no native date type, so applications must parse the string back if they need a Date object.",
  },
  {
    question: "Can I convert multi-document YAML files?",
    answer:
      "The converter parses the first document. To convert each document separately, split your file at the --- separators and run them through the converter one at a time.",
  },
  {
    question: "Why does my YAML to JSON conversion fail?",
    answer:
      "The converter shows the exact line and column of the syntax error. The most common causes are inconsistent indentation, missing colons, duplicate keys, or unquoted strings that contain reserved characters.",
  },
  {
    question: "How do I convert YML to JSON?",
    answer:
      "YML and YAML are the same format - the .yml extension is just a shorter alias for .yaml. Use this converter exactly the same way regardless of which extension your file uses.",
  },
];

export default function YamlToJsonPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML to JSON", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "YAML to JSON Converter",
    description:
      "Convert YAML to JSON instantly. Supports anchors, aliases, merge keys, and multiline strings.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to convert YAML to JSON online",
    description:
      "Quick steps to convert any YAML file to JSON in the browser.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the converter",
        text: "Navigate to the YAML to JSON converter page on KolaviStudio.",
        url: PAGE_PATH,
      },
      {
        name: "Paste or upload YAML",
        text: "Paste your YAML in the left input or click Upload to select a .yml or .yaml file.",
      },
      {
        name: "Pick indentation",
        text: "Choose 2 or 4 space indentation for the generated JSON.",
      },
      {
        name: "Copy or download",
        text: "Click Copy to copy the JSON, or Download to save it as a .json file.",
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
      <YamlToJsonClient faqs={FAQS} />
    </>
  );
}
