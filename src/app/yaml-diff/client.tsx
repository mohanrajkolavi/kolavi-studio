"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { YamlToolLayout } from "@/components/yaml-tools/YamlToolLayout";
import { diffYaml, type StructuralChange } from "@/lib/yaml/diff";
import { decodeShareContent } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

const STORAGE_KEY_LEFT = "yaml-diff-left";
const STORAGE_KEY_RIGHT = "yaml-diff-right";

const DEFAULT_LEFT = `# Original
service: api
replicas: 3
image: app:1.0.0
ports:
  - 8080
features:
  auth: true
  rateLimit: 100
`;

const DEFAULT_RIGHT = `# Updated
service: api
replicas: 5
image: app:1.1.0
ports:
  - 8080
  - 9090
features:
  auth: true
  rateLimit: 200
  caching: true
`;

interface YamlDiffClientProps {
  faqs: { question: string; answer: string }[];
}

function formatValue(v: unknown): string {
  if (v === undefined) return "(undefined)";
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "(unserializable)";
  }
}

function YamlDiffInner({ faqs }: YamlDiffClientProps) {
  const searchParams = useSearchParams();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [left, setLeft] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_LEFT;
    const fromUrl = searchParams.get("l");
    if (fromUrl) {
      const decoded = decodeShareContent(fromUrl);
      if (decoded) return decoded;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEFT);
      if (stored) return stored;
    } catch {
      // localStorage may be blocked
    }
    return DEFAULT_LEFT;
  });

  const [right, setRight] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_RIGHT;
    const fromUrl = searchParams.get("r");
    if (fromUrl) {
      const decoded = decodeShareContent(fromUrl);
      if (decoded) return decoded;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RIGHT);
      if (stored) return stored;
    } catch {
      // localStorage may be blocked
    }
    return DEFAULT_RIGHT;
  });

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY_LEFT, left);
        localStorage.setItem(STORAGE_KEY_RIGHT, right);
      } catch {
        // quota exceeded
      }
    }, 500);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [left, right]);

  const result = useMemo(() => {
    try {
      return diffYaml(left, right);
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Unknown error",
      } as const;
    }
  }, [left, right]);

  const errored = "error" in result;

  const summary = useMemo(() => {
    if (errored) return null;
    const adds = result.lines.filter((l) => l.type === "added").length;
    const removes = result.lines.filter((l) => l.type === "removed").length;
    const structuralCount = result.structural?.length ?? 0;
    return { adds, removes, structuralCount };
  }, [result, errored]);

  const structuredText = useMemo(() => {
    if (errored || !result.structural) return "";
    return result.structural
      .map((c: StructuralChange) => {
        const path = c.path || "(root)";
        if (c.type === "added") {
          return `+ ${path}: ${formatValue(c.rightValue)}`;
        }
        if (c.type === "removed") {
          return `- ${path}: ${formatValue(c.leftValue)}`;
        }
        return `~ ${path}: ${formatValue(c.leftValue)} -> ${formatValue(
          c.rightValue,
        )}`;
      })
      .join("\n");
  }, [result, errored]);

  const leftPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Original (left)
        </h2>
        <div className="flex items-center gap-1.5">
          <UploadButton
            onContent={setLeft}
            accept=".yml,.yaml,.txt"
            label="Upload"
          />
          <ShareButton content={left} basePath="/yaml-diff" />
        </div>
      </div>
      <textarea
        value={left}
        onChange={(e) => setLeft(e.target.value)}
        className={cn(
          "flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm",
          "focus:outline-none",
        )}
        placeholder="Paste original YAML here..."
        spellCheck={false}
      />
    </div>
  );

  const rightPane = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Updated (right)
        </h2>
        <div className="flex items-center gap-1.5">
          <UploadButton
            onContent={setRight}
            accept=".yml,.yaml,.txt"
            label="Upload"
          />
          <ShareButton content={right} basePath="/yaml-diff" />
        </div>
      </div>
      <textarea
        value={right}
        onChange={(e) => setRight(e.target.value)}
        className={cn(
          "flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm",
          "focus:outline-none",
        )}
        placeholder="Paste updated YAML here..."
        spellCheck={false}
      />
    </div>
  );

  return (
    <YamlToolLayout
      title="YAML Diff"
      description="Compare two YAML files side by side. See added, removed, and changed keys at line and structure level."
      currentPath="/yaml-diff"
    >
      <p className="mb-3 text-xs text-muted-foreground">
        Last updated: April 28, 2026
      </p>

      <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-2 text-base font-semibold">
          What does the YAML diff tool do?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Paste two YAML files into the panes below to see exactly what
          changed. The Line view highlights added, removed, and unchanged
          lines (like <code>git diff</code>). The Structural view parses
          both sides and reports semantic changes by dotted key path -
          ignoring key reorder, comment changes, and indentation tweaks.
          All processing runs in your browser; nothing is uploaded.
        </p>
      </div>

      {!errored && summary && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          {result.semanticallyEqual ? (
            <div className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-3 py-1 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Semantically equal</span>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-green-500/10 px-3 py-1 text-green-700 dark:text-green-400">
                <span className="font-mono font-semibold">+{summary.adds}</span>
                <span>added</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-3 py-1 text-red-700 dark:text-red-400">
                <span className="font-mono font-semibold">
                  -{summary.removes}
                </span>
                <span>removed</span>
              </span>
              {result.structural && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 px-3 py-1 text-blue-700 dark:text-blue-400">
                  <span className="font-mono font-semibold">
                    {summary.structuralCount}
                  </span>
                  <span>structural change{summary.structuralCount === 1 ? "" : "s"}</span>
                </span>
              )}
            </>
          )}
          {!result.leftValid.valid && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Left side has syntax errors</span>
            </span>
          )}
          {!result.rightValid.valid && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-3 py-1 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Right side has syntax errors</span>
            </span>
          )}
        </div>
      )}

      <div className="hidden lg:grid lg:grid-cols-2 lg:divide-x rounded-lg border bg-background overflow-hidden h-[400px] mb-6">
        {leftPane}
        {rightPane}
      </div>

      <div className="lg:hidden mb-6">
        <Tabs defaultValue="left">
          <TabsList className="w-full">
            <TabsTrigger value="left" className="flex-1">
              Original
            </TabsTrigger>
            <TabsTrigger value="right" className="flex-1">
              Updated
            </TabsTrigger>
          </TabsList>
          <TabsContent value="left">
            <div className="flex flex-col rounded-lg border bg-background h-[350px] overflow-hidden">
              {leftPane}
            </div>
          </TabsContent>
          <TabsContent value="right">
            <div className="flex flex-col rounded-lg border bg-background h-[350px] overflow-hidden">
              {rightPane}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {errored ? (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Diff failed
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {result.error}
            </p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="line">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <TabsList>
              <TabsTrigger value="line">Line view</TabsTrigger>
              <TabsTrigger value="structural">Structural view</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="line">
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Line-level diff
                </h2>
              </div>
              <div className="overflow-auto max-h-[500px] p-0">
                {result.lines.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Files are identical.
                  </div>
                ) : (
                  <div className="font-mono text-xs">
                    {result.lines.map((line, i) => {
                      const lines = line.value
                        .split("\n")
                        .filter((_, idx, arr) =>
                          idx === arr.length - 1 ? line.value.endsWith("\n") === false : true,
                        );
                      const linesToRender =
                        line.value.endsWith("\n") && lines.length > 0
                          ? lines.slice(0, -1)
                          : lines;
                      return linesToRender.map((text, j) => (
                        <div
                          key={`${i}-${j}`}
                          className={cn(
                            "flex border-l-2 px-3 py-0.5 whitespace-pre",
                            line.type === "added" &&
                              "bg-green-500/10 border-green-500 text-green-900 dark:text-green-300",
                            line.type === "removed" &&
                              "bg-red-500/10 border-red-500 text-red-900 dark:text-red-300",
                            line.type === "unchanged" &&
                              "border-transparent text-muted-foreground",
                          )}
                        >
                          <span className="mr-2 inline-block w-3 select-none opacity-60">
                            {line.type === "added"
                              ? "+"
                              : line.type === "removed"
                                ? "-"
                                : " "}
                          </span>
                          <span>{text || "\u00A0"}</span>
                        </div>
                      ));
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="structural">
            <div className="rounded-lg border bg-background overflow-hidden">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Structural diff
                </h2>
                {result.structural && structuredText && (
                  <CopyButton content={structuredText} label="Copy" />
                )}
              </div>
              <div className="overflow-auto max-h-[500px] p-4">
                {!result.leftValid.valid || !result.rightValid.valid ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Structural diff is unavailable until both files parse
                      successfully.
                    </p>
                    {!result.leftValid.valid &&
                      result.leftValid.errors.map((err, i) => (
                        <div
                          key={`l-${i}`}
                          className="text-xs text-amber-700 dark:text-amber-400"
                        >
                          <span className="font-mono font-semibold">
                            Left line {err.line}, col {err.col}:
                          </span>{" "}
                          {err.message}
                        </div>
                      ))}
                    {!result.rightValid.valid &&
                      result.rightValid.errors.map((err, i) => (
                        <div
                          key={`r-${i}`}
                          className="text-xs text-amber-700 dark:text-amber-400"
                        >
                          <span className="font-mono font-semibold">
                            Right line {err.line}, col {err.col}:
                          </span>{" "}
                          {err.message}
                        </div>
                      ))}
                  </div>
                ) : result.semanticallyEqual ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">
                      Files are semantically equal - no structural changes.
                    </span>
                  </div>
                ) : result.structural && result.structural.length > 0 ? (
                  <ul className="space-y-1.5 font-mono text-xs">
                    {result.structural.map((c, i) => (
                      <li
                        key={i}
                        className={cn(
                          "flex items-start gap-2 px-2 py-1 rounded",
                          c.type === "added" &&
                            "bg-green-500/10 text-green-900 dark:text-green-300",
                          c.type === "removed" &&
                            "bg-red-500/10 text-red-900 dark:text-red-300",
                          c.type === "changed" &&
                            "bg-blue-500/10 text-blue-900 dark:text-blue-300",
                        )}
                      >
                        <span className="font-bold">
                          {c.type === "added"
                            ? "+"
                            : c.type === "removed"
                              ? "-"
                              : "~"}
                        </span>
                        <span className="font-semibold">{c.path || "(root)"}</span>
                        <span>:</span>
                        {c.type === "added" && (
                          <span className="break-all">
                            {formatValue(c.rightValue)}
                          </span>
                        )}
                        {c.type === "removed" && (
                          <span className="break-all">
                            {formatValue(c.leftValue)}
                          </span>
                        )}
                        {c.type === "changed" && (
                          <>
                            <span className="break-all line-through opacity-70">
                              {formatValue(c.leftValue)}
                            </span>
                            <span>-&gt;</span>
                            <span className="break-all">
                              {formatValue(c.rightValue)}
                            </span>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <article className="prose dark:prose-invert max-w-none mt-12">
        <h2>Line diff vs structural diff</h2>
        <p>
          A YAML file is two things at once: a stream of text and a parsed
          tree. Two diffs answer two different questions.
        </p>
        <ul>
          <li>
            <strong>Line diff</strong> answers <em>what did the bytes
            change?</em> It is what code review tools and Git show. It picks
            up trailing whitespace, comment edits, indentation tweaks, and
            key reordering - including changes that have no effect on the
            parsed value.
          </li>
          <li>
            <strong>Structural diff</strong> answers <em>what did the
            data change?</em> It parses both sides into a tree, walks them
            together, and reports added, removed, and changed values by
            dotted path. Two YAML files that produce the same tree are
            reported as semantically equal.
          </li>
        </ul>
        <p>
          For pull-request review and audit trails, line diff is what you
          want - it preserves the human-authored structure. For deciding
          whether a change is safe to apply, structural diff is what you
          want - it filters out noise and shows only the consequential
          edits.
        </p>

        <h2>Common YAML diff use cases</h2>
        <ul>
          <li>
            <strong>Kubernetes drift detection</strong> - compare a live
            manifest dumped with{" "}
            <code>kubectl get -o yaml</code> against the version in Git
            to spot out-of-band edits.
          </li>
          <li>
            <strong>Helm chart upgrades</strong> - diff a rendered chart
            between two versions before running{" "}
            <code>helm upgrade</code> in production.
          </li>
          <li>
            <strong>Docker Compose review</strong> - structural diff makes
            anchor-heavy compose files reviewable; line diff alone is
            often unreadable.
          </li>
          <li>
            <strong>Config rollouts</strong> - confirm that a refactor (key
            sort, comment cleanup, anchor extraction) is semantically a
            no-op before merging.
          </li>
          <li>
            <strong>CI artifacts</strong> - validate that a generated config
            matches a checked-in baseline.
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

export function YamlDiffClient({ faqs }: YamlDiffClientProps) {
  return (
    <Suspense
      fallback={
        <YamlToolLayout
          title="YAML Diff"
          description="Compare two YAML files in your browser."
          currentPath="/yaml-diff"
        >
          <div className="flex min-h-[500px] items-center justify-center">
            <p className="text-muted-foreground">Loading diff tool...</p>
          </div>
        </YamlToolLayout>
      }
    >
      <YamlDiffInner faqs={faqs} />
    </Suspense>
  );
}
