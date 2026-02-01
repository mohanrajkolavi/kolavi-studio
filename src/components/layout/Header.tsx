"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 px-4 pt-4 backdrop-blur-xl sm:px-6 dark:bg-background/90">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:p-4 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:w-auto focus:h-auto focus:m-0 focus:overflow-visible focus:[clip:auto]"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-[2rem] border border-border bg-background/80 px-5 shadow-sm backdrop-blur-xl sm:px-6 dark:bg-background/80 dark:border-border">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-lg font-semibold tracking-tight text-foreground">Kolavi Studio</span>
        </Link>

        {/* Desktop Navigation (centered, SaaS-style nav links) */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:gap-1">
          <nav className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-2 text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop: Theme toggle + CTA */}
        <div className="hidden md:flex md:items-center md:gap-2">
          <ThemeToggle />
          <Link
            href="/contact"
            className="inline-flex items-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Get in Touch
          </Link>
        </div>

        {/* Mobile: Theme toggle + Menu Button (Get in Touch is inside menu) */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl p-2.5 text-muted-foreground transition-colors hover:bg-muted"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </header>
  );
}
