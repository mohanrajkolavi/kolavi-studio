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
  Undo2,
  Redo2,
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
const MAX_HISTORY = 100;

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
// Undo/Redo history hook
// ---------------------------------------------------------------------------

function useHistory(initialValue: string) {
  const historyRef = useRef<string[]>([initialValue]);
  const indexRef = useRef(0);
  const [current, setCurrent] = useState(initialValue);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback((value: string) => {
    // Debounce: batch rapid keystrokes into single history entries (300ms)
    if (batchTimeoutRef.current) clearTimeout(batchTimeoutRef.current);

    setCurrent(value);

    batchTimeoutRef.current = setTimeout(() => {
      const history = historyRef.current;
      const idx = indexRef.current;

      // If we're not at the end, trim forward history
      if (idx < history.length - 1) {
        historyRef.current = history.slice(0, idx + 1);
      }

      historyRef.current.push(value);

      // Cap history length
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY);
      }

      indexRef.current = historyRef.current.length - 1;
    }, 300);
  }, []);

  const setWithoutHistory = useCallback((value: string) => {
    // Reset history when content is loaded from external source (file upload, URL)
    historyRef.current = [value];
    indexRef.current = 0;
    setCurrent(value);
  }, []);

  const undo = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
      // Flush pending push so the current state is saved before undoing
      const history = historyRef.current;
      const idx = indexRef.current;
      if (idx < history.length - 1) {
        historyRef.current = history.slice(0, idx + 1);
      }
      historyRef.current.push(current);
      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current = historyRef.current.slice(-MAX_HISTORY);
      }
      indexRef.current = historyRef.current.length - 1;
    }

    const idx = indexRef.current;
    if (idx > 0) {
      indexRef.current = idx - 1;
      setCurrent(historyRef.current[idx - 1]);
    }
  }, [current]);

  const redo = useCallback(() => {
    const idx = indexRef.current;
    const history = historyRef.current;
    if (idx < history.length - 1) {
      indexRef.current = idx + 1;
      setCurrent(history[idx + 1]);
    }
  }, []);

  const canUndo = indexRef.current > 0 || batchTimeoutRef.current !== null;
  const canRedo = indexRef.current < historyRef.current.length - 1;

  return { current, push, setWithoutHistory, undo, redo, canUndo, canRedo };
}

// ---------------------------------------------------------------------------
// Resizable split pane hook
// ---------------------------------------------------------------------------

function useResizablePane(containerRef: RefObject<HTMLDivElement | null>) {
  const [splitPercent, setSplitPercent] = useState(50);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - rect.left;
        const percent = Math.min(Math.max((x / rect.width) * 100, 20), 80);
        setSplitPercent(percent);
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [containerRef]
  );

  return { splitPercent, handleMouseDown };
}

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
  const splitContainerRef = useRef<HTMLDivElement | null>(null);

  // Determine initial content
  const initialContent = useMemo(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    current: content,
    push: pushContent,
    setWithoutHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(initialContent);

  const { splitPercent, handleMouseDown } = useResizablePane(splitContainerRef);

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

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "b") {
        e.preventDefault();
        applyToolbarAction(textareaRef, TOOLBAR_ACTIONS[0], content, pushContent);
      } else if (e.key === "i") {
        e.preventDefault();
        applyToolbarAction(textareaRef, TOOLBAR_ACTIONS[1], content, pushContent);
      } else if (e.key === "s") {
        e.preventDefault();
        triggerDownload(content);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, pushContent, undo, redo]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          setWithoutHistory(text);
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be re-uploaded
      e.target.value = "";
    },
    [setWithoutHistory]
  );

  const renderedHtml = useMemo(
    () => parseMarkdown(content, { gfm, sanitize: true }),
    [content, gfm]
  );

  const wordCount = useMemo(() => countWords(content), [content]);
  const charCount = content.length;

  const handleToolbarClick = useCallback(
    (action: ToolbarAction) => {
      applyToolbarAction(textareaRef, action, content, pushContent);
    },
    [content, pushContent]
  );

  // ---- Shared UI pieces ----

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <div className="mx-1 h-5 w-px bg-border" />
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
      onChange={(e) => pushContent(e.target.value)}
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

      {/* Desktop: split pane with draggable resizer */}
      <div
        ref={splitContainerRef}
        className="hidden overflow-hidden rounded-lg border bg-background md:flex md:h-[calc(100vh-280px)] md:min-h-[500px] md:max-h-[900px]"
      >
        {/* Editor side */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${splitPercent}%` }}
        >
          {toolbar}
          <div className="flex-1 overflow-auto">{editorTextarea}</div>
          {statsBar}
        </div>

        {/* Draggable resizer handle */}
        <button
          type="button"
          aria-label="Resize editor and preview panes"
          className="relative z-10 w-1.5 cursor-col-resize select-none border-x border-border bg-muted transition-colors hover:bg-primary/20 active:bg-primary/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col gap-1">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            </div>
          </div>
        </button>

        {/* Preview side */}
        <div className="flex-1 overflow-auto">
          {previewPane}
        </div>
      </div>

      {/* Mobile: tabs (fixed height, scrollable) */}
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
            <div className="flex h-[calc(100vh-300px)] min-h-[350px] max-h-[600px] flex-col overflow-hidden rounded-lg border bg-background">
              {toolbar}
              <div className="flex-1 overflow-auto">{editorTextarea}</div>
              {statsBar}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="h-[calc(100vh-300px)] min-h-[350px] max-h-[600px] overflow-auto rounded-lg border bg-background">
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
