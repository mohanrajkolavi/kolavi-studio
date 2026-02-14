import Link from "next/link";
import { NAV_LINKS, LEGAL_LINKS } from "@/lib/constants";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/20" role="contentinfo">
      <div className="container mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        {/* Main footer content - clean, premium design */}
        <div className="grid grid-cols-1 gap-12 sm:gap-16 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-5">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-90 sm:text-3xl"
            >
              <Logo withPeriod />
            </Link>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
              Digital marketing agency specializing in medical spas, dental practices, and law firms.
            </p>
          </div>

          {/* Navigation links - 2 columns on larger screens */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-2 lg:gap-12">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                Site
              </h3>
              <ul className="mt-4 space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                More
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/portfolio"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/partner"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                  >
                    Partner Program
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar - legal links + copyright */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
          <nav
            className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:gap-x-4"
            aria-label="Legal"
          >
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted-foreground">
            © {currentYear} Kolavi Studio. All rights reserved.
          </p>
        </div>
      </div>
      {/* Safe area for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden />
    </footer>
  );
}
