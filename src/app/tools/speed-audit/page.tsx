import { getPageMetadata } from "@/lib/seo/metadata";
import { SpeedAuditForm } from "@/components/tools/SpeedAuditForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Activity, MapPin, Gauge, Search, Users } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Free Med Spa SEO & Speed Audit",
  description:
    "Get a free PageSpeed and SEO audit of your med spa website. See how you compare to competitors and get actionable recommendations.",
  path: "/tools/speed-audit",
  keywords: "med spa SEO audit, website speed audit, PageSpeed insights, med spa marketing",
});

export default function SpeedAuditPage() {
  return (
    <main className="relative w-full">
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10 dark:via-background dark:to-background pointer-events-none" />
        
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl text-center">
              {/* Main heading */}
              <h1 className="text-h1 text-foreground mb-8 text-balance">
                Find Out What&apos;s Costing You Patients Right Now
              </h1>

              {/* Subtitle */}
              <p className="text-[18px] sm:text-[20px] text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed text-balance">
                Enter your website and we&apos;ll generate an instant performance snapshot of your med spa&apos;s digital presence. PageSpeed, SEO health, local visibility gaps, and critical issues your current agency probably isn&apos;t telling you about.
              </p>
              
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-16">
                Takes 30 seconds. No credit card. No commitment. Just data.
              </p>

              {/* SECTION 2: THE FORM */}
              <div className="text-left mt-8 max-w-[1200px] mx-auto" id="audit-form">
                <SpeedAuditForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT YOUR AUDIT COVERS (Bento Grid) */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              WHAT YOU GET
            </div>
            <h2 className="text-h2 text-foreground max-w-2xl mx-auto">
              A Complete Digital Health Check for Your Med Spa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {/* Card 1 (Large, 2-col span) */}
            <div className="md:col-span-2 rounded-[24px] border border-border bg-card p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-h3 text-foreground mb-4">PageSpeed Analysis</h3>
              <p className="text-body text-muted-foreground">
                We test your site&apos;s load speed on both mobile and desktop using Google&apos;s own PageSpeed Insights. You&apos;ll see your exact score, what&apos;s slowing you down, and how it compares to the 95+ benchmark we build for our clients. Slow sites lose patients. Most med spa sites score below 60. We&apos;ll show you exactly where yours lands.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-6 group-hover:bg-muted/80 transition-colors">
                <Activity className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-[20px] font-bold text-foreground mb-3">SEO Health Score</h3>
              <p className="text-small text-muted-foreground">
                A top-level assessment of your on-page SEO: title tags, meta descriptions, header structure, image optimization, internal linking, and keyword targeting. We flag what&apos;s missing, what&apos;s broken, and what&apos;s costing you organic traffic right now.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-6 group-hover:bg-muted/80 transition-colors">
                <MapPin className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-[20px] font-bold text-foreground mb-3">Local SEO Visibility</h3>
              <p className="text-small text-muted-foreground">
                We check your Google Business Profile optimization, citation consistency across major directories, local pack positioning, and NAP (Name, Address, Phone) accuracy. For med spas, local search is everything. Most agencies ignore it. We audit it first.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-6 group-hover:bg-muted/80 transition-colors">
                <Gauge className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-[20px] font-bold text-foreground mb-3">Core Web Vitals</h3>
              <p className="text-small text-muted-foreground">
                Google&apos;s three core performance metrics: Largest Contentful Paint, First Input Delay, and Cumulative Layout Shift. These directly affect your search rankings. We test all three and tell you if you&apos;re passing or failing in Google&apos;s eyes.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-6 group-hover:bg-muted/80 transition-colors">
                <Search className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-[20px] font-bold text-foreground mb-3">Technical SEO Check</h3>
              <p className="text-small text-muted-foreground">
                Schema markup, sitemap health, robots.txt configuration, crawlability, index status, HTTPS security, and mobile responsiveness. The invisible infrastructure that determines whether Google can even find and rank your pages properly.
              </p>
            </div>

            {/* Card 6 (Full width, 3-col span) */}
            <div className="lg:col-span-3 rounded-[24px] border border-border bg-card p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group">
              <div className="flex flex-col md:flex-row md:items-center gap-8">
                <div className="w-16 h-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-h3 text-foreground mb-4">Competitor Snapshot</h3>
                  <p className="text-body text-muted-foreground">
                    We don&apos;t just audit your site in isolation. We compare your digital presence against the top-ranking med spas in your local market. You&apos;ll see where you&apos;re ahead, where you&apos;re behind, and where the biggest opportunities are hiding. This alone makes the audit worth requesting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: WHAT HAPPENS AFTER YOU SUBMIT */}
      <section className="relative z-10 bg-muted/30 py-24 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-background border border-border text-label text-muted-foreground">
              HOW IT WORKS
            </div>
            <h2 className="text-h2 text-foreground">
              From Submission to Strategy in 24 Hours
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative animate-reveal" style={{ animationDelay: "150ms" }}>
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-border via-primary/30 to-border" />
            
            {[
              { num: "01", title: "Instant Snapshot", desc: "The moment you submit, we run an automated performance scan on your website. Within seconds, you'll see a basic score preview covering PageSpeed, mobile optimization, and critical technical issues." },
              { num: "02", title: "Deep Audit (24 hours)", desc: "Within 24 hours, our team layers on a comprehensive manual review: SEO health, local visibility, competitor analysis, and specific recommendations tailored to your med spa's market and services. This is not a generic automated report. It's a real audit with real insights." },
              { num: "03", title: "Roadmap Delivery", desc: "You'll receive a complete audit report via email with a prioritized action plan. No sales call required. No strings attached. If you want to discuss the findings, we're available. If you want to implement the roadmap yourself, you're welcome to. The audit is yours either way." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-[16px] font-bold text-primary mb-6 shadow-sm">
                  {step.num}
                </div>
                <h3 className="text-[20px] font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-small text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: TRUST SIGNALS */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              WHY TRUST THIS AUDIT
            </div>
            <h2 className="text-h2 text-foreground">
              Built by the Same Team That Does the Work
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            <div className="p-8 rounded-[24px] border border-border bg-card shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-3">Powered by Real Data</h3>
              <p className="text-small text-muted-foreground">We use the same tools and methodology for this free audit that we use for our paying clients. Google PageSpeed Insights, Screaming Frog, Ahrefs, Google Search Console data points. Nothing generic. Nothing fabricated.</p>
            </div>
            <div className="p-8 rounded-[24px] border border-border bg-card shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-3">Built on Proven Experience</h3>
              <p className="text-small text-muted-foreground">Our founder built Business Mavericks to 31,000+ monthly organic visitors. The audit framework comes from years of identifying exactly what moves the needle for content-driven growth.</p>
            </div>
            <div className="p-8 rounded-[24px] border border-border bg-card shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-3">No Sales Pitch Attached</h3>
              <p className="text-small text-muted-foreground">This is not a Trojan horse for a pushy sales call. You get the audit. You get the roadmap. What you do with it is entirely your decision. We earn clients through the quality of our work, not through pressure tactics.</p>
            </div>
            <div className="p-8 rounded-[24px] border border-border bg-card shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-3">Med Spa Specific</h3>
              <p className="text-small text-muted-foreground">This isn&apos;t a generic website audit. We evaluate your site specifically through the lens of med spa patient acquisition: treatment page optimization, local search presence, booking flow efficiency, and competitive positioning in the aesthetics market.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: CTA Fallback */}
      <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-primary pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
          <h2 className="text-h2 text-foreground mb-6 text-balance">
            Your Competitors Already Know Their Numbers. Do You?
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            30 seconds. No commitment. Just a clear picture of where you stand and where the opportunities are.
          </p>
          <Button
            asChild
            size="lg"
            className="h-14 px-10 rounded-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-button shadow-premium"
          >
            <Link href="#audit-form">Get Your Free Audit</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
