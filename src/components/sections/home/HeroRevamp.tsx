import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroRevamp() {
  return (
    <section className="relative min-h-[100svh] md:min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-12 md:pt-[72px] md:pb-0">
      {/* Background gradients */}
      <div className="absolute inset-0 w-full h-full bg-hero-atmosphere pointer-events-none transform-gpu" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center animate-reveal-hero h-full my-auto">
        <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
          Revenue First AI Agency
        </div>

        <h1 className="text-[clamp(28px,8vw,40px)] leading-[1.1] font-bold tracking-[-0.03em] md:text-[64px] text-foreground max-w-[1000px] mx-auto text-balance mb-4 sm:mb-5">
          Your Med Spa Deserves an Agency That Builds Like It's 2026
        </h1>

        <p className="text-body text-muted-foreground max-w-[600px] mx-auto text-balance mb-8 sm:mb-10">
          Custom Next.js websites. AI-powered SEO. Automated patient acquisition. Built exclusively for medical spas that refuse to blend in.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto max-w-2xl mx-auto">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto text-[16px] px-8 h-12 sm:h-14 rounded-[48px] bg-primary/90 hover:bg-primary backdrop-blur-md shadow-premium border border-primary/20 transition-all duration-300"
          >
            <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-[16px] px-8 h-12 sm:h-14 rounded-[48px] bg-background/40 hover:bg-background/60 backdrop-blur-md border border-border/50 shadow-sm transition-all duration-300"
          >
            <Link href="/contact">Contact Us</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-[16px] px-8 h-12 sm:h-14 rounded-[48px] bg-background/40 hover:bg-background/60 backdrop-blur-md border border-border/50 shadow-sm transition-all duration-300"
          >
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
