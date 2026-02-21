"use client";

import Link from "next/link";
import { Instagram, AtSign, Rss } from "lucide-react";
import { RefLink } from "@/components/partner/RefLink";
import { LEGAL_LINKS } from "@/lib/constants";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background relative z-10 overflow-hidden border-t border-border" role="contentinfo">
      {/* Subtle top glow from primary color */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-3xl h-20 bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-8">
          
          {/* Brand block */}
          <div className="lg:col-span-5 flex flex-col">
            <Link
              href="/"
              className="inline-block text-foreground transition-opacity hover:opacity-90 w-max"
            >
              <Logo className="text-2xl font-bold tracking-wide" withPeriod />
            </Link>
            <p className="mt-8 max-w-sm text-body leading-relaxed text-muted-foreground">
              The high-performance marketing agency exclusively for luxury medical spas. Next.js speed, AI SEO, and premium design engineering.
            </p>

            <nav className="mt-8 flex items-center gap-3" aria-label="Social and feeds">
              <a
                href="https://www.instagram.com/mohanrajkolavi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" aria-hidden />
              </a>
              <a
                href="https://www.threads.com/@mohanrajkolavi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Threads"
              >
                <AtSign className="h-5 w-5" aria-hidden />
              </a>
              <Link
                href="/blog/rss"
                className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Blog RSS feed"
              >
                <Rss className="h-5 w-5" aria-hidden />
              </Link>
            </nav>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex h-12 items-center rounded-full bg-muted/50 border border-border px-4 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-3 animate-pulse" aria-hidden />
                <span className="text-small font-medium text-foreground">Accepting new partners</span>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3 lg:col-span-7 lg:gap-12">
            <div>
              <h3 className="text-label text-foreground mb-8">
                Services
              </h3>
              <ul className="space-y-5">
                <li>
                  <Link
                    href="/services"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Services
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portfolio"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Portfolio
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-label text-foreground mb-8">
                Company
              </h3>
              <ul className="space-y-5">
                <li>
                  <Link
                    href="/about"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <RefLink
                    href="/partner"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Partner Program
                  </RefLink>
                </li>
                <li>
                  <RefLink
                    href="/contact"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Contact
                  </RefLink>
                </li>
              </ul>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <h3 className="text-label text-foreground mb-8">
                Tools
              </h3>
              <ul className="space-y-5">
                <li>
                  <Link
                    href="/tools"
                    className="text-body text-muted-foreground transition-colors hover:text-foreground"
                  >
                    All Tools
                  </Link>
                </li>
                <li>
                  <Link
                    href="/tools/speed-audit"
                    className="text-body text-primary transition-colors hover:text-primary/80 font-medium"
                  >
                    Free Speed Audit &rarr;
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-24 pt-8 border-t border-border flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-small text-muted-foreground">
            &copy; {currentYear} Kolavi Studio. All rights reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-small text-muted-foreground"
            aria-label="Legal"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
    </footer>
  );
}
