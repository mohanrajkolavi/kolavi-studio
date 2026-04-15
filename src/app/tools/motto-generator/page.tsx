import { getPageMetadata } from "@/lib/seo/metadata";
import { SloganGenerator } from "@/components/tools/SloganGenerator";
import { SITE_URL } from "@/lib/constants";
import {
  Sparkles,
  Compass,
  Heart,
  Users,
  Shield,
  ArrowRight,
  Flag,
  Flame,
  GraduationCap,
  Trophy,
  Home,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = getPageMetadata({
  title: "Free Motto Generator - Personal, Family & Team Motto Maker",
  description:
    "Generate inspiring mottos for yourself, your family, team, or business with this free AI motto generator. Choose values, tone, and length. Instant results, no signup.",
  path: "/tools/motto-generator",
  keywords:
    "motto generator, free motto generator, personal motto generator, family motto generator, team motto generator, life motto generator, ai motto generator, motto maker, motto creator, sports team motto generator",
});

function MottoGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        { "@type": "ListItem", position: 3, name: "Motto Generator", item: `${base}/tools/motto-generator` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Motto Generator",
      url: `${base}/tools/motto-generator`,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free AI-powered motto generator that creates inspiring, values-driven mottos for individuals, families, teams, clubs, and businesses in seconds.",
      featureList: [
        "8 unique mottos per generation",
        "Personal, family, team, and business framing",
        "Values-driven AI suggestions",
        "Tone slider (serious to bold)",
        "Style preferences (punchy, metaphoric, aspirational)",
        "One-click copy for every result",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a motto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A motto is a short guiding phrase that captures the core values, beliefs, or philosophy of a person, family, team, or organization. Unlike a marketing slogan, a motto is aspirational and timeless. Famous examples include Semper Fidelis (US Marines), Carpe Diem (seize the day), and Non Ducor, Duco (I am not led, I lead).",
          },
        },
        {
          "@type": "Question",
          name: "How does the motto generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Enter your name or group, describe the values or ideas you want to express, pick a tone, and click Generate. The AI instantly creates 8 unique mottos, each labeled with a style tag (aspirational, punchy, metaphoric, or emotional) and a word count. You can copy any motto with one click or regenerate for fresh ideas.",
          },
        },
        {
          "@type": "Question",
          name: "Is the motto generator free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, 100% free. No signup, no credit card, no paywall. You can generate up to 8 batches per day (64 mottos total) from a single IP address. Use them for personal, family, school, sports, or commercial purposes.",
          },
        },
        {
          "@type": "Question",
          name: "How do you write a good motto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A good motto is short (3 to 7 words), values-driven, and memorable. Start with the belief you want to live by, then distill it into its sharpest form. Use active verbs (Lead, Serve, Rise), avoid generic positivity, and make sure every word earns its place. A great motto is something you would be proud to live by for years, not just one season.",
          },
        },
        {
          "@type": "Question",
          name: "What is the difference between a motto and a slogan?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A motto is a guiding principle for people, families, teams, or organizations. It is aspirational, timeless, and values-driven (example: Semper Fidelis). A slogan is a marketing phrase used to sell a product or campaign and is usually short-lived (example: Just Do It when used in a specific ad campaign). Mottos lead with identity, slogans lead with benefit.",
          },
        },
        {
          "@type": "Question",
          name: "Can I create a motto for my sports team or club?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Enter your team or club name, describe what you stand for (hustle, discipline, unity, winning, playing hard), and pick a bold or aspirational tone. The generator returns 8 options you can use for jerseys, banners, locker room walls, or rallying cries.",
          },
        },
        {
          "@type": "Question",
          name: "Can I create a Latin motto?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "This tool generates English mottos by default, but you can ask for Latin-style framing by describing the feel you want (formal, timeless, military, academic). If you need a true Latin phrase, generate English options first then have a Latin scholar or translator render your favorite into classical Latin for authenticity.",
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
    icon: Compass,
    title: "8 Mottos Per Generation",
    description:
      "One click returns 8 distinct options, each with its own angle and style tag. Pick the one that feels most true to who you are (or want to become).",
  },
  {
    icon: Heart,
    title: "Values-Driven AI",
    description:
      "The AI is tuned to the structure of great mottos: Semper Fidelis, Carpe Diem, Non Ducor Duco. Output leads with identity and belief, not marketing fluff.",
  },
  {
    icon: Flag,
    title: "Personal, Family, or Team",
    description:
      "Use it for your own life motto, a family crest phrase, a sports team rallying cry, or a company motto. The AI adapts to who will live by the words.",
  },
  {
    icon: Flame,
    title: "Tone & Style Controls",
    description:
      "Slide from Serious to Bold, and pick up to 3 style preferences (punchy, metaphoric, aspirational, emotional) to dial in exactly the weight you want.",
  },
  {
    icon: Shield,
    title: "Free, No Signup",
    description:
      "No account, no credit card, no watermark. Generate up to 8 batches per day (64 mottos total) completely free, forever.",
  },
];

