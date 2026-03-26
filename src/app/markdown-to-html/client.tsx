"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import xml from "highlight.js/lib/languages/xml";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ToolLayout } from "@/components/markdown-tools/ToolLayout";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { parseMarkdown, minifyHtml, wrapHtml } from "@/lib/markdown/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("xml", xml);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "md-html-content";

const DEFAULT_CONTENT = `# Hello World

This is a **Markdown to HTML** converter. Start typing to see live results.

## Features

- GitHub Flavored Markdown support
- Live rendered preview
- Syntax-highlighted HTML output
- Download, copy, and share

> Try editing this content!

\`\`\`js
console.log("Hello!");
\`\`\`

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
`;

// ---------------------------------------------------------------------------
// Inner component (reads searchParams)
// ---------------------------------------------------------------------------

function MarkdownToHtmlInner() {
  const searchParams = useSearchParams();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- State ---

  const [content, setContent] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CONTENT;

    const fromUrl = getContentFromUrl(searchParams);
    if (fromUrl) return fromUrl;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // localStorage may be blocked
    }

    return DEFAULT_CONTENT;
  });

  const [gfm, setGfm] = useState(true);
  const [sanitize, setSanitize] = useState(true);
  const [includeWrapper, setIncludeWrapper] = useState(false);
  const [minify, setMinify] = useState(false);

  // --- Auto-save with debounce ---

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
      } catch {
        // quota exceeded or blocked
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content]);

  // --- Derived HTML ---

  const rawHtml = useMemo(
    () => parseMarkdown(content, { gfm, sanitize }),
    [content, gfm, sanitize]
  );

  const outputHtml = useMemo(() => {
    let result = rawHtml;
    if (includeWrapper) result = wrapHtml(result);
    if (minify) result = minifyHtml(result);
    return result;
  }, [rawHtml, includeWrapper, minify]);

  // Preview always uses sanitized, non-minified body HTML
  const previewHtml = useMemo(
    () => parseMarkdown(content, { gfm, sanitize: true }),
    [content, gfm]
  );

  // --- Syntax highlighting ---

  const highlightedHtml = useMemo(() => {
    try {
      return hljs.highlight(outputHtml, { language: "xml" }).value;
    } catch {
      return outputHtml
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [outputHtml]);

  // --- Character counts ---

  const inputCharCount = content.length;
  const outputCharCount = outputHtml.length;

  // --- Pane fragments ---

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Markdown
        </h2>
        <span className="text-xs text-muted-foreground">
          {inputCharCount.toLocaleString()} chars
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          "flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm",
          "focus:outline-none"
        )}
        placeholder="Paste or type your markdown here..."
        spellCheck={false}
      />
    </div>
  );

  const optionsRow = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <span className="flex items-center gap-2 text-sm">
        <Switch
          id="gfm-toggle"
          checked={gfm}
          onCheckedChange={setGfm}
          aria-label="Toggle GFM mode"
        />
        <label htmlFor="gfm-toggle">GFM mode</label>
      </span>
      <span className="flex items-center gap-2 text-sm">
        <Switch
          id="sanitize-toggle"
          checked={sanitize}
          onCheckedChange={setSanitize}
          aria-label="Toggle sanitize output"
        />
        <label htmlFor="sanitize-toggle">Sanitize output</label>
      </span>
      <span className="flex items-center gap-2 text-sm">
        <Switch
          id="wrapper-toggle"
          checked={includeWrapper}
          onCheckedChange={setIncludeWrapper}
          aria-label="Toggle include HTML wrapper"
        />
        <label htmlFor="wrapper-toggle">Include HTML wrapper</label>
      </span>
      <span className="flex items-center gap-2 text-sm">
        <Switch
          id="minify-toggle"
          checked={minify}
          onCheckedChange={setMinify}
          aria-label="Toggle minify"
        />
        <label htmlFor="minify-toggle">Minify</label>
      </span>
    </div>
  );

  const htmlPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">HTML</h2>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-xs text-muted-foreground">
            {outputCharCount.toLocaleString()} chars
          </span>
          <CopyButton content={outputHtml} label="Copy" />
          <DownloadButton
            content={outputHtml}
            filename="output.html"
            mimeType="text/html"
            label="Download"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm">
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );

  const previewPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Preview
        </h2>
      </div>
      <div
        className="prose dark:prose-invert max-w-none flex-1 overflow-auto p-4"
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  );

  return (
    <ToolLayout
      title="Markdown to HTML Converter"
      description="Convert markdown to clean, semantic HTML instantly."
      currentPath="/markdown-to-html"
    >
      {/* Action bar */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {optionsRow}
        <div className="flex items-center gap-2">
          <UploadButton onContent={setContent} />
          <ShareButton content={content} basePath="/markdown-to-html" />
        </div>
      </div>

      <div className="mb-4">
        <RelatedTools
          links={[
            { href: "/markdown-editor", label: "Edit in Editor", getContent: () => content },
            { href: "/markdown-to-pdf", label: "Convert to PDF instead", getContent: () => content },
          ]}
        />
      </div>

      {/* Desktop: 3-column layout (lg+), fixed height with independent scroll */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:divide-x rounded-lg border bg-background overflow-hidden h-[calc(100vh-300px)] min-h-[500px] max-h-[800px]">
        {inputPane}
        {htmlPane}
        {previewPane}
      </div>

      {/* Mobile / tablet: tabs (below lg), fixed height with scroll */}
      <div className="lg:hidden">
        <Tabs defaultValue="markdown">
          <TabsList className="w-full">
            <TabsTrigger value="markdown" className="flex-1">
              Markdown
            </TabsTrigger>
            <TabsTrigger value="html" className="flex-1">
              HTML
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markdown">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-320px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>

          <TabsContent value="html">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-320px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {htmlPane}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="rounded-lg border bg-background h-[calc(100vh-320px)] min-h-[350px] max-h-[600px] overflow-auto">
              {previewPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
}

// ---------------------------------------------------------------------------
// Exported client wrapper with Suspense (useSearchParams requires it)
// ---------------------------------------------------------------------------

export function MarkdownToHtmlClient() {
  return (
    <Suspense
      fallback={
        <ToolLayout
          title="Markdown to HTML Converter"
          description="Convert markdown to clean, semantic HTML instantly."
          currentPath="/markdown-to-html"
        >
          <div className="flex min-h-[600px] items-center justify-center">
            <p className="text-muted-foreground">Loading converter...</p>
          </div>
        </ToolLayout>
      }
    >
      <MarkdownToHtmlInner />
    </Suspense>
  );
}
