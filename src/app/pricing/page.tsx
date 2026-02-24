import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Pricing and Complete Scope | Kolavi Studio",
  description:
    "Transparent tiers. No hidden retainers. A complete breakdown of the Kolavi Studio growth engine: Marketing, Growth, and Full System.",
  path: "/pricing",
  image: `${SITE_URL}/og-image.jpg`,
  keywords: "Kolavi Studio pricing, growth agency pricing, SEO packages, marketing tiers",
});

// SECTION 01: TIERS
const tiers = [
  {
    name: "Marketing",
    price: "$2,499 setup fee + $999 / mo",
    bestFor: "Growing businesses ready to stop losing clients to competitors.",
    included: [
      "Custom Next.js website (up to 6 pages, 95+ PageSpeed guaranteed)",
      "Local SEO including Google Business Profile management and 50+ directory citations",
      "AI-powered SEO and Generative Engine Optimization (GEO)",
      "Social media marketing (1 platform)",
      "8 pages per month on-page optimization",
      "6 SEO blog posts per month",
      "Real-time performance dashboard",
      "Shared account manager",
    ],
    notIncluded: [
      "AI Chatbot for 24/7 lead capture",
      "Lead generation funnel",
      "Automated follow-up sequences",
      "Reputation management and review automation",
      "Google and Meta Ads Management",
      "Video Content Editing",
      "Conversion Rate Optimization (CRO) testing",
      "Full automation suite",
    ],
    cta: "Book a Call for Marketing",
    popular: false,
  },
  {
    name: "Growth",
    price: "$3,499 setup fee + $1,499 / mo",
    bestFor: "Established businesses ready to own their local market.",
    included: [
      "Everything in Marketing, plus:",
      "Custom Next.js website up to 12 pages (up from 6)",
      "16 pages per month on-page optimization (up from 8)",
      "16 SEO blog posts per month (up from 6)",
      "AI chatbot for 24/7 lead capture",
      "Lead generation funnel",
      "Automated follow-up sequences",
      "Reputation management and review automation",
      "2 social media platforms (up from 1)",
      "Dedicated account manager (up from shared)",
      "Monthly strategy call (30 minutes)",
    ],
    notIncluded: [
      "Google and Meta Ads Management",
      "Video Content Editing",
      "Conversion Rate Optimization (CRO) testing",
      "Full automation suite",
    ],
    cta: "Book a Call for Growth",
    popular: true,
  },
  {
    name: "Full System",
    price: "$5,999 setup fee + $2,499 / mo",
    bestFor: "Multi-location operators who want total market ownership.",
    included: [
      "Everything in Growth, plus:",
      "Custom Next.js website up to 18 pages (up from 12)",
      "Up to 30 pages per month on-page optimization (up from 16)",
      "30 SEO blog posts per month (up from 16)",
      "Google and Meta Ads management (ad spend billed directly by client)",
      "Conversion Rate Optimization (CRO) testing",
      "Full automation suite (up from basic)",
      "Video editing for Reels, Shorts, and TikTok (up to 8 videos per month)",
      "4 social media platforms (up from 2)",
      "Dedicated 1-on-1 account manager (up from dedicated)",
      "Monthly strategy call (60 minutes, up from 30) & quarterly strategy session with founder",
    ],
    notIncluded: [] as string[],
    cta: "Book a Call for Full System",
    popular: false,
  },
];

