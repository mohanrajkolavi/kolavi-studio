"use client";

import Link from "next/link";
import { RefLink } from "@/components/partner/RefLink";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const EXIT_MS = 280;

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
}

export function MobileNav({ open, onOpenChange, isAdmin = false }: MobileNavProps) {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setIsExiting(false);
      setVisible(true);
    } else if (visible) {
      setIsExiting(true);
      const t = setTimeout(() => {
        setVisible(false);
        setIsExiting(false);
      }, EXIT_MS);
      return () => clearTimeout(t);
    }
  }, [open, visible]);

  // Lock body scroll when menu is open for premium UX
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (open || isExiting) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [open, isExiting]);

  if (typeof document === "undefined") return null;
  if (!visible) return null;

  const show = open && !isExiting;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
      data-state={show ? "open" : "closed"}
      className={cn(
        "fixed inset-0 z-[100] flex flex-col bg-background transition-[opacity,visibility] duration-300 ease-out",
        "pb-[env(safe-area-inset-bottom)]",
        "data-[state=open]:visible data-[state=open]:opacity-100",
        "data-[state=closed]:invisible data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none"
      )}
    >
      {/* Header: logo + close (matches main site) */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 pt-[env(safe-area-inset-top)] sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
          onClick={() => onOpenChange(false)}
        >
          <Logo withPeriod={false} />
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Centered nav links - premium spacing and typography */}
      <nav className="flex flex-1 flex-col items-center justify-center px-6 py-8" aria-label="Main">
        <ul className="flex w-full max-w-sm flex-col gap-1 text-center">
          {/* Navigation Links */}
          {isAdmin && (
            <li>
              <Link
                href="/dashboard"
                className="block min-h-[48px] py-3 text-[17px] font-semibold leading-tight text-foreground transition-colors hover:text-primary active:opacity-80"
                onClick={() => onOpenChange(false)}
              >
                Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/about"
              className="block min-h-[48px] py-3 text-[17px] font-semibold leading-tight text-foreground transition-colors hover:text-primary active:opacity-80"
              onClick={() => onOpenChange(false)}
            >
              About
            </Link>
          </li>
          <li>
            <RefLink
              href="/partner"
              className="block min-h-[48px] py-3 text-[17px] font-semibold leading-tight text-foreground transition-colors hover:text-primary active:opacity-80"
              onClick={() => onOpenChange(false)}
            >
              Partner Program
            </RefLink>
          </li>
          <li>
            <Link
              href="/blog"
              className="block min-h-[48px] py-3 text-[17px] font-semibold leading-tight text-foreground transition-colors hover:text-primary active:opacity-80"
              onClick={() => onOpenChange(false)}
            >
              Blog
            </Link>
          </li>
        </ul>

        {/* CTA or Logout - prominent, premium touch target */}
        <div className="mt-10 w-full max-w-sm">
          {isAdmin ? (
            <LogoutButton
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[48px] bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-premium transition-colors hover:bg-primary/90 active:opacity-90"
            />
          ) : (
            <RefLink
              href="/tools/speed-audit"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[48px] bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-premium transition-colors hover:bg-primary/90 active:opacity-90"
              onClick={() => onOpenChange(false)}
            >
              Free Speed Audit
            </RefLink>
          )}
        </div>
      </nav>
    </div>,
    document.body
  );
}
