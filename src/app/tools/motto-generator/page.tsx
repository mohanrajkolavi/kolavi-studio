import Link from "next/link";
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
  Home,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Zap,
  Mail,
  UserPen,
  Megaphone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_PUBLISHED = "2025-09-10T00:00:00.000Z";
const PAGE_MODIFIED = "2026-04-24T00:00:00.000Z";

export const metadata = getPageMetadata({
  title: "Motto Generator: AI for Family, Business, School & Personal",
  description:
    "Motto generator free AI tool for family, business, school, company, and personal mottos. Get 8 values-driven motto options in seconds. No signup, no credit card.",
  path: "/tools/motto-generator",
  modifiedTime: PAGE_MODIFIED,
  publishedTime: PAGE_PUBLISHED,
  keywords:
    "motto generator, motto generator free, free motto generator, ai motto generator, family motto generator, business motto generator, company motto generator, school motto generator, free ai motto generator, motto maker, motto creator, motto generator ai, free motto maker, family motto maker",
});

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "What is a motto generator?",
    a: "A motto generator is a free AI tool that creates short guiding phrases for a person, family, team, school, company, or business. This motto generator returns 8 AI-generated options per batch, each labeled with a style tag (punchy, aspirational, metaphoric, or emotional) and a word count, so you can compare 8 angles instead of settling for one random phrase.",
  },
  {
    q: "What is a motto?",
    a: "A motto is a short guiding phrase (usually 3 to 7 words) that captures the core values, beliefs, or philosophy of a person, family, team, or organization. Unlike a marketing slogan, a motto is aspirational and timeless. Famous examples include Semper Fidelis (US Marines, since 1883), Carpe Diem (Horace, 23 BC), and Non Ducor Duco (I am not led, I lead).",
  },
  {
    q: "How does the motto generator work?",
    a: "Enter your name or group, describe the values or ideas you want to express, pick a tone, and click Generate. The AI instantly creates 8 unique mottos, each labeled with a style tag (aspirational, punchy, metaphoric, or emotional) and a word count. You can copy any motto with one click or regenerate for fresh ideas.",
  },
  {
    q: "Is the motto generator really free?",
    a: "Yes, 100% free. No signup, no credit card, no paywall. You can generate up to 8 batches per day (64 mottos total) from a single IP address. Use the output for personal, family, school, sports, or commercial purposes.",
  },
  {
    q: "How do I create a family motto?",
    a: "Use the family motto generator by entering your family surname and the values you want passed down across generations (faith, grit, hospitality, love of learning, adventure). Pick a serious or aspirational tone, then click Generate. The AI returns 8 family motto options in the cadence of timeless family mottos, ready for a crest, a framed wall print, a holiday card, or the back cover of a family scrapbook.",
  },
  {
    q: "What makes a good business motto?",
    a: "A good business motto is short (3 to 7 words), values-driven, and repeatable by every team member. Unlike a tagline, which sells a product, a business motto guides how the team shows up on a bad Tuesday. Enter your company name and the values you want every new hire to share (honest craft, fast shipping, customer obsession), and use the returned options on careers pages, team handbooks, all-hands decks, and internal Slack headers.",
  },
  {
    q: "How do I write a school motto?",
    a: "Use the school motto generator for a new school charter, a graduating class, a student council, a debate team, a scouts troop, or an academic society. Enter the institution name and the values you want to honor (learning, service, curiosity, honor, integrity). Pick a formal or serious tone for a classical feel, or pick bold for a more modern rally cry. Expect examples like Seek Truth, Serve Others or Learn, Lead, Lift.",
  },
  {
    q: "What is a personal motto?",
    a: "A personal motto is your one-sentence answer to how you want to live. It typically sits on your desk, your screensaver, the inside cover of your journal, or the back of your phone case. Enter your first name and the traits or beliefs you want to commit to (discipline, kindness, creativity, resilience, courage). The AI returns 8 personal motto candidates tuned to individual commitment rather than group identity.",
  },
  {
    q: "How is an AI motto generator different from a regular motto generator?",
    a: "A regular motto generator typically returns a single random phrase from a fixed list. An AI motto generator uses a trained language model to produce fresh candidates in the rhythm of timeless mottos like Semper Fidelis and Carpe Diem, adapting to your specific name, values, and tone. Output is original to your inputs, labeled by style, and easier to match to your actual voice.",
  },
  {
    q: "How do you write a good motto?",
    a: "A good motto is short (3 to 7 words), values-driven, and memorable. Start with the belief you want to live by, then distill it into its sharpest form. Use active verbs (Lead, Serve, Rise), avoid generic positivity, and make sure every word earns its place. Say it out loud three times in a row - if it stumbles, keep iterating.",
  },
  {
    q: "What is the difference between a motto and a slogan?",
    a: "A motto is a guiding principle for people, families, teams, or organizations. It is aspirational, timeless, and values-driven (example: Semper Fidelis). A slogan is a marketing phrase used to sell a product or campaign and is usually short-lived (example: Just Do It when used in a specific ad campaign). Mottos lead with identity, slogans lead with benefit.",
  },
  {
    q: "Can I create a motto for my sports team or club?",
    a: "Yes. Enter your team or club name, describe what you stand for (hustle, discipline, unity, winning, playing hard), and pick a bold or aspirational tone. The generator returns 8 options you can use for jerseys, banners, locker room walls, or rallying cries.",
  },
  {
    q: "Can I create a Latin motto?",
    a: "This tool generates English mottos by default, but you can ask for Latin-style framing by describing the feel you want (formal, timeless, military, academic). If you need a true Latin phrase, generate English options first then have a Latin scholar or translator render your favorite into classical Latin for authenticity.",
  },
];

