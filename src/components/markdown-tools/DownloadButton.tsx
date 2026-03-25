"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DownloadButtonProps {
  content: string;
  filename: string;
  mimeType: string;
  className?: string;
  label?: string;
}

export function DownloadButton({
  content,
  filename,
  mimeType,
  className,
  label,
}: DownloadButtonProps) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [content, filename, mimeType]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className={cn("gap-1.5", className)}
      aria-label={`Download as ${filename}`}
    >
      <Download className="h-3.5 w-3.5" />
      {label && <span>{label}</span>}
    </Button>
  );
}
