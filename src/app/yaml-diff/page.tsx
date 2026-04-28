import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { YamlDiffClient } from "./client";

const PAGE_PATH = "/yaml-diff";
const PAGE_URL = "https://kolavistudio.com/yaml-diff";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";

export const metadata = getPageMetadata({
  title: "YAML Diff | Compare Two YAML Files Online (Free, Browser-Based)",
  description:
    "Compare two YAML files side by side. See added, removed, and changed keys highlighted at line and structure level. Detects semantic equality across reordered keys.",
  path: PAGE_PATH,
  keywords:
    "yaml diff, compare yaml, yaml comparison, yaml difference, diff yaml files, yaml compare online, yaml diff tool, yaml file compare",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "What does the YAML diff tool do?",
    answer:
      "It compares two YAML files and shows what changed. The line view highlights added, removed, and unchanged lines like git diff. The structural view parses both files and reports semantic changes by dotted key path - so a key reorder shows as no change, while a renamed key shows as one removed plus one added.",
  },
  {
    question: "How is structural diff different from line diff?",
    answer:
      "Line diff compares the raw text. If you reorder two top-level keys, the line diff shows one removed and one added even though the parsed value is identical. Structural diff parses both sides into trees and walks them, so reordering, comment changes, and indentation tweaks register as no change. Use line diff for review, structural diff for correctness.",
  },
  {
    question: "Does the YAML diff tool detect semantic equality?",
    answer:
      "Yes. When both inputs parse, the tool reports 'semantically equal' if the resulting trees are deep-equal - meaning the YAML files would behave identically when consumed by any parser, regardless of key order, comment placement, or whitespace differences.",
  },
  {
    question: "Can I diff invalid YAML?",
    answer:
      "The line-level diff works on any input, including syntactically invalid YAML. The structural diff requires both sides to parse successfully; if either side has a syntax error, the structural pane shows the error with a line and column number and disables structural comparison until the input is fixed.",
  },
  {
    question: "Is the YAML diff tool sent to a server?",
    answer:
      "No. Parsing and diffing run entirely in your browser, so your YAML files never leave your device. The tool is safe for secrets, internal infrastructure config, and proprietary data.",
  },
  {
    question: "How do I diff two YAML files online?",
    answer:
      "Paste the original file into the left pane, the new version into the right pane, and the tool compares them automatically. Use the Upload buttons to load .yaml or .yml files. Toggle between line view and structural view; both update live as you edit.",
  },
  {
    question: "Does the diff tool follow YAML anchors and aliases?",
    answer:
      "Yes. Both files are parsed with a YAML 1.2 library that resolves anchors and merge keys before the structural diff runs. Two files that produce the same expanded value are reported as semantically equal even if one uses anchors and the other inlines the values.",
  },
  {
    question: "What is the maximum file size for YAML diff?",
    answer:
      "5 MB per side. Larger files should be diffed locally with git diff or a CLI tool like dyff (https://github.com/homeport/dyff) which is built specifically for YAML and Kubernetes manifests.",
  },
  {
    question: "Can I compare multi-document YAML files?",
    answer:
      "Yes. The line diff works on any input, multi-document or otherwise. The structural diff currently parses the first document of each side; for multi-document comparisons (e.g. Kubernetes manifests bundling many resources), split the files into per-document chunks before diffing.",
  },
  {
    question: "How does YAML diff handle key order?",
    answer:
      "Structural diff treats two YAML maps with the same keys and values as identical regardless of order, because YAML maps are unordered by spec. Line diff respects order because it operates on raw text. If you care about deterministic ordering, run both files through the YAML formatter with sort keys enabled before diffing.",
  },
  {
    question: "Why does my YAML diff show changes I did not make?",
    answer:
      "Three common causes: trailing-whitespace differences (line diff catches them, structural diff ignores them), CRLF vs LF line endings, or a YAML parser that auto-resolves aliases differently between the two sides. Format both files with the same indentation and key order before diffing to eliminate noise.",
  },
  {
    question: "Can I share a diff URL?",
    answer:
      "Yes. The Share buttons on each pane copy a link that encodes that pane's content. Send the link to a teammate to load the same comparison in their browser. For diffs you want to keep, copy the structured change list and paste it into a pull-request description.",
  },
];

export default function YamlDiffPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Diff", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "YAML Diff",
    description:
      "Compare two YAML files in the browser. Line-level and structural diff with semantic-equality detection.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to compare two YAML files online",
    description:
      "Quick steps to diff YAML files in the browser, with both line and structural views.",
    totalTime: "PT1M",
    steps: [
      {
        name: "Open the YAML diff tool",
        text: "Navigate to the YAML Diff page.",
        url: PAGE_PATH,
      },
      {
        name: "Paste the original",
        text: "Paste or upload the original YAML on the left pane.",
      },
      {
        name: "Paste the new version",
        text: "Paste or upload the changed YAML on the right pane.",
      },
      {
        name: "Read the diff",
        text: "Switch between Line and Structural views to see textual and semantic changes.",
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
      <YamlDiffClient faqs={FAQS} />
    </>
  );
}
