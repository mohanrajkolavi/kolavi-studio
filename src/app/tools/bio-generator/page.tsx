import Link from "next/link";
import { getPageMetadata } from "@/lib/seo/metadata";
import { BioGenerator } from "@/components/tools/BioGenerator";
import { SITE_URL } from "@/lib/constants";
import {
  Sparkles,
  Zap,
  Target,
  Users,
  Shield,
  ArrowRight,
  Briefcase,
  Camera,
  Code,
  Megaphone,
  GraduationCap,
  Heart,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Mail,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Free AI Bio Generator  - LinkedIn, Instagram, Twitter Bio Maker",
  description:
    "Free AI bio generator for LinkedIn, Instagram, Twitter/X, TikTok & 7+ platforms at once. Professional bio writer that respects character limits, targets your audience, and sounds human. No signup.",
  path: "/tools/bio-generator",
  keywords:
    "ai bio generator, free ai bio generator, bio generator, ai professional bio generator, bio ai generator, instagram bio generator, bio maker, free bio generator, linkedin bio generator, twitter bio generator, aesthetic bio maker, social media bio generator",
});

/** JSON-LD SoftwareApplication + FAQPage schema for rich results. */
function BioGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        { "@type": "ListItem", position: 3, name: "AI Bio Generator", item: `${base}/tools/bio-generator` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "AI Bio Generator",
      url: `${base}/tools/bio-generator`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free AI-powered bio generator that creates platform-optimized bios for LinkedIn, Twitter/X, Instagram, TikTok, GitHub, and more  - all at once from a single input.",
      featureList: [
        "Multi-platform bio generation",
        "Character limit enforcement",
        "Audience-targeted bios",
        "Tone customization slider",
        "Role quick-start templates",
        "One-click copy per platform",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does the AI Bio Generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your name, role, and optionally your achievements, skills, and personality traits. Select which platforms you need bios for, set your preferred tone and target audience, then click Generate. The AI creates a unique, optimized bio for each platform  - respecting character limits and adapting style (professional for LinkedIn, punchy for Twitter, emoji-friendly for Instagram).",
          },
        },
        {
          "@type": "Question",
          name: "Is the AI Bio Generator free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free. No signup, no credit card, no hidden limits. Generate as many bios as you need across all supported platforms.",
          },
        },
        {
          "@type": "Question",
          name: "What platforms are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LinkedIn Headline (120 chars), LinkedIn About (2,000 chars), Twitter/X (160 chars), Instagram (150 chars), TikTok (80 chars), Facebook (101 chars), GitHub (160 chars), Professional/Website (500 chars), Email Signature (200 chars), and Threads (150 chars).",
          },
        },
        {
          "@type": "Question",
          name: "Will the bios sound generic or AI-written?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. The generator is specifically trained to avoid cliches like 'passionate about' or 'dedicated to'. It uses your actual achievements, skills, and personality to create specific, human-sounding bios. Each platform bio is written uniquely  - not a truncated version of the same text.",
          },
        },
        {
          "@type": "Question",
          name: "Can I customize the tone of my bio?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Use the tone slider to choose from 5 levels: Very Formal, Professional, Balanced, Casual, or Bold & Witty. You can also target your bio for specific audiences: recruiters, potential clients, collaborators, or social followers.",
          },
        },
        {
          "@type": "Question",
          name: "What is an AI bio generator?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "An AI bio generator is a tool that uses artificial intelligence to write short biographical descriptions for your social media profiles, professional websites, and online portfolios. Instead of staring at a blank text field, you provide basic information about yourself and the AI crafts polished, platform-optimized bios instantly.",
          },
        },
        {
          "@type": "Question",
          name: "Can I use this for dating app profiles?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "While the tool is optimized for professional and social media platforms, you can use the Instagram or TikTok output as a starting point for dating profiles. Set the tone to Casual or Bold & Witty, include personality traits in the input, and the AI will generate something personal and engaging.",
          },
        },
        {
          "@type": "Question",
          name: "How do I make my AI-generated bio sound authentic?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The key is specific inputs. Instead of 'marketing professional,' write 'B2B SaaS marketer who grew pipeline 3x at a Series B startup.' Add personality traits, hobbies, or a fun fact. The more specific your input, the more unique and authentic the output. You can also tweak the tone slider and edit the result to add your personal voice.",
          },
        },
        {
          "@type": "Question",
          name: "What information should I include for the best results?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "At minimum, provide your name and current role. For the best bios, also add: 1-2 key achievements with numbers, your top skills or tools, your industry, and a personality trait or hobby. The more context the AI has, the more specific and compelling your bio will be.",
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
    icon: Zap,
    title: "All Platforms, One Click",
    description:
      "Generate bios for LinkedIn, Twitter/X, Instagram, TikTok, GitHub, and 5 more platforms simultaneously. Each bio is uniquely crafted  - not a truncated copy.",
  },
  {
    icon: Target,
    title: "Character-Limit Perfect",
    description:
      "Every bio respects the exact character limit for its platform. Live color-coded indicators show you where you stand  - green, yellow, or red.",
  },
  {
    icon: Users,
    title: "Audience-Targeted",
    description:
      "Writing for recruiters? Clients? Social followers? Choose your audience and the AI adapts language, emphasis, and call-to-action accordingly.",
  },
  {
    icon: Sparkles,
    title: "Actually Sounds Human",
    description:
      'No "passionate about synergizing paradigms." The AI writes specific, punchy bios using your real achievements and personality. Zero filler.',
  },
  {
    icon: Shield,
    title: "Free, No Signup",
    description:
      "No account, no credit card, no limits. Generate as many bios as you need. Your data is never stored or shared.",
  },
];

