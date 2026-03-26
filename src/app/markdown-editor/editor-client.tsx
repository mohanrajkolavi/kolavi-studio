"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
  type RefObject,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Bold,
  Italic,
  Heading1,
  Link,
  Code,
  Quote,
  List,
  ListOrdered,
  Minus,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ToolLayout } from "@/components/markdown-tools/ToolLayout";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { parseMarkdown } from "@/lib/markdown/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "md-editor-content";

const DEFAULT_CONTENT = `# Welcome to the Markdown Editor

Start writing your markdown here and see a **live preview** on the right.

## Features

- **Live preview** as you type
- GitHub Flavored Markdown support
- Auto-save to your browser
- Share your markdown via URL
- Download as \`.md\` file

## Try some markdown

Here's a [link](https://example.com) and some \`inline code\`.

> This is a blockquote

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

| Feature | Status |
|---------|--------|
| Editor | ✅ |
| Preview | ✅ |
| Share | ✅ |`;

// ---------------------------------------------------------------------------
// Toolbar config
// ---------------------------------------------------------------------------

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  prefix: string;
  suffix: string;
  block?: boolean;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: Bold, label: "Bold", prefix: "**", suffix: "**" },
  { icon: Italic, label: "Italic", prefix: "*", suffix: "*" },
  { icon: Heading1, label: "Heading", prefix: "# ", suffix: "", block: true },
  { icon: Link, label: "Link", prefix: "[", suffix: "](url)" },
  { icon: Code, label: "Code", prefix: "`", suffix: "`" },
  { icon: Quote, label: "Blockquote", prefix: "> ", suffix: "", block: true },
  {
    icon: List,
    label: "Unordered list",
    prefix: "- ",
    suffix: "",
    block: true,
  },
  {
    icon: ListOrdered,
    label: "Ordered list",
    prefix: "1. ",
    suffix: "",
    block: true,
  },
  { icon: Minus, label: "Horizontal rule", prefix: "\n---\n", suffix: "" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function applyToolbarAction(
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  action: ToolbarAction,
  content: string,
  setContent: (v: string) => void
) {
  const el = textareaRef.current;
  if (!el) return;

  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = content.slice(start, end);

  let before = content.slice(0, start);
  const after = content.slice(end);

  if (action.block && before.length > 0 && !before.endsWith("\n")) {
    before += "\n";
  }

  const insertedText = selected || action.label;
  const wrapped = `${before}${action.prefix}${insertedText}${action.suffix}${after}`;
  setContent(wrapped);

  requestAnimationFrame(() => {
    el.focus();
    const newStart = before.length + action.prefix.length;
    const newEnd = newStart + insertedText.length;
    el.setSelectionRange(newStart, newEnd);
  });
}

function triggerDownload(content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "document.md";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Inner component (reads searchParams)
// ---------------------------------------------------------------------------

function MarkdownEditorInner() {
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [content, setContent] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CONTENT;

    const fromUrl = getContentFromUrl(searchParams);
    if (fromUrl) return fromUrl;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // localStorage may be unavailable
    }

    return DEFAULT_CONTENT;
  });

  const [gfm, setGfm] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const param = searchParams.get("gfm");
    return param === "true" || param === null;
  });

  // Auto-save with 1s debounce
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
      } catch {
        // quota exceeded or blocked
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key === "b") {
        e.preventDefault();
        applyToolbarAction(textareaRef, TOOLBAR_ACTIONS[0], content, setContent);
      } else if (e.key === "i") {
        e.preventDefault();
        applyToolbarAction(textareaRef, TOOLBAR_ACTIONS[1], content, setContent);
      } else if (e.key === "s") {
        e.preventDefault();
        triggerDownload(content);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setContent(text);
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be re-uploaded
      e.target.value = "";
    },
    []
  );

  const renderedHtml = useMemo(
    () => parseMarkdown(content, { gfm, sanitize: true }),
    [content, gfm]
  );

  const wordCount = useMemo(() => countWords(content), [content]);
  const charCount = content.length;

  const handleToolbarClick = useCallback(
    (action: ToolbarAction) => {
      applyToolbarAction(textareaRef, action, content, setContent);
    },
    [content]
  );

  // ---- Shared UI pieces ----

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
      {TOOLBAR_ACTIONS.map((action) => (
        <Button
          key={action.label}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleToolbarClick(action)}
          aria-label={action.label}
          title={action.label}
        >
          <action.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );

  const editorTextarea = (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className={cn(
        "h-full w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm",
        "focus:outline-none"
      )}
      placeholder="Write your markdown here..."
      spellCheck={false}
    />
  );

  const previewPane = (
    <div
      className="prose dark:prose-invert max-w-none overflow-auto p-4"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );

  const statsBar = (
    <div className="flex items-center justify-between border-t px-3 py-1.5">
      <span className="text-sm text-muted-foreground">
        {wordCount} words &middot; {charCount} chars
      </span>
      <div className="flex items-center gap-2">
        <label
          htmlFor="gfm-toggle"
          className="cursor-pointer text-sm text-muted-foreground"
        >
          GitHub Flavored Markdown
        </label>
        <Switch
          id="gfm-toggle"
          checked={gfm}
          onCheckedChange={setGfm}
          aria-label="Toggle GitHub Flavored Markdown"
        />
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.mdx"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload markdown file"
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Upload file"
      >
        <Upload className="h-3.5 w-3.5" />
        <span>Upload</span>
      </Button>
      <ShareButton content={content} basePath="/markdown-editor" />
      <DownloadButton
        content={content}
        filename="document.md"
        mimeType="text/markdown"
        label="Download"
      />
    </div>
  );

  return (
    <ToolLayout
      title="Free Markdown Editor"
      description="Write and preview markdown instantly with live rendering. No login required."
      currentPath="/markdown-editor"
    >
      {/* Action buttons */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RelatedTools
          links={[
            { href: "/markdown-to-pdf", label: "Convert to PDF", getContent: () => content },
            { href: "/markdown-to-html", label: "Convert to HTML", getContent: () => content },
            { href: "/markdown-formatter", label: "Format", getContent: () => content },
            { href: "/markdown-table-generator", label: "Build a Table" },
          ]}
        />
        <div className="flex items-center justify-end">{actionButtons}</div>
      </div>

      {/* Desktop: split pane (fixed height, independently scrollable) */}
      <div className="hidden overflow-hidden rounded-lg border bg-background md:grid md:h-[calc(100vh-280px)] md:min-h-[500px] md:max-h-[900px] md:grid-cols-2 md:divide-x">
        <div className="flex flex-col overflow-hidden">
          {toolbar}
          <div className="flex-1 overflow-auto">{editorTextarea}</div>
          {statsBar}
        </div>
        <div className="overflow-auto">{previewPane}</div>
      </div>

      {/* Mobile: tabs */}
      <div className="md:hidden">
        <Tabs defaultValue="write">
          <TabsList className="w-full">
            <TabsTrigger value="write" className="flex-1">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="write">
            <div className="flex min-h-[400px] flex-col rounded-lg border bg-background">
              {toolbar}
              <div className="flex-1">{editorTextarea}</div>
              {statsBar}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="min-h-[400px] rounded-lg border bg-background">
              {previewPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  );
}

// ---------------------------------------------------------------------------
// Exported client component (wraps inner with Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function MarkdownEditorClient() {
  return (
    <Suspense
      fallback={
        <ToolLayout
          title="Free Markdown Editor"
          description="Write and preview markdown instantly with live rendering. No login required."
          currentPath="/markdown-editor"
        >
          <div className="flex min-h-[600px] items-center justify-center">
            <p className="text-muted-foreground">Loading editor...</p>
          </div>
        </ToolLayout>
      }
    >
      <MarkdownEditorInner />
    </Suspense>
  );
}
