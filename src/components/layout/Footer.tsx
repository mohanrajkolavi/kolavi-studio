"use client";

import Link from "next/link";
import { Instagram, AtSign, Rss } from "lucide-react";
import { RefLink } from "@/components/partner/RefLink";
import { LEGAL_LINKS } from "@/lib/constants";
import { Logo } from "./Logo";

const FOOTER_SECTIONS = [
  {
    title: "Why us",
    links: [
      { href: "/#services", label: "Services" },
      { href: "/#pricing", label: "Investment plans" },
      { href: "/portfolio", label: "Portfolio" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/partner", label: "Partner Program", ref: true },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/tools", label: "All Tools" },
      { href: "/tools/speed-audit", label: "Free Speed Audit →", primary: true },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="bg-background relative z-10 overflow-hidden border-t border-border"
      role="contentinfo"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-3xl h-20 bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8 lg:gap-x-12">
          {/* Brand */}
          <div className="lg:col-span-5 space-y-5">
            <Link
              href="/"
              className="inline-block text-foreground transition-opacity hover:opacity-90"
              aria-label="Kolavi Studio home"
            >
              <Logo className="text-2xl font-bold tracking-wide" withPeriod />
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
              The high-performance marketing agency for businesses that compete at the top. Next.js
              speed, AI SEO, and systems built to compound.
            </p>
            <div className="flex items-center gap-2" aria-label="Social and feeds">
              <a
                href="https://www.instagram.com/mohanrajkolavi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="https://www.threads.com/@mohanrajkolavi/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Threads"
              >
                <AtSign className="h-4 w-4" aria-hidden />
              </a>
              <Link
                href="/blog/rss"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Blog RSS feed"
              >
                <Rss className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3.5 py-1.5 text-xs font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 motion-safe:animate-pulse" aria-hidden />
              Accepting new clients.
            </span>
          </div>

          {/* Link sections */}
          <nav
            className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-10"
            aria-label="Footer navigation"
          >
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-2.5">
                  {section.links.map((item) => {
                    const Comp = item.ref ? RefLink : Link;
                    return (
                      <li key={item.href}>
                        <Comp
                          href={item.href}
                          className={
                            item.primary
                              ? "text-sm font-medium text-primary transition-colors hover:text-primary/80"
                              : "text-sm text-muted-foreground transition-colors hover:text-foreground"
                          }
                        >
                          {item.label}
                        </Comp>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kolavi Studio. All rights reserved.
          </p>
          <nav
            className="flex flex-wrap items-center justify-center sm:justify-end gap-x-6 gap-y-1 text-xs text-muted-foreground"
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