const platformLimits = [
  { platform: "LinkedIn Headline", limit: "120", note: "Recruiters see this first" },
  { platform: "LinkedIn About", limit: "2,000", note: "Your professional story" },
  { platform: "Twitter / X", limit: "160", note: "First impression on your profile" },
  { platform: "Instagram", limit: "150", note: "Emojis + line breaks work well" },
  { platform: "TikTok", limit: "80", note: "Ultra-short, trendy" },
  { platform: "Facebook", limit: "101", note: "Personal connections" },
  { platform: "GitHub", limit: "160", note: "Tech stack + what you build" },
  { platform: "Threads", limit: "150", note: "Conversational, casual" },
];

export default function BioGeneratorPage() {
  return (
    <main className="relative w-full">
      <BioGeneratorSchema />

      {/* ── HERO ── */}
      <section className="relative min-h-[80dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        <div className="absolute inset-0 bg-hero-atmosphere pointer-events-none" />
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FREE AI TOOL
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free AI Bio Generator for Every Platform
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                The bio maker that actually sounds like you. Generate professional bios for LinkedIn, Instagram, Twitter/X, TikTok, GitHub, and more  - all at once, in seconds.
              </p>
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-12">
                No signup. No credit card. Just your bio, ready to copy.
              </p>

              {/* CTA arrow to form */}
              <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
                <a href="#generator">
                  Generate Your Bio
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
              <BioGenerator />
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
              What Makes This AI Bio Generator Different
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Most bio generators give you one generic paragraph. Ours generates platform-specific, audience-targeted bios that are ready to paste.
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

      {/* ── WHAT IS AN AI BIO GENERATOR ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <h2 className="text-h2 text-foreground">
              What Is an AI Bio Generator?
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-5 animate-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              An AI bio generator is a tool that uses artificial intelligence to write short biographical descriptions for your social media profiles, professional websites, portfolios, and email signatures. Instead of staring at a blank text field trying to describe yourself in 150 characters, you provide basic information  - your name, role, achievements, and personality  - and the AI crafts a polished, platform-optimized bio in seconds.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              The best AI bio generators go beyond simple text generation. They understand that a LinkedIn headline needs to be professional and keyword-rich, while an Instagram bio should be casual with strategic emoji placement. They respect character limits, adapt tone to your audience, and avoid the generic filler language that makes bios sound robotic.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Our free AI bio generator takes this further by creating bios for <strong>all your platforms simultaneously</strong> from a single input. You describe yourself once, and get 10 uniquely crafted bios  - each optimized for its specific platform&apos;s style, character limit, and audience expectations. No other tool does this.
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
                title: "Tell us about you",
                description:
                  "Enter your name and role. Optionally add achievements, skills, and personality. Or pick a quick-start template to pre-fill everything.",
              },
              {
                step: "2",
                title: "Pick your platforms",
                description:
                  "Select which platforms you need bios for  - LinkedIn, Twitter/X, Instagram, TikTok, GitHub, or all 10 at once. Set your tone and audience.",
              },
              {
                step: "3",
                title: "Copy & paste",
                description:
                  "Get platform-optimized bios with character counts, one-click copy buttons, and tips to make each bio perform better.",
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
                Try It Now  - Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── TIPS FOR WRITING A BETTER BIO ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              PRO TIPS
            </div>
            <h2 className="text-h2 text-foreground">
              Tips for Writing a Better Bio with AI
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Get more from the generator by following these proven strategies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Lightbulb,
                title: "Be Specific, Not Generic",
                description:
                  "\"B2B SaaS marketer who grew pipeline 3x\" beats \"experienced marketing professional.\" Numbers, company names, and concrete outcomes give the AI better material to work with.",
              },
              {
                icon: Target,
                title: "Know Your Audience First",
                description:
                  "A bio for recruiters should lead with credentials and impact. A bio for clients should lead with what you solve. Pick your audience before generating.",
              },
              {
                icon: Sparkles,
                title: "Add Personality Traits",
                description:
                  "Include hobbies, quirks, or a fun fact in the personality field. \"Weekend marathon runner\" or \"coffee snob\" makes your bio memorable and human.",
              },
              {
                icon: CheckCircle,
                title: "Edit the Output",
                description:
                  "AI gives you a strong draft  - not the final version. Swap in your favorite phrase, adjust a word that doesn't feel right, or add an inside joke only your audience would get.",
              },
              {
                icon: Users,
                title: "Match the Platform Culture",
                description:
                  "LinkedIn rewards professionalism. Twitter rewards wit. Instagram rewards aesthetics. Use our tone slider to shift between formal and casual as you generate for each platform.",
              },
              {
                icon: Zap,
                title: "Regenerate with Variations",
                description:
                  "Don't settle on the first output. Change your tone, swap achievements, or adjust the audience  - each generation produces entirely different bios.",
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

      {/* ── WHO USES AN AI BIO GENERATOR ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              USE CASES
            </div>
            <h2 className="text-h2 text-foreground">
              Who Uses an AI Bio Generator?
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              From job seekers to CEOs  - anyone who needs to describe themselves in a few words.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Briefcase,
                title: "Job Seekers & Professionals",
                description:
                  "Craft LinkedIn headlines and About sections that stand out to recruiters. A strong bio increases profile views by up to 40%.",
              },
              {
                icon: Megaphone,
                title: "Marketers & Social Media Managers",
                description:
                  "Manage bios across multiple client accounts and platforms. Generate consistent, on-brand bios in bulk without creative burnout.",
              },
              {
                icon: Camera,
                title: "Content Creators & Influencers",
                description:
                  "Keep Instagram, TikTok, and Twitter bios fresh and engaging. Update bios to match campaigns, launches, or trending topics.",
              },
              {
                icon: Code,
                title: "Developers & Designers",
                description:
                  "Write GitHub bios that highlight your tech stack and projects. Create portfolio bios that attract freelance clients or open-source contributors.",
              },
              {
                icon: GraduationCap,
                title: "Students & Recent Graduates",
                description:
                  "Turn limited experience into compelling bios. Highlight coursework, internships, and skills in a way that sounds professional, not desperate.",
              },
              {
                icon: Heart,
                title: "Entrepreneurs & Founders",
                description:
                  "Communicate your mission and value proposition across platforms. Speaker bios, investor-facing profiles, and personal brand bios  - all from one input.",
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

      {/* ── PLATFORM LIMITS TABLE ── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              REFERENCE
            </div>
            <h2 className="text-h2 text-foreground">
              Social Media Bio Character Limits (2026)
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Every platform has different limits. Our generator handles them all automatically.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-4 font-semibold text-foreground">Platform</th>
                  <th className="text-center px-5 py-4 font-semibold text-foreground">Limit</th>
                  <th className="text-right px-5 py-4 font-semibold text-foreground hidden sm:table-cell">Note</th>
                </tr>
              </thead>
              <tbody>
                {platformLimits.map((row, i) => (
                  <tr key={row.platform} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.platform}</td>
                    <td className="px-5 py-3.5 text-center tabular-nums text-muted-foreground">{row.limit}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs hidden sm:table-cell">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── COMMON BIO MISTAKES ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              AVOID THESE
            </div>
            <h2 className="text-h2 text-foreground">
              Common Bio Writing Mistakes to Avoid
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Even with AI, these pitfalls can make your bio fall flat. Here&apos;s what to watch for.
            </p>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                icon: AlertTriangle,
                mistake: "Using buzzwords and cliches",
                fix: "\"Passionate about leveraging synergies\" tells people nothing. Replace with specific outcomes: \"Grew organic traffic 200% in 6 months.\"",
              },
              {
                mistake: "Same bio everywhere",
                icon: AlertTriangle,
                fix: "LinkedIn, Instagram, and Twitter have completely different audiences and cultures. A professional summary doesn't work as a TikTok bio. Tailor each one.",
              },
              {
                mistake: "Ignoring character limits",
                icon: AlertTriangle,
                fix: "A truncated bio looks sloppy. Our generator enforces exact limits per platform so your bio never gets cut off mid-sentence.",
              },
              {
                mistake: "Writing in third person on casual platforms",
                icon: AlertTriangle,
                fix: "\"John is a software engineer\" feels cold on Instagram. Use first person (\"I build apps that...\") on social platforms, third person for formal contexts.",
              },
              {
                mistake: "No call to action",
                icon: AlertTriangle,
                fix: "A bio without a CTA is a dead end. Add \"DM for collabs,\" \"Link in bio,\" or \"Let's connect\" to guide what happens next.",
              },
              {
                mistake: "Trying to say everything",
                icon: AlertTriangle,
                fix: "You have 150 characters, not 1,500. Pick one angle: what you do, who you help, or what makes you different. Save the rest for your website.",
              },
            ].map((item) => (
              <div
                key={item.mistake}
                className="flex gap-4 rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
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

      {/* ── FAQ (SEO) ── */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
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
                q: "How does the AI Bio Generator work?",
                a: "Enter your name, role, and optionally your achievements, skills, and personality traits. Select which platforms you need bios for, set your preferred tone and target audience, then click Generate. The AI creates a unique, optimized bio for each platform  - respecting character limits and adapting style (professional for LinkedIn, punchy for Twitter, emoji-friendly for Instagram).",
              },
              {
                q: "Is the AI Bio Generator really free?",
                a: "Yes, completely free. No signup, no credit card, no hidden limits. Generate as many bios as you need across all 10 supported platforms.",
              },
              {
                q: "What platforms are supported?",
                a: "LinkedIn Headline (120 chars), LinkedIn About (2,000 chars), Twitter/X (160 chars), Instagram (150 chars), TikTok (80 chars), Facebook (101 chars), GitHub (160 chars), Professional/Website (500 chars), Email Signature (200 chars), and Threads (150 chars).",
              },
              {
                q: "Will the bios sound generic or AI-written?",
                a: "No. The generator avoids cliches like \"passionate about\" or \"dedicated to.\" It uses your actual achievements, skills, and personality to create specific, human-sounding bios. Each platform bio is uniquely crafted  - not a shorter version of the same text.",
              },
              {
                q: "Can I customize the tone?",
                a: "Yes. Choose from 5 tone levels: Very Formal, Professional, Balanced, Casual, or Bold & Witty. You can also target specific audiences  - recruiters, potential clients, collaborators, or social followers  - and the AI adjusts its language accordingly.",
              },
              {
                q: "How is this different from ChatGPT or other AI bio tools?",
                a: "Most tools generate one bio at a time with no character limit awareness. This tool generates all your platform bios simultaneously, enforces exact character limits, adapts style per platform, and lets you target specific audiences  - all from a single form input.",
              },
              {
                q: "What is an AI bio generator?",
                a: "An AI bio generator is a tool that uses artificial intelligence to write short biographical descriptions for your social media profiles, websites, and portfolios. You provide basic details about yourself  - name, role, achievements  - and the AI creates polished, ready-to-use bios optimized for each platform's style and character limits.",
              },
              {
                q: "Can I use this for dating app profiles?",
                a: "While optimized for professional and social media platforms, you can use the Instagram or TikTok output as a starting point for dating profiles. Set the tone to Casual or Bold & Witty, include personality traits, and the AI generates something personal and engaging that you can adapt.",
              },
              {
                q: "How do I make my AI-generated bio sound authentic?",
                a: "Specific inputs create authentic outputs. Instead of \"marketing professional,\" try \"B2B SaaS marketer who grew pipeline 3x at a Series B startup.\" Add personality traits, hobbies, or a fun fact. Then edit the result  - swap in your favorite phrase or add an inside reference only your audience would get.",
              },
              {
                q: "What information should I include for the best results?",
                a: "At minimum: your name and current role. For the best bios, also add 1-2 key achievements with numbers, your top skills or tools, your industry, and a personality trait or hobby. The more context the AI has, the more specific and compelling your bio will be.",
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

      {/* RELATED TOOLS */}
      <section className="border-t border-border bg-muted/30 py-20 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-10 animate-reveal">
            <h2 className="text-h3 text-foreground">More Free AI Tools From KolaviStudio</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              { href: "/tools/email-generator", title: "AI Email Generator", desc: "Write cold outreach, follow-ups, replies, subject lines, and signatures in seconds.", icon: Mail },
              { href: "/tools/slogan-generator", title: "AI Slogan Generator", desc: "8 catchy slogans, taglines, mottos, or catchphrases in seconds.", icon: Megaphone },
              { href: "/tools/motto-generator", title: "Motto Generator", desc: "Inspiring mottos for yourself, your family, your team, or your company.", icon: Compass },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-premium hover:-translate-y-1 group block"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-[16px] font-bold text-foreground mb-2">{tool.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.desc}</p>
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
            Ready to Upgrade Your Bio?
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
            Stop spending 30 minutes agonizing over 150 characters. Generate platform-perfect bios in seconds.
          </p>
          <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-10">
            <a href="#generator">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Your Bio  - Free
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
