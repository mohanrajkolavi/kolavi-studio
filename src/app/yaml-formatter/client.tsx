"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { formatYaml } from "@/lib/yaml/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("yaml", yamlLang);

const STORAGE_KEY = "yaml-formatter-content";

const DEFAULT_YAML = `# Messy YAML - paste your own or use this sample
service:    api-gateway
   replicas:    3
ports:
-   80
-      443
features:
       auth:    true
   rateLimit: 100
   logLevel:    info
`;

interface YamlFormatterClientProps {
  faqs: { question: string; answer: string }[];
}

function YamlFormatterInner({ faqs }: YamlFormatterClientProps) {
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

  const [indent, setIndent] = useState<2 | 4>(2);
  const [sortKeys, setSortKeys] = useState(false);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, content);
      } catch {
        // quota exceeded
      }
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content]);

  const formatted = useMemo(
    () => formatYaml(content, { indent, sortMapEntries: sortKeys }),
    [content, indent, sortKeys],
  );

  const highlightedYaml = useMemo(() => {
    if (!formatted.success) return "";
    try {
      return hljs.highlight(formatted.output, { language: "yaml" }).value;
    } catch {
      return formatted.output;
    }
  }, [formatted]);

  const inputCharCount = content.length;
  const outputCharCount = formatted.output.length;

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Input</h2>
        <span className="text-xs text-muted-foreground">
          {inputCharCount.toLocaleString()} chars
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={cn(
          "flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm",
          "focus:outline-none",
        )}
        placeholder="Paste messy YAML here..."
        spellCheck={false}
      />
    </div>
  );

  const outputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Formatted YAML
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-xs text-muted-foreground">
            {outputCharCount.toLocaleString()} chars
          </span>
          {formatted.success ? (
            <>
              <CopyButton content={formatted.output} label="Copy" />
              <DownloadButton
                content={formatted.output}
                filename="formatted.yaml"
                mimeType="application/yaml"
                label="Download"
              />
            </>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {formatted.success ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-sm">
            <code
              className="hljs"
              dangerouslySetInnerHTML={{ __html: highlightedYaml }}
            />
          </pre>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                Cannot format - syntax error
              </p>
              {formatted.errors.map((err, i) => (
                <div key={i} className="mt-2 text-xs text-muted-foreground">
                  {err.line > 0 && (
                    <span className="font-mono font-semibold text-foreground">
                      Line {err.line}, Col {err.col}:
                    </span>
                  )}{" "}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <YamlToolLayout
      title="YAML Formatter & Beautifier"
      description="Format and beautify YAML files. Choose 2 or 4 space indentation, sort keys alphabetically, and produce consistent output."
      currentPath="/yaml-formatter"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 27, 2026
      </p>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          What does the YAML formatter do?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It parses your YAML, normalizes whitespace and indentation, optionally
          alphabetizes map keys, and emits clean output that follows the YAML
          1.2 spec. Trailing whitespace is removed and inconsistent indents are
          fixed automatically. All processing runs in your browser.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <UploadButton
            onContent={setContent}
            accept=".yml,.yaml,.txt"
            label="Upload YAML"
          />
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="indent" className="text-muted-foreground">
              Indent:
            </label>
            <select
              id="indent"
              value={indent}
              onChange={(e) => setIndent(Number(e.target.value) as 2 | 4)}
              className="rounded-md border bg-background px-2 py-1 text-sm"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch
              id="sort-keys"
              checked={sortKeys}
              onCheckedChange={setSortKeys}
              aria-label="Sort keys alphabetically"
            />
            <label htmlFor="sort-keys">Sort keys</label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ShareButton content={content} basePath="/yaml-formatter" />
        </div>
      </div>

      <div className="mb-4">
        <RelatedTools
          links={[
            {
              href: "/yaml-validator",
              label: "Validate this YAML",
              getContent: () => content,
            },
            {
              href: "/yaml-to-json",
              label: "Convert to JSON",
              getContent: () => content,
            },
            {
              href: "/yaml-editor",
              label: "Open in editor",
              getContent: () => formatted.output || content,
            },
          ]}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x rounded-lg border bg-background overflow-hidden h-[calc(100vh-380px)] min-h-[500px] max-h-[800px]">
        {inputPane}
        {outputPane}
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="input">
          <TabsList className="w-full">
            <TabsTrigger value="input" className="flex-1">
              Input
            </TabsTrigger>
            <TabsTrigger value="output" className="flex-1">
              Formatted
            </TabsTrigger>
          </TabsList>
          <TabsContent value="input">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>
          <TabsContent value="output">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {outputPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>Why format YAML?</h2>
        <p>
          YAML config files drift over time. One engineer prefers 4 space
          indents, another prefers 2. One sorts keys alphabetically, another
          groups them logically. Pull requests fill up with whitespace-only
          changes that drown out the real edits. Running every YAML file
          through a single formatter with consistent options eliminates this
          noise.
        </p>

        <h2>What the formatter changes</h2>
        <ul>
          <li>
            <strong>Indentation</strong> - normalized to your chosen width (2 or
            4 spaces) at every level.
          </li>
          <li>
            <strong>Trailing whitespace</strong> - removed from the end of every
            line.
          </li>
          <li>
            <strong>Key sorting</strong> - optionally alphabetized map keys at
            every nesting level for deterministic output.
          </li>
          <li>
            <strong>Quoting</strong> - quotes are added or removed based on
            whether the YAML 1.2 spec requires them for the value type.
          </li>
          <li>
            <strong>Anchor expansion</strong> - aliases (<code>*name</code>) are
            resolved to their referenced values, so the output is fully
            expanded.
          </li>
        </ul>

        <h2>What the formatter cannot preserve</h2>
        <p>
          The formatter operates on the parsed data tree, not the original
          source text. That means it cannot preserve comments, anchor
          declarations, or original document order. If those matter, use a
          formatter built into a code editor (such as Prettier with the YAML
          plugin) that walks the source tokens instead.
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

export function YamlFormatterClient({ faqs }: YamlFormatterClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="YAML Formatter & Beautifier"
          description="Format and beautify YAML in your browser."
          currentPath="/yaml-formatter"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading formatter...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <YamlFormatterInner faqs={faqs} />
    </Suspense>
  );
}
