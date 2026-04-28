"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import jsonLang from "highlight.js/lib/languages/json";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { jsonToYaml } from "@/lib/yaml/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("yaml", yamlLang);
hljs.registerLanguage("json", jsonLang);

const STORAGE_KEY = "json-to-yaml-content";

const DEFAULT_JSON = `{
  "service": {
    "name": "api-gateway",
    "version": "1.4.2",
    "replicas": 3,
    "ports": [80, 443],
    "features": {
      "auth": true,
      "rateLimit": 100,
      "logLevel": "info"
    },
    "description": "Production API gateway."
  }
}`;

interface JsonToYamlClientProps {
  faqs: { question: string; answer: string }[];
}

function JsonToYamlInner({ faqs }: JsonToYamlClientProps) {
  const searchParams = useSearchParams();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [content, setContent] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_JSON;
    const fromUrl = getContentFromUrl(searchParams);
    if (fromUrl) return fromUrl;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      // localStorage may be blocked
    }
    return DEFAULT_JSON;
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

  const conversion = useMemo(
    () => jsonToYaml(content, { indent, sortMapEntries: sortKeys }),
    [content, indent, sortKeys],
  );

  const highlightedYaml = useMemo(() => {
    if (!conversion.success) return "";
    try {
      return hljs.highlight(conversion.output, { language: "yaml" }).value;
    } catch {
      return conversion.output;
    }
  }, [conversion]);

  const inputCharCount = content.length;
  const outputCharCount = conversion.output.length;

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">JSON</h2>
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
        placeholder="Paste or type JSON here..."
        spellCheck={false}
      />
    </div>
  );

  const outputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">YAML</h2>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-xs text-muted-foreground">
            {outputCharCount.toLocaleString()} chars
          </span>
          {conversion.success ? (
            <>
              <CopyButton content={conversion.output} label="Copy" />
              <DownloadButton
                content={conversion.output}
                filename="output.yaml"
                mimeType="application/yaml"
                label="Download"
              />
            </>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {conversion.success ? (
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
                Conversion error
              </p>
              {conversion.errors.map((err, i) => (
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
      title="JSON to YAML Converter"
      description="Convert JSON to YAML with custom indentation and key sorting. Safe in-browser conversion, no data leaves your device."
      currentPath="/json-to-yaml"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 28, 2026
      </p>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          What does this JSON to YAML converter do?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It parses your JSON and emits the equivalent YAML using indentation
          you choose. Pick 2 or 4 spaces, toggle key sorting for deterministic
          output, and copy or download the result. All processing runs in your
          browser, so no data is sent to a server.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <UploadButton
            onContent={setContent}
            accept=".json,.txt"
            label="Upload JSON"
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
          <ShareButton content={content} basePath="/json-to-yaml" />
        </div>
      </div>

      <div className="mb-4">
        <RelatedTools
          links={[
            {
              href: "/yaml-to-json",
              label: "Reverse: YAML to JSON",
              getContent: () => conversion.output || content,
            },
            {
              href: "/yaml-validator",
              label: "Validate output",
              getContent: () => conversion.output || content,
            },
            {
              href: "/yaml-formatter",
              label: "Format YAML",
              getContent: () => conversion.output || content,
            },
          ]}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x rounded-lg border bg-background overflow-hidden h-[calc(100vh-380px)] min-h-[500px] max-h-[800px]">
        {inputPane}
        {outputPane}
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="json">
          <TabsList className="w-full">
            <TabsTrigger value="json" className="flex-1">
              JSON
            </TabsTrigger>
            <TabsTrigger value="yaml" className="flex-1">
              YAML
            </TabsTrigger>
          </TabsList>
          <TabsContent value="json">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>
          <TabsContent value="yaml">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {outputPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>When to convert JSON to YAML</h2>
        <p>
          You convert JSON to YAML when you want a human to edit it. API
          responses, database dumps, and tool exports all default to JSON
          because every parser handles it. But config files - Kubernetes
          manifests, GitHub Actions, Docker Compose, Helm values, OpenAPI specs
          - usually live as YAML so engineers can scan and edit them quickly.
        </p>

        <h2>What the converter does</h2>
        <ul>
          <li>
            <strong>Indentation</strong> - choose 2 spaces (the YAML community
            default and what Kubernetes uses) or 4 spaces.
          </li>
          <li>
            <strong>Key sorting</strong> - alphabetize map keys at every level
            for diff-friendly output.
          </li>
          <li>
            <strong>Multiline strings</strong> - long strings with newlines are
            emitted as literal block scalars (<code>|</code>) for readability.
          </li>
          <li>
            <strong>Type fidelity</strong> - JSON booleans, numbers, and null
            map to native YAML scalars without quoting.
          </li>
        </ul>

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

export function JsonToYamlClient({ faqs }: JsonToYamlClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="JSON to YAML Converter"
          description="Convert JSON to YAML in your browser."
          currentPath="/json-to-yaml"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading converter...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <JsonToYamlInner faqs={faqs} />
    </Suspense>
  );
}
