import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CheatSheetClient } from "./client";

export const metadata = getPageMetadata({
  title: "Markdown Cheat Sheet - Complete Syntax Guide",
  description:
    "Complete markdown syntax reference with live examples. Copy any syntax in one click. Covers headings, lists, links, images, tables, and more.",
  path: "/markdown-cheat-sheet",
  keywords:
    "markdown cheat sheet, markdown syntax, markdown guide, markdown reference, markdown formatting",
});

export default function MarkdownCheatSheetPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: "Cheat Sheet", url: "/markdown-cheat-sheet" },
  ]);

  const faqSchema = getFAQSchema([
    {
      question: "What is markdown?",
      answer:
        "Markdown is a lightweight markup language created by John Gruber in 2004. It lets you format plain text using simple symbols like # for headings, * for bold, and - for lists. The formatted text can be converted to HTML, PDF, and other formats.",
    },
    {
      question: "What are the basic markdown syntax rules?",
      answer:
        "The core syntax includes # symbols for headings (# H1 through ###### H6), asterisks for emphasis (*italic* and **bold**), dashes or asterisks for unordered lists, numbers for ordered lists, and square brackets with parentheses for links.",
    },
    {
      question: "What is GitHub Flavored Markdown (GFM)?",
      answer:
        "GFM is GitHub's extended version of standard markdown. It adds features like task lists with checkboxes, tables, strikethrough text using tildes, fenced code blocks with language-specific syntax highlighting, and automatic URL linking.",
    },
    {
      question: "Where is markdown used?",
      answer:
        "Markdown is widely used for README files on GitHub and GitLab, documentation sites, blog posts, technical writing, note-taking apps like Obsidian and Notion, and static site generators like Jekyll and Hugo. It is also the standard format for many CMS platforms.",
    },
  ]);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Markdown Cheat Sheet",
    url: "https://kolavistudio.com/markdown-cheat-sheet",
    applicationCategory: "Reference",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Complete markdown syntax reference with live examples and one-click copy for every formatting pattern.",
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
      <CheatSheetClient />
    </>
  );
}
