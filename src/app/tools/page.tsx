import { getPageMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import {
  Zap,
  BarChart3,
  Calculator,
  LayoutGrid,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Free SEO & Marketing Tools for Med Spas",
  description:
    "Free tools to power your SEO strategy: website speed audit, treatment coverage analyzer, ROI calculator, competitor comparison, and more. No signup required.",
  path: "/tools",
  keywords:
    "med spa SEO tools, free SEO audit, website speed audit, treatment analyzer, med spa ROI calculator, competitor comparison",
});

const tools = [
  {
    id: "speed-audit",
    href: "/tools/speed-audit",
    icon: Zap,
    title: "Free SEO & Speed Audit",
    description:
      "Get a free PageSpeed and SEO health check. See how your med spa site performs, what’s costing you patients, and how you compare to the 95+ benchmark.",
    cta: "Get Your Free Audit",
    featured: true,
  },
  {
    id: "treatment-analyzer",
    href: "/tools/treatment-analyzer",
    icon: BarChart3,
    title: "Treatment Coverage Analyzer",
    description:
      "Enter your website URL. We identify all treatments you offer, check local rankings, and show the revenue opportunity you’re missing.",
    cta: "Analyze My Menu",
    featured: false,
  },
  {
    id: "roi-calculator",
    href: "/tools/roi-calculator",
    icon: Calculator,
    title: "ROI Calculator",
    description:
      "See how much revenue you could gain by ranking for all your treatments, not just your top one. Multi-treatment SEO ROI in minutes.",
    cta: "Calculate ROI",
    featured: false,
  },
  {
    id: "treatment-visualizer",
    href: "/tools/treatment-visualizer",
    icon: LayoutGrid,
    title: "Treatment Coverage Visualizer",
    description:
      "Select which treatments you offer and see how much search volume you’re missing. Current vs. potential state at a glance.",
    cta: "Visualize Coverage",
    featured: false,
  },
  {
    id: "competitor-comparison",
    href: "/tools/competitor-comparison",
    icon: Users,
    title: "Competitor Comparison",
    description:
      "Compare your site to up to 3 competitors. PageSpeed, treatment pages, and digital presence gaps—so you know where you stand.",
    cta: "Compare Competitors",
    featured: false,
  },
];

export default function ToolsPage() {
  const featured = tools.find((t) => t.featured);
  const rest = tools.filter((t) => !t.featured);

  return (
    <main className="relative w-full">
      {/* Hero */}
      <section className="relative min-h-[70dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        <div className="absolute inset-0 bg-hero-atmosphere pointer-events-none" />
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                SEO STRATEGY TOOLS
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free Tools to Power Your Med Spa SEO
              </h1>
              <p className="text-[18px] sm:text-[20px] text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
                Part of our SEO strategy: use these tools to audit your site, analyze treatment coverage, estimate ROI, and compare yourself to competitors. No signup. No credit card. Just data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured: Free SEO Audit */}
      {featured && (
        <section className="relative z-10 bg-background py-16 sm:py-20 border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="rounded-[24px] border-2 border-primary/20 bg-card p-8 sm:p-10 shadow-sm transition-all duration-300 hover:shadow-premium hover:border-primary/30 group">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <featured.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-label font-medium text-primary">Most popular</span>
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-h3 text-foreground mb-2">{featured.title}</h2>
                    <p className="text-body text-muted-foreground max-w-xl">
                      {featured.description}
                    </p>
                  </div>
                </div>
                <Button asChild size="lg" className="shrink-0 rounded-[48px] shadow-premium">
                  <Link href={featured.href}>
                    {featured.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tool grid */}
      <section className="relative z-10 bg-background py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-14 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              ALL TOOLS
            </div>
            <h2 className="text-h2 text-foreground max-w-2xl mx-auto">
              More Tools for Your SEO Strategy
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              We add new tools over time. Each one is built to help med spas make better decisions and grow organic traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group block text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-[20px] font-bold text-foreground mb-3">{tool.title}</h3>
                  <p className="text-small text-muted-foreground mb-6">{tool.description}</p>
                  <span className="inline-flex items-center text-button text-primary font-medium group-hover:underline">
                    {tool.cta}
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
