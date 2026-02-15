import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PartnerPageCTAs, PartnerPageCTA } from "@/components/partner/PartnerPageCTAs";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";
import { Handshake, DollarSign, TrendingUp, Shield, FileCheck } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Partner Program - Earn with Kolavi Studio",
  description:
    "Join the Kolavi Studio Partner Program. Earn 15% on one-time fees and 10% on monthly recurring revenue when your referrals become paying clients.",
  path: "/partner",
  keywords: "partner program, affiliate, referral program, earn commission, Kolavi Studio",
});

const benefits = [
  {
    icon: <DollarSign className="h-8 w-8" />,
    title: "15% One-Time Fees",
    description: "Earn 15% when your referred lead pays for a one-time project or service.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "10% Recurring Revenue",
    description: "Earn 10% on every monthly payment from clients you referred.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Transparent Tracking",
    description: "30-day cookie attribution. Clear tracking with your unique partner link.",
  },
  {
    icon: <FileCheck className="h-8 w-8" />,
    title: "Simple Terms",
    description: "Commission paid only when referred leads become paying clients.",
  },
];

const steps = [
  { step: 1, title: "Apply", desc: "Submit your application. We review and approve qualified partners." },
  { step: 2, title: "Get Your Link", desc: "Receive your unique partner link: yoursite.com/partner?ref=YOURCODE" },
  { step: 3, title: "Share", desc: "Share your link with businesses that need digital marketing." },
  { step: 4, title: "Earn", desc: "When they become paying clients, you earn commission." },
];

const faqs = [
  {
    question: "How does the referral link work?",
    answer:
      "Once approved, you receive a unique link (e.g. yoursite.com/partner?ref=YOURCODE). When someone clicks it, we set a 30-day cookie. If they submit a contact form and become a paying client within that window, you earn commission.",
  },
  {
    question: "What is the commission structure?",
    answer:
      "15% on one-time fees (projects, one-off services) and 10% on monthly recurring revenue from referred clients. Commission is paid only when the lead converts to a paying client. On average, partners earn $250+ per referred lead.",
  },
  {
    question: "How long is the attribution window?",
    answer:
      "30 days. The first partner link clicked receives credit. If a visitor submits a contact form within 30 days of clicking your link, the lead is attributed to you.",
  },
  {
    question: "When do I get paid?",
    answer:
      "Payouts are processed on a schedule (e.g., monthly). Pending commission appears in your dashboard until it's paid out. Minimum payout thresholds may apply.",
  },
  {
    question: "Who can become a partner?",
    answer:
      "Individuals and businesses who can refer qualified leads—marketing agencies, consultants, industry peers, or anyone with an audience that needs digital marketing services. We review applications and approve qualified partners at our discretion.",
  },
];

export default function PartnerPage() {
  return (
    <main>
      {/* Hero - refined with gradient and Handshake */}
      <section className="relative border-b border-border bg-background">
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-gradient-to-b from-muted/50 via-background to-background dark:from-muted/20 dark:via-background dark:to-background" />
        <div className="relative overflow-visible">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl py-12 sm:py-16 lg:py-20 text-center">
              <div className="mb-6 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:text-orange-400">
                  <Handshake className="h-10 w-10" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Partner{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Program
                </span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
                Earn commission when you refer businesses to Kolavi Studio. 15% on one-time fees, 10% on monthly recurring revenue.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
                <PartnerPageCTAs />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-muted/30 py-14 sm:py-20" aria-labelledby="how-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                How It Works
              </span>
            </div>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 id="how-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Four simple steps
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-orange-400">
                    <span className="text-lg font-bold">{s.step}</span>
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-foreground">{s.title}</h3>
                  <p className="mt-3 text-base text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border py-20 sm:py-28" aria-labelledby="benefits-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Why Partner With Us
              </span>
            </div>
            <div className="mx-auto max-w-2xl text-center mb-12">
              <h2 id="benefits-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Commission that grows with you
              </h2>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-400/25 dark:border dark:border-orange-400/40 dark:text-orange-400">
                    {b.icon}
                  </div>
                  <h3 className="mt-6 text-lg font-medium text-foreground">{b.title}</h3>
                  <p className="mt-3 text-base text-muted-foreground">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-border py-16 sm:py-24" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="h-0.5 w-8 rounded-full bg-orange-500" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                FAQ
              </span>
            </div>
            <h2 id="faq-heading" className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mt-12 space-y-4">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-border/60 bg-card [&>summary]:list-none [&>summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left font-medium text-foreground transition-colors hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="border-t border-border/60 px-6 py-4 text-muted-foreground">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-muted/30 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Ready to earn with us?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Apply to join the partner program. We&apos;ll review your application and get back to you within a few business days.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <PartnerPageCTA />
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Partner link format: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{SITE_URL}/partner?ref=YOURCODE</code>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