// SECTION 02: COMPARE ALL FEATURES (sticky header table)
const compareTableRows: { section?: string; feature: string; marketing: string; growth: string; fullSystem: string }[] = [
  { section: "Core Technology & Foundation", feature: "", marketing: "", growth: "", fullSystem: "" },
  { feature: "Custom Next.js Website", marketing: "6 pages", growth: "12 pages", fullSystem: "18 pages" },
  { feature: "PageSpeed Guarantee", marketing: "95+ (All Tiers)", growth: "95+ (All Tiers)", fullSystem: "95+ (All Tiers)" },
  { feature: "Real-Time Revenue Dashboard", marketing: "Yes", growth: "Yes", fullSystem: "Yes" },
  { section: "Traffic & SEO Engine", feature: "", marketing: "", growth: "", fullSystem: "" },
  { feature: "On-Page Optimization", marketing: "8 pages/mo", growth: "16 pages/mo", fullSystem: "Up to 30 pages/mo" },
  { feature: "SEO Blog Posts", marketing: "6/mo", growth: "16/mo", fullSystem: "30/mo" },
  { feature: "Local Citation Building (50+ Directories)", marketing: "Setup Phase", growth: "Setup Phase", fullSystem: "Setup Phase" },
  { feature: "Google Business Profile Management", marketing: "Yes", growth: "Yes", fullSystem: "Yes" },
  { feature: "Generative Engine Optimization (GEO)", marketing: "Yes", growth: "Yes", fullSystem: "Yes" },
  { feature: "AI-Powered SEO", marketing: "Yes", growth: "Yes", fullSystem: "Yes" },
  { section: "Conversion & Automation", feature: "", marketing: "", growth: "", fullSystem: "" },
  { feature: "AI Chatbot (24/7 Lead Capture)", marketing: "No", growth: "Yes", fullSystem: "Yes" },
  { feature: "Lead Generation Funnel", marketing: "No", growth: "Yes", fullSystem: "Yes" },
  { feature: "Automated Follow-Up Sequences", marketing: "No", growth: "Yes", fullSystem: "Yes" },
  { feature: "Reputation Management & Reviews", marketing: "No", growth: "Yes", fullSystem: "Yes" },
  { feature: "Automation Level", marketing: "No", growth: "Basic", fullSystem: "Full Automation Suite" },
  { feature: "CRO Testing", marketing: "No", growth: "No", fullSystem: "Yes" },
  { section: "Paid Media & Social", feature: "", marketing: "", growth: "", fullSystem: "" },
  { feature: "Social Media Platforms", marketing: "1", growth: "2", fullSystem: "4" },
  { feature: "Google and Meta Ads Management", marketing: "Add-on", growth: "Add-on", fullSystem: "Included" },
  { feature: "Video Content Editing", marketing: "Add-on", growth: "Add-on", fullSystem: "Up to 8 videos/mo" },
  { section: "Account Management & Access", feature: "", marketing: "", growth: "", fullSystem: "" },
  { feature: "Account Manager", marketing: "Shared", growth: "Dedicated", fullSystem: "1-on-1 Dedicated" },
  { feature: "Strategy Calls", marketing: "None", growth: "30-min monthly", fullSystem: "60-min monthly + Quarterly Founder Session" },
];

// SECTION 03: ONE-TIME & ADD-ONS
const oneTimeProjects = [
  { name: "SEO Audit and Roadmap", price: "Free" },
  { name: "Custom AI Chatbot", price: "$999" },
  { name: "Website Speed Overhaul", price: "$1,499" },
  { name: "Full Lead Gen Funnel Build", price: "$1,499 to $2,499" },
  { name: "CRO Sprint (30 days)", price: "$1,499 to $2,499" },
  { name: "Programmatic SEO Sprint (100 Pages)", price: "$1,999" },
  { name: "Custom Next.js Website (Standalone)", price: "$3,500" },
];

const monthlyAddOns = [
  { name: "Google or Meta Ads Management", price: "$699 / mo" },
  { name: "Social Media Video Editing (4 videos)", price: "$199 / mo" },
  { name: "GEO Optimization Standalone", price: "$199 / mo" },
  { name: "AI Chatbot Maintenance & Optimization", price: "$149 / mo" },
  { name: "Extra Location SEO Page", price: "$99 / mo" },
  { name: "Extra SEO Blog Post", price: "$69 / post" },
];