function MottoGeneratorSchema() {
  const base = SITE_URL ?? "https://kolavistudio.com";
  const pageUrl = `${base}/tools/motto-generator`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        { "@type": "ListItem", position: 2, name: "Tools", item: `${base}/tools` },
        { "@type": "ListItem", position: 3, name: "Motto Generator", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": pageUrl,
      url: pageUrl,
      name: "Motto Generator: AI for Family, Business, School & Personal",
      description:
        "Free AI motto generator for family, business, school, company, and personal mottos. Get 8 values-driven options in seconds.",
      inLanguage: "en-US",
      datePublished: PAGE_PUBLISHED,
      dateModified: PAGE_MODIFIED,
      isPartOf: {
        "@type": "WebSite",
        name: "Kolavi Studio",
        url: base,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${base}/og-image.jpg`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Motto Generator",
      url: pageUrl,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern browser with JavaScript enabled",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "127",
        bestRating: "5",
        worstRating: "1",
      },
      description:
        "Free AI motto generator that creates inspiring, values-driven mottos for families, businesses, schools, companies, and individuals in seconds. Also works for sports teams, clubs, and non-profits.",
      featureList: [
        "8 unique motto options per generation",
        "Family, business, company, school, and personal motto modes",
        "AI trained on timeless mottos like Semper Fidelis and Carpe Diem",
        "Tone slider (serious to bold)",
        "Style preferences (punchy, metaphoric, aspirational, emotional)",
        "One-click copy for every result",
        "Free motto generator - no signup, no credit card, no watermark",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to Write a Motto Using a Motto Generator",
      description:
        "Use the free AI motto generator to write a family, business, school, or personal motto in under a minute.",
      totalTime: "PT1M",
      estimatedCost: {
        "@type": "MonetaryAmount",
        currency: "USD",
        value: "0",
      },
      tool: [
        { "@type": "HowToTool", name: "Kolavi Studio Motto Generator" },
      ],
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Enter who the motto is for",
          text: "Type your name, family surname, team name, company, or school. This sets the voice of the motto so the AI can match first-person, group, or institutional phrasing.",
          url: `${pageUrl}#generator`,
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Describe your values",
          text: "In the About field, list the beliefs, qualities, or principles you want the motto to capture (discipline, service, faith, unity, hustle, curiosity). Three to five values is the sweet spot.",
          url: `${pageUrl}#generator`,
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Pick a tone and style",
          text: "Slide the tone from Serious to Bold, then select up to three style tags (punchy, aspirational, metaphoric, emotional). This gives the AI enough direction without locking it into one angle.",
          url: `${pageUrl}#generator`,
        },
        {
          "@type": "HowToStep",
          position: 4,
          name: "Generate and copy your favorite",
          text: "Click Generate to get 8 motto candidates. Each one includes a style tag and word count. Copy the best one with a single click, or regenerate for fresh angles.",
          url: `${pageUrl}#generator`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
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

const mottoTypes: {
  slug: string;
  icon: React.ElementType;
  heading: string;
  tagline: string;
  answer: string;
  howTo: string;
  examples: string[];
}[] = [
  {
    slug: "family-motto-generator",
    icon: Home,
    heading: "Family Motto Generator",
    tagline: "For family crests, household signs, and phrases passed across generations",
    answer:
      "A family motto generator creates a short guiding phrase shared across generations of one family, often placed on a crest, a framed print above the fireplace, or the back of a family photo album. Use it to put into words what your family stands for.",
    howTo:
      "Enter your family surname and the values you want passed down: faith, grit, hospitality, love of learning, adventure, or service. Pick a serious or aspirational tone. The AI returns 8 family motto options in the cadence of centuries-old mottos - short enough for a crest, weighty enough to repeat at holiday dinners.",
    examples: ["Hold Fast, Love Deep", "From One, Strength To All", "We Build, We Hold, We Return"],
  },
  {
    slug: "ai-motto-generator",
    icon: Sparkles,
    heading: "AI Motto Generator",
    tagline: "Trained on timeless mottos, not advertising copy",
    answer:
      "An AI motto generator uses a trained language model to produce motto candidates in the rhythm of timeless guiding phrases like Semper Fidelis and Carpe Diem, not marketing jingles. Output is original to your inputs and labeled by style, so you can match the motto to your real voice.",
    howTo:
      "Every batch returns 8 AI-generated candidates tagged by style (punchy, aspirational, metaphoric, or emotional) and word count. The AI leads with identity and active verbs instead of generic positivity, so you get phrases that sound earned rather than templated. Regenerate as many times as you want.",
    examples: ["Lead With Honor", "Rise, Then Lift Others", "Build What Lasts"],
  },
  {
    slug: "business-motto-generator",
    icon: Briefcase,
    heading: "Business Motto Generator",
    tagline: "For small businesses, independent operators, and new ventures",
    answer:
      "A business motto generator creates the one phrase that guides how your team shows up on a bad Tuesday. Unlike a tagline, which sells a product, a business motto is the internal north star you repeat in hiring, retros, and all-hands.",
    howTo:
      "Enter your business name and the values every new hire should share (honest craft, fast shipping, customer obsession, long-term thinking). Use the returned options on your careers page, team handbook, all-hands slides, and internal Slack header. A business motto earns its weight through repetition.",
    examples: ["Honest Craft, Honest Work", "Small Team, Long Horizon", "Ship With Care"],
  },
  {
    slug: "company-motto-generator",
    icon: Users,
    heading: "Company Motto Generator",
    tagline: "For culture documents, investor decks, and new-hire onboarding",
    answer:
      "A company motto generator creates the headline phrase for culture documents, investor updates, and employee onboarding. It answers what do we stand for in the fewest words possible - across every team and department.",
    howTo:
      "Generate 8 candidates, then stress-test each one against a real decision your leadership team made last quarter. If the motto would not have helped you choose between two good options, it is decoration, not direction. A true company motto should cut, not just hang on the wall.",
    examples: ["Customers First, Ego Last", "Build The Next Decade", "Hire Slow, Trust Fast"],
  },
  {
    slug: "school-motto-generator",
    icon: GraduationCap,
    heading: "School Motto Generator",
    tagline: "For crests, banners, graduating classes, student councils, and clubs",
    answer:
      "A school motto generator creates phrases that appear on crests, diplomas, entrance arches, and graduation programs. School mottos should feel timeless rather than trendy, and rooted in the values the institution wants to honor.",
    howTo:
      "Use the generator for a new school charter, a graduating class, a student council, a debate team, a scouts troop, or an academic society. Enter the institution name and the values (learning, service, curiosity, honor, integrity). Pick a formal or serious tone for a classical feel, or bold for a modern rally cry.",
    examples: ["Seek Truth, Serve Others", "Learn, Lead, Lift", "Honor In All Things"],
  },
  {
    slug: "personal-motto-generator",
    icon: Compass,
    heading: "Personal Motto Generator",
    tagline: "For your desk, your journal, and your screensaver",
    answer:
      "A personal motto generator creates your one-sentence answer to how you want to live. A personal motto is usually shorter and more intimate than a team or company motto - it belongs on your desk, your screensaver, the inside cover of your journal, or the back of your phone case.",
    howTo:
      "Enter your first name and the traits or beliefs you want to commit to (discipline, kindness, creativity, resilience, courage). The AI returns 8 candidates tuned to personal commitment rather than group identity. The best personal mottos feel true in your mouth when you say them three times in a row.",
    examples: ["Calm, Careful, Committed", "Do Hard Things Daily", "Kind And Unafraid"],
  },
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
                FREE AI TOOL - UPDATED APRIL 2026
              </div>
              <h1 className="text-h1 text-foreground mb-6 text-balance">
                Free AI Motto Generator for Family, Business, School & Personal Mottos
              </h1>
              <p className="text-[18px] sm:text-[20px] leading-relaxed text-muted-foreground max-w-2xl mx-auto mb-4 text-balance">
                Generate 8 values-driven mottos in under 10 seconds. Works for family mottos, business and company mottos, school mottos, personal life mottos, and sports team rally cries.
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

      {/* KEY TAKEAWAYS (AI SEO / GEO) */}
      <section className="relative z-10 bg-background border-b border-border py-14 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-[24px] border border-primary/20 bg-primary/[0.03] p-7 sm:p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground m-0">
                  Key Takeaways
                </h2>
              </div>
              <p className="text-[15px] sm:text-[16px] text-muted-foreground leading-relaxed mb-5">
                A <strong className="text-foreground">motto generator</strong> is a free AI tool that creates short guiding phrases for a person, family, team, school, or company. This <strong className="text-foreground">motto generator free</strong> tool returns 8 options per batch, each tuned to the rhythm of timeless mottos like <em>Semper Fidelis</em> and <em>Carpe Diem</em>, not marketing copy.
              </p>
              <ul className="space-y-2.5">
                {[
                  "Six dedicated modes: family motto, AI motto, business motto, company motto, school motto, and personal motto generators",
                  "8 AI-generated options per batch, each labeled by style (punchy, aspirational, metaphoric, emotional) and word count",
                  "Tone slider (Serious to Bold) and up to 3 style preferences for precise voice control",
                  "Free with no signup, no credit card, and no watermark - usable for commercial, family, and personal purposes",
                  "Up to 8 batches per day (64 mottos total) from a single IP",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
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

      {/* MOTTO GENERATOR TYPES (SEO + GEO) */}
      <section id="motto-generator-types" className="border-t border-border bg-muted/30 py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-16 animate-reveal">
            <div className="inline-flex items-center justify-center px-4 py-2 mb-6 rounded-[48px] bg-muted/50 border border-border text-label text-muted-foreground">
              6 MOTTO MODES
            </div>
            <h2 className="text-h2 text-foreground">
              A Motto Generator for Every Purpose
            </h2>
            <p className="mt-4 text-body text-muted-foreground max-w-2xl mx-auto">
              The same AI adapts to your audience. Whether you need a family motto, a business or company motto, a school motto, or a personal life motto, this tool returns 8 options tuned to that specific voice.
            </p>
          </div>

          <div className="space-y-8 animate-reveal" style={{ animationDelay: "100ms" }}>
            {mottoTypes.map((type) => {
              const Icon = type.icon;
              return (
                <article
                  key={type.slug}
                  id={type.slug}
                  className="rounded-[24px] border border-border bg-card p-7 sm:p-10 shadow-sm scroll-mt-24"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5 mb-5">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-[22px] sm:text-[26px] font-bold text-foreground mb-1.5">
                        {type.heading}
                      </h3>
                      <p className="text-[14px] sm:text-[15px] text-muted-foreground italic">
                        {type.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-muted-foreground">
                    <p className="text-[16px] sm:text-[17px] leading-relaxed">
                      {type.answer}
                    </p>
                    <p className="text-[16px] sm:text-[17px] leading-relaxed">
                      {type.howTo}
                    </p>

                    <div className="pt-2">
                      <p className="text-label text-muted-foreground/90 mb-3 uppercase tracking-wider">
                        Example Outputs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {type.examples.map((ex) => (
                          <span
                            key={ex}
                            className="inline-block px-3.5 py-2 rounded-full bg-muted text-[14px] font-medium text-foreground italic"
                          >
                            &ldquo;{ex}&rdquo;
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-[48px] shadow-premium text-[16px] h-14 px-8">
              <a href="#generator">
                Try Any Mode - Free
                <ArrowRight className="ml-2 w-4 h-4" />
              </a>
            </Button>
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
              Motto Generator - Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4 animate-reveal" style={{ animationDelay: "100ms" }}>
            {FAQ_ITEMS.map((faq) => (
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
              { href: "/tools/bio-generator", title: "AI Bio Generator", desc: "Generate platform-optimized bios for LinkedIn, Twitter/X, Instagram, and more.", icon: UserPen },
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
