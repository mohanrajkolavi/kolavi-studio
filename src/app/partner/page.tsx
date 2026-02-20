import Link from "next/link";
import { headers } from "next/headers";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { getPageMetadata } from "@/lib/seo/metadata";
import { FAQ, type FAQItem } from "@/components/sections/FAQ";
import { Button } from "@/components/ui/button";
import {
  Users,
  Wallet,
  TrendingUp,
  Stethoscope,
  Building2,
  Syringe,
  GraduationCap,
  Scale,
  Laptop,
  Network
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "Partner Program - Earn Recurring Commissions",
  description: "Join the Kolavi Studio Partner Program. Refer medical spas and earn 10% recurring commission for the life of the client.",
  path: "/partner",
  keywords: "agency partner program, med spa referral, marketing referral, reseller program",
});

const PARTNER_FAQ_ITEMS: FAQItem[] = [
  {
    question: "How much can I earn per referral?",
    answer: "Commission details are shared upon approval. Expect competitive recurring payouts that reward long-term partnerships, not one-time finder's fees.",
  },
  {
    question: "Do I need to be in the med spa industry?",
    answer: "You need to have relationships with or access to med spa owners. Consultants, software vendors, equipment suppliers, accountants, and attorneys in the aesthetics space are all great fits.",
  },
  {
    question: "Do I need to handle the sales process?",
    answer: "No. You make the introduction or share your referral link. We handle the audit, proposal, sales conversation, and close. You get credit for the referral.",
  },
  {
    question: "When do I get paid?",
    answer: "Payouts are monthly. Once a referred client signs and pays, your commission begins. No caps on earnings.",
  },
  {
    question: "Is there a minimum commitment?",
    answer: "No. Refer one client or fifty. There's no quota, no minimum activity requirement, and no penalty for inactivity.",
  },
  {
    question: "What happens if a referred client cancels?",
    answer: "Commissions are earned for as long as the referred client remains active. No clawbacks after the first 90 days.",
  },
];

const steps = [
  {
    step: "01",
    title: "Apply",
    description: "Fill out a short application. We review it within 48 hours. If you work with or know med spa owners, you are a fit.",
  },
  {
    step: "02",
    title: "Refer",
    description: "Share your unique referral link or make a warm introduction. We handle the sales conversation, the audit, the proposal, and the close. You do not need to sell anything.",
  },
  {
    step: "03",
    title: "Earn",
    description: "Earn a recurring commission for as long as the referred client stays with us. Payouts are monthly. No caps. No clawbacks after 90 days.",
  },
];

const partnerTypes = [
  { icon: Stethoscope, title: "Med spa consultants and coaches" },
  { icon: Building2, title: "Practice management software companies" },
  { icon: Syringe, title: "Medical equipment suppliers and distributors" },
  { icon: GraduationCap, title: "Aesthetic training and certification providers" },
  { icon: Scale, title: "Accountants and attorneys serving the med spa industry" },
  { icon: Laptop, title: "Web developers and designers who do not offer marketing" },
  { icon: Network, title: "Anyone with relationships in the med spa space" },
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
              PARTNER PROGRAM
            </div>

            <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
              Grow With Us. Get Paid for Every Referral.
            </h1>

            <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
              Send med spa owners our way and earn recurring commissions on every client that signs. Simple terms. Transparent payouts. No fine print.
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
                If you have an existing audience or client base of medical spa owners, aesthetic practitioners, or plastic surgeons, you are a perfect fit.
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <div className="p-12 md:p-16 rounded-[40px] border border-primary/20 bg-card shadow-premium relative overflow-hidden animate-reveal">
              <div className="absolute top-1/2 left-1/2 w-full h-full bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                  <Wallet className="w-10 h-10 text-primary" />
                </div>
                <h2 id="commission-heading" className="text-h2 text-foreground mb-6">
                  Commission Structure
                </h2>
                <p className="text-[20px] leading-relaxed text-muted-foreground font-medium max-w-2xl mx-auto mb-8">
                  Commission details shared upon approval. Expect highly competitive recurring payouts that actively reward long-term partnerships.
                </p>
              </div>
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-primary pointer-events-none" />

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
