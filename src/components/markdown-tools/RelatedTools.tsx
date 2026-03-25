"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { setTransferContent } from "@/lib/markdown/shareUrl";

export interface RelatedToolLink {
  href: string;
  label: string;
  getContent?: () => string;
}

interface RelatedToolsProps {
  links: RelatedToolLink[];
}

export function RelatedTools({ links }: RelatedToolsProps) {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, link: RelatedToolLink) => {
      if (!link.getContent) return; // let normal navigation happen
      e.preventDefault();
      const content = link.getContent();
      setTransferContent(content);
      router.push(link.href);
    },
    [router]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Continue with:</span>
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          onClick={(e) => handleClick(e, link)}
          className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
