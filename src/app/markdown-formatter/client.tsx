"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ClipboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/markdown-tools/CopyButton";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { DownloadButton } from "@/components/markdown-tools/DownloadButton";
import { ToolLayout } from "@/components/markdown-tools/ToolLayout";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { formatMarkdown, diffLines, type DiffLine } from "@/lib/markdown/formatter";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "md-formatter-input";

function DiffView({ diff }: { diff: DiffLine[] }) {
  return (
    <div className="h-[400px] overflow-auto rounded-md border bg-background font-mono text-sm">
      {diff.map((line, i) => (
        <div
          key={i}
          className={cn(
            "flex",
            line.type === "added" &&
              "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200",
            line.type === "removed" &&
              "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          )}
        >
          <span className="w-12 shrink-0 select-none border-r px-2 py-0.5 text-right text-muted-foreground">
            {line.lineNumber}
          </span>
          <span className="whitespace-pre-wrap px-3 py-0.5">
            {line.content}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MarkdownFormatterClient() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [formatOnPaste, setFormatOnPaste] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [diff, setDiff] = useState<DiffLine[]>([]);
  const initialized = useRef(false);

  // Initialize from URL param or localStorage
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const fromUrl = getContentFromUrl(searchParams);
    if (fromUrl) {
      setInput(fromUrl);
      const formatted = formatMarkdown(fromUrl);
      setOutput(formatted);
      setDiff(diffLines(fromUrl, formatted));
      return;
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setInput(saved);
      }
    } catch {
      // localStorage unavailable
    }
  }, [searchParams]);

  // Persist input to localStorage
  useEffect(() => {
    if (!initialized.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, input);
    } catch {
      // localStorage unavailable
    }
  }, [input]);

  const runFormat = useCallback((text: string) => {
    const formatted = formatMarkdown(text);
    setOutput(formatted);
    setDiff(diffLines(text, formatted));
  }, []);

  const handleFormat = useCallback(() => {
    runFormat(input);
  }, [input, runFormat]);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!formatOnPaste) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData("text/plain");
      const newInput = input + pasted;
      setInput(newInput);
      runFormat(newInput);
    },
    [formatOnPaste, input, runFormat]
  );

  return (
    <ToolLayout
      title="Markdown Formatter & Beautifier"
      description="Clean up messy markdown automatically. Fix spacing, headings, and lists."
      currentPath="/markdown-formatter"
    >
      {/* Top controls */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="format-on-paste"
            checked={formatOnPaste}
            onCheckedChange={setFormatOnPaste}
          />
          <label
            htmlFor="format-on-paste"
            className="text-sm font-medium leading-none"
          >
            Format on paste
          </label>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input pane */}
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Input</h2>
          <Textarea
            placeholder="Paste or type your markdown here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPaste={handlePaste}
            className="h-[400px] resize-none font-mono text-sm"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleFormat} disabled={!input.trim()}>
              Format
            </Button>
            <UploadButton onContent={setInput} />
            <ShareButton content={input} basePath="/markdown-formatter" />
          </div>
        </Card>

        {/* Output pane */}
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Output
            </h2>
            <div className="flex items-center gap-2">
              <Switch
                id="show-diff"
                checked={showDiff}
                onCheckedChange={setShowDiff}
                disabled={!output}
              />
              <label
                htmlFor="show-diff"
                className="text-sm font-medium leading-none"
              >
                Show changes
              </label>
            </div>
          </div>

          {showDiff && output ? (
            <DiffView diff={diff} />
          ) : (
            <Textarea
              readOnly
              value={output}
              placeholder="Formatted markdown will appear here..."
              className="h-[400px] resize-none font-mono text-sm"
            />
          )}

          <div className="flex items-center gap-2">
            <CopyButton content={output} label="Copy" />
            <DownloadButton
              content={output}
              filename="formatted.md"
              mimeType="text/markdown"
              label="Download"
            />
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <RelatedTools
          links={[
            { href: "/markdown-editor", label: "Open in Editor", getContent: () => output || input },
            { href: "/markdown-to-pdf", label: "Convert to PDF", getContent: () => output || input },
            { href: "/markdown-to-html", label: "Convert to HTML", getContent: () => output || input },
          ]}
        />
      </div>
    </ToolLayout>
  );
}