// SECTION 05: HOW WE COMPARE (2 columns: Kolavi vs Traditional Agency)
const howWeCompare = [
  {
    feature: "Technology Stack",
    kolavi: "Custom Next.js & React",
    traditional: "WordPress or drag-and-drop builders",
  },
  {
    feature: "PageSpeed Score",
    kolavi: "95+ Guaranteed",
    traditional: "Typically 40 to 60",
  },
  {
    feature: "Content Engine",
    kolavi: "AI-Powered, Human-Edited (High volume, high quality)",
    traditional: "Manual writing (Slow) or unedited AI (Spammy)",
  },
  {
    feature: "Search Visibility",
    kolavi: "Standard SEO + GEO (Generative Engine Optimization) included",
    traditional: "Traditional search only",
  },
  {
    feature: "Local SEO & Reach",
    kolavi: "Programmatic city-pages & automated 50+ directory citations",
    traditional: "Basic profile updates & manual directory submissions",
  },
  {
    feature: "Lead Generation",
    kolavi: "24/7 AI chatbots & automated multi-step funnels",
    traditional: "Static contact forms & \"we will call you\" pages",
  },
  {
    feature: "Lead Nurture & Automation",
    kolavi: "Automated follow-ups, review requests, & CRM syncing",
    traditional: "Manual emails or fragmented third-party software",
  },
  {
    feature: "Design Quality",
    kolavi: "Custom, conversion-engineered architecture",
    traditional: "Modified off-the-shelf templates",
  },
  {
    feature: "Reporting and Metrics",
    kolavi: "Real-time revenue dashboards",
    traditional: "Monthly PDF vanity metrics",
  },
  {
    feature: "Pricing Structure",
    kolavi: "Transparent flat-rate tiers. You own the assets.",
    traditional: "Vague retainers, hourly billing, proprietary lock-ins.",
  },
];

