import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Code2,
  LineChart,
  Bot,
  Workflow,
  PenTool,
  BarChart3,
  CheckCircle2,
  LayoutTemplate,
  Layers,
  Zap,
  Cloud,
  Server,
  Network
} from "lucide-react";

export const metadata = getPageMetadata({
  title: "Our Services - Med Spa Marketing & Web Design",
  description: "Comprehensive med spa marketing: Next.js web design, multi-treatment SEO, content marketing, and paid advertising. Tailored specifically for aesthetic practices.",
  path: "/services",
  image: `${SITE_URL}/og-image.jpg`,
  keywords:
    "med spa SEO, medical spa web design, content marketing, PPC for med spas, digital marketing services",
});

const services = [
  {
    id: "websites",
    icon: Code2,
    title: "Next.js + Headless CMS Websites",
    description: [
      "We do not use templates. We do not use WordPress or Squarespace. Every Kolavi Studio website is a custom-engineered Next.js application built specifically for performance and patient conversion.",
      "Most medical spa websites suffer from bloated code and outdated plugins that inherently slow down load times. This actively hurts your Google rankings and frustrates potential patients. We build headless architectures that guarantee lightning-fast sub-second load times.",
      "Our websites are fully mobile-first, ensuring patients have a flawless booking experience from their phones. We also build in rigorous ADA and HIPAA compliance right from the start, protecting your practice while delivering a premium digital experience.",
    ],
    features: [
      "95+ Google PageSpeed guaranteed",
      "Sub-second page load times",
      "Fully custom, mobile-first design",
      "ADA and HIPAA compliance built-in",
      "Seamless booking system integration",
    ],
  },
  {
    id: "seo",
    icon: LineChart,
    title: "AI-Powered SEO",
    description: [
      "Traditional SEO is too slow. We utilize an AI-powered SEO infrastructure to systematically dominate your local market for every single treatment you offer.",
      "We break down search optimization into four rigorous pillars: on-page optimization, deep technical SEO, authoritative off-page citation building, and programmatic SEO. Programmatic SEO allows us to generate hundreds of highly targeted, location-specific treatment pages at scale. If someone searches for 'lip fillers near me' or 'laser hair removal in [your city]', your practice will own that search result.",
      "We build a massive footprint of city and treatment page combinations, ensuring you capture high-intent patients exactly when they are ready to book.",
    ],
    features: [
      "Programmatic SEO at massive scale",
      "Deep technical and on-page optimization",
      "Local SEO and Google Business Profile ranking",
      "Authoritative citation and link building",
      "City and treatment specific landing pages",
    ],
  },
  {
    id: "geo",
    icon: Bot,
    title: "GEO: AI Search Optimization",
    description: [
      "Generative Engine Optimization (GEO) is the absolute future of search. Patients are no longer just Googling treatments. They are asking ChatGPT, Perplexity, and Google AI Overviews for personalized medical spa recommendations.",
      "We actively optimize your brand to appear as the authoritative answer within these AI models. This requires a completely different approach than traditional SEO. It demands structured data, deep semantic authority, and highly specific content formatting that AI engines favor.",
      "We position your practice as the definitive expert in your region, ensuring that when an AI recommends a local clinic, it recommends yours.",
    ],
    features: [
      "ChatGPT and Perplexity optimization",
      "Google AI Overview integration",
      "Advanced Schema markup structuring",
      "Semantic authority building",
      "AI-native content formatting",
    ],
  },
  {
    id: "automation",
    icon: Workflow,
    title: "Lead Generation & Automation",
    description: [
      "Traffic is useless if it does not convert into paying patients. We build robust, multi-step lead generation funnels that capture attention and automate the booking process.",
      "Our systems include highly intelligent AI chatbots that answer patient questions 24/7, direct CRM integrations, and seamless appointment reminders. We build specific funnels for high-ticket services like GLP-1 weight loss programs, ensuring leads are nurtured until they are ready to consult.",
      "We also automate post-consultation follow-ups, membership upsells, and review requests, closing the loop and maximizing the lifetime value of every single patient.",
    ],
    features: [
      "24/7 intelligent AI chatbots",
      "Multi-step conversion funnels",
      "GLP-1 and high-ticket treatment workflows",
      "Automated appointment reminders",
      "Membership upsell automation",
    ],
  },
  {
    id: "content",
    icon: PenTool,
    title: "Content Engine",
    description: [
      "Content is the asset that compounds your organic traffic over time. We deploy an AI-assisted, human-edited content workflow to produce authoritative articles at scale.",
      "We do not publish generic fluff. Every piece of content is deeply researched, medically accurate, and targeted at specific keywords your patients are actively searching for. From detailed treatment guides to recovery instructions, we build a library of trust.",
      "We also edit and optimize your video content for short-form platforms, creating a cohesive brand narrative that captures attention across TikTok, Instagram Reels, and YouTube Shorts.",
    ],
    features: [
      "Blog content generated at scale",
      "AI-assisted, human-edited precision",
      "Keyword-targeted treatment guides",
      "Short-form video editing and optimization",
      "Compounding organic traffic assets",
    ],
  },
  {
    id: "reputation",
    icon: BarChart3,
    title: "Reputation & Reporting",
    description: [
      "You cannot improve what you cannot measure. We tie every single campaign, every keyword, and every ad dollar directly to measurable patient bookings.",
      "We actively manage your reputation through automated review generation systems, ensuring your 5-star ratings consistently outpace your competitors. We monitor and respond to reviews, building a pristine public image for your clinic.",
      "You receive access to real-time dashboards and detailed monthly reports. No confusing metrics. No vanity numbers. Just a crystal-clear view of your return on investment and revenue growth.",
    ],
    features: [
      "Automated 5-star review generation",
      "Active review monitoring and response",
      "Call tracking and lead attribution",
      "Real-time ROI dashboards",
      "Transparent monthly performance reports",
    ],
  },
];

