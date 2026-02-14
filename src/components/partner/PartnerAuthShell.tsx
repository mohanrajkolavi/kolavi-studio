"use client";

import Link from "next/link";
import { ArrowLeft, Handshake } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

type PartnerAuthShellProps = {
  children: React.ReactNode;
  /** Title for the branding panel (e.g. "Partner Portal") */
  title?: string;
  /** Subtitle/description under the title */
  subtitle?: string;
};

export function PartnerAuthShell({
  children,
  title = "Partner Portal",
  subtitle = "Sign in to view your referrals, track commissions, and manage your partner link.",
}: PartnerAuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar - full-rounded pill style */}
      <header className="bg-background/95 px-4 pt-4 backdrop-blur-sm sm:px-6">
        <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-border bg-background/80 px-5 shadow-sm backdrop-blur-xl sm:px-6">
          <Link
            href="/partner"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partner Program
          </Link>
          <Link href="/" className="text-lg font-semibold tracking-tight">
            <Logo withPeriod />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 sm:px-6 lg:flex lg:min-h-[calc(100vh-3.5rem)] lg:items-center lg:gap-16 lg:py-16">
        {/* Left: Branding panel */}
        <div className="mx-auto max-w-md lg:mx-0 lg:max-w-lg lg:flex-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:text-orange-400">
            <Handshake className="h-10 w-10" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {title.includes(" ") ? (
              <>
                {title.split(" ")[0]}{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  {title.split(" ").slice(1).join(" ")}
                </span>
              </>
            ) : (
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                {title}
              </span>
            )}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          <div className="mt-10 hidden space-y-4 lg:block">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-400/20">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">15%</span>
              </div>
              <div>
                <p className="font-medium text-foreground">One-time fees</p>
                <p className="text-sm text-muted-foreground">Earn when referred leads pay for projects</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-400/20">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">10%</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Recurring revenue</p>
                <p className="text-sm text-muted-foreground">Ongoing commission on monthly payments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form area */}
        <div className="mt-12 lg:mt-0 lg:w-full lg:max-w-md">{children}</div>
      </div>
    </div>
  );
}
