import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Pricing - Transparent Med Spa Marketing Packages",
  description: "Transparent pricing for med spa marketing: Visibility, Growth, and Dominance tiers. Custom Next.js websites, GEO/AI SEO, programmatic SEO, and full automation.",
  path: "/pricing",
  image: `${SITE_URL}/og-image.jpg`,
  keywords: "med spa marketing pricing, medical spa agency cost, Kolavi Studio pricing, med spa SEO packages",
});

const featuresList = [
  "On-page SEO optimization",
  "Blog posts",
  "Lead gen funnel",
  "Marketing automation",
  "Email marketing",
  "Account manager",
  "Programmatic SEO",
  "Google Ads management",
  "AI chatbot",
  "GLP-1 marketing funnel",
  "Post-consultation email nurture",
  "CRO + A/B testing",
  "Video content editing",
  "Meta Ads management",
  "Membership upsell automation",
  "Virtual consultation setup",
  "Micro-influencer matching",
];

const tiers = [
  {
    name: "Visibility",
    setup: "$2,599",
    monthly: "$1,299",
    bestFor: "New or small single-location med spas",
    popular: false,
    features: {
      "On-page SEO optimization": "Up to 8 pages per month",
      "Blog posts": "6 posts per month, AI-assisted, human-edited, SEO-optimized",
      "Lead gen funnel": "Landing page + form + confirmation page",
      "Marketing automation": "Booking confirmations + appointment reminders",
      "Email marketing": "1 email campaign per month (design, copywriting, sending, and performance tracking included)",
      "Account manager": "Shared (1:5 ratio)\n48-hour response, 2 ad-hoc requests per month",
      "Programmatic SEO": false,
      "Google Ads management": false,
      "AI chatbot": false,
      "GLP-1 marketing funnel": false,
      "Post-consultation email nurture": false,
      "CRO + A/B testing": false,
      "Video content editing": false,
      "Meta Ads management": false,
      "Membership upsell automation": false,
      "Virtual consultation setup": false,
      "Micro-influencer matching": false,
    }
  },
  {
    name: "Growth",
    setup: "$3,599",
    monthly: "$1,699",
    bestFor: "Established spas ready to dominate their city",
    popular: true,
    features: {
      "On-page SEO optimization": "Unlimited pages per month",
      "Blog posts": "16 posts per month, AI-assisted, human-edited, SEO-optimized",
      "Lead gen funnel": "Full funnel: landing page + CRM integration + follow-up sequence",
      "Marketing automation": "Confirmations, reminders, re-engagement, review requests",
      "Email marketing": "2 email campaigns per month (design, copywriting, sending, and performance tracking included)",
      "Account manager": "Shared (1:3 ratio)\nEmail + Slack/WhatsApp, 24-hour response, 5 ad-hoc requests per month, 30-minute monthly call",
      "Programmatic SEO": "Up to 30 auto-generated pages targeting your treatments across your city and surrounding neighborhoods (e.g., 'Botox in [City]', 'Laser Hair Removal near [Neighborhood]')",
      "Google Ads management": "Up to $5K ad spend managed",
      "AI chatbot": "24/7 lead capture, FAQ handling, booking assistant",
      "GLP-1 marketing funnel": "Dedicated landing page + email sequence for weight loss services",
      "Post-consultation email nurture": "5-step sequence to convert consultations into bookings",
      "CRO + A/B testing": "Ongoing page and booking flow optimization",
      "Video content editing": false,
      "Meta Ads management": false,
      "Membership upsell automation": false,
      "Virtual consultation setup": false,
      "Micro-influencer matching": false,
    }
  },
  {
    name: "Dominance",
    setup: "$5,599",
    monthly: "$2,499",
    bestFor: "Multi-location, $2M+ revenue, PE-backed groups",
    popular: false,
    features: {
      "On-page SEO optimization": "Unlimited pages per month",
      "Blog posts": "Up to 30 posts per month, AI-assisted, human-edited, SEO-optimized",
      "Lead gen funnel": "Full funnel: landing page + CRM integration + follow-up sequence",
      "Marketing automation": "Confirmations, reminders, re-engagement, review requests",
      "Email marketing": "4 email campaigns per month (design, copywriting, sending, and performance tracking included)",
      "Account manager": "Dedicated account manager (1:1)\nEmail + Slack/WhatsApp + phone, 4-hour response, unlimited requests, 60-minute monthly call, 90-minute quarterly strategy session, direct founder access",
      "Programmatic SEO": "50 to 200+ auto-generated pages across all your locations and treatments. Ideal for multi-location groups where each location gets its own treatment pages, neighborhood pages, and service area pages.",
      "Google Ads management": "Up to $10K ad spend managed",
      "AI chatbot": "Free ($999 value), 24/7 lead capture, FAQ handling, booking assistant",
      "GLP-1 marketing funnel": "Landing page + ads + full email sequence",
      "Post-consultation email nurture": "5-step sequence to convert consultations into bookings",
      "CRO + A/B testing": "Ongoing page and booking flow optimization",
      "Video content editing": "4 videos per month for Instagram Reels, TikTok, YouTube Shorts",
      "Meta Ads management": "Facebook + Instagram campaigns",
      "Membership upsell automation": "Auto-promote membership plans to repeat clients",
      "Virtual consultation setup": "Landing page + booking flow + pre-consult intake",
      "Micro-influencer matching": "Local influencer outreach + campaign coordination",
    }
  }
];

