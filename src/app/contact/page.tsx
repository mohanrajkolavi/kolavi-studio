import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { getPageMetadata } from "@/lib/seo/metadata";
import { FAQ, type FAQItem } from "@/components/sections/FAQ";
import { getFAQSchema } from "@/lib/seo/jsonld/faq";
import { SelectedTierBadge } from "@/components/contact/SelectedTierBadge";
import { Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Contact Us",
  description: "Get in touch with Kolavi Studio. We're ready to help your business grow with Next.js websites, SEO, and expert digital marketing.",
  path: "/contact",
  keywords: "contact Kolavi Studio, digital marketing consultation, web design and SEO",
});

const CONTACT_FAQ_ITEMS: FAQItem[] = [
  {
    question: "How quickly do you respond?",
    answer: "Every inquiry gets a response within 24 hours. Most hear back the same business day.",
  },
  {
    question: "Do I need to be ready to sign up to contact you?",
    answer: "No. Whether you're ready to start today or just exploring options, we're happy to talk. No pressure. No hard sell.",
  },
  {
    question: "What happens after I submit the form?",
    answer: "You'll get a confirmation email immediately. Within 24 hours, a team member will follow up to schedule a call or answer your questions directly.",
  },
  {
    question: "Can I just get the free SEO audit without a call?",
    answer: "Yes. If you'd prefer to skip the conversation and go straight to the audit, mention that in your message. We'll deliver the audit report to your inbox.",
  },
  {
    question: "Do you work with businesses outside the US?",
    answer: "Currently we focus on US-based clients. If you're outside the US, reach out anyway. We evaluate international inquiries on a case-by-case basis.",
  },
];

export default async function ContactPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const faqSchema = getFAQSchema(CONTACT_FAQ_ITEMS);

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
              CONTACT US
            </div>

            <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
              Let's Talk About Your Growth.
            </h1>

            <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
              Whether you are ready to start or just exploring, we respond to every inquiry within 24 hours.
            </p>
          </div>
        </section>

        {/* SECTION 2: Contact form + info */}
        <section className="relative z-10 bg-background py-24 sm:py-32" aria-label="Contact form and info">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">

                {/* Left Column: Info & CTA */}
                <div className="space-y-8 animate-reveal">
                  <div className="rounded-[32px] border border-border bg-card p-10 shadow-premium">
                    <h3 className="text-h4 text-foreground mb-8">Contact Information</h3>
                    <div className="space-y-8">
                      <div className="flex items-start gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary border border-primary/20">
                          <Mail className="h-6 w-6" aria-hidden />
                        </div>
                        <div className="flex flex-col justify-center min-h-[48px]">
                          <p className="text-[14px] font-semibold text-foreground uppercase tracking-wider mb-1">Email Us</p>
                          <a href="mailto:hello@kolavistudio.com" className="text-body text-muted-foreground hover:text-primary transition-colors">hello@kolavistudio.com</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary border border-primary/20">
                          <Clock className="h-6 w-6" aria-hidden />
                        </div>
                        <div className="flex flex-col justify-center min-h-[48px]">
                          <p className="text-[14px] font-semibold text-foreground uppercase tracking-wider mb-1">Response Time</p>
                          <p className="text-body text-muted-foreground">Within 24 hours</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[32px] bg-card border border-primary/20 p-10 shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-primary/5 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
                    <h3 className="text-h4 text-foreground font-bold mb-4 relative z-10">Prefer to start with a free audit instead?</h3>
                    <p className="text-body text-muted-foreground mb-8 leading-relaxed relative z-10">
                      Get a free, comprehensive technical SEO audit of your current digital presence. We will uncover the hidden performance bottlenecks costing you potential customers.
                    </p>
                    <Button asChild className="w-full h-14 rounded-[48px] text-[16px] relative z-10">
                      <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
                    </Button>
                  </div>
                </div>

                {/* Right Column: Tally Form */}
                <div className="animate-reveal lg:sticky lg:top-32" style={{ animationDelay: "100ms" }}>
                  <Suspense fallback={null}>
                    <SelectedTierBadge />
                  </Suspense>
                  <div className="rounded-[32px] border border-border shadow-premium bg-card overflow-hidden h-full min-h-[700px] relative">
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center -z-10">
                      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <iframe
                      src={process.env.NEXT_PUBLIC_TALLY_FORM_EMBED_URL || "https://tally.so/embed/w7X9jW?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      title="Contact Form"
                      className="bg-transparent w-full h-full min-h-[700px] relative z-10"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: FAQ */}
        <section className="relative z-10 bg-background pb-24 sm:pb-32" aria-labelledby="faqs-heading">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center mb-16 animate-reveal">
              <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FAQ
              </div>
              <h2 id="faqs-heading" className="text-h2 text-foreground mb-6">
                Before You Reach Out
              </h2>
            </div>
            <FAQ title="" items={CONTACT_FAQ_ITEMS} className="bg-background animate-reveal py-0 sm:py-0" />
          </div>
        </section>

        {/* SECTION 4: CTA */}
        <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh] border-t border-border">
          <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
            <h2 className="text-h2 text-foreground mb-8 text-balance">
              Or Skip Straight to Your Free Audit
            </h2>
            <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
              No forms. No meetings. Just a comprehensive SEO audit of your digital presence, delivered directly to your inbox.
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
    </>
  );
}
