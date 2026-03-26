"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadButton } from "@/components/markdown-tools/UploadButton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ToolLayout } from "@/components/markdown-tools/ToolLayout";
import { ShareButton } from "@/components/markdown-tools/ShareButton";
import { RelatedTools } from "@/components/markdown-tools/RelatedTools";
import { parseMarkdown } from "@/lib/markdown/parser";
import { getContentFromUrl } from "@/lib/markdown/shareUrl";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "md-pdf-content";

const DEFAULT_MARKDOWN = `# Hello World

This is a **Markdown to PDF** converter. Start typing your markdown here.

## Features

- Multiple themes
- Adjustable font size
- A4 and Letter page sizes
- One-click PDF download

> Try editing this content and click "Convert & Download PDF" to generate your PDF.

\`\`\`js
console.log("Hello from Markdown!");
\`\`\`
`;

type Theme = "default" | "github" | "resume";
type FontSize = "12px" | "14px" | "16px";
type PageSize = "a4" | "letter";

const themeClasses: Record<Theme, string> = {
  default:
    "font-sans prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-a:text-blue-600",
  github:
    "font-sans prose prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-headings:border-b prose-headings:pb-2 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-50 prose-pre:border",
  resume:
    "font-serif prose prose-sm max-w-none leading-tight prose-headings:font-bold prose-headings:mb-1 prose-p:my-1 prose-li:my-0.5 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base",
};

export function MarkdownToPdfClient() {
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [theme, setTheme] = useState<Theme>("default");
  const [fontSize, setFontSize] = useState<FontSize>("14px");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = getContentFromUrl(params);
    if (shared) {
      setMarkdown(shared);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMarkdown(saved);
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, markdown);
    } catch {
      // localStorage unavailable
    }
  }, [markdown]);

  const renderedHtml = parseMarkdown(markdown, { gfm: true, sanitize: true });

  const handleDownload = useCallback(async () => {
    if (!previewRef.current || generating) return;
    setGenerating(true);

    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const pageDimensions =
        pageSize === "a4"
          ? { width: 210, height: 297 }
          : { width: 215.9, height: 279.4 };

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: pageSize === "a4" ? "a4" : "letter",
      });

      const pdfWidth = pageDimensions.width;
      const pdfHeight = pageDimensions.height;
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = contentWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      const usableHeight = pdfHeight - margin * 2;
      let remainingHeight = scaledHeight;
      let sourceY = 0;
      let page = 0;

      while (remainingHeight > 0) {
        if (page > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(usableHeight, remainingHeight);
        const sourceSliceHeight = sliceHeight / ratio;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        sliceCanvas.height = sourceSliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            canvas,
            0,
            sourceY,
            imgWidth,
            sourceSliceHeight,
            0,
            0,
            imgWidth,
            sourceSliceHeight
          );
        }

        const sliceImgData = sliceCanvas.toDataURL("image/png");
        pdf.addImage(
          sliceImgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          sliceHeight
        );

        sourceY += sourceSliceHeight;
        remainingHeight -= sliceHeight;
        page++;
      }

      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.text("Generated at kolavistudio.com", pdfWidth / 2, pdfHeight - 5, {
        align: "center",
      });

      pdf.save("document.pdf");
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [generating, pageSize]);

  return (
    <ToolLayout
      title="Markdown to PDF Converter"
      description="Convert markdown to a beautifully formatted PDF. Choose from multiple themes."
      currentPath="/markdown-to-pdf"
    >
      {/* Controls bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label htmlFor="theme-select" className="text-sm font-medium text-muted-foreground">
            Theme
          </label>
          <Select
            value={theme}
            onValueChange={(v) => setTheme(v as Theme)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="resume">Resume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="fontsize-select" className="text-sm font-medium text-muted-foreground">
            Font size
          </label>
          <Select
            value={fontSize}
            onValueChange={(v) => setFontSize(v as FontSize)}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12px">12px</SelectItem>
              <SelectItem value="14px">14px</SelectItem>
              <SelectItem value="16px">16px</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1.5">
          <label htmlFor="pagesize-select" className="text-sm font-medium text-muted-foreground">
            Page size
          </label>
          <Select
            value={pageSize}
            onValueChange={(v) => setPageSize(v as PageSize)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <UploadButton onContent={setMarkdown} />
          <Button
            onClick={handleDownload}
            disabled={generating || !markdown.trim()}
          >
            <FileDown className="mr-2 h-4 w-4" />
            {generating ? "Generating..." : "Convert & Download PDF"}
          </Button>
          <ShareButton content={markdown} basePath="/markdown-to-pdf" />
        </div>
      </div>

      {/* Split pane: input and preview at equal height */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:h-[calc(100vh-340px)] lg:min-h-[400px] lg:max-h-[700px]">
        {/* Input Pane */}
        <div className="flex flex-col overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Markdown</h2>
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type or paste your markdown here..."
            className="flex-1 resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0"
          />
        </div>

        {/* Preview Pane */}
        <div className="flex flex-col overflow-hidden rounded-lg border bg-background">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Preview</h2>
          </div>
          <Card className="flex-1 overflow-auto rounded-none border-0 shadow-none">
            <div
              ref={previewRef}
              className={cn("p-8", themeClasses[theme])}
              style={{ fontSize }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
            <p className="mt-8 pb-4 text-center text-xs text-gray-400">
              Generated at kolavistudio.com
            </p>
          </Card>
        </div>
      </div>

      {/* Related tools */}
      <div className="mt-4">
        <RelatedTools
          links={[
            { href: "/markdown-editor", label: "Edit in Editor", getContent: () => markdown },
            { href: "/markdown-to-html", label: "Convert to HTML instead", getContent: () => markdown },
          ]}
        />
      </div>
    </ToolLayout>
  );
}
