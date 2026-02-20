"use client";

import Link from "next/link";
import { RefLink } from "@/components/partner/RefLink";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Logo } from "./Logo";

type HeaderProps = {
  isAdmin?: boolean;
};

export function Header({ isAdmin = false }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-transparent pt-4 px-4 safe-top sm:px-6 pointer-events-none">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto] pointer-events-auto"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-white/20 bg-white/70 backdrop-blur-[20px] px-5 sm:px-6 relative pointer-events-auto shadow-sm dark:border-white/10 dark:bg-zinc-950/60 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-950/60">
        
        {/* Left Side Navigation (Desktop) */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-start md:gap-1">
          <nav className="flex items-center gap-0.5" aria-label="Main">
            {isAdmin && (
              <Link
                href="/dashboard"
                className="rounded-[48px] px-3 py-1.5 text-nav text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Dashboard
              </Link>
            )}
            <Link href="/about" className="rounded-[48px] px-3 py-1.5 text-nav text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              About
            </Link>
            <RefLink href="/partner" className="rounded-[48px] px-3 py-1.5 text-nav text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Partner Program
            </RefLink>
            <Link href="/blog" className="rounded-[48px] px-3 py-1.5 text-nav text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Blog
            </Link>
          </nav>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-start md:justify-center md:flex-1">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg"
          >
            <Logo className="text-xl font-bold tracking-wide text-foreground sm:text-2xl" withPeriod />
          </Link>
        </div>

        {/* Right Side: Theme toggle + CTA or Logout (Desktop) */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:gap-2">
          <ThemeToggle />
          {isAdmin ? (
            <LogoutButton className="inline-flex h-9 items-center justify-center rounded-[48px] bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          ) : (
            <RefLink
              href="/tools/speed-audit"
              className="inline-flex h-9 items-center justify-center rounded-[48px] bg-primary px-4 text-button text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-premium"
            >
              Free SEO Audit
            </RefLink>
          )}
        </div>

        {/* Mobile View Toggle */}
        <div className="flex items-center justify-end gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} isAdmin={isAdmin} />
    </header>
  );
}
