import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { MarkdownFormatterClient } from "./client";

export const metadata = getPageMetadata({
  title: "Markdown Formatter and Beautifier - Free Online Tool",
  description:
    "Clean up messy markdown automatically. Fix spacing, headings, lists, and inconsistent formatting. See a diff of every change. Free, no signup.",
  path: "/markdown-formatter",
  keywords:
    "markdown formatter, markdown beautifier, format markdown, markdown linter, clean up markdown, markdown prettifier",
});

export default function MarkdownFormatterPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown Formatter", url: "/markdown-formatter" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What does the markdown formatter fix?",
      answer:
        "The formatter normalizes heading levels, fixes inconsistent list indentation, removes trailing whitespace, ensures blank lines between blocks, and standardizes emphasis markers. It produces clean, consistent markdown that follows common style conventions.",
    },
    {
      question: "Can I see what the formatter changed?",
      answer:
        "Yes. After formatting, a diff view highlights every change made to your document. Added lines appear in green and removed lines appear in red, so you can review each modification before copying the result.",
    },
    {
      question: "What is format on paste?",
      answer:
        "Format on paste automatically cleans up markdown as soon as you paste it into the editor. This saves a step when you are working with markdown copied from other sources that may have inconsistent formatting.",
    },
    {
      question: "Is my data private when using the formatter?",
      answer:
        "Yes. All formatting is performed entirely in your browser using client-side JavaScript. Your markdown content is never sent to a server, so your documents remain completely private.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Markdown Formatter and Beautifier",
    url: "https://kolavistudio.com/markdown-formatter",
    applicationCategory: "Utility",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Automatically clean up and beautify messy markdown with diff view showing every change.",
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
      <MarkdownFormatterClient />
    </>
  );
}
