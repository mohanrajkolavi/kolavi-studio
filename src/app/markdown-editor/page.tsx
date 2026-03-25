import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import MarkdownEditorClient from "./editor-client";

export const metadata = getPageMetadata({
  title: "Free Markdown Editor - Live Preview",
  description:
    "Write and preview markdown instantly with our free online editor. Supports GitHub Flavored Markdown, auto-saves your work, and requires no login.",
  path: "/markdown-editor",
  keywords:
    "markdown editor, markdown editor online, markdown preview, live markdown editor, markdown writer, free markdown editor",
});

export default function MarkdownEditorPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Markdown Editor", url: "/markdown-editor" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What is a markdown editor?",
      answer:
        "A markdown editor is a tool that lets you write plain text with simple formatting syntax and see the rendered result in real time. It converts lightweight markup like headings, bold, and lists into formatted output you can use in documentation, blogs, and README files.",
    },
    {
      question: "How do I use this online markdown editor?",
      answer:
        "Type or paste your markdown in the left panel and the formatted preview appears instantly on the right. You can use toolbar buttons for common formatting like headings, bold, italics, links, and code blocks.",
    },
    {
      question: "Is this markdown editor completely free?",
      answer:
        "Yes. This editor is 100% free with no account required. Your content is processed entirely in your browser, so nothing is sent to a server.",
    },
    {
      question: "What is GitHub Flavored Markdown (GFM)?",
      answer:
        "GFM is an extended version of standard markdown used on GitHub. It adds support for tables, task lists, strikethrough text, and fenced code blocks with syntax highlighting.",
    },
    {
      question: "Can I save my work in the markdown editor?",
      answer:
        "Yes. The editor auto-saves your content to your browser's local storage, so your work persists between sessions. You can also download your markdown as a .md file at any time.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Markdown Editor",
    url: "https://kolavistudio.com/markdown-editor",
    applicationCategory: "Utility",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Write and preview markdown instantly with live rendering, GitHub Flavored Markdown support, and auto-save.",
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
      <MarkdownEditorClient />
    </>
  );
}
