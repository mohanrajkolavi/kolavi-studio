"use client";

import { useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  onContent: (content: string) => void;
  accept?: string;
  label?: string;
}

export function UploadButton({
  onContent,
  accept = ".md,.markdown,.txt,.mdx",
  label = "Upload",
}: UploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") {
          onContent(text);
        }
      };
      reader.readAsText(file);

      // Reset so the same file can be re-uploaded
      e.target.value = "";
    },
    [onContent]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
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
        <span>{label}</span>
      </Button>
    </>
  );
}
