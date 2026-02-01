"use client";

import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open && (
        <SheetContent side="right">
          <nav className="flex flex-col gap-4 mt-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => onOpenChange(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={() => onOpenChange(false)}
            >
              Get in Touch
            </Link>
          </nav>
        </SheetContent>
      )}
    </Sheet>
  );
}
