import Link from "next/link";
import { headers } from "next/headers";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getPageMetadata } from "@/lib/seo/metadata";
import { FAQ, type FAQItem } from "@/components/sections/FAQ";
import { Button } from "@/components/ui/button";
import {
  Users,
  TrendingUp,
  Building2,
  Scale,
  Laptop,
  Network,
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "Partner Program - Earn Recurring Commissions",
  description: "Join the Kolavi Studio Partner Program. Refer local businesses and earn 10% on setup fees plus 5% recurring commission. Transparent payouts. No caps. No clawbacks after 90 days.",
  path: "/partner",
  keywords: "agency partner program, referral program, marketing referral, reseller program, local business",
});

const PARTNER_FAQ_ITEMS: FAQItem[] = [
  {
    question: "How much can I earn per referral?",
    answer: "You earn 10% of the one-time setup fee, plus 5% of the monthly retainer. There is no cap on how much you can earn or how many businesses you can refer.",
  },
  {
    question: "Do I need to be in a specific industry?",
    answer: "No. As long as you have relationships with established, multi-location, or high-ticket local businesses that need more revenue and better digital systems, you are a fit.",
  },
  {
    question: "Do I need to handle the sales process?",
    answer: "Not at all. Your only job is the introduction. Once you refer them, our team conducts the revenue audit, handles the technical scoping, and closes the deal.",
  },
  {
    question: "When do I get paid?",
    answer: "Setup fee commissions are paid out 30 days after the client clears their initial invoice. Recurring monthly commissions are paid out on the 15th of every month for active client retainers.",
  },
  {
    question: "Is there a minimum commitment or quota?",
    answer: "No. Whether you send us one client a year or ten clients a month, you receive the exact same 10% and 5% commission structure.",
  },
  {
    question: "What happens if a referred client cancels?",
    answer: "If a client cancels their Kolavi Studio retainer, your recurring monthly commission for that specific client will stop. However, there are no clawbacks on past monthly payouts or setup fees after the initial 90-day period.",
  },
];

const steps = [
  {
    step: "01",
    title: "Apply",
    description: "Fill out a short application. We review it within 48 hours. If you work with, consult for, or know established local business owners, you are a fit.",
  },
  {
    step: "02",
    title: "Refer",
    description: "Share your unique referral link or make a warm email introduction. We handle the sales conversation, the technical audit, the proposal, and the close. You do not need to sell anything.",
  },
  {
    step: "03",
    title: "Earn",
    description: "Earn a 10% commission on the upfront setup fee, plus a 5% recurring commission on the monthly retainer for as long as the referred client stays with us. Payouts are monthly. No caps. No clawbacks after 90 days.",
  },
];

const partnerTypes = [
  { icon: Users, title: "Business consultants and growth coaches" },
  { icon: Building2, title: "Field service and practice management software vendors" },
  { icon: Scale, title: "Accountants, bookkeepers, and attorneys serving local businesses" },
  { icon: Laptop, title: "Web developers and designers who do not offer advanced SEO or AI automation" },
  { icon: Network, title: "B2B influencers with an audience of local operators" },
  { icon: TrendingUp, title: "Anyone with strong relationships in the home service, legal, or high-ticket local space" },
];