const oneTimeProjects = [
  { name: "SEO Audit + Roadmap", price: "Free" },
  { name: "Virtual Consultation Setup", price: "$499" },
  { name: "Custom AI Chatbot", price: "$999" },
  { name: "Full Lead Gen Funnel Build", price: "$1,499 to $2,999" },
  { name: "CRO Sprint (30-day)", price: "$1,499 to $2,499" },
  { name: "GLP-1 Launch Package", price: "$2,499 to $3,999" },
  { name: "Full Marketing Automation Build", price: "$2,499 to $4,999" },
];

const monthlyAddOns = [
  { name: "Extra Email Campaign", price: "$199 / campaign" },
  { name: "Extra Blog Posts", price: "$199 / post" },
  { name: "Competitor Analysis Report", price: "$249 / mo" },
  { name: "Extra Landing Page", price: "$299 / page" },
  { name: "SMS Marketing", price: "$299 / mo" },
  { name: "Micro-Influencer Matching", price: "$399 / mo" },
  { name: "Social Media Calendar (8 posts)", price: "$499 / mo" },
  { name: "Google Ads Standalone", price: "$599 / mo + spend (ad spend budget paid directly to platform, not included in fee)" },
  { name: "Video Editing (4 videos)", price: "$599 / mo" },
  { name: "Meta Ads Management", price: "$699 / mo + spend (ad spend budget paid directly to platform, not included in fee)" },
  { name: "Additional Location", price: "60% of base retainer (e.g., Visibility = $779/mo, Growth = $1,019/mo, Dominance = $1,499/mo)" },
];

const competitorComparison = [
  {
    feature: "Technology Stack",
    kolavi: "Next.js (React)",
    patientgain: "WordPress",
    growth99: "Proprietary / WP",
    sagapixel: "WordPress",
  },
  {
    feature: "PageSpeed Score",
    kolavi: "95-100 Guaranteed",
    patientgain: "Typically 40-60",
    growth99: "Typically 50-70",
    sagapixel: "Typically 60-80",
  },
  {
    feature: "Programmatic SEO",
    kolavi: "Yes (Built-in)",
    patientgain: "No",
    growth99: "No",
    sagapixel: "No",
  },
  {
    feature: "AI Content Engine",
    kolavi: "Yes",
    patientgain: "No",
    growth99: "Basic",
    sagapixel: "Human only (Slower)",
  },
  {
    feature: "GEO Optimization",
    kolavi: "Yes",
    patientgain: "No",
    growth99: "No",
    sagapixel: "No",
  },
  {
    feature: "Design Quality",
    kolavi: "Custom, Premium",
    patientgain: "Template-based",
    growth99: "Template-based",
    sagapixel: "Custom",
  },
];