const techStack = [
  { name: "Next.js", icon: LayoutTemplate, desc: "Core framework for every site we build" },
  { name: "Headless CMS", icon: Layers, desc: "Decoupled content management for speed and flexibility" },
  { name: "Vercel", icon: Zap, desc: "Primary deployment and edge network" },
  { name: "AWS", icon: Cloud, desc: "Cloud infrastructure for custom backend requirements" },
  { name: "Google Cloud Platform", icon: Server, desc: "BigQuery for analytics, Cloud Functions for automation" },
  { name: "Azure", icon: Network, desc: "Enterprise-grade hosting option for Microsoft ecosystems" },
];

export default function ServicesPage() {
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
            OUR SERVICES
          </div>

          <h1 className="text-hero text-foreground max-w-[900px] mx-auto text-balance mb-8">
            Everything Your Med Spa Needs. Nothing It Doesn't.
          </h1>

          <p className="text-body text-muted-foreground max-w-[650px] mx-auto text-balance mb-12">
            A full-stack digital growth engine built exclusively for medical spas. Every service engineered to drive patient bookings, not vanity metrics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto max-w-2xl mx-auto">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto text-[16px] px-8 h-12 sm:h-14 rounded-[48px]"
            >
              <Link href="/tools/speed-audit">Get Your Free SEO Audit</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto text-[16px] px-8 h-12 sm:h-14 rounded-[48px]"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 2: SERVICE DEEP DIVES (BENTO GRID) */}
      <section className="relative z-10 bg-background py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 gap-16 lg:gap-24">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="group relative rounded-[32px] border border-border bg-card p-8 sm:p-12 lg:p-16 shadow-premium hover:shadow-xl transition-all duration-500 animate-reveal overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
                  
                  <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    <div className="lg:col-span-7 flex flex-col justify-center">
                      <div className="w-16 h-16 rounded-[16px] bg-primary/10 flex items-center justify-center mb-8 border border-primary/20">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-h2 text-foreground mb-6">
                        {service.title}
                      </h2>
                      <div className="space-y-6 text-body text-muted-foreground leading-relaxed">
                        {service.description.map((paragraph, pIndex) => (
                          <p key={pIndex}>{paragraph}</p>
                        ))}
                      </div>
                    </div>
                    
                    <div className="lg:col-span-5 flex flex-col justify-center">
                      <div className="rounded-[24px] bg-muted/30 p-8 border border-border">
                        <h3 className="text-h4 text-foreground mb-6">Core Deliverables</h3>
                        <ul className="space-y-4">
                          {service.features.map((feature, fIndex) => (
                            <li key={fIndex} className="flex items-start text-body text-muted-foreground">
                              <CheckCircle2 className="w-6 h-6 text-primary mr-4 shrink-0" />
                              <span className="mt-0.5">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: TECH STACK SHOWCASE */}
      <section className="relative z-10 bg-muted/30 py-24 sm:py-32 border-y border-border overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-5 py-2.5 mb-6 rounded-[48px] bg-background border border-border text-label text-muted-foreground">
              ENGINEERING EXCELLENCE
            </div>
            <h2 className="text-h2 text-foreground mb-6">Built on the Stack That Scales</h2>
            <p className="text-body text-muted-foreground max-w-2xl mx-auto">
              We do not force every client onto the same platform. We choose the right infrastructure for your growth stage, your traffic volume, and your technical requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "200ms" }}>
            {techStack.map((tech) => {
              const TechIcon = tech.icon;
              return (
                <div key={tech.name} className="flex items-center p-6 rounded-[24px] bg-background border border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-6 shrink-0">
                    <TechIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-semibold text-foreground mb-1">{tech.name}</h3>
                    <p className="text-small text-muted-foreground">{tech.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA */}
      <section className="relative z-10 bg-background py-32 lg:py-[160px] overflow-hidden flex flex-col justify-center min-h-[50vh]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 bg-primary pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center relative z-10 animate-reveal">
          <h2 className="text-h2 text-foreground mb-8 text-balance">
            See What We'd Build for You
          </h2>
          <p className="text-body text-muted-foreground mb-12 max-w-2xl mx-auto text-balance">
            Every engagement starts with a free SEO audit. No commitment. No pitch deck. Just a clear roadmap of what is broken and how we will fix it.
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
