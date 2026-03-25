import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { MarkdownToPdfClient } from "./client";

export const metadata = getPageMetadata({
  title: "Markdown to PDF Converter - Free Online Tool",
  description:
    "Convert markdown to a clean PDF in one click. Choose from multiple themes and page sizes. Free, no signup needed.",
  path: "/markdown-to-pdf",
  keywords:
    "markdown to pdf, convert markdown to pdf, markdown pdf converter, markdown to pdf online, md to pdf",
});

export default function MarkdownToPdfPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown to PDF", url: "/markdown-to-pdf" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "How do I convert markdown to PDF?",
      answer:
        "Paste or type your markdown content into the editor, choose a theme and page size, then click the convert button. Your PDF will be generated instantly in the browser and ready to download.",
    },
    {
      question: "What themes are available for the PDF output?",
      answer:
        "The converter includes several built-in themes such as a clean default style, a GitHub-inspired theme, and a minimal document layout. Each theme controls typography, spacing, and heading styles in the final PDF.",
    },
    {
      question: "Can I choose the page size for my PDF?",
      answer:
        "Yes. You can select from standard page sizes including Letter, A4, and Legal before generating your PDF. The content will reflow to fit the chosen dimensions.",
    },
    {
      question: "Is this markdown to PDF converter free to use?",
      answer:
        "Yes. The tool is completely free with no account or signup required. All processing happens in your browser, so your documents stay private and are never uploaded to a server.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Markdown to PDF Converter",
    url: "https://kolavistudio.com/markdown-to-pdf",
    applicationCategory: "Utility",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Convert markdown to professionally styled PDF documents with multiple themes and page size options.",
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
      <MarkdownToPdfClient />
    </>
  );
}
