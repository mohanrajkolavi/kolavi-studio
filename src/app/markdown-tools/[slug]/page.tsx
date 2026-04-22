import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageMetadata } from "@/lib/seo/metadata";
import { getBreadcrumbSchema } from "@/lib/seo/jsonld/breadcrumb";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ToolFooter } from "@/components/markdown-tools/ToolFooter";
import { MARKDOWN_TOOLS, getToolBySlug } from "@/lib/markdown/tools-data";

// ---------------------------------------------------------------------------
// Static params: generate a page for every tool WITHOUT an externalPath.
// Slugs with a bespoke static route (e.g. /markdown-tools/obsidian/page.tsx)
// are excluded here - the static route wins over the dynamic route.
// ---------------------------------------------------------------------------

const BESPOKE_ROUTE_SLUGS = new Set<string>(["obsidian"]);

export function generateStaticParams() {
  return MARKDOWN_TOOLS.filter(
    (t) => !t.externalPath && !BESPOKE_ROUTE_SLUGS.has(t.slug),
  ).map((t) => ({
    slug: t.slug,
  }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool) return {};

  return getPageMetadata({
    title: `${tool.name} Markdown: Complete Guide`,
    description: tool.description,
    path: `/markdown-tools/${tool.slug}`,
    keywords: tool.keywords,
  });
}

// ---------------------------------------------------------------------------
// Support badge helpers
// ---------------------------------------------------------------------------

function SupportBadge({ level }: { level: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    full: {
      label: "Full",
      classes: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    },
    gfm: {
      label: "GFM",
      classes: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    partial: {
      label: "Partial",
      classes: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
    custom: {
      label: "Custom",
      classes: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
  };
  const badge = map[level] ?? map.partial;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}
    >
      {badge.label}
    </span>
  );
}

function SupportIcon({ support }: { support: "yes" | "no" | "partial" }) {
  if (support === "yes") {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        Yes
      </span>
    );
  }
  if (support === "no") {
    return (
      <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-500">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      Partial
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function MarkdownToolPage({ params }: PageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.externalPath) return notFound();

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Markdown Tools", url: "/markdown-tools" },
    { name: tool.name, url: `/markdown-tools/${tool.slug}` },
  ]);

  const faqSchema = getFAQSchema(tool.faqs);

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {tool.name} Markdown: Complete Guide
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {tool.intro}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm">
          <span className="font-medium text-muted-foreground">
            Markdown support:
          </span>
          <SupportBadge level={tool.markdownSupport} />
        </p>

        {/* Syntax support table */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Markdown Support in {tool.name}
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Format</th>
                  <th className="px-4 py-3 text-left font-medium">Syntax</th>
                  <th className="px-4 py-3 text-left font-medium">Support</th>
                </tr>
              </thead>
              <tbody>
                {tool.syntaxSupport.map((row, i) => (
                  <tr
                    key={row.format}
                    className={
                      i % 2 === 0
                        ? "bg-background"
                        : "bg-muted/30"
                    }
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {row.format}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {row.syntax}
                        </code>
                        <CopyButton content={row.syntax} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <SupportIcon support={row.support} />
                        {row.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {row.notes}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quirks */}
        {tool.quirks && tool.quirks.length > 0 && (
          <section className="mt-8">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                Things to know
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                {tool.quirks.map((q) => (
                  <li key={q} className="flex gap-2">
                    <span className="shrink-0" aria-hidden="true">
                      &bull;
                    </span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {tool.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-medium">{faq.question}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA section */}
        <section className="mt-10 rounded-lg border border-border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold">Explore More</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/markdown-editor"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try it in our editor
            </Link>
            <Link
              href="/markdown-tools"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Browse all tools
            </Link>
            <Link
              href="/markdown-cheat-sheet"
              className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Cheat Sheet
            </Link>
            <a
              href={tool.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              {tool.name} official docs
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        </section>

        {/* Footer navigation */}
        <ToolFooter currentPath={`/markdown-tools/${slug}`} />
      </div>
    </>
  );
}