export default function PricingPage() {
  return (
    <main className="relative w-full">
      {/* SECTION 1: HERO */}
      <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[72px]">
        <div className="absolute inset-0 w-full h-full bg-background" />
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/20 pointer-events-none" />
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 bg-primary pointer-events-none -translate-y-1/2 -translate-x-1/2"
          aria-hidden
        />

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-reveal">
          <div className="inline-flex items-center justify-center px-5 py-2.5 mb-8 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            PRICING
          </div>

          <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
            Transparent Investment. Predictable Results.
          </h1>

          <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
            Three tiers built for three stages of growth. No hidden fees. No surprise invoices. Every deliverable spelled out.
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

      {/* SECTION 2: PRICING TIERS */}
      <section className="relative z-10 bg-background py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {tiers.map((tier, index) => (
              <div
                key={tier.name}
                className={`relative rounded-[32px] border bg-card p-8 sm:p-10 shadow-premium flex flex-col animate-reveal ${
                  tier.popular 
                    ? "border-primary lg:-mt-8 lg:mb-8 ring-1 ring-primary/20" 
                    : "border-border mt-0"
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary text-[12px] font-bold tracking-wider uppercase text-primary-foreground shadow-sm">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-h3 text-foreground mb-2">{tier.name}</h3>
                <p className="text-small text-muted-foreground mb-6 min-h-[42px]">{tier.bestFor}</p>
                
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline mb-2">
                    <span className="text-[48px] font-bold leading-none tracking-tight text-foreground">{tier.monthly}</span>
                    <span className="text-body text-muted-foreground ml-2">/mo</span>
                  </div>
                  <p className="text-small text-muted-foreground">
                    + {tier.setup} setup fee
                  </p>
                </div>

                <div className="flex-1 mb-8">
                  <h4 className="text-small font-semibold text-foreground uppercase tracking-wider mb-4">What is included</h4>
                  <ul className="space-y-4">
                    {Object.entries(tier.features).filter(([_, val]) => val !== false).map(([feature, val], i) => (
                      <li key={i} className="flex items-start text-small text-muted-foreground">
                        <Check className="w-5 h-5 text-primary mr-3 shrink-0" />
                        <span className="mt-0.5 whitespace-pre-line">
                          {val === true ? feature : <><strong className="text-foreground whitespace-pre-line">{val}</strong> {feature.includes('Pages/mo') || feature.includes('Posts/mo') ? '' : `- ${feature}`}</>}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <h4 className="text-small font-semibold text-muted-foreground uppercase tracking-wider mb-4 mt-8">Not included</h4>
                  <ul className="space-y-4">
                    {Object.entries(tier.features).filter(([_, val]) => val === false).map(([feature], i) => (
                      <li key={i} className="flex items-start text-small text-muted-foreground/60">
                        <X className="w-5 h-5 mr-3 shrink-0" />
                        <span className="mt-0.5">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild
                  size="lg"
                  variant={tier.popular ? "default" : "outline"}
                  className={`w-full h-14 rounded-[48px] text-[16px] ${!tier.popular && "bg-background hover:bg-muted"}`}
                >
                  <Link href="/contact">Get Started</Link>
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-[24px] bg-muted/30 border border-border shadow-sm flex items-start gap-4 max-w-4xl mx-auto animate-reveal" style={{ animationDelay: "300ms" }}>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-primary font-bold">i</span>
            </div>
            <p className="text-body text-muted-foreground pt-1">
              All advertising management fees (Google Ads, Meta Ads) cover our strategy, setup, optimization, and reporting. Ad spend budgets are separate and paid directly to the ad platforms by you. We manage your campaigns. You control your ad budget.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: FULL FEATURE COMPARISON TABLE */}
      <section className="relative z-10 bg-background py-24 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <h2 className="text-h2 text-foreground mb-6">Compare All Features</h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              A detailed breakdown of exactly what is included in each Kolavi Studio growth tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-border bg-card shadow-sm animate-reveal" style={{ animationDelay: "200ms" }}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-6 text-small font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20 w-[40%] align-bottom">Feature</th>
                  {tiers.map(t => (
                    <th key={t.name} className={`p-6 border-b w-[20%] align-bottom ${t.popular ? 'bg-primary/5 border-x border-t border-primary text-primary border-b-primary relative' : 'border-border bg-muted/20 text-foreground'}`}>
                      <div className="flex flex-col items-start gap-1">
                        {t.popular && (
                          <span className="px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm whitespace-nowrap mb-1">
                            Most Popular
                          </span>
                        )}
                        <span className="text-body font-semibold">
                          {t.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {featuresList.map((feature, i) => {
                  const isLastRow = i === featuresList.length - 1;
                  return (
                    <tr key={i} className="transition-colors hover:bg-muted/10">
                      <td className={`p-6 text-body font-medium text-foreground ${isLastRow ? 'border-b border-border' : ''}`}>{feature}</td>
                      {tiers.map(t => {
                        const val = feature in t.features ? t.features[feature as keyof typeof t.features] : undefined;
                        return (
                          <td key={t.name} className={`p-6 text-body ${t.popular ? `bg-primary/5 border-x border-primary text-foreground ${isLastRow ? 'border-b' : ''}` : `text-muted-foreground ${isLastRow ? 'border-b border-border' : ''}`}`}>
                            {val === true ? (
                              <Check className="w-5 h-5 text-primary" />
                            ) : val === false || val === undefined ? (
                              <div className="flex items-center gap-2">
                                <X className="w-5 h-5 text-muted-foreground/30" />
                                <span className="text-muted-foreground/50 text-[14px]">Not included</span>
                              </div>
                            ) : (
                              <span className="font-medium text-foreground whitespace-pre-line">{val as string}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 4 & 5: A LA CARTE & ADD-ONS */}
      <section className="relative z-10 bg-muted/30 py-24 sm:py-32 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* One-Time Projects */}
            <div className="animate-reveal">
              <h2 className="text-h3 text-foreground mb-8">One-Time Projects</h2>
              <div className="flex flex-col gap-4">
                {oneTimeProjects.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[20px] bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-body font-medium text-foreground">{item.name}</span>
                    <span className="text-body text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Add-Ons */}
            <div className="animate-reveal" style={{ animationDelay: "150ms" }}>
              <h2 className="text-h3 text-foreground mb-8">Monthly Add-Ons</h2>
              <div className="flex flex-col gap-4">
                {monthlyAddOns.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-6 rounded-[20px] bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-body font-medium text-foreground">{item.name}</span>
                    <span className="text-body text-muted-foreground font-medium bg-muted/50 px-3 py-1 rounded-full">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 6: DISCOUNTS */}
      <section className="relative z-10 bg-background py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-reveal">
            <div className="p-8 rounded-[24px] bg-primary text-primary-foreground shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2" />
              <h3 className="text-[20px] font-bold mb-2 relative z-10">Annual Payment</h3>
              <p className="text-primary-foreground/90 font-medium text-[16px] relative z-10">10% off total retainer</p>
            </div>
            <div className="p-8 rounded-[24px] bg-card border border-border shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-2">Multi-Location</h3>
              <p className="text-muted-foreground font-medium text-[16px]">60% of base retainer per additional location</p>
            </div>
            <div className="p-8 rounded-[24px] bg-card border border-border shadow-sm">
              <h3 className="text-[20px] font-bold text-foreground mb-2">Add-On Bundle</h3>
              <p className="text-muted-foreground font-medium text-[16px]">2+ add-ons: cheapest add-on at 50% off</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: COMPETITOR COMPARISON */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <h2 className="text-h2 text-foreground mb-6">How We Compare</h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              We built Kolavi because the industry standard simply is not good enough. See how our technology and methodologies stack up.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[24px] border border-border bg-card shadow-sm animate-reveal" style={{ animationDelay: "200ms" }}>
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr>
                  <th className="p-6 text-small font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/20 w-[20%]">Standard</th>
                  <th className="p-6 text-body font-bold text-primary border-b border-border bg-primary/5 w-[20%]">Kolavi Studio</th>
                  <th className="p-6 text-body font-semibold text-foreground border-b border-border bg-muted/20 w-[20%]">PatientGain</th>
                  <th className="p-6 text-body font-semibold text-foreground border-b border-border bg-muted/20 w-[20%]">Growth99</th>
                  <th className="p-6 text-body font-semibold text-foreground border-b border-border bg-muted/20 w-[20%]">Sagapixel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitorComparison.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-muted/10">
                    <td className="p-6 text-body font-medium text-foreground">{row.feature}</td>
                    <td className="p-6 text-body font-semibold text-primary bg-primary/5 border-x border-primary/10">
                      {row.kolavi}
                    </td>
                    <td className="p-6 text-body text-muted-foreground">{row.patientgain}</td>
                    <td className="p-6 text-body text-muted-foreground">{row.growth99}</td>
                    <td className="p-6 text-body text-muted-foreground">{row.sagapixel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 8: CTA */}
      <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-primary pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
          <h2 className="text-h2 text-foreground mb-8 text-balance">
            Start With a Free SEO Audit
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            No contracts. No commitments. We will audit your current digital presence and show you exactly where the opportunities are.
          </p>
          <Button
            asChild
            size="lg"
            className="h-14 px-10 rounded-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-button shadow-premium"
          >
            <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
