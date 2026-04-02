import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { TableGeneratorClient } from "./table-generator-client";

export const metadata = getPageMetadata({
  title: "Markdown Table Generator - CSV to Markdown Table",
  description:
    "Generate markdown tables instantly. Paste CSV data or build tables manually with alignment controls. Free online tool, no signup required.",
  path: "/markdown-table-generator",
  keywords:
    "markdown table generator, markdown table, csv to markdown table, markdown table creator, table generator online",
});

export default function MarkdownTableGeneratorPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Table Generator", url: "/markdown-table-generator" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "How do I create a markdown table?",
      answer:
        "Use the visual grid to add rows and columns, then type your content into each cell. The tool generates valid markdown table syntax automatically. You can also start by pasting CSV or tab-separated data.",
    },
    {
      question: "Can I import CSV data into a markdown table?",
      answer:
        "Yes. Paste your CSV or tab-separated data directly into the import area and it will be converted into a properly formatted markdown table. This works with data copied from spreadsheets like Excel and Google Sheets.",
    },
    {
      question: "How do I align columns in a markdown table?",
      answer:
        "Click the alignment controls on each column header to set left, center, or right alignment. The generator adds the correct colon syntax to the separator row automatically.",
    },
    {
      question: "What input formats are supported?",
      answer:
        "You can build tables manually using the visual editor, or import data from CSV files, tab-separated values, and clipboard content from spreadsheet applications. The output is standard markdown table syntax compatible with GitHub, GitLab, and most markdown renderers.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Markdown Table Generator",
    url: "https://kolavistudio.com/markdown-table-generator",
    applicationCategory: "Utility",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Generate markdown tables from CSV data or a visual editor with column alignment controls.",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appSchema),
        }}
      />
      <TableGeneratorClient />
    </>
  );
}
