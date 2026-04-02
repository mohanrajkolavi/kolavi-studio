"use client";

import { useState, useCallback } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getShareUrl } from "@/lib/markdown/shareUrl";

interface ShareButtonProps {
  content: string;
  basePath: string;
  className?: string;
}

export function ShareButton({ content, basePath, className }: ShareButtonProps) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getShareUrl(content, basePath);
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // silent fail
    }
  }, [content, basePath]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn("gap-1.5", className)}
      aria-label={shared ? "Link copied" : "Share"}
    >
      {shared ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-500">Link copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </>
      )}
    </Button>
  );
}
