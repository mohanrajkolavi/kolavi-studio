"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yamlLang from "highlight.js/lib/languages/yaml";
import jsonLang from "highlight.js/lib/languages/json";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { yamlToJson } from "@/lib/yaml/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("yaml", yamlLang);
hljs.registerLanguage("json", jsonLang);

const STORAGE_KEY = "yaml-to-json-content";

const DEFAULT_YAML = `# Edit or paste your YAML below
service:
  name: api-gateway
  version: 1.4.2
  replicas: 3
  ports:
    - 80
    - 443
  features:
    auth: true
    rateLimit: 100
    logLevel: info
  description: |
    Production API gateway.
    Handles ingress for the public web tier.
`;

interface YamlToJsonClientProps {
  faqs: { question: string; answer: string }[];
}

function YamlToJsonInner({ faqs }: YamlToJsonClientProps) {
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

  const conversion = useMemo(() => yamlToJson(content, indent), [content, indent]);

  const highlightedJson = useMemo(() => {
    if (!conversion.success) return "";
    try {
      return hljs.highlight(conversion.output, { language: "json" }).value;
    } catch {
      return conversion.output;
    }
  }, [conversion]);

  const inputCharCount = content.length;
  const outputCharCount = conversion.output.length;

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">YAML</h2>
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
        placeholder="Paste or type YAML here..."
        spellCheck={false}
      />
    </div>
  );

  const outputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">JSON</h2>
        <div className="flex items-center gap-1.5">
          <span className="mr-2 text-xs text-muted-foreground">
            {outputCharCount.toLocaleString()} chars
          </span>
          {conversion.success ? (
            <>
              <CopyButton content={conversion.output} label="Copy" />
              <DownloadButton
                content={conversion.output}
                filename="output.json"
                mimeType="application/json"
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
              dangerouslySetInnerHTML={{ __html: highlightedJson }}
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
      title="YAML to JSON Converter"
      description="Convert YAML to JSON in your browser. Supports anchors, aliases, merge keys, and multiline strings."
      currentPath="/yaml-to-json"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 27, 2026
      </p>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          How does YAML to JSON conversion work?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste your YAML and the converter parses it against the YAML 1.2 spec,
          then emits the equivalent JSON. Anchors, aliases, and merge keys are
          resolved into the output. Comments are dropped because JSON has no
          comment syntax. All processing happens in your browser.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-2">
          <ShareButton content={content} basePath="/yaml-to-json" />
        </div>
      </div>

      <div className="mb-4">
        <RelatedTools
          links={[
            {
              href: "/json-to-yaml",
              label: "Reverse: JSON to YAML",
              getContent: () => conversion.output || content,
            },
            {
              href: "/yaml-validator",
              label: "Validate this YAML",
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
        {outputPane}
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="yaml">
          <TabsList className="w-full">
            <TabsTrigger value="yaml" className="flex-1">
              YAML
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              JSON
            </TabsTrigger>
          </TabsList>
          <TabsContent value="yaml">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>
          <TabsContent value="json">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {outputPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>Why convert YAML to JSON?</h2>
        <p>
          YAML and JSON describe the same data shapes - maps, lists, and scalars
          - but they target different audiences. YAML is friendlier to humans
          editing config files. JSON is the format every API, every JavaScript
          runtime, and every database driver speaks natively. Converting between
          the two is a routine task when you are debugging an OpenAPI spec,
          diffing a Kubernetes manifest, or pasting config into a tool that only
          accepts JSON.
        </p>

        <h2>What the converter handles</h2>
        <ul>
          <li>
            <strong>Anchors and aliases</strong> - <code>&amp;name</code> and{" "}
            <code>*name</code> references are expanded.
          </li>
          <li>
            <strong>Merge keys</strong> - <code>{"<<: *defaults"}</code> is
            resolved by merging the referenced map into the current map.
          </li>
          <li>
            <strong>Multiline strings</strong> - literal (<code>|</code>) and
            folded (<code>&gt;</code>) block scalars become regular JSON
            strings with the correct newline characters.
          </li>
          <li>
            <strong>Tagged values</strong> - explicit <code>!!str</code> and{" "}
            <code>!!int</code> tags are resolved to the underlying scalar type.
          </li>
          <li>
            <strong>Booleans and null</strong> - <code>yes</code>,{" "}
            <code>true</code>, <code>on</code> become <code>true</code>;{" "}
            <code>no</code>, <code>false</code>, <code>off</code> become{" "}
            <code>false</code>; <code>~</code> and <code>null</code> become{" "}
            <code>null</code>.
          </li>
        </ul>

        <h2>What does not survive the round-trip</h2>
        <p>
          JSON has no syntax for comments, no anchors, and no support for
          multiple documents in a single file. If your YAML uses these features,
          they are lost during conversion. To preserve documentation, move the
          comments into a dedicated description field before converting.
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

export function YamlToJsonClient({ faqs }: YamlToJsonClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="YAML to JSON Converter"
          description="Convert YAML to JSON in your browser."
          currentPath="/yaml-to-json"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading converter...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <YamlToJsonInner faqs={faqs} />
    </Suspense>
  );
}
