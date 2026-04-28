import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getHowToSchema } from "@/lib/seo/jsonld/howto";
import { getSoftwareApplicationSchema } from "@/lib/seo/jsonld/softwareapp";
import { YamlEditorClient } from "./client";

const PAGE_PATH = "/yaml-editor";
const PAGE_URL = "https://kolavistudio.com/yaml-editor";
const DATE_PUBLISHED = "2026-04-28T00:00:00Z";
const DATE_MODIFIED = "2026-04-28T00:00:00Z";

export const metadata = getPageMetadata({
  title: "Online YAML Editor | Free Browser-Based with Live Validation",
  description:
    "Edit YAML in the browser with live validation, syntax highlighting, and localStorage autosave. No signup required, free, and your data stays on your device.",
  path: PAGE_PATH,
  keywords:
    "yaml editor, online yaml editor, yaml editor online, edit yaml, browser yaml editor, yaml ide, free yaml editor",
  author: "Mohan Raj Kolavi",
  publishedTime: DATE_PUBLISHED,
  modifiedTime: DATE_MODIFIED,
});

const FAQS = [
  {
    question: "What is the YAML editor?",
    answer:
      "It is a free browser-based YAML editor with live validation, syntax highlighting, and localStorage autosave. You can edit any YAML file - Kubernetes manifests, GitHub Actions, Docker Compose, OpenAPI specs - and see errors with line and column numbers as you type.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. The editor runs entirely in your browser. There is no signup, no extension, and no installation. Just open the page and start editing.",
  },
  {
    question: "Is my YAML saved automatically?",
    answer:
      "Yes. The editor autosaves your work to your browser's localStorage every half second. When you return to the page, your last draft is loaded automatically. The autosave is local to your device only.",
  },
  {
    question: "Does the editor validate YAML in real time?",
    answer:
      "Yes. As you type, the editor parses your YAML against the YAML 1.2 spec and shows the line and column of any syntax error. The validation status updates instantly without an explicit save action.",
  },
  {
    question: "Can I share my YAML draft?",
    answer:
      "Yes. Click Share to generate a URL that encodes your YAML in the query string. Anyone who opens that URL sees the same content. Sensitive YAML should not be shared this way because the URL itself contains the data.",
  },
  {
    question: "Is my data sent to a server?",
    answer:
      "No. All editing, validation, and saving happens in your browser. Your YAML never leaves your device, which makes the editor safe for secrets, internal config, and proprietary infrastructure files.",
  },
  {
    question: "Does the editor support YAML 1.2 features?",
    answer:
      "Yes. Anchors, aliases, merge keys, block scalars (literal | and folded >), tagged values, and standard scalar types are all supported during validation.",
  },
  {
    question: "How big a YAML file can I edit?",
    answer:
      "The editor handles up to 5 MB. localStorage browser limits are typically around 5 to 10 MB per origin, so very large drafts may not autosave on some browsers.",
  },
  {
    question: "Can I download my YAML?",
    answer:
      "Yes. Click Download to save the current editor content as a .yaml file. You can also copy it to your clipboard with the Copy button or convert it to JSON via the linked converter.",
  },
  {
    question: "Is there syntax highlighting in the editor?",
    answer:
      "Yes. The preview panel shows your YAML with syntax highlighting via highlight.js, including separate colors for keys, scalars, comments, and structural punctuation.",
  },
];

export default function YamlEditorPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "YAML Tools", url: "/yaml-tools" },
    { name: "YAML Editor", url: PAGE_PATH },
  ]);

  const faqSchema = getFAQSchema(FAQS);

  const softwareSchema = getSoftwareApplicationSchema({
    name: "YAML Editor",
    description:
      "Browser-based YAML editor with live validation, syntax highlighting, and localStorage autosave.",
    operatingSystem: "Any",
    applicationCategory: "DeveloperApplication",
    url: PAGE_URL,
    offers: { price: "0", currency: "USD" },
    author: { name: "KolaviStudio", url: "https://kolavistudio.com" },
  });

  const howToSchema = getHowToSchema({
    name: "How to use the YAML editor",
    description: "Steps to edit and save YAML in the browser editor.",
    totalTime: "PT2M",
    steps: [
      {
        name: "Open the editor",
        text: "Navigate to the YAML Editor page on KolaviStudio.",
        url: PAGE_PATH,
      },
      {
        name: "Paste or type YAML",
        text: "Edit YAML in the left input. The right panel shows syntax-highlighted output and validation status.",
      },
      {
        name: "Watch live validation",
        text: "If your YAML has a syntax error, the line and column of the issue appear instantly.",
      },
      {
        name: "Save or share",
        text: "Your draft autosaves to localStorage. Click Download to save a .yaml file or Share to generate a shareable URL.",
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
      <YamlEditorClient faqs={FAQS} />
    </>
  );
}
