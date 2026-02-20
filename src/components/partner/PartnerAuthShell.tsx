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
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 -mt-[72px] pt-[120px] md:pt-[100px]">
      {/* Full-bleed background that sits behind the fixed header */}
      <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none -z-10" />

      {/* Centered Card */}
      <div
        className="relative z-10 w-full rounded-[20px] sm:rounded-[24px] border border-border/50 bg-card/60 backdrop-blur-2xl shadow-premium px-6 py-8 sm:px-12 sm:py-12"
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
