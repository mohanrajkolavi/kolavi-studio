"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import hljs from "highlight.js/lib/core";
import yaml from "highlight.js/lib/languages/yaml";
import json from "highlight.js/lib/languages/json";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { validateYaml, parseYaml } from "@/lib/yaml/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("json", json);

const STORAGE_KEY = "yaml-validator-content";

const DEFAULT_YAML = `# Sample Kubernetes deployment - edit or paste your own YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx:1.27
          ports:
            - containerPort: 80
`;

interface YamlValidatorClientProps {
  faqs: { question: string; answer: string }[];
}

function YamlValidatorInner({ faqs }: YamlValidatorClientProps) {
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

  const validation = useMemo(() => validateYaml(content), [content]);

  const previewJson = useMemo(() => {
    if (!validation.valid) return "";
    try {
      return JSON.stringify(parseYaml(content), null, 2);
    } catch {
      return "";
    }
  }, [content, validation.valid]);

  const highlightedJson = useMemo(() => {
    if (!previewJson) return "";
    try {
      return hljs.highlight(previewJson, { language: "json" }).value;
    } catch {
      return previewJson;
    }
  }, [previewJson]);

  const inputCharCount = content.length;
  const lineCount = content.split("\n").length;

  const inputPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">YAML Input</h2>
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
        placeholder="Paste or type YAML here..."
        spellCheck={false}
      />
    </div>
  );

  const resultPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Result</h2>
        {validation.valid && previewJson ? (
          <CopyButton content={previewJson} label="Copy JSON" />
        ) : null}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {validation.valid ? (
          <>
            <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  Valid YAML
                </p>
                <p className="text-xs text-muted-foreground">
                  Parsed successfully against the YAML 1.2 specification.
                </p>
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Parsed JSON preview
              </p>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                <code
                  className="hljs"
                  dangerouslySetInnerHTML={{ __html: highlightedJson }}
                />
              </pre>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">
                Invalid YAML
              </p>
              {validation.errors.map((err, i) => (
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
      title="YAML Validator"
      description="Validate YAML syntax instantly. Spot errors with line and column numbers and confirm files are well-formed before deployment."
      currentPath="/yaml-validator"
    >
      {/* Last updated label */}
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 27, 2026
      </p>

      {/* Answer-first callout */}
      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          What does this YAML validator do?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It parses your YAML against the YAML 1.2 specification and either
          confirms the file is valid or shows the line and column of the first
          syntax error. Everything runs in your browser, so your YAML never
          leaves your device. The validator handles anchors, aliases, merge keys,
          block scalars, and tagged values.
        </p>
      </div>

      {/* Action bar */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UploadButton
            onContent={setContent}
            accept=".yml,.yaml,.txt"
            label="Upload YAML"
          />
        </div>
        <RelatedTools
          links={[
            {
              href: "/yaml-to-json",
              label: "Convert to JSON",
              getContent: () => content,
            },
            {
              href: "/yaml-formatter",
              label: "Format & beautify",
              getContent: () => content,
            },
            {
              href: "/yaml-editor",
              label: "Open in editor",
              getContent: () => content,
            },
          ]}
        />
      </div>

      {/* Desktop: 2-column layout */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x rounded-lg border bg-background overflow-hidden h-[calc(100vh-380px)] min-h-[500px] max-h-[800px]">
        {inputPane}
        {resultPane}
      </div>

      {/* Mobile / tablet: tabs */}
      <div className="lg:hidden">
        <Tabs defaultValue="yaml">
          <TabsList className="w-full">
            <TabsTrigger value="yaml" className="flex-1">
              YAML
            </TabsTrigger>
            <TabsTrigger value="result" className="flex-1">
              Result
            </TabsTrigger>
          </TabsList>
          <TabsContent value="yaml">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {inputPane}
            </div>
          </TabsContent>
          <TabsContent value="result">
            <div className="flex flex-col rounded-lg border bg-background h-[calc(100vh-360px)] min-h-[350px] max-h-[600px] overflow-hidden">
              {resultPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* SEO body */}
      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>Why use a dedicated YAML validator?</h2>
        <p>
          YAML is whitespace-sensitive, which means a single misplaced space can
          break a Kubernetes deployment, a GitHub Actions workflow, or a Docker
          Compose file. Most editors highlight tokens but stop short of catching
          structural errors. This validator parses your file the same way the
          official YAML 1.2 spec does, so the result matches what your CI runner,
          deployment tool, or application library will see.
        </p>

        <h2>Common YAML errors this tool catches</h2>
        <ul>
          <li>
            <strong>Inconsistent indentation</strong> - mixing tabs and spaces or
            unexpected indent jumps inside a list or map.
          </li>
          <li>
            <strong>Missing colons</strong> - forgetting the colon after a key,
            or putting the colon at the wrong position relative to the value.
          </li>
          <li>
            <strong>Unquoted special characters</strong> - colons, hashes, and
            angle brackets that need quoting when they appear in values.
          </li>
          <li>
            <strong>Duplicate keys</strong> - the same key appearing twice at the
            same level, which silently breaks downstream tools.
          </li>
          <li>
            <strong>Broken anchors and aliases</strong> - referencing an alias
            (<code>*name</code>) before its anchor (<code>&amp;name</code>), or
            using a name that was never declared.
          </li>
          <li>
            <strong>Unclosed flow sequences</strong> - a stray <code>{`{`}</code>{" "}
            or <code>[</code> without its closing pair.
          </li>
        </ul>

        <h2>How to read the validator output</h2>
        <p>
          When YAML is valid, the right pane shows a parsed JSON preview so you
          can verify the structure matches your intent. When it is invalid, the
          validator surfaces a single line-and-column pointer with a description
          of what the parser expected at that position. Fix that error, and the
          validator immediately re-checks the rest of the file.
        </p>

        <h2>Validating Kubernetes, GitHub Actions, and Docker Compose YAML</h2>
        <p>
          This tool covers the syntactic layer for any YAML file, including
          Kubernetes manifests, GitHub Actions workflows, Docker Compose files,
          Ansible playbooks, OpenAPI specs, and CircleCI configs. It does not
          enforce schema rules specific to those tools - <code>kubectl apply
          --dry-run=client</code>, <code>docker compose config</code>, and the
          GitHub Actions UI handle that layer. Use this validator first to
          confirm the file parses, then run the tool-specific checker.
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

export function YamlValidatorClient({ faqs }: YamlValidatorClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="YAML Validator"
          description="Validate YAML syntax instantly."
          currentPath="/yaml-validator"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading validator...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <YamlValidatorInner faqs={faqs} />
    </Suspense>
  );
}