export default async function PartnerPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const faqSchema = getFAQSchema(PARTNER_FAQ_ITEMS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        nonce={nonce}
      />

      <main className="relative w-full">
        {/* SECTION 1: HERO */}
        <section className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[72px]">
          <div className="absolute inset-0 w-full h-full bg-hero-atmosphere pointer-events-none" />

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center animate-reveal">
            <div className="inline-flex items-center justify-center px-5 py-2.5 mb-8 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              PARTNER PROGRAM
            </div>

            <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
              Grow With Us. Get Paid for Every Referral.
            </h1>

            <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
              Refer established local businesses and earn 10% on setup plus 5% recurring. Simple terms. Transparent payouts. No fine print.
            </p>

            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-[16px] px-10 h-12 sm:h-14 rounded-[48px] shadow-premium"
            >
              <Link href="/partner/apply">Apply Now</Link>
            </Button>
          </div>
        </section>

        {/* SECTION 2: HOW IT WORKS */}
        <section className="relative z-10 bg-background py-24 sm:py-32" aria-labelledby="partner-how-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-20 animate-reveal">
              <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                THE PROCESS
              </div>
              <h2 id="partner-how-heading" className="text-h2 text-foreground mb-6">
                How It Works
              </h2>
            </div>

            <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
              {steps.map((item, i) => (
                <div key={item.step} className="relative flex flex-col p-10 rounded-[32px] border border-border bg-card shadow-premium hover:shadow-xl transition-shadow animate-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="text-stat text-muted/30 mb-8 font-bold leading-none">
                    {item.step}
                  </div>
                  <h3 className="text-h3 text-foreground mb-4">{item.title}</h3>
                  <p className="text-body text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3: WHO THIS IS FOR */}
        <section className="relative z-10 bg-muted/30 py-24 sm:py-32 border-y border-border" aria-labelledby="who-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center mb-20 animate-reveal">
              <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-background border border-border text-label text-muted-foreground shadow-sm">
                IDEAL PARTNERS
              </div>
              <h2 id="who-heading" className="text-h2 text-foreground mb-6">
                Who This Is For
              </h2>
              <p className="text-body text-muted-foreground max-w-2xl mx-auto">
                If you have an existing audience or client base of high-ticket local service providers, home service contractors, or professional firms, you are a perfect fit.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "200ms" }}>
              {partnerTypes.map((type, index) => {
                const Icon = type.icon;
                return (
                  <div key={index} className="flex items-start p-6 rounded-[24px] bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-[12px] bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex flex-col justify-center min-h-[48px]">
                      <h3 className="text-[16px] font-medium text-foreground leading-tight">{type.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: COMMISSION STRUCTURE */}
        <section className="relative z-10 bg-background py-24 sm:py-32" aria-labelledby="commission-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                COMMISSION STRUCTURE
              </div>
              <h2 id="commission-heading" className="text-h2 text-foreground mb-4">
                Transparent, High-Yield Payouts
              </h2>
              <p className="text-body text-muted-foreground max-w-2xl mx-auto mb-10">
                We pay 10% of the Setup Fee + 5% of the Monthly Retainer for every client you close.
              </p>
              <p className="text-sm font-medium text-foreground">Here is what that looks like in practice:</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm text-center">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Tier 01 Marketing</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">You earn</p>
                <p className="text-2xl font-bold text-foreground mb-1">$249</p>
                <p className="text-sm text-muted-foreground mb-3">upfront</p>
                <p className="text-lg font-semibold text-foreground">+ $49 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              </div>
              <div className="rounded-[24px] border-2 border-primary bg-card p-6 shadow-sm text-center ring-2 ring-primary/10">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Tier 02 Growth</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">You earn</p>
                <p className="text-2xl font-bold text-foreground mb-1">$349</p>
                <p className="text-sm text-muted-foreground mb-3">upfront</p>
                <p className="text-lg font-semibold text-foreground">+ $74 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              </div>
              <div className="rounded-[24px] border border-border bg-card p-6 shadow-sm text-center">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Tier 03 Full System</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">You earn</p>
                <p className="text-2xl font-bold text-foreground mb-1">$599</p>
                <p className="text-sm text-muted-foreground mb-3">upfront</p>
                <p className="text-lg font-semibold text-foreground">+ $124 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
              </div>
            </div>

            <div className="rounded-[24px] border border-primary/20 bg-primary/5 p-6 sm:p-8 text-center">
              <p className="text-base sm:text-lg text-foreground font-medium leading-relaxed">
                Refer just four Tier 03 clients a year, and you build an extra <strong className="text-primary">$496</strong> in passive monthly recurring revenue, plus <strong className="text-primary">$2,396</strong> in upfront cash bonuses.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="relative z-10 bg-background pb-24 sm:pb-32" aria-labelledby="faqs-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-16 animate-reveal">
              <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FAQ
              </div>
              <h2 id="faqs-heading" className="text-h2 text-foreground mb-6">
                Partner Program Questions
              </h2>
            </div>
            <FAQ title="" items={PARTNER_FAQ_ITEMS} className="bg-background animate-reveal py-0 sm:py-0" />
          </div>
        </section>

        {/* SECTION 5: CTA */}
        <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh] border-t border-border">
          <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
            <h2 className="text-h2 text-foreground mb-8 text-balance">
              Start Earning Today
            </h2>
            <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
              Apply to the partner program. Quick application. 48-hour review. Start referring immediately after approval.
            </p>
            <Button
              asChild
              size="lg"
              className="h-14 px-10 rounded-[48px] bg-primary hover:bg-primary/90 text-primary-foreground text-button shadow-premium"
            >
              <Link href="/partner/apply">Apply Now</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
