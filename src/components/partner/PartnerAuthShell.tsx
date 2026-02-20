"use client";

import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

type PartnerAuthShellProps = {
  children: React.ReactNode;
  /** Max width of the centered card. Default is 480px for auth pages. */
  maxWidth?: "480px" | "560px" | "800px";
};

export function PartnerAuthShell({
  children,
  maxWidth = "480px",
}: PartnerAuthShellProps) {
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      {/* Premium Gradient Background (softer than landing page) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/5 dark:from-primary/5 dark:via-background dark:to-primary/10 pointer-events-none transform-gpu" />
      <div
        className="absolute top-0 left-0 -translate-y-1/4 -translate-x-1/4 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full blur-[80px] md:blur-[120px] opacity-10 bg-primary pointer-events-none transform-gpu"
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-0 translate-y-1/4 translate-x-1/4 w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[80px] md:blur-[120px] opacity-10 bg-primary pointer-events-none transform-gpu"
        aria-hidden
      />

      {/* Centered Card */}
      <div
        className="relative z-10 w-full rounded-[20px] sm:rounded-[24px] border border-border bg-background shadow-sm dark:bg-card px-6 py-8 sm:px-12 sm:py-12"
        style={{ maxWidth: maxWidth === "800px" ? "800px" : maxWidth === "560px" ? "560px" : "480px" }}
      >
        <div className="flex justify-center mb-8">
          <Link
            href="/"
            className="transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-lg"
          >
            <Logo className="text-xl font-bold tracking-wide text-foreground" withPeriod />
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
