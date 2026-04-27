"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { validateYaml } from "@/lib/yaml/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("yaml", yamlLang);

const STORAGE_KEY = "yaml-editor-content";

const DEFAULT_YAML = `# YAML Editor - your draft autosaves to localStorage
# Sample CI workflow - edit or paste your own
name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
`;

interface YamlEditorClientProps {
  faqs: { question: string; answer: string }[];
}

function YamlEditorInner({ faqs }: YamlEditorClientProps) {
  const searchParams = useSearchParams();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [content, setContent] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_YAML;
    const fromUrl = getContentFromUrl(searchParams);
    if (fromUrl) return fromUrl;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // localStorage may be blocked
    }
    return DEFAULT_YAML;
  });

  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
        setSavedAt(Date.now());
      } catch {
        // quota exceeded
      }
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content]);

  const validation = useMemo(() => validateYaml(content), [content]);

  const highlightedYaml = useMemo(() => {
    try {
      return hljs.highlight(content, { language: "yaml" }).value;
    } catch {
      return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }, [content]);

  const inputCharCount = content.length;
  const lineCount = content.split("\n").length;

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Editor</h2>
        <span className="text-xs text-muted-foreground">
          {lineCount} lines, {inputCharCount.toLocaleString()} chars
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          "flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm",
          "focus:outline-none",
        )}
        placeholder="Type or paste YAML here..."
        spellCheck={false}
      />
    </div>
  );

  const previewPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Preview</h2>
        <div className="flex items-center gap-1.5">
          <CopyButton content={content} label="Copy" />
          <DownloadButton
            content={content}
            filename="document.yaml"
            mimeType="application/yaml"
            label="Download"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm">
          <code
            className="hljs"
            dangerouslySetInnerHTML={{ __html: highlightedYaml }}
          />
        </pre>
      </div>
    </div>
  );

  return (
    <YamlToolLayout
      title="YAML Editor"
      description="Edit YAML in your browser with live validation, syntax highlighting, and autosave to localStorage."
      currentPath="/yaml-editor"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 27, 2026
      </p>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          What is the YAML editor?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A free browser-based YAML editor with live YAML 1.2 validation, syntax
          highlighting, and localStorage autosave. Edit any YAML file -
          Kubernetes manifest, GitHub Actions workflow, Docker Compose, OpenAPI
          spec - and see errors with line and column numbers as you type.
        </p>
      </div>

      {/* Status bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm",
            validation.valid
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {validation.valid ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">Valid YAML</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span className="font-semibold">
                {validation.errors[0]?.line
                  ? `Error - Line ${validation.errors[0].line}, Col ${validation.errors[0].col}`
                  : "Error"}
              </span>
              <span className="text-xs font-normal opacity-90">
                {validation.errors[0]?.message}
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {savedAt ? "Autosaved" : "Autosave on"}
        </span>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UploadButton
            onContent={setContent}
            accept=".yml,.yaml,.txt"
            label="Upload YAML"
          />
        </div>
        <div className="flex items-center gap-2">
          <ShareButton content={content} basePath="/yaml-editor" />
        </div>
      </div>

      <div className="mb-4">
        <RelatedTools
          links={[
            {
              href: "/yaml-validator",
              label: "Open in validator",
              getContent: () => content,
            },
            {
              href: "/yaml-to-json",
              label: "Convert to JSON",
              getContent: () => content,
            },
            {
              href: "/yaml-formatter",
              label: "Format YAML",
              getContent: () => content,
            },
          ]}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x rounded-lg border bg-background overflow-hidden h-[calc(100vh-380px)] min-h-[500px] max-h-[800px]">
        {inputPane}
        {previewPane}
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="editor">
          <TabsList className="w-full">
            <TabsTrigger value="editor" className="flex-1">
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              Preview
            </TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-380px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>
          <TabsContent value="preview">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-380px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {previewPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>Why use a browser YAML editor?</h2>
        <p>
          A dedicated YAML editor is faster than a generic text editor when you
          are debugging a config file. Live validation tells you the moment a
          missing colon or stray indent breaks the parser, instead of waiting
          for a CI run or a deploy command to fail. Syntax highlighting makes
          it easier to scan for keys, values, and comments. Autosave guarantees
          you do not lose work if you close the tab.
        </p>

        <h2>What this editor offers</h2>
        <ul>
          <li>
            <strong>Live YAML 1.2 validation</strong> - line-and-column error
            messages update as you type, with no manual save.
          </li>
          <li>
            <strong>Syntax highlighting</strong> - separate colors for keys,
            scalars, comments, and structural punctuation via highlight.js.
          </li>
          <li>
            <strong>localStorage autosave</strong> - your draft is saved
            automatically every 500ms, locally on your device only.
          </li>
          <li>
            <strong>Upload, download, share</strong> - drop in a .yml or .yaml
            file, or generate a shareable URL with the content embedded.
          </li>
          <li>
            <strong>Privacy-first</strong> - the editor runs in your browser, so
            your YAML never leaves your device.
          </li>
        </ul>

        <h2>Editor vs validator vs formatter - which do I need?</h2>
        <p>
          The editor is for writing and editing. The validator is for a
          one-shot syntax check. The formatter is for normalizing whitespace
          and indentation across an existing file. Most workflows use all
          three: edit in the editor, run through the formatter for diff-clean
          output, and validate before committing.
        </p>

        <h2>FAQs</h2>
        <div className="not-prose space-y-4">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border p-4">
              <h3 className="text-base font-semibold mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </article>
    </YamlToolLayout>
  );
}

export function YamlEditorClient({ faqs }: YamlEditorClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="YAML Editor"
          description="Edit YAML in your browser with live validation."
          currentPath="/yaml-editor"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading editor...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <YamlEditorInner faqs={faqs} />
    </Suspense>
  );
}
