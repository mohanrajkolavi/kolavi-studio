"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { MobileNav } from "./MobileNav";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-[2rem] border border-neutral-200/80 bg-white/80 px-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <span className="text-lg font-semibold tracking-tight text-neutral-900">Kolavi Studio</span>
        </Link>

        {/* Desktop Navigation (centered, SaaS-style nav links) */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-center md:gap-1">
          <nav className="flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl px-4 py-2 text-[15px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            Get in Touch
          </Link>
        </div>

        {/* Mobile: Get in Touch + Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900"
          >
            Get in Touch
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl p-2.5 text-neutral-600 transition-colors hover:bg-neutral-100"
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
