import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { JsonToYamlClient } from "./client";

const PAGE_PATH = "/json-to-yaml";
const PAGE_URL = "https://kolavistudio.com/json-to-yaml";
const DATE_PUBLISHED = "2026-04-27T00:00:00Z";
const DATE_MODIFIED = "2026-04-27T00:00:00Z";

export const metadata = getPageMetadata({
  title: "JSON to YAML Converter | Free Online Tool with Indent Options",
  description:
    "Convert JSON to YAML in your browser. Choose 2 or 4 space indentation, sort keys alphabetically, and produce clean diff-friendly YAML. Free and no signup.",
  path: PAGE_PATH,
  keywords:
    "json to yaml, convert json to yaml, json to yaml converter, json to yaml online, json to yml, json to yaml parser, json yaml conversion",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "How do I convert JSON to YAML?",
    answer:
      "Paste your JSON in the left panel and the equivalent YAML appears on the right instantly. Pick 2 or 4 space indentation, optionally sort keys, then copy the YAML or download it as a .yaml file.",
  },
  {
    question: "What indentation options are available?",
    answer:
      "You can choose 2 or 4 space indentation. 2 spaces is the YAML community default, used by Kubernetes, GitHub Actions, and Docker Compose. 4 spaces is common in Ansible and some style guides.",
  },
  {
    question: "Can I sort keys alphabetically?",
    answer:
      "Yes. Toggle the Sort keys option to alphabetize map keys at every nesting level. This produces deterministic output, which makes diffs cleaner in version control.",
  },
  {
    question: "How are JSON strings with newlines converted?",
    answer:
      "Multi-line strings are emitted as YAML literal block scalars (|) so the source remains readable. Short strings stay on a single line.",
  },
  {
    question: "Can I convert JSON files larger than a few hundred KB?",
    answer:
      "Yes. The converter handles up to 5 MB. For larger files, split the JSON into smaller payloads or run the conversion in your build pipeline.",
  },
  {
    question: "Does the converter preserve number precision?",
    answer:
      "JSON numbers are converted to YAML scalars without modification. Numbers that exceed JavaScript's safe integer range (greater than 2^53 - 1) may lose precision because they pass through native JSON parsing.",
  },
  {
    question: "Is my JSON data sent to a server?",
    answer:
      "No. Conversion happens entirely in your browser, so your data never leaves your device. The tool is safe for sensitive payloads, internal config, and proprietary infrastructure files.",
  },
  {
    question: "How does the converter handle null values?",
    answer:
      "JSON null becomes YAML null. The output uses the explicit null keyword rather than the tilde ~ shortcut for maximum clarity.",
  },
  {
    question: "Can I convert JSON to YML?",
    answer:
      "Yes. .yml and .yaml are the same format - the extension is just shorter. Use this converter the same way and rename the downloaded file if your tooling requires .yml.",
  },
  {
    question: "What if my JSON is invalid?",
    answer:
      "The converter shows the line and approximate column where the JSON parser failed, along with the underlying error message from the JavaScript engine.",
  },
];

export default function JsonToYamlPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "JSON to YAML", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "JSON to YAML Converter",
    description:
      "Convert JSON to YAML with custom indentation and key sorting.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to convert JSON to YAML online",
    description:
      "Quick steps to convert any JSON document to YAML in the browser.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the converter",
        text: "Navigate to the JSON to YAML converter on KolaviStudio.",
        url: PAGE_PATH,
      },
      {
        name: "Paste or upload JSON",
        text: "Paste your JSON or click Upload to load a .json file.",
      },
      {
        name: "Choose options",
        text: "Pick 2 or 4 space indentation. Optionally enable sort keys for deterministic output.",
      },
      {
        name: "Copy or download",
        text: "Click Copy to copy the YAML, or Download to save it as a .yaml file.",
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
      <JsonToYamlClient faqs={FAQS} />
    </>
  );
}
