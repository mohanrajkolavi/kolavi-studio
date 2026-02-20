import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, Monitor, Clock } from "lucide-react";

export const metadata = getPageMetadata({
  title: "Our Portfolio - Documenting Real Results",
  description: "Explore our portfolio of successful digital marketing campaigns and web design projects. Built in public, completely transparent, and relentlessly documented.",
  path: "/portfolio",
  keywords: "med spa portfolio, medical spa case studies, web design projects, marketing success stories",
});

const projects = [
  {
    title: "Kolavi Studio (This Site)",
    category: "Agency Infrastructure",
    description: "This very website serves as the technical baseline for every single client we partner with. If it is not good enough for us, it is not good enough for you.",
    icon: Monitor,
    results: [
      "95+ Google PageSpeed guaranteed",
      "Next.js headless architecture",
      "Sub-second load times globally",
      "Fully accessible ADA compliance",
    ],
  },
  {
    title: "Business Mavericks",
    category: "Media Brand",
    description: "Our founder's prior project, scaled entirely through systematic, AI-assisted content strategy and technical SEO without spending a single dollar on ads.",
    icon: TrendingUp,
    results: [
      "31,000+ monthly organic visitors",
      "60,000+ targeted Instagram followers",
      "Dominant rankings for highly competitive terms",
      "Zero dollar initial ad spend",
    ],
  },
  {
    title: "First Client Cohort",
    category: "Medical Spa Partners",
    description: "Our initial client projects are currently in progress. Every single engagement will be documented here with exact metrics, timelines, and verifiable results. No stock photos. No fabricated stories. Just absolute proof.",
    icon: Clock,
    results: [
      "Real baseline metrics documented",
      "Transparent 90-day growth trajectories",
      "Verified patient acquisition costs",
      "Full stack implementation",
    ],
  },
];

const standards = [
  "Custom Next.js + Headless CMS build",
  "95+ Google PageSpeed guaranteed",
  "Full SEO infrastructure deployed from day one",
  "Real-time reporting dashboards available instantly",
  "Strict monthly performance documentation",
];

export default function PortfolioPage() {
  return (
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
            OUR WORK
          </div>

          <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
            Engineered to Perform. Built to Prove It.
          </h1>

          <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
            We are a new agency, and we are building our portfolio entirely in public. Every project. Every result. Documented transparently from day one.
          </p>
        </div>
      </section>

      {/* SECTION 2: WHAT WE ARE BUILDING */}
      <section className="relative z-10 bg-background py-24 sm:py-32" aria-labelledby="portfolio-projects-heading">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-20 animate-reveal">
            <h2 id="portfolio-projects-heading" className="text-h2 text-foreground mb-6">
              What We Are Building
            </h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {projects.map((project, i) => {
              const Icon = project.icon;
              return (
                <div key={i} className="flex flex-col p-10 rounded-[32px] border border-border bg-card shadow-premium hover:shadow-xl transition-all duration-300 animate-reveal overflow-hidden relative group" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-primary/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />

                  <div className="relative z-10 flex-1 flex flex-col">
                    <div className="mb-8">
                      <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-muted text-[12px] font-bold tracking-wider uppercase text-muted-foreground">
                        {project.category}
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-[16px] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shrink-0">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>

                    <h3 className="text-h3 text-foreground mb-4">{project.title}</h3>

                    <p className="text-body text-muted-foreground leading-relaxed mb-10 flex-1">
                      {project.description}
                    </p>

                    <div>
                      <h4 className="text-small font-semibold text-foreground uppercase tracking-wider mb-4 border-t border-border pt-6">The Standards</h4>
                      <ul className="space-y-3">
                        {project.results.map((result, idx) => (
                          <li key={idx} className="flex items-start text-small text-muted-foreground">
                            <CheckCircle2 className="w-5 h-5 text-primary mr-3 shrink-0" />
                            <span className="mt-0.5">{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: WHAT TO EXPECT */}
      <section className="relative z-10 bg-muted/30 py-24 sm:py-32 border-y border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="p-12 md:p-16 rounded-[40px] bg-card border border-border shadow-premium relative overflow-hidden animate-reveal">
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-h2 text-foreground mb-10">
                The Deliverable Standard
              </h2>
              <p className="text-body text-muted-foreground mb-10 max-w-2xl">
                Every single piece of work that leaves Kolavi Studio is held to the exact same uncompromising standard of technical excellence.
              </p>

              <ul className="space-y-6">
                {standards.map((standard, idx) => (
                  <li key={idx} className="flex items-center text-[18px] text-foreground font-medium">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-5 border border-primary/20 shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    {standard}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh]">
        <div className="absolute inset-0 w-full h-full bg-cta-atmosphere pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
          <h2 className="text-h2 text-foreground mb-8 text-balance">
            Be One of Our First Success Stories
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Early clients get our full attention, our absolute best pricing, and a front-row seat to what a modern medical spa agency can actually deliver.
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
