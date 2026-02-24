"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const TRUSTED_BRANDS = [
  { name: "Groww", logo: "/logos/Groww_app_logo.png" },
  { name: "Paytm", logo: "/logos/Paytm_Logo_(standalone).svg.png" },
  { name: "Amazon", logo: "/logos/Amazon_logo.svg.png" },
  { name: "PayPal", logo: "/logos/PayPal.svg.png" },
  { name: "Citibank", logo: "/logos/Citi.svg.png" },
] as const;

export function HeroRevamp() {
  return (
    <section
      className="relative w-full min-h-[100dvh] flex flex-col overflow-hidden border-b border-border -mt-[72px] pt-[72px] pb-0"
      style={{
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
        minHeight: "calc(100dvh - env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="absolute inset-0 w-full h-full bg-hero-atmosphere pointer-events-none transform-gpu" />
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,hsl(var(--primary)/0.06),transparent_65%)] pointer-events-none" />

      {/* Main hero: one full viewport on small devices; shares viewport with sponsor on laptop+ */}
      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col items-center justify-center w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-12 md:py-16 lg:py-20 animate-reveal-hero text-center lg:min-h-0">
        {/* Badge — frosted, like navbar */}
        <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20 bg-background/70 text-[11px] sm:text-xs font-medium uppercase tracking-wider sm:tracking-widest text-muted-foreground shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 dark:border-white/10 dark:bg-zinc-950/50 dark:supports-[backdrop-filter]:bg-zinc-950/40 max-w-[min(100%,calc(100vw-2rem))]">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="truncate sm:whitespace-normal text-center leading-tight">Revenue-First Digital Agency</span>
        </div>

        {/* Headline — one line, wraps naturally */}
        <h1 className="mt-3.5 sm:mt-5 md:mt-6 leading-[1.15] sm:leading-[1.1] font-bold tracking-[-0.03em] text-foreground text-balance max-w-4xl mx-auto w-full text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-[4rem] 2xl:text-[4.5rem]">
          Your site takes 4 seconds to load. Every second costs you a client.
        </h1>

        {/* Subhead — mobile: 15px for fit + readability */}
        <p className="mt-3.5 sm:mt-5 text-[15px] sm:text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-[1.55] sm:leading-relaxed">
          We build systems that compound traffic, convert paid ads, and capture leads around the clock.
        </p>

        {/* CTAs — frosted, premium pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full sm:w-auto max-w-sm sm:max-w-none mx-auto">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 min-h-[44px] sm:h-12 md:h-14 rounded-full border border-white/20 bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 backdrop-blur-xl supports-[backdrop-filter]:bg-primary/80 hover:bg-primary/95 hover:supports-[backdrop-filter]:bg-primary/90 dark:border-white/10 font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
            title="We cap new clients monthly. Takes 5 minutes to apply."
          >
            <Link href="/tools/speed-audit">Get Your Free Revenue Audit</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 h-11 min-h-[44px] sm:h-12 md:h-14 rounded-full border border-white/20 bg-background/75 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 hover:bg-background/85 hover:supports-[backdrop-filter]:bg-background/75 dark:border-white/10 dark:bg-zinc-950/60 dark:hover:bg-zinc-950/70 dark:supports-[backdrop-filter]:bg-zinc-950/50 font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
          >
            <Link href="#how-we-work">See How It Works</Link>
          </Button>
        </div>
      </div>

      {/* Trusted by — logo strip */}
      <div
        className="relative z-10 w-full mt-auto border-t border-white/10 dark:border-white/5 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="max-w-4xl mx-auto px-6 sm:px-8 md:px-10 lg:px-12 py-6 sm:py-8 flex flex-col items-center justify-center gap-6 sm:gap-8">
          <p className="text-center text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wider sm:tracking-widest w-full">
            Trusted by leaders across finance, e-commerce, and payments
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10 md:gap-12 lg:gap-14 w-full">
            {TRUSTED_BRANDS.map(({ name, logo }) => (
              <div
                key={name}
                className="flex items-center justify-center transition-opacity duration-300 hover:opacity-90"
                title={name}
              >
                <Image
                  src={logo}
                  alt={name}
                  width={112}
                  height={32}
                  className="h-6 w-auto sm:h-7 md:h-8 object-contain object-center"
                />
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] sm:text-sm text-muted-foreground max-w-xl w-full mx-auto leading-relaxed">
            When brands at this level trust our platform, the work speaks for itself.
          </p>
        </div>
      </div>
    </section>
  );
}
