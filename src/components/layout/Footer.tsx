import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background" role="contentinfo">
      <div className="container mx-auto px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* Mobile: compact stacked layout */}
        <div className="grid grid-cols-1 gap-10 sm:gap-8 md:grid-cols-3 md:gap-8">
          {/* Brand - full width on mobile */}
          <div className="md:col-span-1">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Kolavi Studio
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:mt-4">
              Digital marketing agency specializing in medical spas, dental practices, and law firms.
            </p>
          </div>

          {/* Mobile: 2-column grid for Navigation + Resources */}
          <div className="grid grid-cols-2 gap-8 sm:gap-0 md:contents">
            {/* Navigation */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Navigation
              </h3>
              <ul className="mt-3 space-y-0 sm:mt-4 sm:space-y-1">
                {NAV_LINKS.slice(0, 4).map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="-mx-2 block rounded-lg py-2.5 pl-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:py-2 sm:pl-0"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Resources
              </h3>
              <ul className="mt-3 space-y-0 sm:mt-4 sm:space-y-1">
                <li>
                  <Link
                    href="/blog"
                    className="-mx-2 block rounded-lg py-2.5 pl-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:py-2 sm:pl-0"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/portfolio"
                    className="-mx-2 block rounded-lg py-2.5 pl-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:py-2 sm:pl-0"
                  >
                    Portfolio
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="-mx-2 block rounded-lg py-2.5 pl-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:py-2 sm:pl-0"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar - copyright */}
        <div className="mt-10 border-t pt-8 sm:mt-12">
          <p className="text-center text-sm text-muted-foreground">
            © {currentYear} Kolavi Studio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
