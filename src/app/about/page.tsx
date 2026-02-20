import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import {
  Gem,
  Cpu,
  Target,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "About Us - Built Different From Day One",
  description: "Learn about Kolavi Studio, our mission to help med spas grow with Next.js websites, AI-powered SEO, and an obsessive attention to detail.",
  path: "/about",
  keywords: "med spa marketing agency, about Kolavi Studio, medical spa digital marketing, growth team",
});

const values = [
  {
    icon: Gem,
    title: "Obsession with Craft",
    description:
      "We do not ship \"good enough.\" Every website, every page, every automation is built to a standard most agencies do not even aim for. If a button does not feel right on hover, we rebuild it. If a page loads in 2.1 seconds instead of 1.8, we optimize it. This is not a marketing line. It is how we operate.",
  },
  {
    icon: Cpu,
    title: "AI-Native, Not AI-Adjacent",
    description:
      "We did not bolt AI onto existing workflows. We built our entire operation around it from day one. Content generation, SEO auditing, lead nurture, competitive analysis. AI is not a feature we offer. It is the infrastructure we run on.",
  },
  {
    icon: Target,
    title: "Med Spa Exclusive",
    description:
      "We do not serve other industries. We do not want to. Every template, every automation, every content strategy is built specifically for medical spas. Botox. Fillers. Body contouring. Laser treatments. GLP-1. We know the business because we chose to know nothing else.",
  },
  {
    icon: LineChart,
    title: "Results Over Activity",
    description:
      "We do not measure success by how many blog posts we published or how many emails we sent. We measure it by patient bookings, revenue growth, and cost per acquisition. If a deliverable does not move a business metric, we kill it and replace it with something that does.",
  },
];

export default function AboutPage() {
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
            ABOUT US
          </div>

          <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
            Built Different From Day One.
          </h1>

          <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
            Founded in 2026. Purpose-built for medical spas. Obsessed with performance, design, and results.
          </p>
        </div>
      </section>

      {/* SECTION 2: OUR STORY */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-b border-border" aria-labelledby="story-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl animate-reveal">
            <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-background border border-border text-label text-muted-foreground shadow-sm">
              OUR STORY
            </div>
            <h2 id="story-heading" className="text-h2 text-foreground mb-10">
              The Industry is Stuck in 2015
            </h2>
            <div className="space-y-8 text-body text-muted-foreground leading-relaxed text-[18px]">
              <p>
                Kolavi Studio was founded in 2026 with a single conviction: the med spa marketing industry is stuck in 2015. Agencies charging premium retainers for slow WordPress templates, two generic blog posts a month, and automated dashboards that nobody checks.
              </p>
              <p>
                We asked an entirely different question. What would a med spa agency look like if it were built today? From scratch. With modern software engineering. With AI-native workflows. And with an obsessive attention to detail that most agencies do not even aspire to.
              </p>
              <p className="text-xl font-medium text-foreground border-l-2 border-primary pl-6 py-2">
                The answer is Kolavi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FOUNDER STORY */}
      <section className="relative z-10 bg-muted/30 py-24 sm:py-32 border-b border-border" aria-labelledby="founder-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl animate-reveal">
            <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-background border border-border text-label text-muted-foreground shadow-sm">
              FOUNDER BACKGROUND
            </div>
            <h2 id="founder-heading" className="text-h2 text-foreground mb-10">
              Proof Over Promises
            </h2>
            <div className="space-y-8 text-body text-muted-foreground leading-relaxed text-[18px]">
              <p>
                Before Kolavi, our founder built Business Mavericks to over 31,000 monthly organic visitors and 60,000 Instagram followers. Not through expensive paid ads or temporary growth hacks. This was achieved through a systematic, AI-powered content strategy executed with ruthless precision over years of testing what actually compounds at scale.
              </p>
              <p>
                That experience proved something incredibly important: when you combine modern technology with relentless iteration and a refusal to cut corners, the results compound in ways traditional approaches simply cannot match.
              </p>
              <p>
                That exact same philosophy is the foundation of Kolavi. Every workflow. Every automation. Every single pixel on every single page. Built with the kind of obsessive perfectionism that most agencies reserve for their own pitch decks, not their clients' actual results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: OUR VALUES (BENTO GRID) */}
      <section className="relative z-10 bg-background py-24 sm:py-32" aria-labelledby="values-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-20 text-center animate-reveal">
            <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              CORE PRINCIPLES
            </div>
            <h2 id="values-heading" className="text-h2 text-foreground mb-6">
              What Drives Us
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group relative p-10 rounded-[32px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-500 animate-reveal overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-[16px] bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-h4 text-foreground mb-4">
                      {item.title}
                    </h3>
                    <p className="text-body text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 5: CTA */}
      <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh] border-t border-border">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-primary pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
          <h2 className="text-h2 text-foreground mb-8 text-balance">
            Ready to Work With an Agency That Actually Cares?
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Start with a free SEO audit. We will show you exactly what is possible.
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