const mottoExamples = [
  { motto: "Semper Fidelis", meaning: "Always Faithful", source: "US Marine Corps" },
  { motto: "Carpe Diem", meaning: "Seize the Day", source: "Horace (Roman poet)" },
  { motto: "Non Ducor, Duco", meaning: "I Am Not Led, I Lead", source: "Sao Paulo, Brazil" },
  { motto: "Dieu Et Mon Droit", meaning: "God and My Right", source: "British Monarchy" },
  { motto: "E Pluribus Unum", meaning: "Out of Many, One", source: "United States" },
  { motto: "Veni, Vidi, Vici", meaning: "I Came, I Saw, I Conquered", source: "Julius Caesar" },
];

export default function MottoGeneratorPage() {
  return (
    <main className="relative w-full">
      <MottoGeneratorSchema />

      {/* HERO */}
      <section className="relative min-h-[80dvh] w-full flex flex-col items-center justify-center overflow-hidden border-b border-border -mt-[72px] pt-[120px] pb-20">
        <div className="absolute inset-0 bg-hero-atmosphere pointer-events-none" />
        <div className="relative z-10 w-full animate-reveal">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
                FREE AI TOOL
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free Motto Generator for People, Teams & Families
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                Generate 8 inspiring mottos in seconds. Works for personal mottos, family crests, sports team rally cries, school clubs, and business values.
              </p>
              <p className="text-[15px] font-medium text-muted-foreground/80 mb-12">
                No signup. No credit card. Just the words you want to live by.
              </p>

              <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
                <a href="#generator">
                  Generate Your Motto
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* GENERATOR */}
      <section id="generator" className="relative z-10 bg-background py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-[24px] border border-border bg-card p-6 sm:p-10 shadow-sm">
              <SloganGenerator defaultMode="motto" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative z-10 bg-background py-24 sm:py-32 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              WHY THIS TOOL
            </div>
            <h2 className="text-h2 text-foreground max-w-2xl mx-auto">
              What Makes This Motto Generator Different
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Most motto generators spit out a single random phrase. Ours gives you 8 values-driven options with style tags and length control.
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

      {/* WHAT IS A MOTTO */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <h2 className="text-h2 text-foreground">
              What Is a Motto?
            </h2>
          </div>
          <div className="prose prose-lg max-w-none text-muted-foreground space-y-5 animate-reveal" style={{ animationDelay: "100ms" }}>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              A motto is a short, guiding phrase that captures the core values, beliefs, or philosophy of a person, family, team, or organization. Unlike a marketing slogan (which sells a product) or a tagline (which identifies a brand), a motto is aspirational and timeless. It answers the question &quot;what do we stand for?&quot; in the fewest words possible. Famous examples have lasted centuries: Semper Fidelis has been the US Marine Corps motto since 1883, and Carpe Diem traces back to Horace in 23 BC.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Great mottos share three traits: <strong>brevity</strong> (typically 3 to 7 words), <strong>identity</strong> (they describe who you are, not what you sell), and <strong>durability</strong> (they hold up over years or generations). This is why so many mottos use active verbs (Lead, Serve, Rise, Protect) and abstract nouns (Honor, Duty, Unity, Courage). A good motto is something you would be proud to repeat out loud at a team huddle, a family reunion, or a company all-hands.
            </p>
            <p className="text-[16px] sm:text-[17px] leading-relaxed">
              Our free motto generator is built specifically for this. The AI is tuned to the rhythms of timeless mottos rather than advertising jingles. You describe what you want to stand for, pick a tone, and it returns 8 candidates with style tags so you can see which ones lean aspirational, which are punchy, and which use metaphor or emotion. Use it for a personal life motto, a family crest phrase, a sports team rallying cry, a school or club motto, or a company&apos;s guiding principle.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              3 SIMPLE STEPS
            </div>
            <h2 className="text-h2 text-foreground">
              How to Use the Motto Generator
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                step: "1",
                title: "Enter who it is for",
                description:
                  "Type your name, family name, team name, or organization. This could be yourself, your family, your sports squad, or your company.",
              },
              {
                step: "2",
                title: "Describe your values",
                description:
                  "In the About field, write the beliefs, qualities, or principles you want the motto to capture (discipline, service, hustle, faith, unity).",
              },
              {
                step: "3",
                title: "Copy your favorite",
                description:
                  "Review 8 unique mottos with style tags and word counts. Copy the one that fits, or regenerate to explore more angles.",
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

      {/* PRO TIPS */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              PRO TIPS
            </div>
            <h2 className="text-h2 text-foreground">
              How to Write a Motto That Lasts
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Pair the AI with these timeless motto-writing principles.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Lightbulb,
                title: "Lead With One Belief",
                description:
                  "The strongest mottos commit to a single value. Semper Fidelis is only about loyalty. E Pluribus Unum is only about unity. Pick the one thing you most want to be known for and let everything else go.",
              },
              {
                icon: Zap,
                title: "Use Active Verbs",
                description:
                  "Verbs of action (Lead, Serve, Rise, Protect, Build, Conquer) give a motto weight and intent. Passive or abstract constructions weaken the phrase. Let the verb do the work.",
              },
              {
                icon: Target,
                title: "Make It Repeatable",
                description:
                  "A good motto is said out loud at team huddles, family dinners, and graduations. Read every candidate three times in a row: if it stumbles, keep iterating. Rhythm matters as much as meaning.",
              },
              {
                icon: CheckCircle,
                title: "Aim For Timeless, Not Trendy",
                description:
                  "Mottos should outlast moments. Avoid references to current events, slang, or pop culture. A motto written in 2026 should still feel right in 2046. If a word feels dated, cut it.",
              },
              {
                icon: Heart,
                title: "Make It True, Not Aspirational Fluff",
                description:
                  "A motto fails when it describes who you wish you were instead of who you actually are. Excellence in All We Do is meaningless. A specific belief you actually live by is gold.",
              },
              {
                icon: Flame,
                title: "Commit and Repeat",
                description:
                  "Mottos gain power through repetition. Put it on the team jersey, the family frame, the company wall. A motto said a thousand times becomes identity. A motto said once is decoration.",
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

      {/* USE CASES / PERSONAS */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              USE CASES
            </div>
            <h2 className="text-h2 text-foreground">
              Who Uses a Motto Generator?
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              From sports teams to families to founders, anyone who wants to put their values into words.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-reveal" style={{ animationDelay: "150ms" }}>
            {[
              {
                icon: Trophy,
                title: "Sports Teams & Coaches",
                description:
                  "Need a rallying cry for the jersey, the locker room, or the season banner? Generate 8 options that capture your team&apos;s grit, unity, or playing style in seconds.",
              },
              {
                icon: Home,
                title: "Families",
                description:
                  "Create a family motto for a crest, a household sign, or a yearly holiday card. Something your kids and grandkids can grow up hearing and repeating.",
              },
              {
                icon: Compass,
                title: "Individuals",
                description:
                  "Write your own personal life motto. The one sentence you want on your desk, your screensaver, or the back of your journal. The words you want to live by.",
              },
              {
                icon: GraduationCap,
                title: "Schools & Clubs",
                description:
                  "Student councils, debate teams, academic societies, scouts, and graduating classes all need mottos. Get 8 options that honor tradition while feeling fresh.",
              },
              {
                icon: Briefcase,
                title: "Companies & Founders",
                description:
                  "Startups and small businesses use company mottos for internal culture documents, recruiting pages, and all-hands decks. A motto keeps the team aligned on what matters.",
              },
              {
                icon: Users,
                title: "Non-Profits & Causes",
                description:
                  "Capture your mission in 3 to 7 words. A motto that fits on a banner, a donation page, or a volunteer t-shirt and still carries the full weight of your cause.",
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

      {/* FAMOUS MOTTOS REFERENCE */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              INSPIRATION
            </div>
            <h2 className="text-h2 text-foreground">
              6 Timeless Mottos For Inspiration
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Study the greats. Then generate your own.
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-4 font-semibold text-foreground">Motto</th>
                  <th className="text-left px-5 py-4 font-semibold text-foreground hidden sm:table-cell">Meaning</th>
                  <th className="text-right px-5 py-4 font-semibold text-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {mottoExamples.map((row, i) => (
                  <tr key={row.motto} className={`border-b border-border/50 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                    <td className="px-5 py-3.5 font-semibold text-foreground italic">{row.motto}</td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{row.meaning}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* COMMON MISTAKES */}
      <section className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="text-center mb-12 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              AVOID THESE
            </div>
            <h2 className="text-h2 text-foreground">
              Common Motto Mistakes to Avoid
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-xl mx-auto">
              Even with AI, these pitfalls will make your motto feel hollow.
            </p>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {[
              {
                mistake: "Writing a wish instead of a belief",
                fix: "Excellence in Everything We Do is a wish. Lead With Honor is a belief. Mottos should describe who you already are (or genuinely commit to becoming), not vague aspirations.",
              },
              {
                mistake: "Using corporate buzzwords",
                fix: "Words like synergy, innovation, excellence, and best-in-class drain the life out of a motto. Use concrete, emotional, or physical language instead.",
              },
              {
                mistake: "Making it too long",
                fix: "A motto of 12 words is a mission statement. 3 to 7 words is the sweet spot. If you cannot fit it on a belt buckle, shield, or jersey, it is too long.",
              },
              {
                mistake: "Copying a famous motto structure",
                fix: "Adding -itas or veritas to your motto does not make it sound Latin. Mottos like Ad Astra Per Aspera earned their weight through centuries of use, not structure-copying.",
              },
              {
                mistake: "Treating it as a one-time task",
                fix: "A motto you write and forget about is decoration. A motto you repeat weekly becomes identity. Whatever you pick, commit to using it out loud in the moments that matter.",
              },
              {
                mistake: "Ignoring how it sounds",
                fix: "Mottos are spoken aloud more than written. Read every candidate three times in a row. If it feels awkward in your mouth, it will feel awkward in a team huddle too.",
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

      {/* FAQ */}
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
                q: "What is a motto?",
                a: "A motto is a short guiding phrase that captures the core values, beliefs, or philosophy of a person, family, team, or organization. Unlike a marketing slogan, a motto is aspirational and timeless. Famous examples include Semper Fidelis (US Marines), Carpe Diem (seize the day), and Non Ducor, Duco (I am not led, I lead).",
              },
              {
                q: "How does the motto generator work?",
                a: "Enter your name or group, describe the values or ideas you want to express, pick a tone, and click Generate. The AI instantly creates 8 unique mottos, each labeled with a style tag and a word count. You can copy any motto with one click or regenerate for fresh ideas.",
              },
              {
                q: "Is the motto generator really free?",
                a: "Yes, 100% free. No signup, no credit card, no paywall. You can generate up to 8 batches per day (64 mottos total) from a single IP address. Use them for personal, family, school, sports, or commercial purposes.",
              },
              {
                q: "How do you write a good motto?",
                a: "A good motto is short (3 to 7 words), values-driven, and memorable. Start with the belief you want to live by, then distill it into its sharpest form. Use active verbs (Lead, Serve, Rise), avoid generic positivity, and make sure every word earns its place.",
              },
              {
                q: "What is the difference between a motto and a slogan?",
                a: "A motto is a guiding principle for people, families, teams, or organizations. It is aspirational, timeless, and values-driven (example: Semper Fidelis). A slogan is a marketing phrase used to sell a product or campaign and is usually short-lived (example: Just Do It in a specific ad campaign). Mottos lead with identity, slogans lead with benefit.",
              },
              {
                q: "Can I create a motto for my sports team or club?",
                a: "Yes. Enter your team or club name, describe what you stand for (hustle, discipline, unity, winning), and pick a bold or aspirational tone. The generator returns 8 options you can use for jerseys, banners, locker room walls, or rallying cries.",
              },
              {
                q: "Can I create a Latin motto?",
                a: "This tool generates English mottos by default, but you can ask for formal or classical framing by selecting the Serious tone and describing the feel you want. If you need a true Latin phrase, generate English options first then have a Latin translator render your favorite into classical Latin.",
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

      {/* BOTTOM CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl text-center">
          <h2 className="text-h2 text-foreground mb-6">
            Ready to Write Your Motto?
          </h2>
          <p className="text-body text-muted-foreground max-w-xl mx-auto mb-10">
            Stop searching for the right words. Get 8 inspiring options in under 10 seconds.
          </p>
          <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-10">
            <a href="#generator">
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Your Motto - Free
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