export default function PricingPage() {
  return (
    <main className="relative w-full">
      {/* HERO */}
      <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden -mt-[72px] pt-[72px]">
        <div className="absolute inset-0 w-full h-full bg-hero-atmosphere pointer-events-none" />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-reveal">
          <div className="inline-flex items-center justify-center px-5 py-2.5 mb-8 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            PRICING
          </div>

          <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
            Pricing and Complete Scope
          </h1>

          <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
            Transparent tiers. No hidden retainers. A complete breakdown of the Kolavi Studio growth engine.
          </p>

          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto text-[16px] px-10 h-12 sm:h-14 rounded-[48px] shadow-premium"
          >
            <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
          </Button>
        </div>
      </section>

      {/* SECTION 01: THE TIERS */}
      <section className="relative z-10 bg-background py-16 sm:py-20 md:py-24" aria-labelledby="tiers-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">The Tiers</span>
            <h2 id="tiers-heading" className="text-2xl sm:text-3xl font-bold text-foreground mt-2 mb-3 tracking-tight">
              Marketing · Growth · Full System
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose the engine that matches your stage. Every tier is a complete system.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {tiers.map((tier, index) => (
              <article
                key={tier.name}
                className={`relative flex flex-col rounded-[28px] border bg-card overflow-hidden shadow-premium ${
                  tier.popular ? "border-2 border-primary lg:scale-[1.02] z-10 ring-2 ring-primary/10" : "border-border"
                }`}
              >
                {/* Card header: tier number + name + badge */}
                <div className="px-6 sm:px-7 pt-6 sm:pt-7 pb-4 border-b border-border/80">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                      Tier {String(index + 1).padStart(2, "0")}
                    </span>
                    {tier.popular && (
                      <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1.5">{tier.name}</h3>
                </div>

                {/* Price block */}
                <div className="px-6 sm:px-7 py-5 bg-muted/30 border-b border-border/80">
                  <p className="text-[13px] text-muted-foreground mb-1">Setup + monthly</p>
                  <p className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                    {tier.price}
                  </p>
                </div>

                {/* Best for */}
                <div className="px-6 sm:px-7 py-4 border-b border-border/80">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Best for</p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{tier.bestFor}</p>
                </div>

                {/* What is included */}
                <div className="px-6 sm:px-7 py-5 flex-1">
                  <p className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-3">What is included</p>
                  <ul className="space-y-2">
                    {tier.included.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground leading-snug">
                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" aria-hidden />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {tier.notIncluded.length > 0 && (
                    <>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">Not included</p>
                      <ul className="space-y-2">
                        {tier.notIncluded.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-[13px] text-muted-foreground/70 leading-snug">
                            <X className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                {/* CTA */}
                <div className="px-6 sm:px-7 py-5 pt-4 border-t border-border/80 bg-muted/20">
                  <Button
                    asChild
                    size="lg"
                    variant={tier.popular ? "default" : "outline"}
                    className="w-full rounded-full font-semibold"
                  >
                    <Link href="/contact">{tier.cta}</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 02: COMPARE ALL FEATURES (sticky header) */}
      <section className="relative z-10 bg-muted/20 py-16 sm:py-20 md:py-24" aria-labelledby="compare-all-features-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h2 id="compare-all-features-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-3 text-center">Compare All Features</h2>
          <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-[24px] border border-border bg-card shadow-sm -mx-4 sm:mx-0">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur border-b border-border shadow-sm">
                <tr>
                  <th className="p-4 sm:p-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[28%]">Feature</th>
                  <th className="p-4 sm:p-6 text-sm font-semibold text-foreground w-[24%]">Marketing</th>
                  <th className="p-4 sm:p-6 text-sm font-semibold text-foreground w-[24%]">Growth</th>
                  <th className="p-4 sm:p-6 text-sm font-semibold text-foreground w-[24%]">Full System</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compareTableRows.map((row, i) => {
                  if (row.section) {
                    return (
                      <tr key={i} className="bg-muted/30">
                        <td colSpan={4} className="p-3 sm:p-4 text-sm font-semibold text-foreground">
                          {row.section}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={i} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 sm:p-6 text-sm font-medium text-foreground">{row.feature}</td>
                      <td className="p-4 sm:p-6 text-sm text-muted-foreground">{row.marketing}</td>
                      <td className="p-4 sm:p-6 text-sm text-muted-foreground">{row.growth}</td>
                      <td className="p-4 sm:p-6 text-sm text-muted-foreground">{row.fullSystem}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 03: ONE-TIME PROJECTS & MONTHLY ADD-ONS */}
      <section className="relative z-10 bg-muted/20 py-16 sm:py-20 md:py-24" aria-labelledby="addons-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Add-ons</span>
            <h2 id="addons-heading" className="text-2xl sm:text-3xl font-bold text-foreground mt-2 mb-3 tracking-tight">
              One-Time Projects & Monthly Add-Ons
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Need specific solutions instead of a full tier? We scope custom builds for your exact bottleneck.
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* One-Time Projects card */}
            <div className="rounded-[24px] border border-border bg-card shadow-premium overflow-hidden">
              <div className="px-6 sm:px-7 py-5 border-b border-border bg-muted/30">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Single delivery</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1">One-Time Projects</h3>
              </div>
              <ul className="divide-y divide-border">
                {oneTimeProjects.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 px-6 sm:px-7 py-4 sm:py-[1.125rem] hover:bg-muted/20 transition-colors">
                    <span className="text-sm font-medium text-foreground leading-snug min-w-0">{item.name}</span>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${item.price === "Free" ? "text-primary" : "text-foreground"}`}>
                      {item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Add-Ons card */}
            <div className="rounded-[24px] border border-border bg-card shadow-premium overflow-hidden">
              <div className="px-6 sm:px-7 py-5 border-b border-primary/20 bg-primary/5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Recurring</span>
                <h3 className="text-lg sm:text-xl font-bold text-foreground mt-1">Monthly Add-Ons</h3>
              </div>
              <ul className="divide-y divide-border">
                {monthlyAddOns.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 px-6 sm:px-7 py-4 sm:py-[1.125rem] hover:bg-muted/20 transition-colors">
                    <span className="text-sm font-medium text-foreground leading-snug min-w-0">{item.name}</span>
                    <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">{item.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: UNIVERSAL PARAMETERS & GUARANTEES */}
      <section className="relative z-10 bg-muted/20 py-16 sm:py-20 md:py-24" aria-labelledby="parameters-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Terms</span>
            <h2 id="parameters-heading" className="text-2xl sm:text-3xl font-bold text-foreground mt-2 mb-3 tracking-tight">
              Universal Parameters & Guarantees
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By onboarding with Kolavi Studio, you are protected by clear, transparent operational guidelines.
            </p>
          </header>

          {/* The Guarantees — 3 tier cards */}
          <div className="mb-10 sm:mb-12">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-5 text-center">
              The Guarantees
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
              <div className="rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Marketing Tier</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  No ranking movement in 60 days? We keep working at no extra charge until there is.
                </p>
              </div>
              <div className="rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Growth Tier</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Not seeing measurable lead growth by month 3? We keep working until you do.
                </p>
              </div>
              <div className="rounded-[20px] border border-primary/30 bg-card p-5 sm:p-6 shadow-sm ring-1 ring-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Full System Tier</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Miss any agreed deliverable? That month is free. Every deliverable. Every month.
                </p>
              </div>
            </div>
          </div>

          {/* Operational Terms — single card with term rows */}
          <div className="rounded-[24px] border border-border bg-card shadow-premium overflow-hidden">
            <div className="px-6 sm:px-7 py-5 border-b border-border bg-muted/30">
              <h3 className="text-base sm:text-lg font-bold text-foreground">Operational Terms</h3>
              <p className="text-xs text-muted-foreground mt-1">What we expect and what you can expect.</p>
            </div>
            <ul className="divide-y divide-border">
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">Active Partnership</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To keep your guarantee active, we ask that you provide tool access within 7 days of onboarding and
                  approve content within 5 business days. Delays on your end push timelines accordingly.
                </p>
              </li>
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">Ad Spend</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All advertising budgets (Google, Meta) are separate from our management fees and paid directly to the
                  ad platforms by the client. You maintain total control over your budget.
                </p>
              </li>
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">Revisions & Timelines</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Content revisions are capped per tier to ensure ranking momentum. Unapproved content will be
                  automatically published after 5 business days to maintain your growth timeline.
                </p>
              </li>
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">External Factors</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SEO timelines refer to overall ranking movement, not guaranteed specific positions. Search engine
                  algorithm updates and third-party platform changes are outside our control.
                </p>
              </li>
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">Refunds & Ownership</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Setup fees and paid monthly retainers are non-refundable once onboarding commences. All assets and
                  systems built remain yours in full upon completion of all outstanding payments.
                </p>
              </li>
              <li className="px-6 sm:px-7 py-5">
                <p className="text-sm font-semibold text-foreground mb-1.5">Cancellations</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You may cancel any time with 30 days written notice. Standard billing applies during the final 30-day
                  notice period to ensure a clean handover of all assets.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 05: HOW WE COMPARE (2-column feature table) */}
      <section className="relative z-10 bg-background py-16 sm:py-20 md:py-24" aria-labelledby="compare-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <header className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
            <h2 id="compare-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight">
              How We Compare
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We built Kolavi Studio because the industry standard simply is not good enough. See how our technology and
              methodologies stack up against a traditional marketing agency.
            </p>
          </header>
          <div className="overflow-x-auto rounded-[24px] border border-border bg-card shadow-premium">
            <table className="w-full min-w-[500px] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-4 sm:p-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[22%]">
                    Feature
                  </th>
                  <th className="p-4 sm:p-6 text-sm font-bold text-primary border-l border-border bg-primary/5 w-[39%]">
                    Kolavi Studio
                  </th>
                  <th className="p-4 sm:p-6 text-sm font-semibold text-foreground border-l border-border bg-muted/20 w-[39%]">
                    Traditional Agency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {howWeCompare.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4 sm:p-6 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="p-4 sm:p-6 text-sm text-foreground leading-snug bg-primary/5 border-l border-primary/10">
                      {row.kolavi}
                    </td>
                    <td className="p-4 sm:p-6 text-sm text-muted-foreground leading-snug border-l border-border">
                      {row.traditional}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 bg-background py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
            Start With a Free Audit
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            No commitment. We will show you exactly where you are losing clients and the precise system to fix it.
          </p>
          <Button asChild size="lg" className="rounded-full shadow-premium">
            <Link href="/tools/speed-audit">Get Your Free Audit</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
