import { getPageMetadata } from "@/lib/seo/metadata";
import { SitemapGenerator } from "@/components/tools/SitemapGenerator";
import { SITE_URL } from "@/lib/constants";
import Link from "next/link";
import {
  Globe,
  FileCode,
  Sliders,
  Download,
  Shield,
  ArrowRight,
  Sparkles,
  Search,
  Code,
  ShoppingCart,
  PenTool,
  Briefcase,
  Users,
  Lightbulb,
  CheckCircle,
  Target,
  RefreshCw,
  Bot,
  TriangleAlert,
  Zap,
  UserPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Free XML Sitemap Generator - Create Sitemaps Online Instantly",
  description:
    "Free XML sitemap generator that crawls your website and creates a downloadable sitemap.xml file. Set crawl depth, max URLs, and change frequency. No signup required.",
  path: "/tools/sitemap-generator",
  keywords:
    "sitemap generator, xml sitemap generator, free sitemap generator, online sitemap generator, generate sitemap from url, sitemap xml generator, create sitemap, website sitemap generator, sitemap creator, generate xml sitemap",
});

/** JSON-LD schema for rich results. */
function SitemapGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        { "@type": "ListItem", position: 3, name: "XML Sitemap Generator", item: `${base}/tools/sitemap-generator` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "XML Sitemap Generator",
      url: `${base}/tools/sitemap-generator`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free online XML sitemap generator that crawls your website, discovers every page, and generates a downloadable sitemap.xml file ready for Google Search Console.",
      featureList: [
        "Automatic website crawling",
        "Standard XML sitemap format",
        "Configurable crawl depth and page limits",
        "robots.txt compliance",
        "One-click download",
        "Priority auto-calculation by depth",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a sitemap generator?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A sitemap generator is a tool that automatically crawls your website, discovers all accessible pages, and creates an XML file listing every URL. This XML sitemap file tells search engines like Google which pages exist on your site, how often they change, and which pages are most important. You submit this file through Google Search Console to help search engines index your content faster and more completely.",
          },
        },
        {
          "@type": "Question",
          name: "How does this XML sitemap generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your website URL, set crawl depth and max pages, then click Generate. Our crawler visits your site, follows internal links using breadth-first search, respects your robots.txt rules, and discovers every accessible page. It then generates a standard XML sitemap with proper formatting, priority values, and change frequency tags - ready to download or copy.",
          },
        },
        {
          "@type": "Question",
          name: "Is this sitemap generator free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no credit card, no hidden limits on file size. You can generate sitemaps with up to 500 URLs per crawl, 3 times per day.",
          },
        },
        {
          "@type": "Question",
          name: "What is an XML sitemap?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An XML sitemap is a file (usually named sitemap.xml) that lists all the important URLs on your website in a format that search engines can read. It follows the sitemaps.org protocol and includes metadata like last modification date, change frequency, and priority for each URL. Search engines use this file to discover and crawl your pages more efficiently.",
          },
        },
        {
          "@type": "Question",
          name: "How do I submit my sitemap to Google?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "After generating and downloading your sitemap.xml, upload it to the root of your website (e.g., https://yoursite.com/sitemap.xml). Then go to Google Search Console, select your property, navigate to Sitemaps in the left menu, enter your sitemap URL, and click Submit. Google will begin processing it and indexing your pages.",
          },
        },
        {
          "@type": "Question",
          name: "What is the maximum number of URLs in a sitemap?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Per the sitemaps.org protocol, a single XML sitemap file can contain up to 50,000 URLs and must not exceed 50MB uncompressed. Our free tool generates sitemaps with up to 500 URLs per crawl. For larger sites, you can split your sitemap into multiple files and reference them in a sitemap index file.",
          },
        },
        {
          "@type": "Question",
          name: "Does this tool respect robots.txt?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Before crawling, we fetch and parse your site's robots.txt file. Any paths marked as Disallow for our user agent or the wildcard (*) agent are excluded from the crawl. This ensures the generated sitemap only includes pages you want search engines to access.",
          },
        },
        {
          "@type": "Question",
          name: "How often should I regenerate my sitemap?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Regenerate your sitemap whenever you add, remove, or significantly restructure pages on your site. For active blogs or e-commerce sites, monthly regeneration is a good practice. Many CMS platforms generate sitemaps automatically, but a standalone generator is useful for manual checks and custom configurations.",
          },
        },
        {
          "@type": "Question",
          name: "What is sitemap priority and change frequency?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Priority is a value from 0.0 to 1.0 that tells search engines how important a page is relative to other pages on your site. Change frequency (changefreq) hints how often a page is likely updated - daily, weekly, monthly, or yearly. Note that search engines treat these as hints, not directives. Our tool auto-calculates priority based on page depth: homepage gets 1.0, top-level pages 0.8, deeper pages progressively lower.",
          },
        },
        {
          "@type": "Question",
          name: "Can I generate a sitemap for a site I don't own?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Technically yes - the tool crawls any publicly accessible website. This is useful for competitive analysis, SEO audits, or understanding a site's structure. However, you should only submit a sitemap to Google Search Console for sites you own or manage. Our crawler respects robots.txt and uses reasonable rate limiting to avoid impacting target sites.",
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const features = [
  {
    icon: Globe,
    title: "Automatic Website Crawling",
    description:
      "Enter a URL and our crawler discovers every page on your site. Follows internal links, respects robots.txt, and handles redirects automatically.",
  },
  {
    icon: FileCode,
    title: "Standard XML Format",
    description:
      "Generates XML sitemaps that follow the sitemaps.org protocol exactly. Compatible with Google Search Console, Bing Webmaster Tools, and all major search engines.",
  },
  {
    icon: Sliders,
    title: "Configurable Crawl Settings",
    description:
      "Control crawl depth (1-5 levels), max pages (up to 500), change frequency, and priority settings. Get exactly the sitemap you need.",
  },
  {
    icon: Download,
    title: "Instant Download",
    description:
      "Download your sitemap.xml file with one click. Or copy the raw XML to paste directly into your CMS, hosting panel, or version control.",
  },
  {
    icon: Shield,
    title: "Free, No Signup",
    description:
      "No account, no credit card, no hidden costs. Generate sitemaps as often as you need. Your URLs are never stored or shared.",
  },
];

export default function SitemapGeneratorPage() {
  return (
    <main className="relative w-full">
      <SitemapGeneratorSchema />

      {/* ── HERO ── */}
      <section className="relative min-h-[80dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        <div className="absolute inset-0 bg-hero-atmosphere pointer-events-none" />
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FREE SEO TOOL
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free XML Sitemap Generator
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                Enter your website URL. We crawl it, find every page, and generate a downloadable sitemap.xml - ready to submit to Google Search Console. No code, no hassle.
              </p>
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-12">
                No signup. No credit card. Just your sitemap, ready to download.
              </p>

              <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
                <a href="#generator">
                  Generate Your Sitemap
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── GENERATOR ── */}
      <section id="generator" className="relative z-10 bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-[24px] border border-border bg-card p-6 sm:p-10 shadow-sm">
              <SitemapGenerator />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              WHY THIS TOOL
            </div>
            <h2 className="text-h2 text-foreground max-w-2xl mx-auto">
              What Makes This Sitemap Generator Different
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Most sitemap generators are slow, limited, or require signup. Ours crawls your site in seconds and gives you a ready-to-use XML file.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-[24px] border border-border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-[20px] font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHAT IS AN XML SITEMAP ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <h2 className="text-h2 text-foreground">
              What Is an XML Sitemap?
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-5 animate-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              An XML sitemap is a file that lists every important URL on your website in a structured format that search engines can read. Think of it as a roadmap for Google, Bing, and other crawlers - it tells them which pages exist, when they were last updated, how often they change, and which pages matter most.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Without a sitemap, search engines rely entirely on discovering your pages through links. This works for small, well-linked sites, but larger sites, new sites, or sites with orphan pages (pages not linked from anywhere) can have significant indexing gaps. A sitemap ensures every page you want indexed gets found.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              The standard format follows the <strong>sitemaps.org protocol</strong>, supported by all major search engines. Each URL entry includes optional metadata: <code className="text-sm bg-muted px-1.5 py-0.5 rounded">&lt;lastmod&gt;</code> for the last modification date, <code className="text-sm bg-muted px-1.5 py-0.5 rounded">&lt;changefreq&gt;</code> for how often the page changes, and <code className="text-sm bg-muted px-1.5 py-0.5 rounded">&lt;priority&gt;</code> for relative importance. Our generator handles all of this automatically.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              3 SIMPLE STEPS
            </div>
            <h2 className="text-h2 text-foreground">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                step: "1",
                title: "Enter Your URL",
                description:
                  "Paste your website URL. Optionally configure crawl depth (1-5 levels) and maximum pages (up to 500) in the advanced settings.",
              },
              {
                step: "2",
                title: "We Crawl Your Site",
                description:
                  "Our crawler follows internal links, respects your robots.txt rules, and discovers every accessible page on your site - typically in under 30 seconds.",
              },
              {
                step: "3",
                title: "Download Your Sitemap",
                description:
                  "Preview all discovered URLs with depth and priority info. Then download sitemap.xml with one click or copy the raw XML to your clipboard.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary font-bold text-xl mb-5 border border-primary/20">
                  {item.step}
                </div>
                <h3 className="text-[20px] font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-small text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
              <a href="#generator">
                Try It Now - Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── PRO TIPS ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              PRO TIPS
            </div>
            <h2 className="text-h2 text-foreground">
              Tips for Getting the Most from Your Sitemap
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              A sitemap alone won&apos;t fix your SEO. Here&apos;s how to make it work harder.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Search,
                title: "Submit to Google Search Console",
                description:
                  "After downloading, upload sitemap.xml to your site root. Then go to Google Search Console, navigate to Sitemaps, and submit the URL. Google will start processing it within hours.",
              },
              {
                icon: Target,
                title: "Place in Your Root Directory",
                description:
                  "Convention is to put your sitemap at /sitemap.xml (e.g., https://yoursite.com/sitemap.xml). Most search engines look here by default, and it makes submission straightforward.",
              },
              {
                icon: Lightbulb,
                title: "Keep Under 50,000 URLs",
                description:
                  "Google's limit is 50,000 URLs per sitemap file. For larger sites, split into multiple sitemaps and use a sitemap index file to reference them all.",
              },
              {
                icon: RefreshCw,
                title: "Update When Content Changes",
                description:
                  "Regenerate your sitemap when you add or remove pages. Stale sitemaps with dead links hurt your crawl budget and send mixed signals to search engines.",
              },
              {
                icon: Bot,
                title: "Reference in robots.txt",
                description:
                  "Add a line to your robots.txt file: Sitemap: https://yoursite.com/sitemap.xml. This helps every search engine crawler find your sitemap automatically.",
              },
              {
                icon: CheckCircle,
                title: "Use Priority Wisely",
                description:
                  "Priority values (0.0-1.0) tell search engines which pages matter most relative to each other. Auto mode sets your homepage to 1.0 and decreases by depth - which works well for most sites.",
              },
            ].map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.title}
                  className="flex gap-4 rounded-[20px] border border-border bg-card p-6 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-foreground mb-2">
                      {tip.title}
                    </h3>
                    <p className="text-small text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              USE CASES
            </div>
            <h2 className="text-h2 text-foreground">
              Who Uses a Sitemap Generator?
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              From solo bloggers to enterprise teams - anyone who wants search engines to find their content.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Search,
                title: "SEO Professionals",
                description:
                  "Run site audits, generate sitemaps for client deliverables, and identify orphan pages that search engines can't find through links alone.",
              },
              {
                icon: Code,
                title: "Web Developers",
                description:
                  "Generate sitemaps during deployment workflows, verify all pages are accessible after a migration, and catch broken internal links early.",
              },
              {
                icon: Briefcase,
                title: "Small Business Owners",
                description:
                  "Submit your site to Google properly and make sure every service page, location page, and blog post gets indexed and can rank.",
              },
              {
                icon: PenTool,
                title: "Content Creators & Bloggers",
                description:
                  "Ensure every post is included in your sitemap. New articles get indexed faster when search engines know they exist from your sitemap.",
              },
              {
                icon: ShoppingCart,
                title: "E-commerce Stores",
                description:
                  "Product pages, category pages, collection pages - e-commerce sites often have hundreds of URLs that need indexing. A sitemap covers them all.",
              },
              {
                icon: Users,
                title: "Agency Teams",
                description:
                  "Generate sitemaps for multiple client sites quickly. Include them in technical SEO audits and handoff documents without manual work.",
              },
            ].map((persona) => {
              const Icon = persona.icon;
              return (
                <div
                  key={persona.title}
                  className="rounded-[24px] border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground mb-2">
                    {persona.title}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {persona.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── XML SITEMAP SPECIFICATIONS TABLE ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              REFERENCE
            </div>
            <h2 className="text-h2 text-foreground">
              XML Sitemap Specifications (2026)
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Key limits and formats defined by the sitemaps.org protocol and supported by all major search engines.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-4 font-semibold text-foreground">Specification</th>
                  <th className="text-center px-5 py-4 font-semibold text-foreground">Value</th>
                  <th className="text-right px-5 py-4 font-semibold text-foreground hidden sm:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { spec: "Max URLs per file", value: "50,000", note: "Use sitemap index for more" },
                  { spec: "Max file size", value: "50 MB", note: "Uncompressed" },
                  { spec: "File format", value: "UTF-8 XML", note: "Following sitemaps.org schema" },
                  { spec: "Priority range", value: "0.0 - 1.0", note: "Default is 0.5" },
                  { spec: "Change frequency", value: "7 values", note: "always to never" },
                  { spec: "Lastmod format", value: "W3C date", note: "YYYY-MM-DD or full ISO 8601" },
                  { spec: "Gzip compression", value: "Supported", note: "Reduces file size by 70%+" },
                  { spec: "Sitemap index", value: "Up to 50,000", note: "Sitemaps per index file" },
                ].map((row, i) => (
                  <tr key={row.spec} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.spec}</td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">{row.value}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs hidden sm:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── COMMON SITEMAP MISTAKES ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              AVOID THESE
            </div>
            <h2 className="text-h2 text-foreground">
              Common Sitemap Mistakes That Hurt Your SEO
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Even with a sitemap generator, these pitfalls can undermine your indexing. Here&apos;s what to watch for.
            </p>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                mistake: "Including noindex or blocked pages",
                fix: "Your sitemap should only contain pages you want indexed. If a page has a noindex meta tag or is blocked by robots.txt, remove it from your sitemap. Conflicting signals confuse search engines.",
              },
              {
                mistake: "Listing URLs that return 404 or redirect",
                fix: "Every URL in your sitemap should return a 200 status code. Dead links and redirect chains waste crawl budget and make your sitemap unreliable in Google's eyes.",
              },
              {
                mistake: "Never updating your sitemap",
                fix: "A stale sitemap with outdated lastmod dates signals neglect. Regenerate your sitemap whenever you publish, update, or remove content. Monthly at minimum for active sites.",
              },
              {
                mistake: "Setting all pages to priority 1.0",
                fix: "Priority is relative. When everything is priority 1.0, nothing is prioritized. Use a gradient: homepage 1.0, key pages 0.8, blog posts 0.6, archives 0.2.",
              },
              {
                mistake: "Exceeding the 50,000 URL or 50MB limit",
                fix: "Single sitemap files must stay under 50,000 URLs and 50MB uncompressed. For larger sites, split into multiple sitemaps and reference them in a sitemap index file.",
              },
              {
                mistake: "Not referencing sitemap in robots.txt",
                fix: "Add 'Sitemap: https://yoursite.com/sitemap.xml' to your robots.txt file. This ensures every crawler - not just Google - can find your sitemap automatically without manual submission.",
              },
            ].map((item) => (
              <div
                key={item.mistake}
                className="flex gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <TriangleAlert className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-foreground mb-1">
                    {item.mistake}
                  </h3>
                  <p className="text-small text-muted-foreground leading-relaxed">
                    {item.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              FAQ
            </div>
            <h2 className="text-h2 text-foreground">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                q: "What is a sitemap generator?",
                a: "A sitemap generator is a tool that automatically crawls your website, discovers all accessible pages, and creates an XML file listing every URL. This file tells search engines like Google which pages exist on your site, how often they change, and which pages are most important. You submit this file through Google Search Console to help search engines index your content faster.",
              },
              {
                q: "How does this XML sitemap generator work?",
                a: "Enter your website URL, set crawl depth and max pages, then click Generate. Our crawler visits your site, follows internal links using breadth-first search, respects your robots.txt rules, and discovers every accessible page. It then generates a standard XML sitemap with proper formatting, priority values, and change frequency tags - ready to download or copy.",
              },
              {
                q: "Is this sitemap generator free?",
                a: "Yes, completely free. No signup, no credit card, no hidden limits on file size. You can generate sitemaps with up to 500 URLs per crawl, 3 times per day.",
              },
              {
                q: "What is an XML sitemap?",
                a: "An XML sitemap is a file (usually named sitemap.xml) that lists all the important URLs on your website in a format that search engines can read. It follows the sitemaps.org protocol and includes metadata like last modification date, change frequency, and priority for each URL. Search engines use this file to discover and crawl your pages more efficiently.",
              },
              {
                q: "How do I submit my sitemap to Google?",
                a: "After generating and downloading your sitemap.xml, upload it to the root of your website (e.g., https://yoursite.com/sitemap.xml). Then go to Google Search Console, select your property, navigate to Sitemaps in the left menu, enter your sitemap URL, and click Submit. Google will begin processing it and indexing your pages.",
              },
              {
                q: "What is the maximum number of URLs?",
                a: "Per the sitemaps.org protocol, a single XML sitemap file can contain up to 50,000 URLs and must not exceed 50MB uncompressed. Our free tool generates sitemaps with up to 500 URLs per crawl. For larger sites, you can split your sitemap into multiple files and reference them in a sitemap index file.",
              },
              {
                q: "Does this tool respect robots.txt?",
                a: "Yes. Before crawling, we fetch and parse your site's robots.txt file. Any paths marked as Disallow for our user agent or the wildcard (*) agent are excluded from the crawl. This ensures the generated sitemap only includes pages you want search engines to access.",
              },
              {
                q: "How often should I regenerate my sitemap?",
                a: "Regenerate your sitemap whenever you add, remove, or significantly restructure pages on your site. For active blogs or e-commerce sites, monthly regeneration is a good practice. Many CMS platforms generate sitemaps automatically, but a standalone generator is useful for manual checks and custom configurations.",
              },
              {
                q: "What is sitemap priority and change frequency?",
                a: "Priority is a value from 0.0 to 1.0 that tells search engines how important a page is relative to other pages on your site. Change frequency (changefreq) hints how often a page is likely updated - daily, weekly, monthly, or yearly. Search engines treat these as hints, not directives. Our tool auto-calculates priority based on page depth: homepage gets 1.0, top-level pages 0.8, deeper pages progressively lower.",
              },
              {
                q: "Can I generate a sitemap for a site I don't own?",
                a: "Technically yes - the tool crawls any publicly accessible website. This is useful for competitive analysis, SEO audits, or understanding a site's structure. However, you should only submit a sitemap to Google Search Console for sites you own or manage.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[20px] border border-border bg-card shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-[16px] font-semibold text-foreground hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="ml-4 shrink-0 text-muted-foreground group-open:rotate-45 transition-transform duration-200 text-xl leading-none">+</span>
                </summary>
                <div className="px-6 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED TOOLS ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              MORE TOOLS
            </div>
            <h2 className="text-h2 text-foreground">
              Try Our Other Free SEO Tools
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                href: "/tools/speed-audit",
                icon: Zap,
                title: "Free SEO & Speed Audit",
                description: "Get a free PageSpeed and SEO health check. See how your site performs and what to fix first.",
                cta: "Get Your Free Audit",
              },
              {
                href: "/tools/bio-generator",
                icon: UserPen,
                title: "AI Bio Generator",
                description: "Generate platform-optimized bios for LinkedIn, Twitter/X, Instagram, and more - all at once.",
                cta: "Generate Your Bio",
              },
              {
                href: "/tools",
                icon: Sparkles,
                title: "All Free Tools",
                description: "ROI calculators, competitor comparison, treatment analyzers, and more SEO tools. All free.",
                cta: "Browse All Tools",
              },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-[24px] border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group block text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-5 group-hover:bg-primary/10 transition-colors">
                    <Icon className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-[18px] font-bold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-small text-muted-foreground mb-4">{tool.description}</p>
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

      {/* ── BOTTOM CTA ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-h2 text-foreground mb-6">
            Ready to Improve Your SEO?
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
            A proper XML sitemap is the foundation of good technical SEO. Generate yours in seconds and help search engines find every page on your site.
          </p>
          <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-10">
            <a href="#generator">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Your Sitemap - Free
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
